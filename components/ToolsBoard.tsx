"use client";
import Link from "next/link";
import { useState } from "react";
import type { Tool } from "@/lib/data";

const KINDS = [{ k: "all", l: "All" }, { k: "built", l: "Built by me" }, { k: "used", l: "Tools I use" }];
const dim = (s: string) => ["paused", "dropped", "archived", "ended"].includes(s);
const host = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

function Card({ t, big }: { t: Tool; big?: boolean }) {
  return (
    <div className={`panel panel-hover ${big ? "p-5" : "p-4"} flex flex-col gap-2 h-full ${dim(t.status) ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-2">
        <Link href={t.href} className={`${big ? "text-[18px]" : "text-[15px]"} font-semibold hover:text-brass`}>{t.name}</Link>
        {big && <span className="chip ml-auto shrink-0">{t.category}</span>}
      </div>
      {t.summary && <p className={`${big ? "text-[13.5px]" : "text-[13px]"} text-[#d6cebc] leading-relaxed`}>{t.summary}</p>}
      <div className="mt-auto pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
        {t.status !== "active" && <span className="chip !text-amber">{t.status}</span>}
        {t.cost && <span className="font-mono text-muted">{t.cost}</span>}
        {t.since && <span>{t.kind === "built" ? "Built" : "Since"} {t.since}</span>}
        {t.projects.length > 0 && <span>{t.projects.join(" · ")}</span>}
        {t.url && <a href={t.url} target="_blank" rel="noreferrer" className="ml-auto text-muted hover:text-brass">{host(t.url)} ↗</a>}
      </div>
    </div>
  );
}

export default function ToolsBoard({ items }: { items: Tool[] }) {
  const [k, setK] = useState("all");
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const cats = [...new Set(items.map(i => i.category))].sort();
  const list = items.filter(t => (k === "all" || t.kind === k) && (!cat || t.category === cat)
    && (!q || (t.name + t.summary + t.category + t.projects.join(" ")).toLowerCase().includes(q.toLowerCase())));
  const built = list.filter(t => t.kind === "built");
  const used = list.filter(t => t.kind === "used");
  const byCat = new Map<string, Tool[]>();
  for (const t of used) { if (!byCat.has(t.category)) byCat.set(t.category, []); byCat.get(t.category)!.push(t); }
  const inp = "bg-[rgba(255,255,255,0.03)] border border-line rounded-full px-4 py-1.5 text-[13px] outline-none focus:border-brass";
  if (!items.length) return (
    <div className="panel p-6 max-w-2xl text-[14px] text-muted leading-relaxed">
      No tools yet. Add one with <Link href="/add" className="text-brass">+ Add → Tool</Link>, or make a note in <code>70 Tools/</code> from the <code>Tool</code> template (<code>type: tool</code>, <code>kind: built</code> or <code>used</code>).
    </div>
  );
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        {KINDS.map(x => (
          <button key={x.k} onClick={() => setK(x.k)} className={`px-4 py-1.5 rounded-full text-[13px] border ${k === x.k ? "bg-brass text-[#06110c] border-transparent" : "border-line text-muted hover:text-text"}`}>
            {x.l} <span className="opacity-60">{x.k === "all" ? items.length : items.filter(i => i.kind === x.k).length}</span>
          </button>
        ))}
        {cats.length > 1 && <select value={cat} onChange={e => setCat(e.target.value)} className={inp}><option value="">All categories</option>{cats.map(c => <option key={c}>{c}</option>)}</select>}
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tools…" className={inp + " ml-auto w-56"} />
      </div>
      {built.length > 0 && (
        <section>
          <div className="eyebrow mb-3">Built by me · {built.length}</div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">{built.map(t => <Card key={t.href} t={t} big />)}</div>
        </section>
      )}
      {[...byCat.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([c, ts]) => (
        <section key={c}>
          <div className="eyebrow mb-3">{c} · {ts.length}</div>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">{ts.map(t => <Card key={t.href} t={t} />)}</div>
        </section>
      ))}
      {!list.length && <p className="text-muted">No tool matches that.</p>}
    </div>
  );
}
