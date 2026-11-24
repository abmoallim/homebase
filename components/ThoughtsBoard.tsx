"use client";
import Link from "next/link";
import { useState } from "react";
import { addItem } from "@/app/add/actions";
import type { Thought } from "@/lib/data";

const FILTERS = [{ k: "all", l: "All" }, { k: "log", l: "Log" }, { k: "inbox", l: "Notes" }, { k: "idea", l: "Ideas" }, { k: "journal", l: "From journal" }];
const KIND: Record<string, { label: string; color: string }> = {
  log: { label: "Thought", color: "#C9A45C" }, inbox: { label: "Note", color: "#D9A548" }, idea: { label: "Idea", color: "#5FB58C" }, journal: { label: "Journal", color: "#8fb8d8" },
};
const month = (d: string) => d ? new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) : "Undated";
const day = (d: string) => d ? new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }) : "";

export default function ThoughtsBoard({ items, projects }: { items: Thought[]; projects: string[] }) {
  const [f, setF] = useState("all");
  const [q, setQ] = useState("");
  const [proj, setProj] = useState("");
  const list = items.filter(t => (f === "all" || t.kind === f) && (!proj || t.project === proj) && (!q || (t.title + t.text + (t.project || "")).toLowerCase().includes(q.toLowerCase())));
  const tags = [...new Set(items.map(i => i.project).filter(Boolean))] as string[];
  const groups = new Map<string, Thought[]>();
  for (const t of list) { const m = month(t.date); if (!groups.has(m)) groups.set(m, []); groups.get(m)!.push(t); }
  const inp = "bg-[rgba(255,255,255,0.03)] border border-line rounded-full px-4 py-1.5 text-[13px] outline-none focus:border-brass";
  return (
    <div className="space-y-6 max-w-[980px]">
      <form action={addItem} className="panel p-4 flex flex-wrap gap-3 items-center">
        <input type="hidden" name="kind" value="thought" />
        <input name="text" required placeholder="Whatever is on your mind: big, small, half-formed…" className="flex-1 min-w-[260px] bg-transparent outline-none text-[15px]" />
        <select name="project" className={inp}><option value="">No project</option>{projects.map(p => <option key={p}>{p}</option>)}</select>
        <button className="rounded-full bg-brass text-[#06110c] font-medium px-5 py-1.5 text-[13px]">Log it</button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(x => (
          <button key={x.k} onClick={() => setF(x.k)} className={`px-4 py-1.5 rounded-full text-[13px] border ${f === x.k ? "bg-brass text-[#06110c] border-transparent" : "border-line text-muted hover:text-text"}`}>
            {x.l} <span className="opacity-60">{x.k === "all" ? items.length : items.filter(i => i.kind === x.k).length}</span>
          </button>
        ))}
        {tags.length > 0 && <select value={proj} onChange={e => setProj(e.target.value)} className={inp}><option value="">All projects</option>{tags.map(t => <option key={t}>{t}</option>)}</select>}
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search thoughts…" className={inp + " ml-auto w-56"} />
      </div>
      {[...groups.entries()].map(([m, ts]) => (
        <section key={m}>
          <div className="eyebrow mb-3">{m}</div>
          <div className="relative pl-6 border-l border-line space-y-3">
            {ts.map((t, i) => (
              <Link key={i} href={t.href} className="panel panel-hover block px-5 py-4 relative">
                <span className="absolute -left-[30px] top-5 w-2.5 h-2.5 rounded-full" style={{ background: KIND[t.kind].color }} />
                <div className="flex flex-wrap items-center gap-2 mb-1.5 text-[11px]">
                  <span className="font-mono px-2 py-0.5 rounded-md border" style={{ color: KIND[t.kind].color, borderColor: KIND[t.kind].color + "55" }}>{KIND[t.kind].label}</span>
                  {t.project && <span className="chip">{t.project}</span>}
                  <span className="text-faint font-mono ml-auto">{day(t.date)}{t.time ? ` · ${t.time}` : ""}</span>
                </div>
                <div className="text-[14.5px] leading-relaxed">{t.title}</div>
                {t.text && <div className="text-[13px] text-muted mt-1.5">{t.text}</div>}
              </Link>
            ))}
          </div>
        </section>
      ))}
      {!list.length && <p className="text-muted">Nothing here yet. Log your first thought above.</p>}
    </div>
  );
}
