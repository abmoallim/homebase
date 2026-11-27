// Calendar events and their repeat rules. Pure code (no disk access), so the browser can use it too.

export const REPEATS = ["daily", "weekly", "monthly", "yearly"] as const;
export type Repeat = (typeof REPEATS)[number];
export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export const COLORS = ["#8fb8d8", "#5FB58C", "#C9A45C", "#E0735A", "#B49AE0", "#C8A27A"];

/** What can differ for a single occurrence of a repeating event. An empty `start` means all day. */
export type Fields = { title: string; date: string; start: string; end: string; place: string; color: string; notes: string };
export type Rule = { repeat: Repeat | ""; every: number; days: number[]; until: string };
export type Series = Fields & Rule & { skip: string[]; changes: Record<string, Partial<Fields>> };
/** One occurrence on the calendar. `occ` is the date the rule produced, even if this one was moved. */
export type Occurrence = Fields & Rule & { id: string; occ: string };
export type EventInput = Fields & Rule;
export type Scope = "one" | "following" | "all";

const DAY = 86400000;
export const toMs = (d: string) => Date.parse(d + "T00:00:00Z");
export const addDays = (d: string, n: number) => new Date(toMs(d) + n * DAY).toISOString().slice(0, 10);
export const diffDays = (a: string, b: string) => Math.round((toMs(a) - toMs(b)) / DAY);
export const weekday = (d: string) => new Date(toMs(d)).getUTCDay();
export const weekStart = (d: string) => addDays(d, -weekday(d)); // weeks start on Sunday

/** Does the repeat rule produce an occurrence on this date? */
export function matches(s: Series, d: string): boolean {
  if (!s.repeat) return d === s.date;
  if (d < s.date || (s.until && d > s.until)) return false;
  const every = Math.max(1, s.every || 1);
  if (s.repeat === "daily") return diffDays(d, s.date) % every === 0;
  if (s.repeat === "weekly") {
    const days = s.days.length ? s.days : [weekday(s.date)];
    return days.includes(weekday(d)) && (diffDays(weekStart(d), weekStart(s.date)) / 7) % every === 0;
  }
  const months = (Number(d.slice(0, 4)) - Number(s.date.slice(0, 4))) * 12 + Number(d.slice(5, 7)) - Number(s.date.slice(5, 7));
  const step = s.repeat === "yearly" ? 12 * every : every;
  return d.slice(8) === s.date.slice(8) && months % step === 0;
}

export function occurrence(id: string, s: Series, occ: string): Occurrence {
  const { skip, changes, ...base } = s;
  return { ...base, date: occ, ...changes[occ], id, occ };
}

/** Occurrences shown between two dates, inclusive. */
export function expand(id: string, s: Series, from: string, to: string): Occurrence[] {
  const out: Occurrence[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) if (!s.changes[d] && !s.skip.includes(d) && matches(s, d)) out.push(occurrence(id, s, d));
  // Changed occurrences are placed by their new date, which may come from outside the range.
  for (const occ of Object.keys(s.changes)) {
    if (s.skip.includes(occ) || !matches(s, occ)) continue;
    const o = occurrence(id, s, occ);
    if (o.date >= from && o.date <= to) out.push(o);
  }
  return out;
}
