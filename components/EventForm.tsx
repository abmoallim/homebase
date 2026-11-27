"use client";
import { useEffect, useState } from "react";
import { COLORS, weekday, type EventInput, type Occurrence, type Repeat, type Scope } from "@/lib/events";

const inp = "bg-[rgba(255,255,255,0.03)] border border-line rounded-lg px-3 py-2 text-[14px] outline-none focus:border-brass [color-scheme:dark]";
const UNIT: Record<Repeat, string> = { daily: "day", weekly: "week", monthly: "month", yearly: "year" };

function Modal({ children, onClose, z = "z-40" }: { children: React.ReactNode; onClose: () => void; z?: string }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div className={`fixed inset-0 ${z} flex items-start justify-center bg-black/60 p-4 pt-[8vh] overflow-y-auto`} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className="w-full max-w-[520px] rounded-2xl border border-line bg-panel p-6 shadow-2xl">{children}</div>
    </div>
  );
}

export function ScopeDialog({ title, allowOne, onPick, onClose }: { title: string; allowOne: boolean; onPick: (s: Scope) => void; onClose: () => void }) {
  const options: [Scope, string][] = [...(allowOne ? [["one", "This event only"] as [Scope, string]] : []), ["following", "This and following events"], ["all", "All events"]];
  return (
    <Modal onClose={onClose} z="z-50">
      <div className="serif text-[24px] mb-4">{title}</div>
      <div className="space-y-2">{options.map(([s, label]) => <button key={s} onClick={() => onPick(s)} className="block w-full text-left rounded-xl border border-line px-4 py-2.5 text-[14px] hover:border-brass hover:text-brass">{label}</button>)}</div>
      <button onClick={onClose} className="mt-4 text-[13px] text-muted hover:text-text">Cancel</button>
    </Modal>
  );
}

export default function EventForm({ event, initial, onSave, onDelete, onClose }: { event?: Occurrence; initial: EventInput; onSave: (v: EventInput) => void; onDelete: () => void; onClose: () => void }) {
  const [v, setV] = useState(initial);
  const set = (patch: Partial<EventInput>) => setV(x => ({ ...x, ...patch }));
  const allDay = !v.start;
  const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  // Changing the start keeps the length.
  const setStart = (s: string) => s && setV(x => ({ ...x, start: s, end: hhmm(Math.min(1439, mins(s) + Math.max(15, mins(x.end || s) - mins(x.start || s) || 60))) }));
  const setRepeat = (r: Repeat | "") => set({ repeat: r, every: r ? v.every : 1, days: r === "weekly" ? (v.days.length ? v.days : [weekday(v.date)]) : [], until: r ? v.until : "" });
  const toggleDay = (d: number) => set({ days: v.days.includes(d) ? v.days.filter(x => x !== d) : [...v.days, d].sort() });

  return (
    <Modal onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(v); }} className="space-y-3">
        <input autoFocus required value={v.title} onChange={e => set({ title: e.target.value })} placeholder="Event title" aria-label="Title" className="w-full bg-transparent border-b border-line pb-2 text-[22px] serif outline-none focus:border-brass" />
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" required aria-label="Date" value={v.date} onChange={e => set({ date: e.target.value })} className={inp} />
          {!allDay && <>
            <input type="time" required aria-label="Start time" value={v.start} onChange={e => setStart(e.target.value)} className={inp} />
            <span className="text-faint">to</span>
            <input type="time" required aria-label="End time" value={v.end === "24:00" ? "23:59" : v.end} onChange={e => set({ end: e.target.value })} className={inp} />
          </>}
          <label className="flex items-center gap-2 text-[13px] text-muted ml-1"><input type="checkbox" checked={allDay} onChange={e => set(e.target.checked ? { start: "", end: "" } : { start: "09:00", end: "10:00" })} />All day</label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Repeat" value={v.repeat} onChange={e => setRepeat(e.target.value as Repeat | "")} className={inp}>
            <option value="">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
          </select>
          {v.repeat && <>
            <span className="text-[13px] text-muted">every</span>
            <input type="number" min={1} max={99} aria-label="Repeat interval" value={v.every} onChange={e => set({ every: Number(e.target.value) || 1 })} className={inp + " w-[70px]"} />
            <span className="text-[13px] text-muted">{UNIT[v.repeat]}{v.every > 1 ? "s" : ""}</span>
          </>}
        </div>
        {v.repeat === "weekly" && (
          <div className="flex flex-wrap gap-1.5">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((n, i) => <button type="button" key={n} aria-pressed={v.days.includes(i)} onClick={() => toggleDay(i)} className={`w-11 py-1.5 rounded-full text-[12px] border ${v.days.includes(i) ? "bg-brass text-[#06110c] border-brass" : "border-line text-muted"}`}>{n}</button>)}</div>
        )}
        {v.repeat && <label className="flex items-center gap-2 text-[13px] text-muted">Ends on<input type="date" value={v.until} min={v.date} onChange={e => set({ until: e.target.value })} className={inp} />{v.until ? <button type="button" onClick={() => set({ until: "" })} className="text-brass">never end</button> : <span className="text-faint">empty = never</span>}</label>}
        <input value={v.place} onChange={e => set({ place: e.target.value })} placeholder="Place or link" aria-label="Place" className={inp + " w-full"} />
        <textarea value={v.notes} onChange={e => set({ notes: e.target.value })} placeholder="Notes" aria-label="Notes" rows={3} className={inp + " w-full resize-y"} />
        <div className="flex gap-2">{COLORS.map(c => <button type="button" key={c} aria-label={`Colour ${c}`} aria-pressed={v.color === c} onClick={() => set({ color: c })} className="w-6 h-6 rounded-full" style={{ background: c, outline: v.color === c ? "2px solid #f4eee1" : "none", outlineOffset: 2 }} />)}</div>
        <div className="flex items-center gap-3 pt-2">
          <button className="rounded-full bg-brass text-[#06110c] font-medium px-6 py-2 text-[13px]">{event ? "Save" : "Add event"}</button>
          <button type="button" onClick={onClose} className="text-[13px] text-muted hover:text-text">Cancel</button>
          {event && <button type="button" onClick={onDelete} className="ml-auto text-[13px] text-[#e0725c] hover:underline">Delete</button>}
        </div>
      </form>
    </Modal>
  );
}
