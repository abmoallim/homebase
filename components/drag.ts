"use client";
/** Follow the pointer from a press until release. Escape cancels. `moved` is false for a plain click. */
export function trackPointer(e: React.PointerEvent, onMove: (ev: PointerEvent) => void, onEnd: (ev: PointerEvent | null, moved: boolean) => void) {
  const x = e.clientX, y = e.clientY;
  let moved = false;
  const move = (ev: PointerEvent) => {
    if (!moved && Math.hypot(ev.clientX - x, ev.clientY - y) < 5) return;
    moved = true;
    onMove(ev);
  };
  const finish = (ev: PointerEvent | null) => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", cancel);
    window.removeEventListener("keydown", key);
    onEnd(ev, moved);
  };
  const up = (ev: PointerEvent) => finish(ev);
  const cancel = () => finish(null);
  const key = (ev: KeyboardEvent) => ev.key === "Escape" && finish(null);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", cancel);
  window.addEventListener("keydown", key);
}

/** The element under the pointer that carries this data attribute. */
export const under = (ev: PointerEvent, attr: string) => (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest<HTMLElement>(`[${attr}]`) || null;
