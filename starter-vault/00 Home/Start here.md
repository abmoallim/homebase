---
type: dashboard
status: active
tags: [dashboard]
summary: "How Homebase works, in two minutes"
---
# 👋 Start here

**Homebase** is a dashboard that reads this Obsidian vault live. Nothing is uploaded anywhere. You change things in Obsidian (or in Homebase's **+ Add** page, or by telling an AI assistant like Claude), and the dashboard updates itself within a few seconds.

## What reads what
| Dashboard page | Reads from |
|---|---|
| Overview | `00 Home/Profile.md` (goal, focus areas), `00 Home/Now.md`, tasks, content, today's daily note |
| Projects | notes with a `priority` number (`type: product`, `project-note`, `work`, `study` or `personal`) |
| Thoughts | `02 Inbox/`, `40 Ideas/`, and the **💭 Thoughts & rants** bullets of daily notes |
| Tasks | every `- [ ]` in the vault; add `📅 2026-12-31` for a due date |
| Content | notes with `type: content` and a `stage` |
| Agent Office | the `agents:` list in `00 Home/Agents.md` |
| Goal Map | `00 Home/Goal Map.canvas` |
| Journal | `01 Daily/` |
| People | `50 People/` |

## Focus areas on the Overview
In `Profile.md`, each entry in `sources:` becomes a card:
```yaml
sources:
  - name: My first project
    note: My first project      # a note with type: product, mrr and customers fields
    kpi: "What success looks like"
    target: 1000                # share of the main goal this one should deliver
    need: 5                     # how many customers/clients you need
    unit: clients
    color: "#E0735A"
```

## With or without AI
- **Without AI:** use Obsidian and the **+ Add** page. Everything works by hand.
- **With Claude Code (or similar):** open this vault folder in the assistant. `CLAUDE.md` explains the conventions, and `Now.md` is loaded at the start of every session, so it already knows you. Just talk to it: "log my day", "add a project called X", "what's due this week?".
