import { connection } from "next/server";
import { decisions, hubs } from "@/lib/data";
import { Reveal } from "@/components/ui";
import DecisionsBoard from "@/components/DecisionsBoard";

export default async function Decisions() {
  await connection();
  return (
    <div className="space-y-6">
      <Reveal><div className="eyebrow">What I decided, and what I did about it</div><h1 className="serif text-[52px] leading-none mt-2">Decisions</h1></Reveal>
      <DecisionsBoard items={decisions()} projects={hubs().map(h => h.name)} />
    </div>
  );
}
