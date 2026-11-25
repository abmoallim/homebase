"use client";
import Link from "next/link";
import { useState } from "react";
import { addDecisionAction } from "@/app/add/actions";
import type { Decision } from "@/lib/data";

const month = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const day = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export default function DecisionsBoard({ items, projects }: { items: Decision[]; projects: string[] }) {
  const [q, setQ] = useState("");
  const [proj, setProj] = useState("");
  const list = items.filter(d => (!proj || d.project === proj) && (!q || (d.title + d.why + (d.project || "")).toLowerCase().includes(q.toLowerCase())));
  const tags = [...new Set(items.map(i => i.project).filter(Boolean))] as string[];
  const groups = new Map<string, Decision[]>();
  for (const d of list) { const m = month(d.date); if (!groups.has(m)) groups.set(m, []); groups.get(m)!.push(d); }
  const inp = "bg-[rgba(255,255,255,0.03)] border border-line rounded-full px-4 py-1.5 text-[13px] outline-none focus:border-brass";
  return (
    <div className="space-y-6 max-w-[980px]">
      <form action={addDecisionAction} className="panel p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <input name="text" required placeholder="What I decided or did: “Built Herdr Editable Files”, “Moving the gym to 5 pm”…" className="flex-1 min-w-[260px] bg-transparent outline-none text-[15px]" />
          <select name="project" className={inp}><option value="">No project</option>{projects.map(p => <option key={p}>{p}</option>)}</select>
          <button className="rounded-full bg-brass text-[#06110c] font-medium px-5 py-1.5 text-[13px]">Log it</button>
        </div>
        <input name="why" placeholder="Why (optional)" className="w-full bg-transparent outline-none text-[13px] text-muted" />
      </form>
      <div className="flex flex-wrap items-center gap-2">
        {tags.length > 0 && <select value={proj} onChange={e => setProj(e.target.value)} className={inp}><option value="">All projects</option>{tags.map(t => <option key={t}>{t}</option>)}</select>}
        <span className="text-faint text-[13px]">{list.length} decision{list.length === 1 ? "" : "s"}</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search decisions…" className={inp + " ml-auto w-56"} />
      </div>
      {[...groups.entries()].map(([m, ds]) => (
        <section key={m}>
          <div className="eyebrow mb-3">{m}</div>
          <div className="relative pl-6 border-l border-line space-y-3">
            {ds.map((d, i) => (
              <div key={i} className="panel px-5 py-4 relative">
                <span className="absolute -left-[30px] top-5 w-2.5 h-2.5 rounded-full bg-[#5FB58C]" />
                <div className="flex flex-wrap items-center gap-2 mb-1.5 text-[11px]">
                  <span className="font-mono px-2 py-0.5 rounded-md border" style={{ color: "#5FB58C", borderColor: "#5FB58C55" }}>Decision</span>
                  {d.project && <span className="chip">{d.project}</span>}
                  <span className="text-faint font-mono ml-auto">{day(d.date)}{d.time ? ` · ${d.time}` : ""}</span>
                </div>
                <Link href={d.href} className="text-[14.5px] leading-relaxed hover:text-brass">{d.title}</Link>
                {d.why && <div className="text-[13px] text-muted mt-1.5">{d.why}</div>}
                {d.thoughtId && <Link href={`/thoughts/${d.thoughtId}`} className="block text-[12px] text-brass mt-2">↳ came from: {d.thoughtTitle ? d.thoughtTitle.slice(0, 90) + (d.thoughtTitle.length > 90 ? "…" : "") : "a thought"}</Link>}
              </div>
            ))}
          </div>
        </section>
      ))}
      {!list.length && <p className="text-muted">No decisions yet. Log the first one above, or from a thought's page.</p>}
    </div>
  );
}
