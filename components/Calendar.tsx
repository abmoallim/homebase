"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { addEvent, editEvent, removeEvent, undoChange, type Result } from "@/app/calendar/actions";
import type { CalItem, Snapshot } from "@/lib/calendar";
import { COLORS, addDays, type EventInput, type Occurrence, type Scope } from "@/lib/events";
import TimeGrid from "./TimeGrid";
import MonthGrid from "./MonthGrid";
import EventForm, { ScopeDialog } from "./EventForm";

export type View = "month" | "week" | "day";
export type Slot = { date: string; start: string; end: string };
export const KIND_COLOR: Record<CalItem["kind"], string> = { event: COLORS[0], task: "#C9A45C", meeting: "#5FB58C", daily: "#9aa79e" };
export const itemColor = (it: CalItem) => it.overdue ? "#e0725c" : it.color || KIND_COLOR[it.kind];
export const time12 = (t: string) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h % 24 < 12 ? "AM" : "PM"}`; };
export const sortItems = (a: CalItem, b: CalItem) => (a.time || "").localeCompare(b.time || "") || a.title.localeCompare(b.title);
const fmt = (d: string, o: Intl.DateTimeFormatOptions) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });
const toInput = ({ id: _i, occ: _o, ...rest }: Occurrence): EventInput => rest;

type Pending = { title: string; allowOne: boolean; run: (scope: Scope) => void };
type Toast = { text: string; undo?: Snapshot; error?: boolean };

export default function Calendar({ view, anchor, days, items, today, nowTime }: { view: View; anchor: string; days: string[]; items: CalItem[]; today: string; nowTime: string }) {
  const router = useRouter();
  const [, start] = useTransition();
  // A dragged event stays where it was dropped while the vault is being written.
  const [shown, moveNow] = useOptimistic(items, (list: CalItem[], p: { key: string; next: EventInput }) =>
    list.map(it => it.event && it.event.id + it.event.occ === p.key ? { ...it, date: p.next.date, time: p.next.start || undefined, end: p.next.end || undefined } : it));
  const [form, setForm] = useState<{ event?: Occurrence; initial: EventInput } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), toast.error ? 6000 : 8000); return () => clearTimeout(t); }, [toast]);

  const send = (label: string, call: () => Promise<Result>, optimistic?: { key: string; next: EventInput }) => start(async () => {
    if (optimistic) moveNow(optimistic);
    try {
      const r = await call();
      if (!r.ok) setToast({ text: r.error, error: true });
      else { setForm(null); setToast({ text: label, undo: r.undo.length ? r.undo : undefined }); }
    } catch { setToast({ text: "Could not reach Homebase. Is it running?", error: true }); }
  });

  /** Repeating events ask which occurrences to change. */
  const withScope = (e: Occurrence, title: string, allowOne: boolean, go: (s: Scope) => void) =>
    e.repeat ? setPending({ title, allowOne, run: s => { setPending(null); go(s); } }) : go("all");

  const change = (e: Occurrence, next: EventInput, label: string, optimistic = false) => {
    const ruleChanged = next.repeat !== e.repeat || next.every !== e.every || next.days.join() !== e.days.join() || next.until !== e.until;
    withScope(e, "Change repeating event", !ruleChanged, s => send(label, () => editEvent(e.id, e.occ, s, next), optimistic ? { key: e.id + e.occ, next } : undefined));
  };
  const move = (e: Occurrence, to: Slot) => {
    if (to.date !== e.date || to.start !== e.start || to.end !== e.end) change(e, { ...toInput(e), ...to }, `Moved “${e.title}”`, true);
  };
  const open = (e: Occurrence) => setForm({ event: e, initial: toInput(e) });
  const add = (slot: Slot) => setForm({ initial: { title: "", place: "", color: COLORS[0], notes: "", repeat: "", every: 1, days: [], until: "", ...slot } });

  const month = anchor.slice(0, 7);
  const step = (n: number) => {
    if (view !== "month") return addDays(anchor, n * (view === "week" ? 7 : 1));
    const d = new Date(month + "-01T12:00:00Z"); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10);
  };
  const href = (v: View, d: string) => `/calendar?v=${v}&d=${d}`;
  const label = view === "month" ? fmt(month + "-01", { month: "long", year: "numeric" }) : view === "day" ? fmt(anchor, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : `${fmt(days[0], { day: "numeric", month: "short" })} – ${fmt(days[6], { day: "numeric", month: "short", year: "numeric" })}`;
  const newSlot = (): Slot => {
    const date = days.includes(today) ? today : view === "month" ? month + "-01" : days[0];
    const h = Math.min(22, Number(nowTime.slice(0, 2)) + 1);
    return { date, start: `${String(h).padStart(2, "0")}:00`, end: `${String(h + 1).padStart(2, "0")}:00` };
  };
  const nav = "px-4 py-1.5 rounded-full text-[13px] border border-line text-muted hover:text-text";
  const grid = { days, items: shown, today, onOpen: open, onAdd: add, onMove: move, dayHref: (d: string) => href("day", d) };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="serif text-[40px] leading-none mr-3">Calendar</h1>
        <Link href={href(view, today)} className={nav}>Today</Link>
        <Link href={href(view, step(-1))} className={nav} aria-label="Previous">←</Link>
        <Link href={href(view, step(1))} className={nav} aria-label="Next">→</Link>
        <div className="serif text-[24px] mx-2">{label}</div>
        <input type="date" aria-label="Jump to date" value={anchor} onChange={e => e.target.value && router.push(href(view, e.target.value))} className="bg-transparent border border-line rounded-full px-3 py-1 text-[12px] text-muted outline-none [color-scheme:dark]" />
        <div className="flex rounded-full border border-line overflow-hidden ml-auto">{(["day", "week", "month"] as const).map(v => <Link key={v} href={href(v, anchor)} className={`px-4 py-1.5 text-[13px] capitalize ${view === v ? "bg-brass text-[#06110c]" : "text-muted hover:text-text"}`}>{v}</Link>)}</div>
        <button onClick={() => add(newSlot())} className="rounded-full bg-brass text-[#06110c] font-medium px-5 py-1.5 text-[13px]">+ New event</button>
      </div>

      {view === "month" ? <MonthGrid {...grid} month={month} /> : <TimeGrid {...grid} nowTime={nowTime} />}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-faint">
        <span>Click or drag on empty time to add · drag an event to move it · drag its bottom edge to change the length</span>
        <span className="ml-auto flex gap-3">{(["task", "meeting", "daily"] as const).map(k => <span key={k} className="flex items-center gap-1.5 capitalize"><span className="w-2 h-2 rounded-full" style={{ background: KIND_COLOR[k] }} />{k}</span>)}<span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#e0725c]" />Overdue</span></span>
      </div>

      {form && <EventForm key={form.event ? form.event.id + form.event.occ : "new"} event={form.event} initial={form.initial} onClose={() => setForm(null)}
        onSave={next => form.event ? change(form.event, next, "Saved") : send("Event added", () => addEvent(next))}
        onDelete={() => { const e = form.event!; withScope(e, "Delete repeating event", true, s => send(`Deleted “${e.title}”`, () => removeEvent(e.id, e.occ, s))); }} />}
      {pending && <ScopeDialog title={pending.title} allowOne={pending.allowOne} onPick={pending.run} onClose={() => setPending(null)} />}
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4 rounded-full border border-line bg-panel px-5 py-2.5 text-[13px] shadow-2xl">
          <span className={toast.error ? "text-[#e0725c]" : ""}>{toast.text}</span>
          {toast.undo && <button className="text-brass font-medium" onClick={() => { const u = toast.undo!; setToast(null); send("Undone", () => undoChange(u)); }}>Undo</button>}
        </div>
      )}
    </div>
  );
}
