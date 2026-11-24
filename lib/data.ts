import { loadVault, plain, today as todayStr, profile, daysUntil, noteHref, resolve, type Note, type Task } from "./vault";

const ACTIVE = (s?: string) => !["paused", "ended", "archived", "dropped", "lost"].includes(s || "");
const HUB_TYPES = ["product", "project-note", "work", "study", "personal"];

export type Hub = {
  name: string; href: string; priority: number; status: string; type: string; summary: string;
  mrr?: number; customers?: number; open: number; next?: string; folder: string; url?: string;
};

function toHub(n: Note): Hub {
  const open = n.tasks.filter(t => t.status === " ");
  return {
    name: n.name, href: noteHref(n), priority: Number(n.fm.priority) || 9, status: n.fm.status || "",
    type: n.fm.type, summary: plain(n.fm.summary || ""), mrr: n.fm.mrr, customers: n.fm.customers,
    open: open.length, next: open[0] ? plain(open[0].text) : undefined, folder: n.folder, url: n.fm.url,
  };
}

export function hubs(): Hub[] {
  return loadVault().notes
    .filter(n => n.fm.priority && HUB_TYPES.includes(n.fm.type) && ACTIVE(n.fm.status))
    .map(toHub).sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
}

export function hub(name: string): Hub | undefined {
  const n = resolve(name);
  return n ? toHub(n) : undefined;
}

export function products() {
  return loadVault().notes.filter(n => n.fm.type === "product").map(toHub);
}

const PALETTE = ["#E0735A", "#D9A548", "#5FB58C", "#8fb8d8", "#C8A27A", "#C9A45C"];
export function goals() {
  const pf = profile();
  const notes = loadVault().notes;
  const ps = products();
  const sources = pf.sources.map((src, i) => {
    const p = src.note ? ps.find(x => x.name === src.note) || hub(src.note) : undefined;
    const counted = src.count_folder
      ? notes.filter(n => n.folder.startsWith(src.count_folder!) && (!src.count_status || n.fm.status === src.count_status)).length : undefined;
    return {
      n: i + 1, name: src.name, href: p?.href, have: counted ?? (p?.customers || 0), need: src.need || 1, unit: src.unit || "clients",
      target: src.target || 0, mrr: p?.mrr || 0, kpi: src.kpi || "", next: p?.next, color: src.color || PALETTE[i % PALETTE.length],
    };
  });
  const mrr = ps.reduce((s, p) => s + (Number(p.mrr) || 0), 0);
  const target = pf.goal.target || sources.reduce((s, x) => s + x.target, 0) || 1;
  return {
    mrr, target, sources,
    countdowns: pf.countdowns.map(c => ({ label: c.label, date: c.date, days: daysUntil(c.date) })),
  };
}

export type RichTask = Task & { href: string; text: string; overdue: boolean };
export function tasks(): RichTask[] {
  const today = todayStr();
  return loadVault().notes.flatMap(n => n.tasks.filter(t => t.status === " ").map(t => ({
    ...t, text: plain(t.text), href: noteHref(n), priority: t.priority ?? (n.folder.startsWith("01 Daily") ? 0 : 9),
    overdue: !!t.due && t.due < today,
  })));
}

