"use client";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type N = { id: string; x: number; y: number; width: number; height: number; text: string; color?: string };
type E = { id: string; fromNode: string; toNode: string; fromSide: string; toSide: string; label?: string };
const COLORS: Record<string, string> = { "1": "#E0735A", "2": "#D9A548", "3": "#C9A45C", "4": "#5FB58C", "5": "#6fb7c4", "6": "#a88bd0" };

function side(n: N, s: string) {
  if (s === "top") return [n.x + n.width / 2, n.y];
  if (s === "bottom") return [n.x + n.width / 2, n.y + n.height];
  if (s === "left") return [n.x, n.y + n.height / 2];
  return [n.x + n.width, n.y + n.height / 2];
}

export default function GoalMapView({ nodes, edges }: { nodes: N[]; edges: E[] }) {
  const pad = 60;
  const minX = Math.min(...nodes.map(n => n.x)) - pad, minY = Math.min(...nodes.map(n => n.y)) - pad;
  const W = Math.max(...nodes.map(n => n.x + n.width)) - minX + pad, H = Math.max(...nodes.map(n => n.y + n.height)) - minY + pad;
  const [z, setZ] = useState(0.75);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const fit = () => { if (box.current) { setZ(Math.min(1, (box.current.clientWidth - 32) / W)); setOff({ x: 0, y: 0 }); } };
  useEffect(fit, [W]);
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  return (
    <div className="relative">
      <div className="absolute right-3 top-3 z-20 flex gap-1">
        {[["−", () => setZ(v => Math.max(.3, v - .1))], ["+", () => setZ(v => Math.min(1.6, v + .1))], ["⟲", fit]].map(([l, f]: any) => (
          <button key={l} onClick={f} className="w-8 h-8 rounded-lg panel text-muted hover:text-text">{l}</button>
        ))}
      </div>
      <div ref={box} className="relative overflow-hidden rounded-2xl border border-line h-[78vh] cursor-grab active:cursor-grabbing bg-[rgba(0,0,0,0.15)]"
        onPointerDown={e => { if ((e.target as HTMLElement).closest("a")) return; drag.current = { x: e.clientX - off.x, y: e.clientY - off.y }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
        onPointerMove={e => { if (drag.current) setOff({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); }}
        onPointerUp={() => { drag.current = null; }}
        onWheel={e => setZ(v => Math.min(1.6, Math.max(.3, v - e.deltaY * 0.0012)))}>
        <div style={{ width: W, height: H, transform: `translate(${off.x}px, ${off.y}px) scale(${z})`, transformOrigin: "0 0" }} className="absolute left-4 top-4">
          <svg width={W} height={H} className="absolute inset-0 pointer-events-none">
            {edges.map((e, i) => {
              const a = byId[e.fromNode], b = byId[e.toNode]; if (!a || !b) return null;
              const [x1, y1] = side(a, e.fromSide), [x2, y2] = side(b, e.toSide);
              const ax = x1 - minX, ay = y1 - minY, bx = x2 - minX, by = y2 - minY;
              const d = `M${ax},${ay} C${ax},${(ay + by) / 2} ${bx},${(ay + by) / 2} ${bx},${by}`;
              return (
                <g key={e.id}>
                  <motion.path d={d} fill="none" stroke="rgba(201,164,92,0.5)" strokeWidth={2} strokeDasharray="6 6" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.3 + i * 0.08 }} />
                  {e.label && <text x={(ax + bx) / 2 + 6} y={(ay + by) / 2} fill="#a59d8b" fontSize="14">{e.label}</text>}
                </g>
              );
            })}
          </svg>
          {nodes.map((n, i) => {
            const c = n.color ? COLORS[n.color] || n.color : "rgba(201,164,92,0.35)";
            return (
              <motion.div key={n.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05, duration: 0.5 }}
                className="absolute rounded-2xl p-5 overflow-hidden prose-vault !text-[15px] !leading-snug"
                style={{ left: n.x - minX, top: n.y - minY, width: n.width, minHeight: n.height, background: "rgba(16,34,26,0.92)", border: `1.5px solid ${c}`, boxShadow: `0 0 40px -18px ${c}` }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href = "", children }) => <Link href={href}>{children}</Link> }}>{n.text}</ReactMarkdown>
              </motion.div>
            );
          })}
        </div>
      </div>
      <p className="text-faint text-[12px] mt-2">Drag to pan, scroll to zoom. Edit the map in Obsidian (Goal Map.canvas) or ask Claude.</p>
    </div>
  );
}
