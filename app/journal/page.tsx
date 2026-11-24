import Link from "next/link";
import { connection } from "next/server";
import { daily } from "@/lib/data";
import { Reveal } from "@/components/ui";
import Md from "@/components/Md";

export default async function Journal() {
  await connection();
  const ds = daily(30);
  return (
    <div className="space-y-6 max-w-[980px]">
      <Reveal><div className="eyebrow">Daily notes</div><h1 className="serif text-[52px] leading-none mt-2">Journal</h1></Reveal>
      <div className="relative pl-8">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-brass via-[rgba(201,164,92,0.3)] to-transparent" />
        {ds.map((d, i) => (
          <Reveal key={d.href} delay={i * 0.06} className="relative mb-8">
            <span className="absolute -left-[27px] top-2 w-[14px] h-[14px] rounded-full border-2 border-brass bg-bg" />
            <div className="eyebrow">{new Date(d.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
            <Link href={d.href} className="serif text-[30px] leading-tight hover:text-brass block mt-1">{d.summary || d.name}</Link>
            <div className="flex flex-wrap gap-2 mt-2">
              {d.mood && <span className="chip">mood {d.mood}</span>}{d.energy && <span className="chip">energy {d.energy}</span>}{d.sleep && <span className="chip">sleep {d.sleep}h</span>}
              {(d.focus as string[]).map(f => <span key={f} className="chip">{f}</span>)}
            </div>
            <details className="panel mt-3 p-5 group">
              <summary className="cursor-pointer text-[13px] text-muted list-none">Read the full day ↓</summary>
              <div className="mt-4"><Md body={d.body} /></div>
            </details>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
