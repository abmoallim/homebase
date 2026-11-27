// The calendar. Each event is one note in the vault (`00 Home/Calendar/`), so it can be edited here,
// in Obsidian, or by asking Claude. Open tasks with a due date, meetings and daily notes show alongside.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { VAULT, loadVault, noteHref, plain, profile } from "./vault";
import { writeNote, safeName } from "./write";
import { COLORS, REPEATS, WEEKDAYS, addDays, diffDays, expand, matches, occurrence, weekday, type EventInput, type Fields, type Occurrence, type Repeat, type Scope, type Series } from "./events";

export type CalItem = { date: string; time?: string; end?: string; title: string; kind: "event" | "task" | "meeting" | "daily"; href?: string; place?: string; color?: string; overdue?: boolean; event?: Occurrence };

const DIR = "00 Home/Calendar";
const FIELDS = ["title", "date", "start", "end", "place", "color", "notes"] as const;

const isoDate = (v: unknown) => { const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? ""); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ""; };
/** "14:30". A hand-written, unquoted 14:30 reaches us from YAML as the number 870. */
const clock = (v: unknown) => {
  if (typeof v === "number") return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
  const m = String(v ?? "").match(/^(\d{1,2}):(\d{2})$/);
  return m && Number(m[1]) * 60 + Number(m[2]) <= 1440 && Number(m[2]) < 60 ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
};

function parseFields(o: Record<string, any>): Partial<Fields> {
  const out: Partial<Fields> = {};
  if (o.title !== undefined) out.title = String(o.title);
  if (o.date !== undefined && isoDate(o.date)) out.date = isoDate(o.date);
  if (o.start !== undefined) out.start = clock(o.start);
  if (o.end !== undefined) out.end = clock(o.end);
  for (const k of ["place", "color", "notes"] as const) if (o[k] !== undefined) out[k] = String(o[k] ?? "");
  return out;
}

function toSeries(fm: Record<string, any>, body: string, name: string): Series | undefined {
  const date = isoDate(fm.date);
  if (!date) return;
  const changes: Series["changes"] = {};
  for (const [k, v] of Object.entries(fm.changes || {})) if (isoDate(k) && v) changes[k] = parseFields(v as Record<string, any>);
  return {
    title: name, start: "", end: "", place: "", color: COLORS[0], ...parseFields(fm), date, notes: body.trim(),
    repeat: REPEATS.includes(fm.repeat) ? fm.repeat as Repeat : "", every: Math.max(1, Math.floor(Number(fm.every)) || 1),
    days: (Array.isArray(fm.days) ? fm.days : []).map((d: unknown) => WEEKDAYS.indexOf(String(d).slice(0, 3).toLowerCase() as typeof WEEKDAYS[number])).filter((d: number) => d >= 0),
    until: isoDate(fm.until), skip: (Array.isArray(fm.skip) ? fm.skip : []).map(isoDate).filter(Boolean), changes,
  };
}

const clean = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "" && v !== undefined && !(Array.isArray(v) && !v.length) && !(v && typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length)));

function frontmatter(s: Series) {
  return clean({
    type: "event", title: s.title, date: s.date, start: s.start, end: s.end, repeat: s.repeat,
    every: s.repeat && s.every > 1 ? s.every : undefined, days: s.repeat === "weekly" ? s.days.map(d => WEEKDAYS[d]) : undefined,
    until: s.repeat ? s.until : undefined, place: s.place, color: s.color, skip: s.skip, changes: s.changes,
  });
}

export function calendarItems(from: string, to: string): CalItem[] {
  const out: CalItem[] = [];
  for (const n of loadVault().notes) {
    if (n.folder !== DIR || n.fm.type !== "event") continue;
    const s = toSeries(n.fm, n.body, n.name);
    if (s) for (const e of expand(n.name, s, from, to)) out.push({ date: e.date, time: e.start || undefined, end: e.end || undefined, title: e.title, place: e.place || undefined, color: e.color, kind: "event", event: e });
  }
  return [...out, ...vaultItems(from, to)];
}

