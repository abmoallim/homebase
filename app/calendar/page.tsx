import Link from "next/link";
import { connection } from "next/server";
import { today } from "@/lib/vault";
import { googleEvents, vaultItems, calendarUrls, type CalItem } from "@/lib/calendar";
import { Reveal } from "@/components/ui";
import TimeGrid from "@/components/TimeGrid";
import { profile } from "@/lib/vault";

const KIND: Record<CalItem["kind"], { label: string; color: string }> = {
  google: { label: "Google", color: "#8fb8d8" }, task: { label: "Task", color: "#C9A45C" }, meeting: { label: "Meeting", color: "#5FB58C" }, daily: { label: "Daily", color: "#9aa79e" },
};
const iso = (d: Date) => d.toISOString().slice(0, 10);
const shift = (m: string, by: number) => { const d = new Date(m + "-01T12:00:00Z"); d.setUTCMonth(d.getUTCMonth() + by); return iso(d).slice(0, 7); };
const addDays = (d: string, n: number) => iso(new Date(new Date(d + "T12:00:00Z").getTime() + n * 86400000));
const long = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const sortItems = (a: CalItem, b: CalItem) => (a.time ? 1 : 0) - (b.time ? 1 : 0) === 0 ? (a.time || "").localeCompare(b.time || "") : (a.time ? 1 : -1);

