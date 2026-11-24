// The few places Homebase writes to the vault: first-run setup and the + Add page.
// Everything else stays read-only; the vault is the source of truth.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { VAULT, today } from "./vault";

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
