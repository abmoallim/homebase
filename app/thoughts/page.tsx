import { connection } from "next/server";
import { thoughts, hubs } from "@/lib/data";
import { Reveal } from "@/components/ui";
import ThoughtsBoard from "@/components/ThoughtsBoard";

export default async function Thoughts({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  await connection();
  const sp = await searchParams;
  return (
    <div className="space-y-6">
      <Reveal><div className="eyebrow">Everything that comes to mind, big or small</div><h1 className="serif text-[52px] leading-none mt-2">Thoughts</h1></Reveal>
      {sp.done && <div className="chip !text-green">✓ {sp.done}</div>}
      <ThoughtsBoard items={thoughts()} projects={hubs().map(h => h.name)} />
    </div>
  );
}
