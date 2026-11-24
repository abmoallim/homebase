"use client";
import { useEffect, useState } from "react";
export default function TzField() {
  const [tz, setTz] = useState("");
  useEffect(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone), []);
  return <label className="block"><span className="eyebrow">Timezone</span>
    <input name="timezone" value={tz} onChange={e => setTz(e.target.value)} className="w-full bg-[rgba(255,255,255,0.03)] border border-line rounded-xl px-3 py-2 text-[14px] outline-none focus:border-brass mt-1" /></label>;
}
