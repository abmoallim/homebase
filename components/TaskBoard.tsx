"use client";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type T = { text: string; href: string; name: string; due?: string; priority: number; overdue: boolean };

const PC = (p: number) => p === 1 ? "#E0735A" : p === 2 ? "#D9A548" : p === 3 ? "#C9A45C" : p === 0 ? "#8fb8d8" : "#5FB58C";

export default function TaskBoard({ tasks, priorities = [] }: { tasks: T[]; priorities?: { n: number; label: string }[] }) {
  const FILTERS = [
    { k: "all", label: "All" }, ...priorities.map(p => ({ k: "p" + p.n, label: `${p.label} (P${p.n})` })),
    { k: "dated", label: "Has a date" }, { k: "daily", label: "From daily notes" },
  ];
  const [f, setF] = useState("all");
  const [q, setQ] = useState("");
  const list = tasks.filter(t =>
    (f === "all" || (f.startsWith("p") && t.priority === Number(f.slice(1))) || (f === "dated" && t.due) || (f === "daily" && t.priority === 0)) &&
    (!q || (t.text + t.name).toLowerCase().includes(q.toLowerCase())));
  const groups = new Map<string, T[]>();
  for (const t of [...list].sort((a, b) => (a.priority || 0.5) - (b.priority || 0.5))) {
    if (!groups.has(t.name)) groups.set(t.name, []);
    groups.get(t.name)!.push(t);
  }
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {FILTERS.map(x => (
          <button key={x.k} onClick={() => setF(x.k)} className={`relative px-4 py-1.5 rounded-full text-[13px] border transition-colors ${f === x.k ? "text-[#06110c] border-transparent" : "border-line text-muted hover:text-text"}`}>
            {f === x.k && <motion.span layoutId="tf" className="absolute inset-0 rounded-full bg-brass" />}
            <span className="relative">{x.label}</span>
          </button>
        ))}
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tasks…" className="ml-auto bg-[rgba(255,255,255,0.03)] border border-line rounded-full px-4 py-1.5 text-[13px] outline-none focus:border-brass w-56" />
      </div>
      <div className="columns-1 lg:columns-2 2xl:columns-3 gap-5">
        <AnimatePresence mode="popLayout">
          {[...groups.entries()].map(([name, ts]) => (
            <motion.div layout key={name} initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .97 }} className="panel p-5 mb-5 break-inside-avoid">
              <Link href={ts[0].href} className="flex items-center justify-between mb-3">
                <span className="font-semibold text-[15px] hover:text-brass">{name}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border" style={{ color: PC(ts[0].priority), borderColor: PC(ts[0].priority) + "55" }}>{ts[0].priority === 0 ? "DAY" : ts[0].priority === 9 ? "—" : "P" + ts[0].priority}</span>
              </Link>
              <ul className="space-y-2">
                {ts.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-[13.5px] leading-snug">
                    <span className="mt-[3px] w-3.5 h-3.5 rounded-[4px] border border-[rgba(244,238,225,0.3)] shrink-0" />
                    <span className="flex-1 text-[#e6dfcf]">{t.text}</span>
                    {t.due && <span className={`font-mono text-[11px] shrink-0 ${t.overdue ? "text-red" : "text-amber"}`}>{t.due.slice(5)}</span>}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {!list.length && <p className="text-muted">No tasks match.</p>}
    </div>
  );
}
