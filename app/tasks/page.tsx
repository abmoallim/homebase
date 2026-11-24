import { connection } from "next/server";
import { tasks } from "@/lib/data";
import TaskBoard from "@/components/TaskBoard";
import { profile } from "@/lib/vault";
import { Reveal } from "@/components/ui";

export default async function Tasks() {
  await connection();
  const t = tasks().map(x => ({ text: x.text, href: x.href, name: x.name, due: x.due, priority: x.priority ?? 9, overdue: x.overdue }));
  return (
    <div className="space-y-6">
      <Reveal><div className="eyebrow">Every open "- [ ]" in the vault</div><h1 className="serif text-[52px] leading-none mt-2">Tasks</h1></Reveal>
      <TaskBoard tasks={t} priorities={profile().priorities} />
    </div>
  );
}
