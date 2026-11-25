// Calendar: your vault's dated items plus Google Calendar through its private iCal address (read-only).
// Set the address in homebase.config.json ({"calendar": "https://calendar.google.com/…/basic.ics"}, a list works too) or CALENDAR_ICAL.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import ical from "node-ical";
import { loadVault, noteHref, plain, profile } from "./vault";

export type CalItem = { date: string; time?: string; end?: string; title: string; kind: "google" | "task" | "meeting" | "daily"; href?: string; place?: string; overdue?: boolean; calendar?: string };

export function calendarUrls(): string[] {
  let v: unknown = process.env.CALENDAR_ICAL;
  if (!v) { try { v = JSON.parse(fs.readFileSync(path.join(process.cwd(), "homebase.config.json"), "utf8")).calendar; } catch { /* no config */ } }
  const list = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[\s,]+/) : [];
  return list.map(String).filter(Boolean).map(u => u.replace(/^webcal:/i, "https:").replace(/^~(?=$|\/)/, os.homedir()));
}

const cache = new Map<string, { at: number; text: string }>();
async function load(url: string): Promise<string> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.text;
  const text = url.startsWith("http") ? await (async () => {
    const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!r.ok) throw new Error(`Google returned ${r.status}. Check the iCal address.`);
    return r.text();
  })() : fs.readFileSync(url, "utf8");
  cache.set(url, { at: Date.now(), text });
  return text;
}

const dayKey = (d: Date, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
const hhmm = (d: Date, tz: string) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(d);
const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Google events between two days (inclusive, YYYY-MM-DD), recurring ones expanded. */
export async function googleEvents(from: string, to: string): Promise<{ items: CalItem[]; error?: string; configured: boolean }> {
  const urls = calendarUrls();
  if (!urls.length) return { items: [], configured: false };
  const tz = profile().timezone, items: CalItem[] = [];
  const lo = new Date(from + "T00:00:00Z"), hi = new Date(to + "T23:59:59Z");
  let error: string | undefined;
  for (const url of urls) {
    try {
      const data = ical.sync.parseICS(await load(url));
      for (const ev of Object.values(data) as any[]) {
        if (ev.type !== "VEVENT" || !ev.start) continue;
        const allDay = ev.datetype === "date";
        const dur = ev.end ? ev.end.getTime() - ev.start.getTime() : 0;
        const starts: { start: Date; ev: any }[] = [];
        if (ev.rrule) {
          for (const d of ev.rrule.between(new Date(lo.getTime() - 86400000 * 2), new Date(hi.getTime() + 86400000), true) as Date[]) {
            const key = d.toISOString().slice(0, 10);
            if (ev.exdate && Object.values(ev.exdate).some((x: any) => x.toISOString().slice(0, 10) === key)) continue;
            const over = ev.recurrences && (ev.recurrences[key] || Object.values(ev.recurrences).find((r: any) => r.recurrenceid?.toISOString().slice(0, 10) === key));
            starts.push(over ? { start: (over as any).start, ev: over } : { start: d, ev });
          }
        } else starts.push({ start: ev.start, ev });
        for (const s of starts) {
          if (s.ev.status === "CANCELLED") continue;
          const end = s.ev.end && s.ev !== ev ? s.ev.end : new Date(s.start.getTime() + dur);
          const title = plain(String(s.ev.summary?.val ?? s.ev.summary ?? "(no title)"));
          const place = s.ev.location ? String(s.ev.location) : undefined;
          if (allDay) {
            const first = localDay(s.start), last = localDay(end); // end day is exclusive
            for (let d = new Date(first + "T12:00:00Z"), n = 0; n < 60; d = new Date(d.getTime() + 86400000), n++) {
              const k = d.toISOString().slice(0, 10);
              if (n > 0 && k >= last) break;
              if (k >= from && k <= to) items.push({ date: k, title, kind: "google", place });
            }
          } else {
            const k = dayKey(s.start, tz);
            if (k >= from && k <= to) { const e = dayKey(end, tz) === k ? hhmm(end, tz) : "24:00"; items.push({ date: k, time: hhmm(s.start, tz), end: dur > 0 && e > hhmm(s.start, tz) ? e : undefined, title, kind: "google", place }); }
          }
        }
      }
    } catch (e: any) { error = e?.message || "Could not read the calendar"; }
  }
  return { items, error, configured: true };
}

/** Dated things from the vault: open tasks with a due date, meetings, and daily notes. */
export function vaultItems(from: string, to: string): CalItem[] {
  const today = dayKey(new Date(), profile().timezone);
  const out: CalItem[] = [];
  for (const n of loadVault().notes) {
    if (n.ext !== ".md") continue;
    for (const t of n.tasks) if (t.status === " " && t.due && t.due >= from && t.due <= to) out.push({ date: t.due, title: plain(t.text.replace(/📅\s*\d{4}-\d{2}-\d{2}/, "").trim()), kind: "task", href: noteHref(n), overdue: t.due < today });
    const d = String(n.fm.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < from || d > to) continue;
    if (n.fm.type === "daily") out.push({ date: d, title: "Daily note", kind: "daily", href: noteHref(n) });
    else if (n.folder.startsWith("03 Meetings") || n.fm.type === "meeting") out.push({ date: d, time: n.fm.time ? String(n.fm.time) : undefined, title: n.name, kind: "meeting", href: noteHref(n) });
  }
  return out;
}
