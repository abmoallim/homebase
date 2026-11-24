import Link from "next/link";
import { connection } from "next/server";
import { loadVault } from "@/lib/vault";
import Md from "@/components/Md";
import { Reveal } from "@/components/ui";
import GoalMap from "@/components/GoalMap";

export default async function NotePage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  await connection();
  const { p = "" } = await searchParams;
  const n = loadVault().notes.find(x => x.path === p);
  if (!n) return <div className="text-muted">Note not found: {p}</div>;
  const fmKeys = Object.entries(n.fm).filter(([k, v]) => !["tags", "summary", "agents", "cssclasses"].includes(k) && v !== null && v !== "" && typeof v !== "object");
  const crumbs = n.folder.split("/").filter(x => x !== ".");
  return (
    <div className="max-w-[980px]">
      <Reveal>
        <div className="text-[12px] text-faint mb-3"><Link href="/" className="hover:text-brass">Home</Link>{crumbs.map(c => <span key={c}> / {c}</span>)}</div>
        <h1 className="serif text-[48px] leading-[1.05]">{n.name}</h1>
        {n.fm.summary && <p className="text-latte mt-2 text-[17px]">{String(n.fm.summary)}</p>}
        <div className="flex flex-wrap gap-2 mt-4">
          {fmKeys.map(([k, v]) => <span key={k} className="chip"><span className="text-faint">{k}</span> <span className="text-text">{String(v)}</span></span>)}
        </div>
      </Reveal>
      <Reveal delay={0.1} className="panel p-7 md:p-9 mt-6">
        {n.ext === ".canvas" ? <GoalMap raw={n.body} /> : <Md body={n.body} />}
      </Reveal>
      <p className="text-faint text-[12px] mt-4">Read-only view of <span className="font-mono">{n.path}</span>. To change it, tell Claude or edit it in Obsidian.</p>
    </div>
  );
}
