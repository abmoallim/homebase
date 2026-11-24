"use client";
import { motion, useMotionValue, animate, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

export function Count({ to, prefix = "", suffix = "", duration = 1.4 }: { to: number; prefix?: string; suffix?: string; duration?: number }) {
  const v = useMotionValue(0);
  const r = useTransform(v, x => prefix + Math.round(x).toLocaleString() + suffix);
  const [s, setS] = useState(prefix + "0" + suffix);
  useEffect(() => { const c = animate(v, to, { duration, ease: "easeOut" }); const u = r.on("change", setS); return () => { c.stop(); u(); }; }, [to]);
  return <span>{s}</span>;
}

export function Bar({ pct, color = "var(--green)", delay = 0.2 }: { pct: number; color?: string; delay?: number }) {
  const w = Math.max(1.5, Math.min(100, pct));
  return (
    <div className="h-[7px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
      <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}aa, ${color})`, boxShadow: `0 0 12px ${color}66` }}
        initial={{ width: 0 }} animate={{ width: w + "%" }} transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  );
}

/** Big goal ring: outer track = target, coloured arcs = each source's target share, bright arc = actual progress. */
export function GoalRing({ value, target, segments }: { value: number; target: number; segments: { color: string; share: number }[] }) {
  const R = 118, C = 2 * Math.PI * R;
  let acc = 0;
  const pct = Math.min(1, value / target);
  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[300px]">
      <defs>
        <linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="#5fb58c" /><stop offset="1" stopColor="#c9a45c" /></linearGradient>
      </defs>
      <g transform="rotate(-90 150 150)">
        <circle cx="150" cy="150" r={R + 16} fill="none" stroke="rgba(201,164,92,0.12)" strokeDasharray="2 6" />
        {segments.map((s, i) => {
          const len = C * s.share - 6;
          const off = acc; acc += C * s.share;
          return (
            <motion.circle key={i} cx="150" cy="150" r={R} fill="none" stroke={s.color} strokeOpacity={0.28} strokeWidth={14} strokeLinecap="round"
              strokeDasharray={`${len} ${C}`} initial={{ strokeDashoffset: -off + len }} animate={{ strokeDashoffset: -off }} transition={{ duration: 1.1, delay: 0.15 * i }} />
          );
        })}
        <motion.circle cx="150" cy="150" r={R} fill="none" stroke="url(#g)" strokeWidth={14} strokeLinecap="round"
          strokeDasharray={`${C} ${C}`} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - Math.max(pct, 0.004)) }} transition={{ duration: 1.6, delay: 0.5 }} />
      </g>
      {[...Array(60)].map((_, i) => {
        const a = (i / 60) * Math.PI * 2; const r1 = R - 16, r2 = i % 5 ? R - 20 : R - 25;
        const f = (v: number) => Math.round(v * 100) / 100;
        return <line key={i} x1={f(150 + r1 * Math.sin(a))} y1={f(150 - r1 * Math.cos(a))} x2={f(150 + r2 * Math.sin(a))} y2={f(150 - r2 * Math.cos(a))} stroke="rgba(244,238,225,0.18)" strokeWidth={1} />;
      })}
    </svg>
  );
}

export function Clock() {
  const [t, setT] = useState<Date | null>(null);
  useEffect(() => { setT(new Date()); const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  if (!t) return <span>&nbsp;</span>;
  return <span className="font-mono tabular-nums">{t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>;
}

export function Greeting() {
  const [g, setG] = useState("Welcome back");
  useEffect(() => {
    const h = Number(new Date().getHours());
    setG(h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);
  return <>{g}</>;
}
