"use client";
import Link from "next/link";
import { useState } from "react";
import { addItem } from "@/app/add/actions";
import type { Thought } from "@/lib/data";

const FILTERS = [{ k: "all", l: "All" }, { k: "inbox", l: "Inbox" }, { k: "idea", l: "Ideas" }, { k: "journal", l: "From journal" }];
const KIND: Record<string, { label: string; color: string }> = {
  inbox: { label: "Inbox", color: "#D9A548" }, idea: { label: "Idea", color: "#5FB58C" }, journal: { label: "Journal", color: "#8fb8d8" },
};

export default function ThoughtsBoard({ items }: { items: Thought[] }) {
  const [f, setF] = useState("all");
  const [q, setQ] = useState("");
  const list = items.filter(t => (f === "all" || t.kind === f) && (!q || (t.title + t.text).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-6">
      <form action={addItem} className="panel p-4 flex gap-3 items-center max-w-3xl">
        <input type="hidden" name="kind" value="thought" />
        <input name="text" required placeholder="Capture a thought, idea or rant…" className="flex-1 bg-transparent outline-none text-[15px]" />
        <button className="rounded-full bg-brass text-[#06110c] font-medium px-5 py-1.5 text-[13px]">Save to Inbox</button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(x => (
          <button key={x.k} onClick={() => setF(x.k)} className={`px-4 py-1.5 rounded-full text-[13px] border ${f === x.k ? "bg-brass text-[#06110c] border-transparent" : "border-line text-muted hover:text-text"}`}>
            {x.l} <span className="opacity-60">{x.k === "all" ? items.length : items.filter(i => i.kind === x.k).length}</span>
          </button>
        ))}
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search thoughts…" className="ml-auto bg-[rgba(255,255,255,0.03)] border border-line rounded-full px-4 py-1.5 text-[13px] outline-none focus:border-brass w-56" />
      </div>
      <div className="columns-1 lg:columns-2 2xl:columns-3 gap-5">
        {list.map((t, i) => (
          <Link key={i} href={t.href} className="panel panel-hover block p-5 mb-5 break-inside-avoid">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border" style={{ color: KIND[t.kind].color, borderColor: KIND[t.kind].color + "55" }}>{KIND[t.kind].label}</span>
              <span className="text-[11px] text-faint font-mono">{t.date}</span>
            </div>
            <div className="text-[15px] leading-snug">{t.title}</div>
            {t.text && <div className="text-[13px] text-muted mt-2 leading-relaxed">{t.text}</div>}
          </Link>
        ))}
      </div>
      {!list.length && <p className="text-muted">Nothing here yet. Capture your first thought above.</p>}
    </div>
  );
}
