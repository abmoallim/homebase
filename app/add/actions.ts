"use server";
import { redirect } from "next/navigation";
import { writeNote, appendLine, dailyNote, safeName, logThought } from "@/lib/write";
import { loadVault, today } from "@/lib/vault";

export async function addItem(fd: FormData) {
  const s = (k: string) => String(fd.get(k) || "").trim();
  const kind = s("kind"), text = s("text"), d = today();
  if (!text) redirect("/add?err=empty");
  const title = safeName(text);
  let done = "";
  if (kind === "task") {
    const line = `- [ ] ${text}${s("due") ? ` 📅 ${s("due")}` : ""}`;
    const proj = s("project");
    const hub = proj ? loadVault().notes.find(n => n.name === proj && n.fm.priority) : undefined;
    if (hub) appendLine(hub.path, line, "## Tasks"); else appendLine(dailyNote(), line, "## 🎯 Top 3 today");
    done = `Task added to ${hub ? hub.name : "today's note"}`;
  } else if (kind === "thought") {
    logThought(text, s("project"));
    done = "Thought logged";
  } else if (kind === "idea") {
    writeNote(`40 Ideas/${title}.md`, { type: "idea", date: d, status: "new", tags: ["idea"], summary: s("notes").slice(0, 140) }, `\n# ${title}\n\n${s("notes")}\n`);
    done = "Idea saved";
  } else if (kind === "person") {
    writeNote(`50 People/${title}.md`, { type: "person", role: s("notes"), last_contact: d, tags: ["person"], summary: s("notes") }, `\n# ${title}\n\n## Who they are\n${s("notes")}\n`);
    done = "Person added";
  } else if (kind === "project") {
    const pr = Number(s("priority")) || 5;
    writeNote(`10 Projects/${title}/${title}.md`, { type: "project-note", project: title, status: "active", priority: pr, date: d, tags: ["project"], summary: s("notes") }, `\n# ${title}\n\n${s("notes")}\n\n## Tasks\n- [ ] First step\n`);
    done = "Project created";
  } else if (kind === "log") {
    appendLine(dailyNote(), `- ${text}`, "## 📝 Log");
    done = "Added to today's log";
  }
  redirect((s("from") === "thoughts" || kind === "thought" ? "/thoughts" : "/add") + "?done=" + encodeURIComponent(done));
}
