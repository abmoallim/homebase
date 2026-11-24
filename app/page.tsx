import Link from "next/link";
import { connection } from "next/server";
import { goals, now, tasks, content, daily, recent, inbox, STAGES, agents } from "@/lib/data";
import { redirect } from "next/navigation";
import { today as todayStr, profile } from "@/lib/vault";
import { Reveal, Count, Bar, GoalRing, Clock, Greeting } from "@/components/ui";
import Inline from "@/components/Inline";

export default async function Overview() {
  await connection();
  if (!profile().setup) redirect("/setup");
  const g = goals(), n = now(), t = tasks(), c = content(), d = daily(7), today = todayStr(), pf = profile();
  const todayNote = d.find(x => x.date === today);
  const due = t.filter(x => x.due).sort((a, b) => a.due!.localeCompare(b.due!)).slice(0, 6);
  const top = t.filter(x => (x.priority ?? 9) <= 2 && !x.due).slice(0, 6);
  const ag = agents().agents;
  const working = ag.filter(a => a.status === "working").length;
  const dateLabel = new Date(today + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow mb-2">{dateLabel}</div>
          <h1 className="serif text-[44px] md:text-[56px] leading-[1.02]"><Greeting />{pf.name ? <>, <span className="italic text-latte">{pf.name}</span></> : null}.</h1>
          {pf.tagline && <p className="text-muted mt-2 max-w-2xl">{pf.tagline}{pf.priorities.length > 0 && <> Priority: <Link href="/projects" className="text-brass">{pf.priorities.map(x => x.label).join(" → ")} → everything else</Link>.</>}</p>}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="text-[13px] text-muted"><Clock /></div>
          <div className="flex flex-wrap gap-2 justify-end">
            {g.countdowns.map(cd => (
              <div key={cd.label} className="panel !rounded-2xl px-4 py-2.5 text-right min-w-[128px]">
                <div className="text-[26px] font-semibold leading-none tabular-nums">{cd.days >= 0 ? <Count to={cd.days} /> : "✓"}<span className="text-[13px] text-muted font-normal ml-1">{cd.days >= 0 ? "days" : ""}</span></div>
                <div className="eyebrow !text-[10px] mt-1">{cd.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Goal + sources */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <Reveal delay={0.05} className="xl:col-span-5 panel p-6 relative overflow-hidden">
          <div className="eyebrow">{pf.goal.label || "The goal"}</div>
          <div className="relative flex items-center justify-center mt-2">
            <GoalRing value={g.mrr} target={g.target} segments={g.sources.map(s => ({ color: s.color, share: s.target / g.target }))} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="eyebrow !text-[10px]">{pf.goal.label || "Progress"}</div>
              <div className="serif text-[52px] leading-none mt-1"><Count to={g.mrr} prefix={pf.goal.unit} /></div>
              <div className="text-muted text-sm mt-1">of <span className="text-text">{pf.goal.unit}{g.target.toLocaleString()}</span> {pf.goal.short}</div>
              <div className="chip mt-3">{((g.mrr / g.target) * 100).toFixed(1)}% there</div>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-[12px] text-muted">
            {g.sources.map(s => <span key={s.name} className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />{s.name} {pf.goal.unit}{(s.target / 1000).toFixed(0)}k</span>)}
          </div>
        </Reveal>

        <div className="xl:col-span-7 grid gap-4">
          {g.sources.map((s, i) => (
            <Reveal key={s.name} delay={0.1 + i * 0.08}>
              <Link href={s.href || "/projects"} className="panel panel-hover block p-5 relative overflow-hidden">
                <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-25" style={{ background: s.color }} />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="eyebrow" style={{ color: s.color }}>{pf.source_label} {s.n}</div>
                    <div className="text-[24px] font-semibold mt-0.5">{s.name}</div>
                    <div className="text-[13px] text-muted mt-0.5">{s.kpi}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[28px] font-semibold tabular-nums leading-none"><Count to={s.have} /><span className="text-muted text-[16px]"> / {s.need}</span></div>
                    <div className="text-[12px] text-muted mt-1">{s.unit} · {pf.goal.unit}{s.mrr} {pf.goal.short}</div>
                  </div>
                </div>
                <div className="relative mt-4"><Bar pct={(s.have / s.need) * 100} color={s.color} delay={0.3 + i * 0.1} /></div>
                {s.next && <div className="relative mt-3 text-[13px] text-[#ddd5c3] truncate"><span className="text-faint mr-2">NEXT →</span>{s.next}</div>}
              </Link>
            </Reveal>
          ))}
        </div>
      </div>

      {/* This week / tasks / waiting */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Reveal delay={0.2} className="lg:col-span-5 panel p-6">
          <div className="flex items-center justify-between"><div className="eyebrow">This week</div><span className="text-[11px] text-faint">from Now.md · {n.date}</span></div>
          <ul className="mt-4 space-y-3">
            {(n.sections["This week"] || []).map((l, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed"><span className="text-brass mt-[2px]">✦</span><span><Inline text={l} /></span></li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.25} className="lg:col-span-4 panel p-6">
          <div className="flex items-center justify-between"><div className="eyebrow">Due soon</div><Link href="/tasks" className="text-[12px] text-brass">All {t.length} tasks →</Link></div>
          <ul className="mt-4 space-y-2.5">
            {due.map((x, i) => (
              <li key={i}><Link href={x.href} className="flex items-start gap-3 group">
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${x.overdue ? "bg-red blink" : "bg-amber"}`} />
                <span className="text-[14px] group-hover:text-brass transition-colors flex-1">{x.text}</span>
                <span className={`text-[11px] font-mono shrink-0 ${x.overdue ? "text-red" : "text-muted"}`}>{x.due!.slice(5)}</span>
              </Link></li>
            ))}
            {!due.length && <li className="text-muted text-sm">Nothing with a date. 🎉</li>}
          </ul>
          <div className="eyebrow mt-6">Top priority</div>
          <ul className="mt-3 space-y-2">
            {top.map((x, i) => (
              <li key={i}><Link href={x.href} className="flex items-start gap-3 group text-[13.5px]">
                <span className="text-[10px] font-mono mt-[3px] px-1.5 rounded border border-line text-muted">{x.priority ? "P" + x.priority : "DAY"}</span>
                <span className="group-hover:text-brass transition-colors">{x.text}</span>
              </Link></li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.3} className="lg:col-span-3 flex flex-col gap-5">
          <div className="panel p-6">
            <div className="eyebrow">Waiting on</div>
            <ul className="mt-3 space-y-2.5 text-[13.5px]">{(n.sections["Waiting on"] || []).map((l, i) => <li key={i} className="flex gap-2"><span className="text-amber">◷</span><span><Inline text={l} /></span></li>)}</ul>
          </div>
          <Link href="/office" className="panel panel-hover p-6 block">
            <div className="eyebrow">Agent office</div>
            <div className="flex items-baseline gap-2 mt-2"><span className="text-[34px] font-semibold"><Count to={working} /></span><span className="text-muted text-sm">working · {ag.length} agents</span></div>
            <div className="flex -space-x-2 mt-3">{ag.map(a => <span key={a.id} title={a.name} className="w-7 h-7 rounded-full border-2 border-[#0a1913] flex items-center justify-center text-[10px] font-bold text-[#06110c]" style={{ background: a.color }}>{a.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>)}</div>
          </Link>
        </Reveal>
      </div>

      {/* Content + today */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Reveal delay={0.35} className="lg:col-span-7 panel p-6">
          <div className="flex items-center justify-between"><div className="eyebrow">Content pipeline</div><Link href="/content" className="text-[12px] text-brass">Board →</Link></div>
          <div className="mt-5 grid grid-cols-6 gap-2">
            {STAGES.map((s, i) => {
              const k = c.filter(x => x.stage === s).length;
              return (
                <div key={s} className="relative">
                  <div className="rounded-xl border border-line p-3 text-center bg-[rgba(255,255,255,0.02)]">
                    <div className="text-[26px] font-semibold tabular-nums"><Count to={k} /></div>
                    <div className="text-[11px] text-muted capitalize">{s}</div>
                  </div>
                  {i < STAGES.length - 1 && <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-faint text-xs z-10">›</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-5 space-y-2">
            {c.filter(x => x.stage !== "idea").slice(0, 4).map(x => (
              <Link key={x.href} href={x.href} className="flex items-center justify-between text-[13.5px] hover:text-brass">
                <span>{x.no ? <span className="font-mono text-faint mr-2">{String(x.no).padStart(2, "0")}</span> : null}{x.name}</span>
                <span className="chip capitalize">{x.channel} · {x.stage}</span>
              </Link>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.4} className="lg:col-span-5 panel p-6">
          <div className="flex items-center justify-between"><div className="eyebrow">Today</div><Link href="/journal" className="text-[12px] text-brass">Journal →</Link></div>
          {todayNote ? (
            <Link href={todayNote.href} className="block mt-3">
              <div className="serif text-[26px] leading-tight">{todayNote.summary || "Today"}</div>
              <div className="flex flex-wrap gap-2 mt-3">{(todayNote.focus as string[]).map(f => <span key={f} className="chip">{f}</span>)}</div>
            </Link>
          ) : <p className="text-muted mt-3 text-sm">No note for today yet. Tell Claude about your day.</p>}
          <div className="eyebrow mt-6">Recent decisions</div>
          <ul className="mt-3 space-y-2.5 text-[13px] text-[#ddd5c3]">{(n.sections["Recent decisions"] || []).slice(0, 3).map((l, i) => <li key={i} className="border-l border-line pl-3"><Inline text={l} /></li>)}</ul>
        </Reveal>
      </div>

      {/* Recent + inbox */}
      <Reveal delay={0.45} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="panel p-6">
          <div className="eyebrow">Recently changed in the vault</div>
          <ul className="mt-3 divide-y divide-[rgba(201,164,92,0.08)]">{recent(7).map(r => (
            <li key={r.href}><Link href={r.href} className="flex justify-between py-2 text-[13.5px] hover:text-brass"><span>{r.name}</span><span className="text-faint text-[12px]">{r.folder}</span></Link></li>
          ))}</ul>
        </div>
        <div className="panel p-6">
          <div className="eyebrow">Inbox · to sort</div>
          <ul className="mt-3 space-y-2">{inbox().map(r => <li key={r.href}><Link href={r.href} className="text-[13.5px] hover:text-brass">{r.name}</Link></li>)}</ul>
          {!inbox().length && <p className="text-muted text-sm mt-3">Inbox zero.</p>}
        </div>
      </Reveal>
    </div>
  );
}
