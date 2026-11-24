import Link from "next/link";
import { connection } from "next/server";
import { hubs, clients } from "@/lib/data";
import { Reveal } from "@/components/ui";

const PCOLOR: Record<number, string> = { 1: "#E0735A", 2: "#D9A548", 3: "#C9A45C" };
const GROUP = (folder: string) => folder.startsWith("10 Projects") ? "Ventures" : folder.startsWith("20 Work") ? "Work" : folder.startsWith("30 Study") ? "Study" : folder.startsWith("60") ? "Personal" : "Goals";

export default async function Projects() {
  await connection();
  const hs = hubs();
  const groups = ["Ventures", "Work", "Study", "Personal", "Goals"].map(g => ({ g, items: hs.filter(h => GROUP(h.folder) === g) })).filter(x => x.items.length);
  const cl = clients();
  return (
    <div className="space-y-10">
      <Reveal><div className="eyebrow">Everything active</div><h1 className="serif text-[52px] leading-none mt-2">Projects</h1></Reveal>
      {groups.map(({ g, items }, gi) => (
        <section key={g}>
          <Reveal delay={0.05 * gi}><div className="eyebrow mb-4">{g}</div></Reveal>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {items.map((h, i) => {
              const col = PCOLOR[h.priority] || "#5FB58C";
              return (
                <Reveal key={h.href} delay={0.05 * gi + 0.04 * i}>
                  <Link href={h.href} className="panel panel-hover block p-5 h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${col}, transparent)` }} />
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-[20px] font-semibold">{h.name}</div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border" style={{ borderColor: col + "66", color: col }}>P{h.priority}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="chip capitalize">{h.status}</span>
                      {h.type === "product" && <span className="chip">${h.mrr || 0} MRR · {h.customers || 0} customers</span>}
                      <span className="chip">{h.open} open</span>
                    </div>
                    <p className="text-[13.5px] text-[#d6cebc] mt-3 leading-relaxed">{h.summary}</p>
                    {h.next && <div className="mt-4 pt-3 border-t border-dashed border-line text-[13px]"><span className="text-faint mr-2">NEXT →</span>{h.next}</div>}
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      ))}
      <section>
        <div className="eyebrow mb-4">Clients</div>
        <div className="panel overflow-hidden">
          <table className="w-full text-[14px]">
            <thead><tr className="text-left text-muted text-[11px] uppercase tracking-wider"><th className="p-4">Client</th><th className="p-4">Project</th><th className="p-4">Status</th><th className="p-4 hidden md:table-cell">Summary</th></tr></thead>
            <tbody>{cl.map(c => (
              <tr key={c.href} className="border-t border-line hover:bg-[rgba(201,164,92,0.04)]">
                <td className="p-4"><Link href={c.href} className="text-brass">{c.name}</Link></td><td className="p-4 text-muted">{c.project}</td>
                <td className="p-4"><span className="chip capitalize">{c.status}</span></td><td className="p-4 text-muted hidden md:table-cell">{c.summary}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
