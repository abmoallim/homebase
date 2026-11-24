// Live agents: local Claude Code sessions, read from ~/.claude/projects/*/*.jsonl (optional, only if that folder exists).
// A session is "working" while its transcript is being written, "waiting" for a while after, then it moves to the archive.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Agent } from "./data";

const ROOT = path.join(os.homedir(), ".claude", "projects");
const WORKING_MS = 90_000, WAITING_MS = 30 * 60_000, ARCHIVE_DAYS = 14;

function cwdOf(file: string): string | undefined {
  try {
    const fd = fs.openSync(file, "r"); const buf = Buffer.alloc(131072); const n = fs.readSync(fd, buf, 0, buf.length, 0); fs.closeSync(fd);
    for (const line of buf.toString("utf8", 0, n).split("\n")) {
      const m = line.match(/"cwd":"([^"]+)"/); if (m) return m[1];
    }
  } catch { /* unreadable */ }
}
const title = (s: string) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const ago = (ms: number) => ms < 90_000 ? "just now" : ms < 3_600_000 ? `${Math.round(ms / 60_000)} min ago` : ms < 86_400_000 ? `${Math.round(ms / 3_600_000)} h ago` : `${Math.round(ms / 86_400_000)} d ago`;

export type PastAgent = { name: string; project: string; last: string; lastMs: number; sessions: number };
export function claudeSessions(): { live: Agent[]; past: PastAgent[] } {
  if (!fs.existsSync(ROOT)) return { live: [], past: [] };
  const now = Date.now(), live: Agent[] = [], byProject = new Map<string, PastAgent>();
  for (const dir of fs.readdirSync(ROOT)) {
    const d = path.join(ROOT, dir);
    let files: { f: string; m: number }[] = [];
    try { files = fs.readdirSync(d).filter(f => f.endsWith(".jsonl")).map(f => ({ f: path.join(d, f), m: fs.statSync(path.join(d, f)).mtimeMs })); } catch { continue; }
    files = files.filter(x => now - x.m < ARCHIVE_DAYS * 86_400_000).sort((a, b) => b.m - a.m);
    if (!files.length) continue;
    const cwd = cwdOf(files[0].f) || dir.replace(/^-home-[^-]+-/, "~-").replace(/-/g, "/");
    const parts = cwd.split("/").filter(Boolean);
    const parent = parts.length > 1 ? parts[parts.length - 2] : "";
    const name = [/^(documents|home|~)$/i.test(parent) || parent === os.userInfo().username ? "" : title(parent), title(parts[parts.length - 1] || dir)].filter(Boolean).join(" / ");
    const age = now - files[0].m;
    if (age < WAITING_MS) {
      live.push({
        id: "live-" + dir, name: `Claude · ${name}`, role: "Claude Code session on this computer", team: "Claude sessions", room: "", kind: "Claude session",
        status: age < WORKING_MS ? "working" : "waiting", task: age < WORKING_MS ? "Working in this folder" : `Waiting for you · last active ${ago(age)}`,
        color: "#8fb8d8", log: [`Folder: ${cwd.replace(os.homedir(), "~")}`, `Sessions in the last ${ARCHIVE_DAYS} days: ${files.length}`],
      });
    } else byProject.set(dir, { name: `Claude · ${name}`, project: cwd.replace(os.homedir(), "~"), last: ago(age), lastMs: files[0].m, sessions: files.length });
  }
  return { live, past: [...byProject.values()].sort((a, b) => b.lastMs - a.lastMs) };
}
