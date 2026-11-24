"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Polls the vault's last-modified stamp and refreshes the page when a note changes. */
export default function LiveRefresh() {
  const router = useRouter();
  const last = useRef<number | null>(null);
  useEffect(() => {
    const tick = async () => {
      try {
        const v = (await (await fetch("/api/version", { cache: "no-store" })).json()).v as number;
        if (last.current !== null && v !== last.current) router.refresh();
        last.current = v;
      } catch { /* dev server restarting */ }
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
