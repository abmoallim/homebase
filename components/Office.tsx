"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Agent } from "@/lib/data";

const W = 1200, H = 720;
type Room = { id: string; label: string; x: number; y: number; w: number; h: number; color: string };
// Five fixed slots on the floor plan. The vault's Profile.md can rename them (id = the `room:` value agents use).
const SLOTS: Room[] = [
  { id: "HQ", label: "HQ", x: 30, y: 30, w: 520, h: 300, color: "#E0735A" },
  { id: "Sales", label: "Sales", x: 580, y: 30, w: 290, h: 300, color: "#D9A548" },
  { id: "Studio", label: "Content studio", x: 900, y: 30, w: 270, h: 300, color: "#C8A27A" },
  { id: "Build", label: "Build room", x: 30, y: 370, w: 420, h: 320, color: "#C9A45C" },
  { id: "Ops", label: "Ops · routines", x: 480, y: 370, w: 320, h: 320, color: "#5FB58C" },
];
const LOUNGE = { x: 830, y: 370, w: 340, h: 190 };
const BOARD = { x: 830, y: 590, w: 340, h: 100 };
const STATUS: Record<string, { c: string; label: string }> = {
  working: { c: "#5FB58C", label: "Working" }, idle: { c: "#8fb8d8", label: "Idle" },
  waiting: { c: "#D9A548", label: "Waiting" }, blocked: { c: "#E0735A", label: "Blocked" },
};

function deskSlots(r: Room, n: number) {
  const maxCols = Math.max(1, Math.floor(r.w / 150));
  const cols = Math.max(1, Math.min(n, maxCols));
  return [...Array(n)].map((_, i) => ({
    x: r.x + (r.w / (cols + 1)) * ((i % cols) + 1),
    y: r.y + 95 + Math.floor(i / cols) * 125,
  }));
}

