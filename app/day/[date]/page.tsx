import Link from "next/link";
import { connection } from "next/server";
import { dayView, tasks } from "@/lib/data";
import { today as todayStr } from "@/lib/vault";
import { googleEvents, vaultItems, type CalItem } from "@/lib/calendar";
import { Reveal } from "@/components/ui";
import Md from "@/components/Md";

const addDays = (d: string, n: number) => new Date(new Date(d + "T12:00:00Z").getTime() + n * 86400000).toISOString().slice(0, 10);
const fmt = (d: string, o: Intl.DateTimeFormatOptions) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });
const COLOR: Record<string, string> = { google: "#8fb8d8", task: "#C9A45C", meeting: "#5FB58C", daily: "#9aa79e" };
const nav = "px-4 py-1.5 rounded-full text-[13px] border border-line text-muted hover:text-text";

function Block({ title, count, children, empty }: { title: string; count?: number; children?: React.ReactNode; empty?: string }) {
  return (
    <section className="panel p-6">
      <div className="eyebrow mb-3">{title}{count ? ` · ${count}` : ""}</div>
      {children || <p className="text-faint text-[13px]">{empty || "Nothing."}</p>}
    </section>
  );
}
function Events({ items }: { items: CalItem[] }) {
  if (!items.length) return null;
  return <div className="space-y-2">{items.map((it, i) => {
    const row = <span className="flex items-baseline gap-2 text-[14px]"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: it.overdue ? "#e0725c" : COLOR[it.kind] }} /><span className="font-mono text-faint text-[12px] w-12 shrink-0">{it.time || "all day"}</span><span>{it.title}</span></span>;
    return it.href ? <Link key={i} href={it.href} className="block hover:text-brass">{row}</Link> : <div key={i}>{row}</div>;
  })}</div>;
}

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  await connection();
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return <p className="text-muted">Not a date: {date}</p>;
  const now = todayStr(), next = addDays(date, 1);
  const v = dayView(date);
  const g = await googleEvents(date, next);
  const items = [...vaultItems(date, next), ...g.items].filter(x => x.kind !== "daily");
  const sort = (a: CalItem, b: CalItem) => (a.time || "").localeCompare(b.time || "");
  const today = items.filter(x => x.date === date).sort(sort), tomorrow = items.filter(x => x.date === next).sort(sort);
  const overdue = date === now ? tasks().filter(t => t.overdue).slice(0, 8) : [];
  const act = v.activity;
  const rel = date === now ? "Today" : date === addDays(now, 1) ? "Tomorrow" : date === addDays(now, -1) ? "Yesterday" : "";
  return (
    <div className="space-y-6 max-w-[980px]">
      <Reveal>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/day/${addDays(date, -1)}`} className={nav}>← {fmt(addDays(date, -1), { weekday: "short", day: "numeric", month: "short" })}</Link>
          <Link href={`/day/${next}`} className={nav}>{fmt(next, { weekday: "short", day: "numeric", month: "short" })} →</Link>
          {date !== now && <Link href={`/day/${now}`} className={nav}>Today</Link>}
          <Link href={`/calendar?v=day&d=${date}`} className="text-[12px] text-brass ml-auto">Calendar day →</Link>
        </div>
        <div className="eyebrow mt-5">{rel || "Day summary"}</div>
        <h1 className="serif text-[48px] leading-[1.05] mt-1">{fmt(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h1>
        {v.note?.summary && <p className="text-latte mt-2 text-[17px]">{v.note.summary}</p>}
        <div className="flex flex-wrap gap-2 mt-4">
          {act && <span className="chip">{(act.active / 60).toFixed(1)} h active in Claude</span>}
          <span className="chip">{v.log.length} logged</span>
          <span className="chip">{v.thoughts.length} thoughts</span>
          <span className="chip">{v.decisions.length} decisions</span>
          {v.note && <Link href={v.note.href} className="chip hover:text-brass">daily note ↗</Link>}
        </div>
      </Reveal>

      <Block title="What happened" count={v.log.length} empty={date > now ? "In the future. Plans are further down." : "No log lines for this day."}>
        {v.log.length > 0 && <ul className="space-y-3">{v.log.map((l, i) => <li key={i} className="border-l border-line pl-4 text-[14.5px] leading-relaxed"><Md body={l} /></li>)}</ul>}
      </Block>

      <div className="grid md:grid-cols-2 gap-6">
        <Block title="Thoughts" count={v.thoughts.length} empty="No thoughts logged.">
          {v.thoughts.length > 0 && <div className="space-y-3">{v.thoughts.map((t, i) => (
            <Link key={i} href={t.href} className="block hover:text-brass text-[14px] leading-relaxed">
              <span className="text-faint font-mono text-[11px] mr-2">{t.time || ""}</span>{t.project && <span className="chip mr-2">{t.project}</span>}{t.title.length > 160 ? t.title.slice(0, 160) + "…" : t.title}
            </Link>))}</div>}
        </Block>
        <Block title="Decisions" count={v.decisions.length} empty="No decisions logged.">
          {v.decisions.length > 0 && <div className="space-y-3">{v.decisions.map((d, i) => (
            <Link key={i} href={d.thoughtId ? `/thoughts/${d.thoughtId}` : d.href} className="block hover:text-brass text-[14px] leading-relaxed">
              <span className="text-faint font-mono text-[11px] mr-2">{d.time || ""}</span>{d.project && <span className="chip mr-2">{d.project}</span>}{d.title}
            </Link>))}</div>}
        </Block>
      </div>

      {act && act.byProject.length > 0 && (
        <Block title="Where the time went">
          <div className="space-y-2">{act.byProject.map(b => (
            <div key={b.project} className="flex items-center gap-3 text-[13px]">
              <span className="w-40 shrink-0 truncate">{b.project}</span>
              <span className="h-2 rounded-full bg-brass/70" style={{ width: `${Math.max(3, (b.minutes / act.active) * 100)}%` }} />
              <span className="text-faint font-mono">{(b.minutes / 60).toFixed(1)} h</span>
            </div>))}</div>
        </Block>
      )}

      {(v.wins.length > 0 || v.meetings.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {v.wins.length > 0 && <Block title="Wins"><ul className="space-y-2 text-[14px]">{v.wins.map((w, i) => <li key={i}><Md body={w} /></li>)}</ul></Block>}
          {v.meetings.length > 0 && <Block title="Meetings"><ul className="space-y-2 text-[14px]">{v.meetings.map((w, i) => <li key={i}><Md body={w} /></li>)}</ul></Block>}
        </div>
      )}

      <Block title={date === now ? "Still on the calendar today" : "On the calendar"} count={today.length} empty="Nothing scheduled.">
        <Events items={today} />
        {overdue.length > 0 && <div className="mt-4 pt-4 border-t border-line"><div className="eyebrow !text-[10px] mb-2">Overdue</div>{overdue.map((t, i) => <Link key={i} href={t.href} className="block text-[13.5px] hover:text-brass"><span className="text-[#e0725c] font-mono text-[11px] mr-2">{t.due}</span>{t.text}</Link>)}</div>}
      </Block>

      <Block title={`Plan for ${fmt(next, { weekday: "long" })}`} empty="No plan yet.">
        {(v.tomorrow.length > 0 || tomorrow.length > 0) && <div className="space-y-4">
          {v.tomorrow.length > 0 && <ul className="space-y-2 text-[14px]">{v.tomorrow.map((l, i) => <li key={i} className="border-l border-brass/50 pl-3"><Md body={l} /></li>)}</ul>}
          <Events items={tomorrow} />
        </div>}
      </Block>
      {g.error && <div className="chip !text-[#e0725c]">Google Calendar: {g.error}</div>}
    </div>
  );
}
