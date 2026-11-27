"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CalItem } from "@/lib/calendar";
import type { Occurrence } from "@/lib/events";
import { itemColor, sortItems, time12, type Slot } from "./Calendar";
import { trackPointer, under } from "./drag";

const H = 72, SNAP = 15, FIRST_HOUR = 6; // px per hour, minutes, hour at the top when the page opens
const mins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const dow = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
const endOf = (it: CalItem) => it.end ? mins(it.end) : Math.min(1440, mins(it.time!) + 45);

/** Lay overlapping events side by side. */
function lanes(list: CalItem[]) {
  const ev = list.map(it => ({ it, s: mins(it.time!), e: Math.max(endOf(it), mins(it.time!) + 30) })).sort((a, b) => a.s - b.s || b.e - a.e);
  const out: { it: CalItem; s: number; e: number; lane: number; n: number }[] = [];
  let group: typeof out = [], gEnd = -1, ends: number[] = [];
  const flush = () => { for (const g of group) g.n = ends.length; out.push(...group); group = []; ends = []; };
  for (const x of ev) {
    if (x.s >= gEnd && group.length) flush();
    let l = ends.findIndex(e => e <= x.s); if (l < 0) { l = ends.length; ends.push(0); }
    ends[l] = x.e; gEnd = Math.max(gEnd, x.e);
    group.push({ ...x, lane: l, n: 1 });
  }
  flush();
  return out;
}

type Props = {
  days: string[]; items: CalItem[]; today: string; nowTime: string; dayHref: (d: string) => string;
  onOpen: (e: Occurrence) => void; onAdd: (s: Slot) => void; onMove: (e: Occurrence, to: Slot) => void;
};
type Preview = Slot & { key: string; title: string; color: string };

