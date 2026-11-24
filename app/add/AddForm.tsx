"use client";
import { useState } from "react";
import { addItem } from "./actions";

const KINDS = [
  { k: "task", label: "Task", ph: "What needs doing?" }, { k: "log", label: "Log entry", ph: "What happened today?" },
  { k: "thought", label: "Thought", ph: "Title or first line" }, { k: "idea", label: "Idea", ph: "Name of the idea" },
  { k: "person", label: "Person", ph: "Their name" }, { k: "project", label: "Project", ph: "Project name" },
];
const inp = "w-full bg-[rgba(255,255,255,0.03)] border border-line rounded-xl px-3 py-2 text-[14px] outline-none focus:border-brass";

export default function AddForm({ projects }: { projects: string[] }) {
  const [kind, setKind] = useState("task");
  const cur = KINDS.find(x => x.k === kind)!;
  return (
    <form action={addItem} className="panel p-6 space-y-4 max-w-2xl">
      <input type="hidden" name="kind" value={kind} />
      <div className="flex flex-wrap gap-2">
        {KINDS.map(x => <button type="button" key={x.k} onClick={() => setKind(x.k)}
          className={`px-4 py-1.5 rounded-full text-[13px] border ${kind === x.k ? "bg-brass text-[#06110c] border-transparent" : "border-line text-muted hover:text-text"}`}>{x.label}</button>)}
      </div>
      <input name="text" autoFocus required placeholder={cur.ph} className={inp} />
      {kind === "task" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <select name="project" className={inp}><option value="">Today's note</option>{projects.map(p => <option key={p}>{p}</option>)}</select>
          <input name="due" type="date" className={inp} />
        </div>
      )}
      {kind === "project" && <input name="priority" type="number" min={1} max={9} placeholder="Priority (1 = most important)" className={inp} />}
      {["thought", "idea", "person", "project"].includes(kind) && (
        <textarea name="notes" rows={3} placeholder={kind === "person" ? "Who are they?" : "Details (optional)"} className={inp} />
      )}
      <button className="rounded-full bg-brass text-[#06110c] font-medium px-6 py-2.5 text-[14px]">Add</button>
    </form>
  );
}
