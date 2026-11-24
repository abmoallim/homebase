import Link from "next/link";
import { connection } from "next/server";
import { content, STAGES } from "@/lib/data";
import { profile } from "@/lib/vault";
import { Reveal } from "@/components/ui";

const COLORS = ["#C9A45C", "#5FB58C", "#8fb8d8", "#E0735A", "#D9A548"];

export default async function Content() {
  await connection();
  const c = content();
  const pf = profile();
  const ids = [...new Set([...pf.channels.map(x => x.id), ...c.map(x => x.channel).filter(Boolean)])];
  const CH: Record<string, string> = Object.fromEntries(ids.map((id, i) => [id, pf.channels.find(x => x.id === id)?.color || COLORS[i % COLORS.length]]));
  return (
    <div className="space-y-6">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div><div className="eyebrow capitalize">{ids.map(i => pf.channels.find(x => x.id === i)?.label || i).join(" · ") || "Ideas to posts"}</div><h1 className="serif text-[52px] leading-none mt-2">Content pipeline</h1></div>
        <div className="flex gap-3 text-[12px] text-muted">{Object.entries(CH).map(([k, v]) => <span key={k} className="flex items-center gap-1.5 capitalize"><i className="w-2.5 h-2.5 rounded-full" style={{ background: v }} />{k}</span>)}</div>
      </Reveal>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((s, si) => {
          const items = c.filter(x => x.stage === s).sort((a, b) => a.rank - b.rank);
          return (
            <Reveal key={s} delay={si * 0.06} className="w-[280px] shrink-0">
              <div className="flex items-center justify-between px-1 mb-3"><span className="eyebrow">{s}</span><span className="text-[12px] text-faint font-mono">{items.length}</span></div>
              <div className="space-y-3 min-h-[200px] rounded-2xl p-2 border border-dashed border-line">
                {items.map(x => (
                  <Link key={x.href} href={x.href} className="panel panel-hover block p-4 !rounded-xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      <i className="w-2 h-2 rounded-full" style={{ background: CH[x.channel] || "#888" }} />
                      <span className="text-[11px] text-muted capitalize">{x.channel}{x.no ? ` · #${x.no}` : ""}{x.voice ? ` · ${x.voice} voice` : ""}</span>
                    </div>
                    <div className="text-[14px] font-medium leading-snug">{x.name}</div>
                    {x.summary && <div className="text-[12px] text-muted mt-1.5 line-clamp-2">{x.summary}</div>}
                    {x.views ? <div className="text-[12px] text-green mt-2">{x.views} views</div> : null}
                  </Link>
                ))}
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
