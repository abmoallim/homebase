"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import PrivacyToggle from "./PrivacyToggle";

const NAV = [
  { href: "/", label: "Overview", icon: "◎" },
  { href: "/projects", label: "Projects", icon: "▦" },
  { href: "/calendar", label: "Calendar", icon: "▤" },
  { href: "/tasks", label: "Tasks", icon: "✓" },
  { href: "/thoughts", label: "Thoughts", icon: "✎" },
  { href: "/decisions", label: "Decisions", icon: "⚑" },
  { href: "/content", label: "Content", icon: "▶" },
  { href: "/focus", label: "Focus", icon: "◔" },
  { href: "/tools", label: "Tools", icon: "⚒" },
  { href: "/office", label: "Agent Office", icon: "⌘" },
  { href: "/map", label: "Goal Map", icon: "✦" },
  { href: "/journal", label: "Journal", icon: "☾" },
  { href: "/people", label: "People", icon: "◉" },
];

export default function Sidebar({ vault }: { vault: string }) {
  const path = usePathname();
  return (
    <aside className="sticky top-0 h-screen w-[78px] lg:w-[230px] shrink-0 border-r border-line bg-[rgba(6,17,12,0.7)] backdrop-blur-md flex flex-col py-6">
      <Link href="/" className="px-4 lg:px-6 mb-8 flex items-center gap-3">
        <Star />
        <div className="hidden lg:block leading-tight">
          <div className="serif text-[22px]">Homebase</div>
          <div className="eyebrow !text-[10px]">vault live</div>
        </div>
      </Link>
      <nav className="flex flex-col gap-1 px-3">
        {NAV.map(n => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-muted hover:text-text transition-colors">
              {active && <motion.span layoutId="nav" className="absolute inset-0 rounded-xl bg-[rgba(201,164,92,0.10)] border border-[rgba(201,164,92,0.25)]" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className={`relative w-6 text-center text-[16px] ${active ? "text-brass" : ""}`}>{n.icon}</span>
              <span className={`relative hidden lg:inline ${active ? "text-text font-medium" : ""}`}>{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-6 hidden lg:block text-[11px] text-faint leading-relaxed">
        <div className="mb-3"><PrivacyToggle label /></div>
        <Link href="/add" className="block mb-3 rounded-xl border border-line px-3 py-2 text-center text-[13px] text-brass hover:bg-[rgba(201,164,92,0.08)]">+ Add</Link>
        <a href={`obsidian://open?path=${encodeURIComponent(vault)}`} className="text-muted hover:text-brass">Open vault in Obsidian ↗</a><br />Edit in Obsidian or tell Claude, and this updates itself.
      </div>
    </aside>
  );
}

function Star() {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" className="shrink-0">
      <motion.g initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} style={{ originX: "20px", originY: "20px" }}>
        <rect x="9" y="9" width="22" height="22" fill="none" stroke="#c9a45c" strokeWidth="1.6" />
        <rect x="9" y="9" width="22" height="22" fill="none" stroke="#c9a45c" strokeWidth="1.6" transform="rotate(45 20 20)" />
        <circle cx="20" cy="20" r="4" fill="#5fb58c" />
      </motion.g>
    </svg>
  );
}