export default function TimeGrid({ days, items, today, nowTime, dayHref, onOpen, onAdd, onMove }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = FIRST_HOUR * H; }, []);
  const cols = `92px repeat(${days.length}, minmax(0, 1fr))`;
  const wide = days.length === 1;
  const on = (d: string) => items.filter(x => x.date === d).sort(sortItems);

  const minutesIn = (el: HTMLElement, y: number) => ((y - el.getBoundingClientRect().top) / H) * 60;
  const snap = (m: number) => Math.round(m / SNAP) * SNAP;

  /** Press on empty time: a click makes a one hour slot, a drag picks the range. */
  function select(e: React.PointerEvent<HTMLDivElement>, date: string) {
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    e.preventDefault();
    const col = e.currentTarget;
    const anchor = clamp(Math.floor(minutesIn(col, e.clientY) / 30) * 30, 0, 1410);
    let slot: Slot = { date, start: hhmm(anchor), end: hhmm(Math.min(1439, anchor + 60)) };
    trackPointer(e, ev => {
      const m = clamp(snap(minutesIn(col, ev.clientY)), 0, 1440);
      const a = Math.min(anchor, m), b = Math.max(anchor + SNAP, m);
      slot = { date, start: hhmm(a), end: hhmm(b) };
      setPreview({ ...slot, key: "new", title: "New event", color: "#C9A45C" });
    }, ev => { setPreview(null); if (ev) onAdd(slot); });
  }

  /** Press on an event: a click opens it, a drag moves it, a drag on the bottom edge resizes it. */
  function grab(e: React.PointerEvent<HTMLElement>, it: CalItem, mode: "move" | "resize") {
    const ev0 = it.event;
    if (!ev0 || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const s0 = ev0.start ? mins(ev0.start) : 0, length = ev0.start ? mins(ev0.end) - s0 : 60;
    const startCol = under(e.nativeEvent, "data-col");
    const grabbed = ev0.start && startCol ? minutesIn(startCol, e.clientY) - s0 : 0;
    let to: Slot | null = null;
    trackPointer(e, ev => {
      if (mode === "resize") {
        if (!startCol) return;
        to = { date: ev0.date, start: ev0.start, end: hhmm(clamp(snap(minutesIn(startCol, ev.clientY)), s0 + SNAP, 1440)) };
      } else {
        const col = under(ev, "data-col"), allDay = under(ev, "data-allday");
        if (allDay) to = { date: allDay.dataset.allday!, start: "", end: "" };
        else if (col) {
          const s = clamp(snap(minutesIn(col, ev.clientY) - grabbed), 0, 1440 - length);
          to = { date: col.dataset.col!, start: hhmm(s), end: hhmm(s + length) };
        }
      }
      if (to) setPreview({ ...to, key: ev0.id + ev0.occ, title: ev0.title, color: itemColor(it) });
    }, (ev, moved) => {
      setPreview(null);
      if (!ev) return;
      if (!moved) onOpen(ev0); else if (to) onMove(ev0, to);
    });
  }

  const chip = (it: CalItem, i: number) => {
    const c = itemColor(it);
    const dragging = it.event && preview?.key === it.event.id + it.event.occ;
    if (it.event) return <button key={i} onPointerDown={e => grab(e, it, "move")} onKeyDown={e => e.key === "Enter" && onOpen(it.event!)} className={`block w-full text-left truncate rounded-md border-l-2 px-1.5 py-0.5 text-[12px] cursor-grab touch-none ${dragging ? "opacity-40" : ""}`} style={{ background: c + "26", borderColor: c }}>{it.title}</button>;
    const inner = <span className="flex items-baseline gap-1.5 text-[12px] leading-tight"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} /><span className="truncate">{it.title}</span></span>;
    return it.href ? <Link key={i} href={it.href} title={it.title} className="block hover:text-brass">{inner}</Link> : <div key={i}>{inner}</div>;
  };

  return (
    <div className="panel overflow-hidden">
      <div ref={scroller} className="overflow-auto h-[calc(100vh-190px)] min-h-[420px]">
        <div className={wide ? "" : "min-w-[760px]"}>
          <div className="sticky top-0 z-20 bg-panel">
            <div className="grid border-b border-line" style={{ gridTemplateColumns: cols }}>
              <div />
              {days.map(d => (
                <Link key={d} href={dayHref(d)} className="flex items-center justify-center gap-3 py-3 border-l border-line hover:bg-[rgba(255,255,255,0.03)]">
                  <span className={`eyebrow !text-[13px] ${d === today ? "!text-brass" : ""}`}>{dow(d)}</span>
                  <span className={`text-[17px] font-semibold ${d === today ? "w-8 h-8 grid place-items-center rounded-full bg-brass text-[#06110c]" : ""}`}>{Number(d.slice(8))}</span>
                </Link>
              ))}
            </div>
            <div className="grid border-b border-line" style={{ gridTemplateColumns: cols }}>
              <div className="eyebrow !text-[10px] grid place-items-center">All day</div>
              {days.map(d => (
                <div key={d} data-allday={d} onClick={e => e.target === e.currentTarget && onAdd({ date: d, start: "", end: "" })}
                  className={`border-l border-line px-1 py-1 space-y-1 min-h-[34px] max-h-[104px] overflow-y-auto cursor-pointer ${preview && !preview.start && preview.date === d ? "bg-[rgba(201,164,92,0.18)]" : ""}`}>
                  {on(d).filter(x => !x.time).map(chip)}
                </div>
              ))}
            </div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: cols, height: 24 * H }}>
            <div className="bg-[rgba(255,255,255,0.02)]">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="flex flex-col items-center pt-3 gap-1 border-b border-line text-muted" style={{ height: H }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg>
                  <span className="text-[12px] font-semibold">{time12(hhmm(h * 60))}</span>
                </div>
              ))}
            </div>
            {days.map(d => (
              <div key={d} data-col={d} onPointerDown={e => select(e, d)} className={`relative border-l border-line cursor-pointer select-none ${d === today ? "bg-[rgba(201,164,92,0.05)]" : ""}`}
                style={{ backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${H - 1}px, var(--line) ${H - 1}px ${H}px)` }}>
                {lanes(on(d).filter(x => x.time)).map((x, i) => {
                  const top = (x.s / 60) * H, h = Math.max(22, ((x.e - x.s) / 60) * H - 2);
                  const c = itemColor(x.it), ev = x.it.event;
                  const dragging = ev && preview?.key === ev.id + ev.occ;
                  const body = (
                    <div className={`h-full rounded-lg px-2 py-1 overflow-hidden text-[12px] leading-tight border-l-[3px] ${dragging ? "opacity-40" : ""}`} style={{ background: `color-mix(in srgb, ${c} 22%, var(--panel-solid))`, borderColor: c }}>
                      <div className={`font-medium ${wide ? "" : "line-clamp-2"}`}>{ev?.repeat ? <span className="text-faint mr-1" title="Repeats">↻</span> : null}{x.it.title}</div>
                      {h > 34 && <div className="text-muted text-[10.5px] mt-0.5 truncate">{time12(x.it.time!)}{x.it.end ? ` – ${time12(x.it.end)}` : ""}</div>}
                      {x.it.place && h > 52 && <div className="text-faint text-[10.5px] truncate">{x.it.place}</div>}
                    </div>
                  );
                  return (
                    <div key={ev ? ev.id + ev.occ : i} className="absolute px-0.5" style={{ top, height: h, left: `${(x.lane / x.n) * 100}%`, width: `${100 / x.n}%` }}>
                      {ev ? (
                        <div role="button" tabIndex={0} onPointerDown={e => grab(e, x.it, "move")} onKeyDown={e => e.key === "Enter" && onOpen(ev)} className="relative h-full cursor-grab touch-none">
                          {body}
                          <span onPointerDown={e => grab(e, x.it, "resize")} className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize" />
                        </div>
                      ) : x.it.href ? <Link href={x.it.href} className="block h-full">{body}</Link> : body}
                    </div>
                  );
                })}
                {preview && preview.start && preview.date === d && (
                  <div className="absolute inset-x-0.5 z-10 pointer-events-none rounded-lg border px-2 py-1 text-[12px] leading-tight shadow-xl" style={{ top: (mins(preview.start) / 60) * H, height: Math.max(18, ((mins(preview.end) - mins(preview.start)) / 60) * H - 2), borderColor: preview.color, background: `color-mix(in srgb, ${preview.color} 35%, var(--panel-solid))` }}>
                    <div className="font-medium truncate">{preview.title}</div>
                    <div className="text-[10.5px]">{time12(preview.start)} – {time12(preview.end)}</div>
                  </div>
                )}
                {d === today && <div className="absolute inset-x-0 border-t-2 border-[#e0725c] z-10 pointer-events-none" style={{ top: (mins(nowTime) / 60) * H }}><span className="absolute -left-1 -top-[5px] w-2 h-2 rounded-full bg-[#e0725c]" /></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
