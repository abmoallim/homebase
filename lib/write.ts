// The few places Homebase writes to the vault: first-run setup and the + Add page.
// Everything else stays read-only; the vault is the source of truth.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { VAULT, today, profile } from "./vault";

export const safeName = (s: string) => s.replace(/[\\/:*?"<>|#^\[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);

export function writeNote(rel: string, fm: Record<string, unknown>, body: string): string {
  const abs = path.join(VAULT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  let out = abs, i = 2;
  while (fs.existsSync(out)) out = abs.replace(/\.md$/, ` ${i++}.md`);
  fs.writeFileSync(out, matter.stringify(body, fm));
  return path.relative(VAULT, out);
}

export function updateFrontmatter(rel: string, patch: Record<string, unknown>) {
  const abs = path.join(VAULT, rel);
  const f = matter(fs.readFileSync(abs, "utf8"));
  fs.writeFileSync(abs, matter.stringify(f.content, { ...f.data, ...patch }));
}

export function appendLine(rel: string, line: string, heading?: string) {
  const abs = path.join(VAULT, rel);
  let txt = fs.readFileSync(abs, "utf8");
  if (heading && txt.includes(heading)) {
    const i = txt.indexOf(heading) + heading.length;
    const nl = txt.indexOf("\n", i);
    const rest = txt.slice(nl + 1);
    // skip an empty placeholder bullet or comment right under the heading
    txt = txt.slice(0, nl + 1) + line + "\n" + rest;
  } else txt = txt.replace(/\n*$/, "\n") + line + "\n";
  fs.writeFileSync(abs, txt);
}

/** Today's daily note path, created from the vault's Daily template if missing. */
export function dailyNote(): string {
  const d = today();
  const rel = `01 Daily/${d}.md`;
  const abs = path.join(VAULT, rel);
  if (!fs.existsSync(abs)) {
    const tpl = path.join(VAULT, "90 Templates/Daily.md");
    const long = new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    const body = fs.existsSync(tpl) ? fs.readFileSync(tpl, "utf8") : `---\ntype: daily\ndate: {{date:YYYY-MM-DD}}\ntags: [daily]\nsummary: ""\n---\n# {{date:dddd, D MMMM YYYY}}\n\n## 📝 Log\n`;
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body.replace(/\{\{date:YYYY-MM-DD\}\}/g, d).replace(/\{\{date:dddd, D MMMM YYYY\}\}/g, long).replace(/\{\{title\}\}/g, d));
  }
  return rel;
}

const LOG_REL = "00 Home/Thoughts Log.md";
/** Append one thought to the running log, creating the log note if the vault doesn't have one yet. */
export function logThought(text: string, project?: string) {
  const abs = path.join(VAULT, LOG_REL);
  if (!fs.existsSync(abs)) {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, `---\ntype: dashboard\nstatus: active\ndate: ${today()}\ntags: [dashboard, thoughts]\nsummary: "Running log of every thought, big or small"\n---\n# 💭 Thoughts Log\n\nOne line per thought: \`- YYYY-MM-DD HH:MM · **Project** · the thought\`.\n\n## Log\n`);
  }
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: profile().timezone }).format(new Date());
  const line = `- ${today()} ${time} · ${project ? `**${project}** · ` : ""}${text.replace(/\s*\n\s*/g, " ")}`;
  const txt = fs.readFileSync(abs, "utf8").replace(/\n*$/, "\n");
  fs.writeFileSync(abs, txt + line + "\n");
}

/** Append a follow-up to a thought's own thread note, creating `00 Home/Thoughts/<date> <words>.md` on the first one. */
export function addToThread(id: string, original: { raw: string; date: string; project?: string }, text: string, existing?: string) {
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: profile().timezone }).format(new Date());
  const line = `- ${today()} ${time} · ${text.replace(/\s*\n\s*/g, " ")}`;
  let rel = existing;
  if (!rel) {
    const words = safeName(original.raw.replace(/[`*_\[\]()]/g, "")).split(" ").slice(0, 6).join(" ");
    rel = writeNote(`00 Home/Thoughts/${original.date} ${words}.md`,
      { type: "thread", thought_id: id, ...(original.project ? { project: original.project } : {}), date: original.date, tags: ["thought"], summary: safeName(original.raw).slice(0, 140) },
      `\n# ${words}\n\n> ${original.raw.replace(/\s*\n\s*/g, " ")}\n\nOne thought, with what came after it. Source line: [[Thoughts Log]].\n\n## Thread\n`);
  }
  const abs = path.join(VAULT, rel);
  fs.writeFileSync(abs, fs.readFileSync(abs, "utf8").replace(/\n*$/, "\n") + line + "\n");
}

/** One decision (or action taken) as its own note in `00 Home/Decisions/`, optionally linked to the thought it came from. */
export function addDecision(title: string, why: string, project?: string, thoughtId?: string) {
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: profile().timezone }).format(new Date());
  const name = safeName(title);
  return writeNote(`00 Home/Decisions/${today()} ${name}.md`,
    { type: "decision", date: today(), time, ...(project ? { project } : {}), ...(thoughtId ? { thought_id: thoughtId } : {}), tags: ["decision"], summary: why.slice(0, 200) },
    `\n# ${name}\n\n${why ? why + "\n" : ""}`);
}
