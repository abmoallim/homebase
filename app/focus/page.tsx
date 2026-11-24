import Link from "next/link";
import { connection } from "next/server";
import { activity } from "@/lib/data";
import { today as todayStr, profile } from "@/lib/vault";
import { Reveal, Count } from "@/components/ui";
import FocusChart from "@/components/FocusChart";

const PCOL = (p: number) => p === 1 ? "#E0735A" : p === 2 ? "#D9A548" : p === 3 ? "#6fb7c4" : p <= 6 ? "#5FB58C" : "#6f6a5e";

export default async function Focus() {
  await connection();
  const all = activity(60);
  const today = todayStr();
  const pf = profile();
  const priLabel = pf.priorities.length ? pf.priorities.map(x => x.label).join(" and ") : "your priorities";
  const inLast = (d: string, n: number) => (Date.parse(today) - Date.parse(d)) / 86400000 < n;
  const w = all.filter(d => inLast(d.date, 7)), m = all.filter(d => inLast(d.date, 30));
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const wAct = sum(w.map(d => d.active)), wPri = sum(w.map(d => d.priorityMin)), wLate = sum(w.map(d => d.late));
  const share = wAct ? Math.round((wPri / wAct) * 100) : 0;
  const switches = w.length ? sum(w.map(d => d.projects)) / w.length : 0;
  const per = new Map<string, { project: string; priority: number; w: number; m: number }>();
  for (const d of m) for (const p of d.byProject) {
    const k = per.get(p.project) || { project: p.project, priority: p.priority, w: 0, m: 0 };
    k.m += p.minutes; if (inLast(d.date, 7)) k.w += p.minutes; per.set(p.project, k);
  }
  const ranked = [...per.values()].sort((a, b) => b.w - a.w || b.m - a.m);
  const maxM = Math.max(1, ...ranked.map(r => r.m));
  const chartDays = [...Array(14)].map((_, i) => {
    const d = new Date(Date.parse(today + "T12:00:00Z") - (13 - i) * 86400000).toISOString().slice(0, 10);
    const a = all.find(x => x.date === d);
    return { date: d, parts: (a?.byProject || []).map(p => ({ project: p.project, minutes: p.minutes, color: PCOL(p.priority) })) };
  });
  const td = all.find(d => d.date === today) || all[0];
  const lowPri = ranked.filter(r => r.priority >= 5 && r.w > 0).reduce((s, r) => s + r.w, 0);
  const insights = [
    share < 50 ? `Only **${share}%** of your Claude time this week went to ${priLabel}, your top priorities.` : `**${share}%** of your Claude time this week went to ${priLabel}. That's where it should be.`,
    wLate > 60 ? `**${(wLate / 60).toFixed(1)} h** of work happened between midnight and 5 am this week. Late nights cost the next morning.` : `Late-night work is low this week (${wLate} min).`,
    switches >= 3 ? `You touched **${switches.toFixed(1)} projects a day** on average. Each switch costs focus; try batching.` : `About ${switches.toFixed(1)} projects a day: good focus.`,
    lowPri > 120 ? `**${(lowPri / 60).toFixed(1)} h** went to P5+ work (study, vault, side projects) this week.` : "",
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <Reveal><div className="eyebrow">Where my time actually goes (local Claude sessions)</div><h1 className="serif text-[52px] leading-none mt-2">Focus</h1></Reveal>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { l: "Active this week", v: <><Count to={Math.round(wAct / 6) / 10} />h</>, s: `${w.length} days with sessions` },
          { l: "On priorities (P1–P2)", v: <><Count to={share} />%</>, s: pf.priorities.map(x => x.label).join(" + ") || "top priorities", c: share < 50 ? "#E0735A" : "#5FB58C" },
          { l: "After midnight", v: <><Count to={Math.round(wLate / 6) / 10} />h</>, s: "00:00–05:00", c: wLate > 60 ? "#D9A548" : undefined },
          { l: "Projects per day", v: switches.toFixed(1), s: "context switches" },
          { l: "Last 30 days", v: <><Count to={Math.round(sum(m.map(d => d.active)) / 60)} />h</>, s: `${m.length} active days` },
        ].map((x, i) => (
          <Reveal key={x.l} delay={i * 0.05} className="panel p-5">
            <div className="eyebrow !text-[10px]">{x.l}</div>
            <div className="text-[32px] font-semibold mt-1 tabular-nums" style={{ color: x.c }}>{x.v}</div>
            <div className="text-[12px] text-muted">{x.s}</div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.15} className="panel p-6">
        <div className="eyebrow mb-3">What the data says</div>
        <ul className="space-y-2">{insights.map((t, i) => <li key={i} className="flex gap-3 text-[15px]"><span className="text-brass">✦</span><span dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.+?)\*\*/g, '<b class="text-[#fffaf0]">$1</b>') }} /></li>)}</ul>
      </Reveal>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <Reveal delay={0.2} className="xl:col-span-7 panel p-6">
          <div className="flex justify-between"><div className="eyebrow">Last 14 days</div>
            <div className="flex gap-3 text-[11px] text-muted">{[["P1", 1], ["P2", 2], ["P3", 3], ["P4–6", 5], ["P7+", 9]].map(([l, p]) => <span key={l} className="flex items-center gap-1"><i className="w-2 h-2 rounded-sm" style={{ background: PCOL(p as number) }} />{l}</span>)}</div>
          </div>
          <FocusChart days={chartDays} />
        </Reveal>
        <Reveal delay={0.25} className="xl:col-span-5 panel p-6">
          <div className="eyebrow mb-4">By project · 7 days (30 days)</div>
          <ul className="space-y-3">{ranked.map(r => (
            <li key={r.project}>
              <div className="flex justify-between text-[13.5px]"><span><span className="font-mono text-[10px] px-1.5 mr-2 rounded border" style={{ color: PCOL(r.priority), borderColor: PCOL(r.priority) + "55" }}>P{r.priority}</span>{r.project}</span>
                <span className="text-muted tabular-nums">{(r.w / 60).toFixed(1)}h <span className="text-faint">({(r.m / 60).toFixed(1)}h)</span></span></div>
              <div className="h-[6px] mt-1.5 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 rounded-full opacity-30" style={{ width: (r.m / maxM) * 100 + "%", background: PCOL(r.priority) }} />
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: (r.w / maxM) * 100 + "%", background: PCOL(r.priority) }} />
              </div>
            </li>))}</ul>
        </Reveal>
      </div>
      {td && (
        <Reveal delay={0.3} className="panel p-6">
          <div className="flex justify-between"><div className="eyebrow">Sessions · {td.date}</div><Link href={td.href} className="text-[12px] text-brass">Activity note →</Link></div>
          <div className="relative h-[34px] mt-5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-line">
            {[0, 6, 12, 18].map(h => <span key={h} className="absolute -top-4 text-[10px] text-faint font-mono" style={{ left: (h / 24) * 100 + "%" }}>{String(h).padStart(2, "0")}:00</span>)}
            {td.sessions.map((s, i) => { const t = (x: string) => { const [h, mm] = x.split(":").map(Number); return (h * 60 + mm) / 1440 * 100; }; const a = t(s.start), b = Math.max(t(s.end), a + 0.6);
              return <span key={i} title={`${s.project} ${s.start}–${s.end}`} className="absolute top-1 bottom-1 rounded" style={{ left: a + "%", width: b - a + "%", background: PCOL(s.priority), opacity: 0.85 }} />; })}
          </div>
          <table className="w-full text-[13px] mt-5">
            <tbody>{td.sessions.map((s, i) => (
              <tr key={i} className="border-t border-line"><td className="py-2 pr-3 font-mono text-muted whitespace-nowrap">{s.start}–{s.end}</td>
                <td className="py-2 pr-3 whitespace-nowrap" style={{ color: PCOL(s.priority) }}>{s.project}</td><td className="py-2 pr-3 text-muted whitespace-nowrap">{s.minutes} min</td>
                <td className="py-2 text-[#d6cebc]">{s.first}</td></tr>))}</tbody>
          </table>
        </Reveal>
      )}
    </div>
  );
}
