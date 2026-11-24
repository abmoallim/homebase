import { connection } from "next/server";
import { hubs } from "@/lib/data";
import { Reveal } from "@/components/ui";
import AddForm from "./AddForm";

export default async function Add({ searchParams }: { searchParams: Promise<{ done?: string; err?: string }> }) {
  await connection();
  const sp = await searchParams;
  return (
    <div className="space-y-6">
      <Reveal><div className="eyebrow">Straight into your vault</div><h1 className="serif text-[52px] leading-none mt-2">Add</h1></Reveal>
      {sp.done && <div className="chip !text-green">✓ {sp.done}</div>}
      {sp.err && <div className="chip !text-red">Type something first.</div>}
      <AddForm projects={hubs().map(h => h.name)} />
    </div>
  );
}