export default function Office({ agents, rooms }: { agents: Agent[]; rooms?: { id?: string; label?: string; color?: string }[] }) {
  const ROOMS: Room[] = SLOTS.map((r, i) => ({ ...r, ...Object.fromEntries(Object.entries(rooms?.[i] || {}).filter(([, v]) => v)) }));
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sel, setSel] = useState<string | null>(agents.find(a => a.status === "working")?.id || agents[0]?.id || null);
  const [away, setAway] = useState<Record<string, boolean>>({});
  const [team, setTeam] = useState<string>("all");

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / W));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  // Working agents occasionally walk to the task board and back.
  useEffect(() => {
    const id = setInterval(() => {
      const workers = agents.filter(a => a.status === "working" || a.status === "waiting");
      if (!workers.length) return;
      const a = workers[Math.floor(Math.random() * workers.length)];
      setAway(s => ({ ...s, [a.id]: true }));
      setTimeout(() => setAway(s => ({ ...s, [a.id]: false })), 4200);
    }, 5200);
    return () => clearInterval(id);
  }, [agents]);

  const desks = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    for (const r of ROOMS) {
      const inRoom = agents.filter(a => (ROOMS.find(x => x.id === a.room) ? a.room : ROOMS[4].id) === r.id);
      const slots = deskSlots(r, inRoom.length);
      inRoom.forEach((a, i) => (pos[a.id] = slots[i]));
    }
    return pos;
  }, [agents]);

  const idle = agents.filter(a => a.status === "idle");
  const posOf = (a: Agent, i: number) => {
    if (a.status === "idle") { const k = idle.indexOf(a); return { x: LOUNGE.x + 62 + (k % 3) * 108, y: LOUNGE.y + 78 + Math.floor(k / 3) * 62 }; }
    if (away[a.id]) return { x: BOARD.x + 50 + (i % 5) * 58, y: BOARD.y + 70 };
    const d = desks[a.id]; return { x: d.x, y: d.y + 62 };
  };
  const teams = ["all", ...Array.from(new Set(agents.map(a => a.team)))];
  const cur = agents.find(a => a.id === sel);
  const counts = Object.keys(STATUS).map(s => ({ s, n: agents.filter(a => a.status === s).length }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_330px] gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {counts.map(({ s, n }) => <span key={s} className="chip"><i className={`w-2 h-2 rounded-full ${s === "working" ? "blink" : ""}`} style={{ background: STATUS[s].c }} />{STATUS[s].label} <b className="text-text">{n}</b></span>)}
          <span className="mx-2 text-faint">|</span>
          {teams.map(t => <button key={t} onClick={() => setTeam(t)} className={`chip capitalize ${team === t ? "!text-[#06110c] !bg-brass !border-brass" : "hover:text-text"}`}>{t}</button>)}
        </div>
        <div ref={wrap} className="relative w-full panel !rounded-3xl overflow-hidden" style={{ height: H * scale }}>
          <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
            {/* floor */}
            <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(0deg, rgba(201,164,92,0.035) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(201,164,92,0.035) 0 1px, transparent 1px 40px), #0b1a14" }} />
            {ROOMS.map(r => (
              <div key={r.id} className="absolute rounded-[22px]" style={{ left: r.x, top: r.y, width: r.w, height: r.h, background: `linear-gradient(160deg, ${r.color}14, rgba(16,34,26,0.55))`, border: `1.5px solid ${r.color}40`, opacity: team === "all" || agents.some(a => a.room === r.id && a.team === team) ? 1 : 0.35, transition: "opacity .3s" }}>
                <div className="absolute left-5 top-4 text-[13px] font-semibold tracking-[0.14em] uppercase" style={{ color: r.color }}>{r.label}</div>
                <Plant x={r.w - 34} y={18} />
              </div>
            ))}
            {/* desks */}
            {agents.map(a => { const d = desks[a.id]; const st = STATUS[a.status] || STATUS.idle; const r = ROOMS.find(x => x.id === a.room) || ROOMS[4]; return (
              <div key={"desk" + a.id} className="absolute" style={{ left: d.x - 46, top: d.y - 8, width: 92, height: 44 }}>
                <div className="absolute inset-0 rounded-[10px]" style={{ background: "#2a2018", border: "1px solid #6f4e3788", boxShadow: "0 6px 14px -6px #000" }} />
                <div className={`absolute left-1/2 -translate-x-1/2 top-[6px] w-[46px] h-[7px] rounded-[3px] ${a.status === "working" ? "screen" : ""}`} style={{ background: a.status === "idle" ? "#333" : st.c, boxShadow: a.status !== "idle" ? `0 0 12px ${st.c}` : "none" }} />
                <div className="absolute left-[12px] bottom-[7px] w-[16px] h-[10px] rounded-[2px] bg-[#3b2f25]" />
                <div className="absolute right-[12px] bottom-[8px] w-[8px] h-[8px] rounded-full" style={{ background: r.color + "aa" }} />
              </div>); })}
            {/* lounge */}
            <div className="absolute rounded-[22px]" style={{ left: LOUNGE.x, top: LOUNGE.y, width: LOUNGE.w, height: LOUNGE.h, background: "rgba(143,184,216,0.05)", border: "1.5px dashed rgba(143,184,216,0.3)" }}>
              <div className="absolute left-5 top-4 text-[13px] font-semibold tracking-[0.14em] uppercase text-[#8fb8d8]">Lounge · idle</div>
              <div className="absolute left-6 right-6 bottom-6 h-[44px] rounded-[14px] bg-[#1c2a33] border border-[#8fb8d833]" />
              <div className="absolute right-6 top-4 text-[18px]">☕</div>
            </div>
            {/* task board */}
            <div className="absolute rounded-[16px]" style={{ left: BOARD.x, top: BOARD.y, width: BOARD.w, height: BOARD.h, background: "rgba(201,164,92,0.06)", border: "1.5px solid rgba(201,164,92,0.35)" }}>
              <div className="absolute left-5 top-3 text-[13px] font-semibold tracking-[0.14em] uppercase text-brass">Task board</div>
              <div className="absolute left-5 right-5 top-9 flex gap-2">
                {["#E0735A", "#D9A548", "#5FB58C", "#C9A45C", "#8fb8d8", "#C8A27A"].map((c, i) => <motion.div key={i} className="h-[16px] flex-1 rounded-[3px]" style={{ background: c + "aa" }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, delay: i * 0.4, repeat: Infinity }} />)}
              </div>
            </div>
            {/* agents */}
            {agents.map((a, i) => {
              const p = posOf(a, i); const st = STATUS[a.status] || STATUS.idle; const dim = team !== "all" && a.team !== team;
              return (
                <motion.button key={a.id} onClick={() => setSel(a.id)} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left"
                  initial={false} animate={{ left: p.x, top: p.y, opacity: dim ? 0.25 : 1 }} transition={{ duration: 2.2, ease: "easeInOut" }}>
                  <div className="relative flex flex-col items-center">
                    {a.status === "blocked" && <span className="absolute w-12 h-12 rounded-full border-2 pulse-ring pointer-events-none" style={{ borderColor: st.c, top: -15, left: "50%", marginLeft: -24 }} />}
                    {sel === a.id && <span className="absolute w-14 h-14 rounded-full border-2 border-brass pointer-events-none" style={{ top: -18, left: "50%", marginLeft: -28 }} />}
                    <div className={a.status === "working" && !away[a.id] ? "typing" : ""}>
                      <div className="w-[34px] h-[20px] rounded-[50%] mx-auto" style={{ background: a.color || "#C9A45C", boxShadow: "0 4px 10px -2px #000" }} />
                      <div className="w-[18px] h-[18px] rounded-full mx-auto -mt-[27px] border-2" style={{ background: "#3b2a20", borderColor: a.color || "#C9A45C" }} />
                    </div>
                    <div className="mt-[12px] text-[11px] font-semibold whitespace-nowrap px-1.5 rounded bg-[rgba(6,17,12,0.8)]">{a.status === "idle" ? a.name.split(" ").slice(-1)[0] : a.name}</div>
                    <AnimatePresence>
                      {a.status !== "idle" && !away[a.id] && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-[44px] left-1/2 -translate-x-1/2 whitespace-nowrap max-w-[220px] truncate px-2.5 py-1 rounded-lg text-[11px] border"
                          style={{ background: "#0f1f18", borderColor: st.c + "66", color: "#e6dfcf" }}>
                          <span style={{ color: st.c }}>{a.status === "blocked" ? "! " : a.status === "waiting" ? "◷ " : "● "}</span>{a.task.length > 30 ? a.task.slice(0, 30) + "…" : a.task}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
        <p className="text-faint text-[12px] mt-2">Click an agent to see what it's doing. Working agents walk to the task board now and then. Agents come from <span className="font-mono">00 Home/Agents.md</span>.</p>
      </div>

      {/* detail panel */}
      <div className="panel p-6 h-fit xl:sticky xl:top-8">
        <AnimatePresence mode="wait">
          {cur ? (
            <motion.div key={cur.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .25 }}>
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-[#06110c]" style={{ background: cur.color }}>{cur.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
                <div><div className="text-[19px] font-semibold leading-tight">{cur.name}</div><div className="text-[12px] text-muted">{cur.kind} · {cur.team}</div></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="chip" style={{ color: STATUS[cur.status]?.c, borderColor: (STATUS[cur.status]?.c || "#888") + "55" }}><i className="w-2 h-2 rounded-full" style={{ background: STATUS[cur.status]?.c }} />{STATUS[cur.status]?.label || cur.status}</span>
                <span className="chip">{cur.room}</span>
                {cur.schedule && <span className="chip">⏱ {cur.schedule}</span>}
              </div>
              <div className="eyebrow mt-6">Role</div><p className="text-[14px] mt-1.5 text-[#e6dfcf]">{cur.role}</p>
              <div className="eyebrow mt-5">Right now</div><p className="text-[15px] mt-1.5">{cur.task}</p>
              {cur.projectHref && <Link href={cur.projectHref} className="inline-block mt-3 text-[13px] text-brass">Open {cur.project} →</Link>}
              <div className="eyebrow mt-6">Activity</div>
              <ul className="mt-3 relative pl-5 space-y-3">
                <span className="absolute left-[5px] top-1 bottom-1 w-px bg-line" />
                {cur.log.map((l, i) => <li key={i} className="relative text-[13px] text-[#d6cebc]"><span className="absolute -left-[19px] top-[6px] w-[9px] h-[9px] rounded-full border border-brass bg-bg" />{l}</li>)}
              </ul>
            </motion.div>
          ) : <p className="text-muted">Pick an agent.</p>}
        </AnimatePresence>
        <div className="eyebrow mt-8 mb-2">All agents</div>
        <div className="space-y-1">{agents.map(a => (
          <button key={a.id} onClick={() => setSel(a.id)} className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left text-[13px] ${sel === a.id ? "bg-[rgba(201,164,92,0.1)]" : "hover:bg-[rgba(255,255,255,0.03)]"}`}>
            <i className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS[a.status]?.c }} /><span className="flex-1 truncate">{a.name}</span><span className="text-faint text-[11px]">{a.team}</span>
          </button>))}</div>
      </div>
    </div>
  );
}

function Plant({ x, y }: { x: number; y: number }) {
  return (
    <svg className="absolute" style={{ left: x, top: y }} width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="9" fill="#5fb58c33" /><circle cx="8" cy="9" r="4" fill="#5fb58c88" /><circle cx="14" cy="10" r="4" fill="#5fb58c77" /><circle cx="11" cy="14" r="4" fill="#5fb58c99" />
    </svg>
  );
}
