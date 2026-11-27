import { connection } from "next/server";
import { today, profile } from "@/lib/vault";
import { calendarItems } from "@/lib/calendar";
import { addDays, weekStart } from "@/lib/events";
import Calendar from "@/components/Calendar";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; d?: string; v?: string }> }) {
  await connection();
  const sp = await searchParams;
  const now = today();
  const view = sp.v === "month" || sp.v === "day" ? sp.v : "week";
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(sp.d || "") ? sp.d! : /^\d{4}-\d{2}$/.test(sp.m || "") ? sp.m + "-01" : now;
  const range = (first: string, n: number) => Array.from({ length: n }, (_, i) => addDays(first, i));
  const days = view === "day" ? [anchor] : view === "week" ? range(weekStart(anchor), 7) : range(weekStart(anchor.slice(0, 7) + "-01"), 42);
  const items = calendarItems(days[0], days[days.length - 1]);
  const nowTime = new Intl.DateTimeFormat("en-GB", { timeZone: profile().timezone, hour: "2-digit", minute: "2-digit" }).format(new Date());
  return <Calendar view={view} anchor={anchor} days={days} items={items} today={now} nowTime={nowTime} />;
}
