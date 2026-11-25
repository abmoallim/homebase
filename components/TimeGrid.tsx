import Link from "next/link";
import type { CalItem } from "@/lib/calendar";

const H = 48, FROM = 5; // px per hour, first hour shown
const mins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const COLOR: Record<CalItem["kind"], string> = { google: "#8fb8d8", task: "#C9A45C", meeting: "#5FB58C", daily: "#9aa79e" };
const dow = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });

/** Lay overlapping events side by side. */
function lanes(list: CalItem[]) {
  const ev = list.map(it => ({ it, s: mins(it.time!), e: Math.max(mins(it.end || it.time!), mins(it.time!) + 30) })).sort((a, b) => a.s - b.s || b.e - a.e);
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

function Chip({ it, now }: { it: CalItem; now?: boolean }) {
  const inner = <span className="flex items-baseline gap-1.5 text-[12px] leading-tight"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: it.overdue ? "#e0725c" : COLOR[it.kind] }} /><span className="truncate">{it.title}</span></span>;
  return it.href ? <Link href={it.href} className="block hover:text-brass">{inner}</Link> : <div>{inner}</div>;
}

export default function TimeGrid({ days, by, today, nowTime, link }: { days: string[]; by: Map<string, CalItem[]>; today: string; nowTime: string; link: (d: string) => string }) {
  const hours = Array.from({ length: 24 - FROM }, (_, i) => FROM + i);
  const cols = `56px repeat(${days.length}, minmax(0, 1fr))`;
  const wide = days.length === 1;
  return (
    <div className="panel overflow-hidden">
      <div className="grid border-b border-line" style={{ gridTemplateColumns: cols }}>
        <div />
        {days.map(d => (
          <Link key={d} href={link(d)} className={`px-2 py-2 border-l border-line hover:bg-[rgba(255,255,255,0.03)] ${d === today ? "text-brass" : "text-muted"}`}>
            <div className="eyebrow !text-[10px]">{dow(d)}</div>
            <div className={`serif text-[22px] leading-none ${d === today ? "text-brass" : "text-text"}`}>{Number(d.slice(8))}</div>
          </Link>
        ))}
      </div>
      <div className="grid border-b border-line" style={{ gridTemplateColumns: cols }}>
        <div className="eyebrow !text-[10px] px-2 py-2">All day</div>
        {days.map(d => (
          <div key={d} className="border-l border-line px-2 py-2 space-y-1 min-h-[34px]">
            {(by.get(d) || []).filter(x => !x.time).map((it, i) => <Chip key={i} it={it} />)}
          </div>
        ))}
      </div>
      <div className="grid relative" style={{ gridTemplateColumns: cols, height: hours.length * H }}>
        <div className="relative">{hours.map(h => <div key={h} className="absolute right-2 text-[10px] font-mono text-faint -translate-y-1.5" style={{ top: (h - FROM) * H }}>{String(h).padStart(2, "0")}:00</div>)}</div>
        {days.map(d => (
          <div key={d} className={`relative border-l border-line ${d === today ? "bg-[rgba(201,164,92,0.05)]" : ""}`}>
            {hours.map(h => <div key={h} className="absolute inset-x-0 border-t border-line/60" style={{ top: (h - FROM) * H }} />)}
            {lanes((by.get(d) || []).filter(x => x.time)).map((x, i) => {
              const top = Math.max(0, (x.s / 60 - FROM) * H), h = Math.max(22, ((x.e - Math.max(x.s, FROM * 60)) / 60) * H - 2);
              const c = COLOR[x.it.kind];
              const body = (
                <div className="h-full rounded-md px-1.5 py-1 overflow-hidden text-[11.5px] leading-tight border-l-2" style={{ background: c + "26", borderColor: c }}>
                  <div className="font-mono text-faint text-[10px]">{x.it.time}{x.it.end ? `–${x.it.end}` : ""}</div>
                  <div className={wide ? "" : "truncate"}>{x.it.title}</div>
                  {wide && x.it.place && <div className="text-faint text-[11px] mt-0.5">{x.it.place}</div>}
                </div>
              );
              return <div key={i} className="absolute px-0.5" style={{ top, height: h, left: `${(x.lane / x.n) * 100}%`, width: `${100 / x.n}%` }}>{x.it.href ? <Link href={x.it.href} className="block h-full">{body}</Link> : body}</div>;
            })}
            {d === today && mins(nowTime) >= FROM * 60 && <div className="absolute inset-x-0 border-t-2 border-[#e0725c] z-10" style={{ top: (mins(nowTime) / 60 - FROM) * H }}><span className="absolute -left-1 -top-[5px] w-2 h-2 rounded-full bg-[#e0725c]" /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