/** Dated things from the rest of the vault: open tasks with a due date, meetings, and daily notes. */
function vaultItems(from: string, to: string): CalItem[] {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: profile().timezone }).format(new Date());
  const out: CalItem[] = [];
  for (const n of loadVault().notes) {
    if (n.ext !== ".md" || n.fm.type === "event") continue;
    for (const t of n.tasks) if (t.status === " " && t.due && t.due >= from && t.due <= to) out.push({ date: t.due, title: plain(t.text.replace(/📅\s*\d{4}-\d{2}-\d{2}/, "").trim()), kind: "task", href: noteHref(n), overdue: t.due < today });
    const d = String(n.fm.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < from || d > to) continue;
    if (n.fm.type === "daily") out.push({ date: d, title: "Daily note", kind: "daily", href: noteHref(n) });
    else if (n.folder.startsWith("03 Meetings") || n.fm.type === "meeting") out.push({ date: d, time: n.fm.time ? clock(n.fm.time) || undefined : undefined, title: n.name, kind: "meeting", href: noteHref(n) });
  }
  return out;
}

// ---- Writing ----

/** What a file held before a change (null = it did not exist), so the change can be undone. */
export type Snapshot = { id: string; before: string | null }[];

function fileFor(id: string) {
  if (!id || id.startsWith(".") || /[\\/]/.test(id)) throw new Error("Bad event id");
  return path.join(VAULT, DIR, id + ".md");
}

function read(id: string) {
  const raw = fs.readFileSync(fileFor(id), "utf8");
  const m = matter(raw);
  const series = m.data.type === "event" ? toSeries(m.data, m.content, id) : undefined;
  if (!series) throw new Error("That note is not a calendar event");
  return { raw, series };
}

const save = (id: string, s: Series) => fs.writeFileSync(fileFor(id), matter.stringify(s.notes ? `\n${s.notes}\n` : "\n", frontmatter(s)));
const create = (s: Series) => path.basename(writeNote(`${DIR}/${s.date} ${safeName(s.title) || "Event"}.md`, frontmatter(s), s.notes ? `\n${s.notes}\n` : "\n"), ".md");

/** Deleted events go to the vault's .trash folder, so they can be recovered. */
function trash(id: string) {
  const dir = path.join(VAULT, ".trash");
  fs.mkdirSync(dir, { recursive: true });
  let to = path.join(dir, id + ".md"), i = 2;
  while (fs.existsSync(to)) to = path.join(dir, `${id} ${i++}.md`);
  fs.renameSync(fileFor(id), to);
}

function check(i: EventInput): EventInput {
  const title = String(i.title || "").replace(/\s+/g, " ").trim().slice(0, 200);
  const date = isoDate(i.date), start = clock(i.start);
  let end = start ? clock(i.end) : "";
  if (!title) throw new Error("Give the event a title");
  if (!date) throw new Error("Pick a date");
  if (start && (!end || end <= start)) throw new Error("The end time must be after the start time");
  const repeat = REPEATS.includes(i.repeat as Repeat) ? i.repeat : "";
  const days = repeat === "weekly" ? [...new Set((i.days || []).filter(d => d >= 0 && d <= 6))].sort() : [];
  const until = repeat ? isoDate(i.until) : "";
  if (until && until < date) throw new Error("The repeat can't end before it starts");
  return { title, date, start, end, place: String(i.place || "").trim().slice(0, 200), color: COLORS.includes(i.color) ? i.color : COLORS[0], notes: String(i.notes || "").trim(), repeat, every: repeat ? Math.min(99, Math.max(1, Math.floor(i.every) || 1)) : 1, days: repeat === "weekly" && !days.length ? [weekday(date)] : days, until };
}

export function createEvent(input: EventInput): Snapshot {
  return [{ id: create({ ...check(input), skip: [], changes: {} }), before: null }];
}

