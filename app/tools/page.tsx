import { connection } from "next/server";
import { tools } from "@/lib/data";
import { Reveal } from "@/components/ui";
import ToolsBoard from "@/components/ToolsBoard";

export default async function Tools() {
  await connection();
  return (
    <div className="space-y-6">
      <Reveal><div className="eyebrow">What I build and what I use</div><h1 className="serif text-[52px] leading-none mt-2">Tools</h1></Reveal>
      <ToolsBoard items={tools()} />
    </div>
  );
}
