"use client";
import Link from "next/link";
import { useState } from "react";
import type { CalItem } from "@/lib/calendar";
import type { Occurrence } from "@/lib/events";
import { itemColor, sortItems, time12, type Slot } from "./Calendar";
import { trackPointer, under } from "./drag";

type Props = {
  days: string[]; month: string; items: CalItem[]; today: string; dayHref: (d: string) => string;
  onOpen: (e: Occurrence) => void; onAdd: (s: Slot) => void; onMove: (e: Occurrence, to: Slot) => void;
};
const SHOWN = 4;

export default function MonthGrid({ days, month, items, today, dayHref, onOpen, onAdd, onMove }: Props) {
  const [drag, setDrag] = useState<{ key: string; over: string } | null>(null);

  function grab(e: React.PointerEvent, ev0: Occurrence) {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    let over = ev0.date;
    trackPointer(e, ev => {
      over = under(ev, "data-day")?.dataset.day || over;
      setDrag({ key: ev0.id + ev0.occ, over });
    }, (ev, moved) => {
      setDrag(null);
      if (!ev) return;
      if (!moved) onOpen(ev0); else onMove(ev0, { date: over, start: ev0.start, end: ev0.end });
    });
  }

  return (
    <div className="panel overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="eyebrow !text-[11px] py-2.5 text-center">{d}</div>)}</div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const list = items.filter(x => x.date === d).sort(sortItems);
          const shown = list.filter(x => x.kind !== "daily");
          return (
            <div key={d} data-day={d} onClick={e => e.target === e.currentTarget && onAdd({ date: d, start: "", end: "" })}
              className={`min-w-0 min-h-[130px] p-1.5 border-b border-line cursor-pointer hover:bg-[rgba(255,255,255,0.02)] ${i % 7 === 6 ? "" : "border-r"} ${d.slice(0, 7) === month ? "" : "opacity-45"} ${drag?.over === d ? "bg-[rgba(201,164,92,0.16)]" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <Link href={dayHref(d)} className={`text-[12px] ${d === today ? "w-6 h-6 grid place-items-center rounded-full bg-brass text-[#06110c] font-semibold" : "text-muted hover:text-brass px-1"}`}>{Number(d.slice(8))}</Link>
                {list.filter(x => x.kind === "daily").map((x, j) => <Link key={j} href={x.href!} title="Daily note" className="w-2 h-2 rounded-full" style={{ background: itemColor(x) }} />)}
              </div>
              <div className="space-y-0.5">
                {shown.slice(0, SHOWN).map((it, j) => {
                  const inner = <span className="flex items-baseline gap-1.5 text-[11.5px] leading-tight min-w-0"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: itemColor(it) }} />{it.time && <span className="text-faint shrink-0 text-[10.5px]">{time12(it.time).replace(":00", "")}</span>}<span className="truncate">{it.title}</span></span>;
                  const ev = it.event;
                  if (ev) return <button key={j} onPointerDown={e => grab(e, ev)} onKeyDown={e => e.key === "Enter" && onOpen(ev)} title={it.title} className={`block w-full text-left rounded px-1 py-0.5 cursor-grab touch-none hover:bg-[rgba(255,255,255,0.06)] ${drag?.key === ev.id + ev.occ ? "opacity-40" : ""}`}>{inner}</button>;
                  return it.href ? <Link key={j} href={it.href} title={it.title} className="block px-1 py-0.5 hover:text-brass">{inner}</Link> : <div key={j} className="px-1 py-0.5">{inner}</div>;
                })}
                {shown.length > SHOWN && <Link href={dayHref(d)} className="block px-1 text-[11px] text-faint hover:text-brass">+{shown.length - SHOWN} more</Link>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
