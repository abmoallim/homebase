// Reads the Obsidian vault straight from disk. The vault is the source of truth; this app never writes to it.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import matter from "gray-matter";
import { cache } from "react";

// Where the vault lives: VAULT_PATH env > homebase.config.json ({"vault": "..."}) > ~/Homebase.
// A missing or empty vault is created from ./starter-vault, so a fresh clone just works.
const ROOT = process.cwd();
function configuredVault(): string {
  if (process.env.VAULT_PATH) return process.env.VAULT_PATH;
  try {
    const c = JSON.parse(fs.readFileSync(path.join(ROOT, "homebase.config.json"), "utf8"));
    if (c.vault) return String(c.vault).replace(/^~(?=$|\/)/, os.homedir());
  } catch { /* no config yet */ }
  return path.join(os.homedir(), "Homebase");
}
export const VAULT = configuredVault();

function copyDir(from: string, to: string) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else if (!fs.existsSync(b)) fs.copyFileSync(a, b);
  }
}
/** Create the starter vault if the vault folder is missing or empty. Returns true when it did. */
export function ensureVault(): boolean {
  const empty = !fs.existsSync(VAULT) || fs.readdirSync(VAULT).filter(f => f !== ".git").length === 0;
  if (!empty) return false;
  copyDir(path.join(ROOT, "starter-vault"), VAULT);
  return true;
}
ensureVault();
const SKIP = new Set([".obsidian", ".git", ".claude", ".trash", "node_modules", "99 Attachments", "90 Templates"]);

export type Task = {
  text: string; status: string; done: boolean; due?: string;
  file: string; name: string; priority?: number; project?: string;
};
export type Note = {
  path: string; name: string; folder: string; ext: string;
  fm: Record<string, any>; body: string; mtime: number; tasks: Task[];
};

function walk(dir: string, out: string[]) {
  for (const e of fs.readdirSync(/*turbopackIgnore: true*/ dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") && e.isDirectory()) continue;
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(md|canvas)$/.test(e.name)) out.push(p);
  }
}

function norm(v: any): any {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (Array.isArray(v)) return v.map(norm);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, norm(x)]));
  return v;
}

const TASK = /^\s*[-*] \[(.)\] (.*)$/;

function parse(abs: string): Note {
  const rel = path.relative(VAULT, abs);
  const ext = path.extname(abs);
  const name = path.basename(abs, ext);
  const raw = fs.readFileSync(/*turbopackIgnore: true*/ abs, "utf8");
  const mtime = fs.statSync(/*turbopackIgnore: true*/ abs).mtimeMs;
  if (ext === ".canvas") return { path: rel, name, folder: path.dirname(rel), ext, fm: {}, body: raw, mtime, tasks: [] };
  let fm: Record<string, any> = {}, body = raw;
  try { const m = matter(raw); fm = norm(m.data); body = m.content; } catch { /* keep raw */ }
  const pr = Number(fm.priority) || undefined;
  const tasks: Task[] = [];
  for (const line of body.split("\n")) {
    const m = line.match(TASK);
    if (!m) continue;
    const due = m[2].match(/📅\s*(\d{4}-\d{2}-\d{2})/)?.[1];
    tasks.push({
      text: m[2].replace(/📅\s*\d{4}-\d{2}-\d{2}/, "").trim(), status: m[1], done: m[1] !== " ",
      due, file: rel, name, priority: pr, project: fm.project,
    });
  }
  return { path: rel, name, folder: path.dirname(rel), ext, fm, body, mtime, tasks };
}

export const loadVault = cache(() => {
  const files: string[] = [];
  walk(VAULT, files);
  const notes = files.map(parse);
  const byName = new Map<string, Note>();
  for (const n of notes) if (n.ext === ".md" && !byName.has(n.name.toLowerCase())) byName.set(n.name.toLowerCase(), n);
  for (const n of notes) if (n.ext !== ".md") byName.set((n.name + n.ext).toLowerCase(), n);
  return { notes, byName };
});

export function latestMtime(): number {
  const files: string[] = [];
  walk(VAULT, files);
  let max = 0;
  for (const f of files) max = Math.max(max, fs.statSync(/*turbopackIgnore: true*/ f).mtimeMs);
  return Math.round(max) + files.length;
}

/** Resolve a wikilink target ("Flane", "Goal Map.canvas", "Folder/Note") to a note. */
export function resolve(target: string): Note | undefined {
  const { byName, notes } = loadVault();
  const t = target.split("#")[0].trim();
  return byName.get(t.toLowerCase()) || byName.get(path.basename(t).toLowerCase()) ||
    notes.find(n => n.path.toLowerCase() === (t + ".md").toLowerCase());
}

export const noteHref = (n: Note) => "/n?p=" + encodeURIComponent(n.path);

/** Plain text: [[a|b]] -> b, **x** -> x. For short labels. */
export function plain(s = ""): string {
  return String(s)
    .replace(/!?\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/!?\[\[([^\]]+)\]\]/g, (_, a) => a.split("/").pop().replace(/\.(md|canvas|base)$/, ""))
    .replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
}

/** Turn Obsidian markdown into plain markdown with app links. */
export function toMarkdown(body: string): string {
  return body
    .replace(/```dataviewjs[\s\S]*?```/g, "")
    .replace(/```dataview[\s\S]*?```/g, "")
    .replace(/```chart[\s\S]*?```/g, "")
    .replace(/^> \[!nav\]\n(> .*\n?)*/m, "")
    .replace(/^(>\s*)+\[!(\w+)\][-+]?\s*(.*)$/gm, (_m, q, _t, title) => `${q}**${title}**`)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/!\[\[([^\]]+)\]\]/g, (_, t) => `*(embedded: ${t})*`)
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, label) => {
      const n = resolve(t);
      const text = label || t.split("/").pop().replace(/\.(md|canvas|base)$/, "");
      return n ? `[${text}](${noteHref(n)})` : `**${text}**`;
    });
}

/** The person's settings, from `00 Home/Profile.md` frontmatter (see starter-vault). */
export type Profile = {
  name: string; timezone: string; tagline: string; setup: boolean; source_label: string;
  goal: { label: string; short: string; unit: string; target: number };
  sources: { name: string; note?: string; kpi?: string; target?: number; need?: number; unit?: string; color?: string; count_folder?: string; count_status?: string }[];
  countdowns: { label: string; date: string }[];
  priorities: { n: number; label: string }[];
  channels: { id: string; label: string; color?: string }[];
  rooms: { id?: string; label?: string; color?: string }[];
};
export function profile(): Profile {
  const fm = resolve("Profile")?.fm || {};
  const tz = fm.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    name: fm.name || "", timezone: tz, tagline: fm.tagline || "", setup: fm.setup !== false && fm.setup !== "false",
    source_label: fm.source_label || "Focus area",
    goal: { label: "", short: "", unit: "", target: 0, ...(fm.goal || {}) },
    sources: fm.sources || [], countdowns: fm.countdowns || [], priorities: fm.priorities || [],
    channels: fm.channels || [], rooms: fm.rooms || [],
  };
}

/** Today's date (YYYY-MM-DD) in the profile's timezone. */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: profile().timezone }).format(new Date());
}
export function daysUntil(d: string): number {
  return Math.ceil((Date.parse(d + "T00:00:00Z") - Date.parse(today() + "T00:00:00Z")) / 86400000);
}
