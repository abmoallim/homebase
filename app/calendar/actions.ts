"use server";
import { refresh } from "next/cache";
import { createEvent, updateEvent, deleteEvent, restore, type Snapshot } from "@/lib/calendar";
import type { EventInput, Scope } from "@/lib/events";

export type Result = { ok: true; undo: Snapshot } | { ok: false; error: string };

function run(change: () => Snapshot): Result {
  try {
    const undo = change();
    refresh();
    return { ok: true, undo };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save" };
  }
}

export async function addEvent(input: EventInput) { return run(() => createEvent(input)); }
export async function editEvent(id: string, occ: string, scope: Scope, input: EventInput) { return run(() => updateEvent(id, occ, scope, input)); }
export async function removeEvent(id: string, occ: string, scope: Scope) { return run(() => deleteEvent(id, occ, scope)); }
export async function undoChange(snap: Snapshot) { return run(() => { restore(snap); return []; }); }
