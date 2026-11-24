import Link from "next/link";
import { connection } from "next/server";
import { people } from "@/lib/data";
import { Reveal } from "@/components/ui";

const HUE = ["#C9A45C", "#5FB58C", "#E0735A", "#6fb7c4", "#a88bd0", "#D9A548"];
export default async function People() {
  await connection();
  const ps = people();
  return (
    <div className="space-y-6">
      <Reveal><div className="eyebrow">The people in my work</div><h1 className="serif text-[52px] leading-none mt-2">People</h1></Reveal>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {ps.map((p, i) => (
          <Reveal key={p.href} delay={i * 0.05}>
            <Link href={p.href} className="panel panel-hover p-5 flex gap-4 items-start h-full">
              <span className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center serif text-[28px] text-[#06110c]" style={{ background: HUE[i % HUE.length] }}>{p.name[0]}</span>
              <div className="min-w-0">
                <div className="text-[18px] font-semibold">{p.name}</div>
                <div className="text-[12px] text-muted">{[p.relationship, p.role, p.company].filter(Boolean).join(" · ")}</div>
                <p className="text-[13px] text-[#d6cebc] mt-2 leading-relaxed">{p.summary}</p>
                {p.last && <div className="text-[11px] text-faint mt-2">Last contact {String(p.last)}</div>}
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
