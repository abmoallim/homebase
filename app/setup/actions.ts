"use server";
import { redirect } from "next/navigation";
import { writeNote, updateFrontmatter, safeName } from "@/lib/write";
import fs from "node:fs";
import path from "node:path";
import { VAULT } from "@/lib/vault";

const COLORS = ["#E0735A", "#D9A548", "#5FB58C"];

export async function finishSetup(fd: FormData) {
  const s = (k: string) => String(fd.get(k) || "").trim();
  const name = s("name"), unit = s("unit"), target = Number(s("target")) || 0;
  const sources: any[] = [], priorities: any[] = [];
  for (let i = 1; i <= 3; i++) {
    const n = safeName(s(`area${i}`));
    if (!n) continue;
    const kpi = s(`kpi${i}`), t = Number(s(`t${i}`)) || 0, need = Number(s(`need${i}`)) || 1;
    writeNote(`10 Projects/${n}/${n}.md`, {
      type: "product", project: n, status: "active", priority: sources.length + 1, mrr: 0, customers: 0,
      tags: ["project"], summary: kpi || `${n}, a focus area`,
    }, `\n# ${n}\n\n**What it is:** \n\n## 🎯 KPI\n${kpi || "What success looks like."}\n\n## Tasks\n- [ ] First step for ${n}\n`);
    sources.push({ name: n, note: n, kpi, target: t, need, unit: s(`unit${i}`) || "clients", color: COLORS[sources.length] });
    priorities.push({ n: sources.length, label: n });
  }
  updateFrontmatter("00 Home/Profile.md", {
    setup: true, name, timezone: s("timezone"), tagline: s("tagline"),
    goal: { label: s("goal") || "Main goal", short: s("short"), unit, target },
    sources, priorities,
  });
  const now = path.join(VAULT, "00 Home/Now.md");
  let txt = fs.readFileSync(now, "utf8");
  txt = txt.replace("- (Run Homebase's first-run setup, or tell Claude about yourself.)", `- **${name || "Me"}**${s("tagline") ? ": " + s("tagline") : ""}`)
    .replace("- (What are you working towards?)", `- ${s("goal") || "Main goal"}${target ? `: ${unit}${target.toLocaleString()} ${s("short")}` : ""}${sources.length ? "\n- Focus areas, in priority order: " + sources.map(x => x.name).join(" → ") : ""}`);
  fs.writeFileSync(now, txt);
  redirect("/");
}
