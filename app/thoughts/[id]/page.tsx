import Link from "next/link";
import { connection } from "next/server";
import { thought } from "@/lib/data";
import { Reveal } from "@/components/ui";
import Md from "@/components/Md";
import { addThreadEntry } from "@/app/add/actions";

const when = (d: string, t?: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) + (t ? ` · ${t}` : "");

export default async function ThoughtPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const t = thought(id);
  if (!t) return <div className="space-y-3"><Link href="/thoughts" className="text-[13px] text-faint hover:text-brass">← All thoughts</Link><p className="text-muted">That thought is not in the log any more.</p></div>;
  const { thought: th, entries } = t;
  return (
    <div className="max-w-[860px] space-y-6">
      <Reveal>
        <Link href="/thoughts" className="text-[13px] text-faint hover:text-brass">← All thoughts</Link>
        <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px]">
          <span className="font-mono px-2 py-0.5 rounded-md border" style={{ color: "#C9A45C", borderColor: "#C9A45C55" }}>Thought</span>
          {th.project && <span className="chip">{th.project}</span>}
          <span className="text-faint font-mono ml-auto">{when(th.date, th.time)}</span>
        </div>
      </Reveal>
      <Reveal delay={0.05} className="panel p-7 md:p-8 text-[17px] leading-relaxed"><Md body={t.raw} /></Reveal>
      <section>
        <div className="eyebrow mb-3">Thread{entries.length ? ` · ${entries.length}` : ""}</div>
        {entries.length > 0 && (
          <div className="relative pl-6 border-l border-line space-y-3 mb-4">
            {entries.map((e, i) => (
              <div key={i} className="panel px-5 py-4 relative">
                <span className="absolute -left-[30px] top-5 w-2.5 h-2.5 rounded-full bg-brass" />
                <div className="text-faint font-mono text-[11px] mb-1.5">{when(e.date, e.time)}</div>
                <Md body={e.text} />
              </div>
            ))}
          </div>
        )}
        <form action={addThreadEntry} className="panel p-4 flex flex-wrap gap-3 items-center">
          <input type="hidden" name="id" value={id} />
          <input name="text" required placeholder="What came after this? A change, an update, where it went…" className="flex-1 min-w-[260px] bg-transparent outline-none text-[15px]" />
          <button className="rounded-full bg-brass text-[#06110c] font-medium px-5 py-1.5 text-[13px]">Add to thread</button>
        </form>
        {!entries.length && <p className="text-faint text-[12px] mt-3">Nothing added yet. A one-liner can stay a one-liner.</p>}
      </section>
    </div>
  );
}
