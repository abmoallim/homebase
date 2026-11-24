"use client";
import { motion } from "framer-motion";

type D = { date: string; parts: { project: string; minutes: number; color: string }[] };
export default function FocusChart({ days }: { days: D[] }) {
  const max = Math.max(60, ...days.map(d => d.parts.reduce((s, p) => s + p.minutes, 0)));
  return (
    <div className="flex items-end gap-2 h-[230px] mt-6">
      {days.map((d, i) => {
        const tot = d.parts.reduce((s, p) => s + p.minutes, 0);
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
            <span className="text-[10px] text-muted opacity-0 group-hover:opacity-100 tabular-nums">{(tot / 60).toFixed(1)}h</span>
            <motion.div className="w-full max-w-[34px] rounded-md overflow-hidden flex flex-col-reverse" initial={{ height: 0 }} animate={{ height: `${(tot / max) * 100}%` }} transition={{ duration: 0.9, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}>
              {[...d.parts].sort((a, b) => a.color.localeCompare(b.color)).map((p, j) => <div key={j} title={`${p.project}: ${p.minutes} min`} style={{ height: (p.minutes / Math.max(tot, 1)) * 100 + "%", background: p.color }} className="border-t border-[#06110c]" />)}
            </motion.div>
            <span className="text-[10px] text-faint font-mono">{d.date.slice(8)}</span>
          </div>
        );
      })}
    </div>
  );
}