/** Change the occurrence `occ` of an event. Only the fields that differ from what was shown are applied. */
export function updateEvent(id: string, occ: string, scope: Scope, input: EventInput): Snapshot {
  const next = check(input);
  const { raw, series: s } = read(id);
  const snap: Snapshot = [{ id, before: raw }];
  if (!s.repeat) { save(id, { ...next, skip: [], changes: {} }); return snap; }
  const shown = occurrence(id, s, occ);
  const edits = Object.fromEntries(FIELDS.filter(k => next[k] !== shown[k]).map(k => [k, next[k]])) as Partial<Fields>;
  if (edits.start !== undefined || edits.end !== undefined) Object.assign(edits, { start: next.start, end: next.end });
  const sameDays = (a: number[], b: number[]) => a.join() === b.join();
  const daysEdited = !sameDays(next.days, shown.days);
  const ruleEdited = daysEdited || next.repeat !== shown.repeat || next.every !== shown.every || next.until !== shown.until;

  if (scope === "one") {
    if (ruleEdited) throw new Error("Repeat settings apply to following or all events");
    save(id, { ...s, changes: { ...s.changes, [occ]: { ...s.changes[occ], ...edits } } });
    return snap;
  }

  const split = scope === "following" && occ > s.date;
  const delta = diffDays(next.date, shown.date);
  const shift = (d: string) => addDays(d, delta);
  const from = split ? occ : s.date;
  // Carry over skipped and changed occurrences. A field edited now replaces the older one-off value.
  const skip = s.skip.filter(d => d >= from).map(shift);
  const changes: Series["changes"] = {};
  for (const [k, v] of Object.entries(s.changes)) {
    if (k < from || k === occ) continue;
    const rest: Partial<Fields> = { ...v };
    for (const f of Object.keys(edits) as (keyof Fields)[]) delete rest[f];
    if (rest.date) rest.date = shift(rest.date);
    if (Object.keys(rest).length) changes[shift(k)] = rest;
  }
  const { date: _moved, ...fieldEdits } = edits;
  const result: Series = {
    ...s, ...fieldEdits, skip, changes,
    date: shift(from), repeat: next.repeat, every: next.every,
    // Moving a whole weekly pattern to another day moves its weekdays with it.
    days: daysEdited || next.repeat !== s.repeat ? next.days : s.days.map(d => (d + ((delta % 7) + 7)) % 7).sort(),
    until: next.until !== shown.until ? next.until : s.until && delta > 0 ? shift(s.until) : s.until,
  };
  if (!result.repeat) Object.assign(result, next, { skip: [], changes: {} });
  if (split) { save(id, { ...s, until: addDays(occ, -1) }); snap.push({ id: create(result), before: null }); }
  else save(id, result);
  return snap;
}

export function deleteEvent(id: string, occ: string, scope: Scope): Snapshot {
  const { raw, series: s } = read(id);
  const snap: Snapshot = [{ id, before: raw }];
  if (!s.repeat || scope === "all") trash(id);
  else if (scope === "one") {
    const { [occ]: _gone, ...changes } = s.changes;
    save(id, { ...s, changes, skip: [...new Set([...s.skip, occ])].sort() });
  } else {
    // "This and following": end the series the day before. If nothing is left, remove it.
    const until = addDays(occ, -1);
    let left = false;
    for (let d = s.date; d <= until && !left; d = addDays(d, 1)) left = !s.skip.includes(d) && matches({ ...s, until }, d);
    if (left) save(id, { ...s, until }); else trash(id);
  }
  return snap;
}

export function restore(snap: Snapshot) {
  for (const { id, before } of snap) {
    const file = fileFor(id);
    if (before === null) { if (fs.existsSync(file)) trash(id); }
    else {
      if (matter(before).data.type !== "event") throw new Error("Nothing to restore");
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, before);
    }
  }
}
