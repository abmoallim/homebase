import Link from "next/link";
import { connection } from "next/server";
import { agents } from "@/lib/data";
import { claudeSessions } from "@/lib/live";
import { profile } from "@/lib/vault";
import Office from "@/components/Office";
import { Reveal } from "@/components/ui";

export default async function OfficePage() {
  await connection();
  const { agents: roster, note, archive } = agents();
  const { live, past } = claudeSessions();
  const list = [...roster, ...live];
  return (
    <div className="space-y-5">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div><div className="eyebrow">Your roster from Agents.md + Claude sessions running on this computer</div><h1 className="serif text-[52px] leading-none mt-2">Agent office</h1></div>
        {note && <Link href={note} className="chip hover:text-brass">Edit agents in Agents.md →</Link>}
      </Reveal>
      <Office agents={list} rooms={profile().rooms} />
      {(archive.length > 0 || past.length > 0) && (
        <Reveal className="panel p-6">
          <div className="flex items-baseline justify-between"><div className="eyebrow">Archive · agents and sessions that are no longer active</div><span className="text-[12px] text-faint">{archive.length + past.length} kept as history</span></div>
          <ul className="mt-4 grid md:grid-cols-2 gap-x-8 gap-y-2.5">
            {archive.map(a => (
              <li key={a.id} className="flex items-start gap-3 text-[13.5px]">
                <span className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-[#6f6a5e]" />
                <span className="flex-1"><span className="text-[#ddd5c3]">{a.name}</span> <span className="text-muted">· {a.role || a.kind || "agent"}</span>{a.log.length > 0 && <span className="block text-[12px] text-faint">{a.log[a.log.length - 1]}</span>}</span>
                <span className="chip capitalize">{a.status}</span>
              </li>
            ))}
            {past.map(p => (
              <li key={p.project} className="flex items-start gap-3 text-[13.5px]">
                <span className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-[#6f6a5e]" />
                <span className="flex-1"><span className="text-[#ddd5c3]">{p.name}</span><span className="block text-[12px] text-faint">{p.project} · {p.sessions} session{p.sessions === 1 ? "" : "s"} in 14 days</span></span>
                <span className="text-[11px] font-mono text-muted shrink-0">{p.last}</span>
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-faint mt-4">To keep an agent from your roster as history, set its <code>status</code> in Agents.md to <code>retired</code> instead of deleting it.</p>
        </Reveal>
      )}
    </div>
  );
}