/** Sections of Now.md as { heading: lines[] }. */
export function now() {
  const n = resolve("Now");
  const out: Record<string, string[]> = {};
  if (!n) return { sections: out, date: "" };
  let cur = "";
  for (const line of n.body.split("\n")) {
    const h = line.match(/^## (.*)/);
    if (h) { cur = h[1].replace(/\s*\(.*\)$/, "").trim(); out[cur] = []; continue; }
    if (cur && /^\s*[-*] /.test(line)) out[cur].push(line.replace(/^\s*[-*] /, ""));
  }
  return { sections: out, date: n.fm.date };
}

export function daily(limit = 14) {
  return loadVault().notes.filter(n => n.fm.type === "daily").sort((a, b) => (b.fm.date || "").localeCompare(a.fm.date || "")).slice(0, limit)
    .map(n => ({ date: n.fm.date, name: n.name, href: noteHref(n), summary: plain(n.fm.summary || ""), mood: n.fm.mood, energy: n.fm.energy, sleep: n.fm.sleep_hours, focus: n.fm.focus || [], body: n.body }));
}

export const STAGES = ["idea", "planning", "scripted", "recorded", "edited", "posted"] as const;
export function content() {
  return loadVault().notes.filter(n => n.fm.type === "content").map(n => ({
    name: n.name, href: noteHref(n), stage: n.fm.stage || "idea", channel: n.fm.channel || "", summary: plain(n.fm.summary || ""),
    rank: Number(n.fm.idea_rank) || 99, no: n.fm.video_no || n.fm.episode, voice: n.fm.voice, views: n.fm.views, publish: n.fm.publish_date,
  }));
}

export function people() {
  return loadVault().notes.filter(n => n.folder === "50 People").map(n => ({
    name: n.name, href: noteHref(n), role: n.fm.role || "", relationship: n.fm.relationship || "", company: n.fm.company || "",
    last: n.fm.last_contact || "", summary: plain(n.fm.summary || ""),
  })).sort((a, b) => String(b.last).localeCompare(String(a.last)));
}

export function clients() {
  return loadVault().notes.filter(n => n.fm.type === "client").map(n => ({
    name: n.name, href: noteHref(n), project: n.fm.project, status: n.fm.status, summary: plain(n.fm.summary || ""),
  }));
}

export function inbox() {
  return loadVault().notes.filter(n => n.folder === "02 Inbox").sort((a, b) => b.mtime - a.mtime)
    .map(n => ({ name: n.name, href: noteHref(n), summary: plain(n.fm.summary || "") }));
}

export function recent(limit = 8) {
  return loadVault().notes.filter(n => n.ext === ".md").sort((a, b) => b.mtime - a.mtime).slice(0, limit)
    .map(n => ({ name: n.name, href: noteHref(n), folder: n.folder, mtime: n.mtime }));
}

export type Agent = {
  id: string; name: string; role: string; team: string; room: string; status: string;
  task: string; project?: string; projectHref?: string; kind?: string; color?: string; schedule?: string; log: string[];
};
export function agents(): { agents: Agent[]; note?: string } {
  const n = resolve("Agents");
  if (!n) return { agents: [] };
  const list = (n.fm.agents || []) as any[];
  return {
    note: noteHref(n),
    agents: list.map((a, i) => ({
      id: String(a.id || i), name: a.name, role: a.role || "", team: a.team || "", room: a.room || "Ops",
      status: a.status || "idle", task: plain(a.task || ""), project: a.project, projectHref: a.project ? (resolve(a.project) ? noteHref(resolve(a.project)!) : undefined) : undefined,
      kind: a.kind, color: a.color, schedule: a.schedule, log: (a.log || []).map((l: string) => plain(l)),
    })),
  };
}

export type ActSession = { project: string; priority: number; path: string; start: string; end: string; minutes: number; prompts: number; late_minutes: number; first: string };
export type ActDay = { date: string; active: number; priorityMin: number; late: number; projects: number; byProject: { project: string; priority: number; minutes: number }[]; sessions: ActSession[]; href: string };
export function activity(days = 30): ActDay[] {
  return loadVault().notes.filter(n => n.fm.type === "activity").sort((a, b) => String(b.fm.date).localeCompare(String(a.fm.date))).slice(0, days)
    .map(n => ({
      date: String(n.fm.date), active: Number(n.fm.active_minutes) || 0, priorityMin: Number(n.fm.priority_minutes) || 0,
      late: Number(n.fm.late_minutes) || 0, projects: Number(n.fm.projects) || 0,
      byProject: (n.fm.by_project || []) as any, sessions: (n.fm.sessions || []) as any, href: noteHref(n),
    }));
}

export type Thought = { kind: "inbox" | "idea" | "journal"; title: string; text: string; href: string; date: string };
/** Everything you've thought out loud: unsorted notes in 02 Inbox, developed ideas, and the "Thoughts & rants" bullets of daily notes. */
export function thoughts(): Thought[] {
  const notes = loadVault().notes.filter(n => n.ext === ".md");
  const out: Thought[] = [];
  for (const n of notes) {
    const date = String(n.fm.date || new Date(n.mtime).toISOString().slice(0, 10));
    if (n.folder === "02 Inbox" || n.fm.type === "thought")
      out.push({ kind: "inbox", title: n.name, text: plain(n.fm.summary || ""), href: noteHref(n), date });
    else if (n.folder === "40 Ideas" || n.fm.type === "idea")
      out.push({ kind: "idea", title: n.name, text: plain(n.fm.summary || ""), href: noteHref(n), date });
    else if (n.fm.type === "daily") {
      const m = n.body.match(/## 💭[^\n]*\n([\s\S]*?)(?=\n## |$)/);
      for (const line of (m?.[1] || "").split("\n")) {
        const t = line.replace(/^\s*[-*]\s*/, "").trim();
        if (t && !t.startsWith("<!--")) out.push({ kind: "journal", title: t.length > 70 ? t.slice(0, 67) + "…" : t, text: t.length > 70 ? plain(t) : "", href: noteHref(n), date: String(n.fm.date || "") });
      }
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
