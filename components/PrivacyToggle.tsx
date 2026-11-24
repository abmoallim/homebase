"use client";
import { useEffect, useState } from "react";

/** Eye button that shows or hides money figures (anything with class "money"). Hidden by default on every page load, so a shared screen never leaks numbers. */
export default function PrivacyToggle({ label = false }: { label?: boolean }) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    const sync = () => setHidden(document.documentElement.dataset.private === "1");
    sync();
    window.addEventListener("homebase-privacy", sync);
    return () => window.removeEventListener("homebase-privacy", sync);
  }, []);
  const toggle = () => {
    const next = document.documentElement.dataset.private === "1" ? "0" : "1";
    document.documentElement.dataset.private = next;
    window.dispatchEvent(new Event("homebase-privacy"));
  };
  return (
    <button type="button" onClick={toggle} title={hidden ? "Show numbers" : "Hide numbers"} aria-label={hidden ? "Show numbers" : "Hide numbers"} aria-pressed={!hidden}
      className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 text-[12px] text-muted hover:text-brass transition-colors">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
        {hidden && <path d="M3 3l18 18" />}
      </svg>
      {label && <span>{hidden ? "Numbers hidden" : "Numbers shown"}</span>}
    </button>
  );
}
