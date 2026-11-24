import { connection } from "next/server";
import { resolve } from "@/lib/vault";
import GoalMap from "@/components/GoalMap";
import { Reveal } from "@/components/ui";

export default async function MapPage() {
  await connection();
  const n = resolve("Goal Map.canvas");
  return (
    <div className="space-y-5">
      <Reveal><div className="eyebrow">The big picture</div><h1 className="serif text-[52px] leading-none mt-2">Goal map</h1></Reveal>
      {n ? <GoalMap raw={n.body} /> : <p className="text-muted">Goal Map.canvas not found in the vault.</p>}
    </div>
  );
}