function Row({ it, big }: { it: CalItem; big?: boolean }) {
  const k = KIND[it.kind];
  const inner = (
    <span className={`flex items-baseline gap-1.5 ${big ? "text-[14.5px]" : "text-[11.5px] leading-tight"}`}>
      <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0 translate-y-[-1px]" style={{ background: it.overdue ? "#e0725c" : k.color }} />
      {it.time && <span className="font-mono text-faint shrink-0">{it.time}</span>}
      <span className={big ? "" : "truncate"}>{it.title}</span>
    </span>
  );
  return it.href ? <Link href={it.href} className="block hover:text-brass">{inner}</Link> : <div>{inner}</div>;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; d?: string; v?: string }> }) {
  await connection();
  const sp = await searchParams;
  const now = today();
  const view = sp.v === "week" || sp.v === "day" ? sp.v : "month";
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(sp.d || "") ? sp.d! : /^\d{4}-\d{2}$/.test(sp.m || "") ? (sp.m === now.slice(0, 7) ? now : sp.m + "-01") : now;
  const month = anchor.slice(0, 7), sel = anchor;
  const first = new Date(month + "-01T12:00:00Z");
  const monStart = (d: string) => addDays(d, -((new Date(d + "T12:00:00Z").getUTCDay() + 6) % 7));
  const days = view === "day" ? [anchor] : view === "week" ? Array.from({ length: 7 }, (_, i) => addDays(monStart(anchor), i)) : Array.from({ length: 42 }, (_, i) => addDays(monStart(month + "-01"), i));
  const [from, to] = [days[0], days[days.length - 1]];
  const g = await googleEvents(from, to);
  const items = [...vaultItems(from, to), ...g.items];
  const by = new Map<string, CalItem[]>();
  for (const it of items) { if (!by.has(it.date)) by.set(it.date, []); by.get(it.date)!.push(it); }
  for (const l of by.values()) l.sort(sortItems);
  const fmt = (d: string, o: Intl.DateTimeFormatOptions) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });
  const label = view === "month" ? fmt(month + "-01", { month: "long", year: "numeric" }) : view === "day" ? fmt(anchor, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : `${fmt(from, { day: "numeric", month: "short" })} – ${fmt(to, { day: "numeric", month: "short", year: "numeric" })}`;
  const step = view === "month" ? (n: number) => shift(month, n) + "-01" : (n: number) => addDays(anchor, n * (view === "week" ? 7 : 1));
  const href = (v: string, d: string) => `/calendar?v=${v}&d=${d}`;
  const nowTime = new Intl.DateTimeFormat("en-GB", { timeZone: profile().timezone, hour: "2-digit", minute: "2-digit" }).format(new Date());
  const nav = "px-4 py-1.5 rounded-full text-[13px] border border-line text-muted hover:text-text";
  const selItems = by.get(sel) || [];
  return (
    <div className="space-y-6">
      <Reveal><div className="eyebrow">Google events, tasks, meetings and daily notes in one place</div><h1 className="serif text-[52px] leading-none mt-2">Calendar</h1></Reveal>
      {!g.configured && (
        <div className="panel p-5 text-[14px] leading-relaxed max-w-[760px]">
          <div className="font-medium mb-1">Connect Google Calendar (2 minutes, read-only)</div>
          In Google Calendar: <b>Settings → your calendar → Integrate calendar → Secret address in iCal format</b>, copy it, then add it to <span className="font-mono">homebase.config.json</span>:
          <pre className="font-mono text-[12.5px] bg-[rgba(255,255,255,0.04)] rounded-lg p-3 mt-2 overflow-x-auto">{`{ "vault": "…", "calendar": "https://calendar.google.com/calendar/ical/…/basic.ics" }`}</pre>
          That address is a password for your calendar: the config file is not committed. Reload this page after saving. Your vault items show below in the meantime.
        </div>
      )}
      {g.error && <div className="chip !text-[#e0725c]">Google Calendar: {g.error}</div>}
      <div className="flex flex-wrap items-center gap-2">
        <Link href={href(view, step(-1))} className={nav}>← Prev</Link>
        <div className="serif text-[26px] mx-2 min-w-[190px] text-center">{label}</div>
        <Link href={href(view, step(1))} className={nav}>Next →</Link>
        <Link href={href(view, now)} className={nav + " ml-2"}>Today</Link>
        <div className="flex rounded-full border border-line overflow-hidden ml-2">{(["month", "week", "day"] as const).map(v => <Link key={v} href={href(v, anchor)} className={`px-4 py-1.5 text-[13px] capitalize ${view === v ? "bg-brass text-[#06110c]" : "text-muted hover:text-text"}`}>{v}</Link>)}</div>
        <div className="ml-auto flex gap-3 text-[11px] text-faint">{(Object.keys(KIND) as CalItem["kind"][]).filter(k => k !== "google" || g.configured).map(k => <span key={k} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: KIND[k].color }} />{KIND[k].label}</span>)}<span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "#e0725c" }} />Overdue</span></div>
      </div>
      {view !== "month" ? <TimeGrid days={days} by={by} today={now} nowTime={nowTime} link={d => href("day", d)} /> :
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="panel overflow-hidden">
          <div className="grid grid-cols-7 border-b border-line">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <div key={d} className="eyebrow !text-[10px] px-2 py-2">{d}</div>)}</div>
          <div className="grid grid-cols-7">
            {days.map((d, i) => {
              const l = by.get(d) || [], inMonth = d.slice(0, 7) === month, isToday = d === now;
              const shown = l.filter(x => x.kind !== "daily");
              return (
                <Link key={d} href={href("month", d)} className={`min-h-[104px] p-1.5 border-b border-r border-line hover:bg-[rgba(255,255,255,0.03)] ${inMonth ? "" : "opacity-40"} ${d === sel ? "bg-[rgba(201,164,92,0.10)]" : ""} ${i % 7 === 6 ? "border-r-0" : ""}`}>
                  <div className={`text-[12px] mb-1 flex items-center justify-between ${isToday ? "text-brass font-semibold" : "text-muted"}`}>
                    <span className={isToday ? "px-1.5 rounded-full bg-brass text-[#06110c]" : ""}>{Number(d.slice(8))}</span>
                    {l.some(x => x.kind === "daily") && <span className="w-1.5 h-1.5 rounded-full" style={{ background: KIND.daily.color }} />}
                  </div>
                  <div className="space-y-0.5">
                    {shown.slice(0, 3).map((it, j) => <div key={j} className="pointer-events-none"><Row it={it} /></div>)}
                    {shown.length > 3 && <div className="text-[11px] text-faint">+{shown.length - 3} more</div>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <aside className="panel p-5 lg:sticky lg:top-6">
          <div className="eyebrow mb-1">{sel === now ? "Today" : "Selected day"}</div>
          <div className="serif text-[24px] mb-4">{long(sel)}</div>
          {selItems.length ? <div className="space-y-3">{selItems.map((it, i) => (
            <div key={i}>
              <div className="text-[10px] font-mono mb-0.5" style={{ color: KIND[it.kind].color }}>{KIND[it.kind].label.toUpperCase()}{it.overdue ? " · OVERDUE" : ""}</div>
              <Row it={it} big />
              {it.place && <div className="text-[12px] text-faint mt-0.5">{it.place}</div>}
            </div>))}</div> : <p className="text-muted text-[14px]">Nothing on this day.</p>}
          <Link href={href("day", sel)} className="block text-[12px] text-brass mt-4">Open day view →</Link>
          <Link href={`/day/${sel}`} className="block text-[12px] text-brass mt-2">Day summary →</Link>
        </aside>
      </div>}
    </div>
  );
}
