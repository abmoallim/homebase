import Link from "next/link";
import { connection } from "next/server";
import { agents } from "@/lib/data";
import Office from "@/components/Office";
import { profile } from "@/lib/vault";
import { Reveal } from "@/components/ui";

export default async function OfficePage() {
  await connection();
  const { agents: list, note } = agents();
  return (
    <div className="space-y-5">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div><div className="eyebrow">Top-down, live from the vault</div><h1 className="serif text-[52px] leading-none mt-2">Agent office</h1></div>
        {note && <Link href={note} className="chip hover:text-brass">Edit agents in Agents.md →</Link>}
      </Reveal>
      <Office agents={list} rooms={profile().rooms} />
    </div>
  );
}
