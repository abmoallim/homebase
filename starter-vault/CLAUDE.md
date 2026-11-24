# Vault conventions (for the AI assistant)

This Obsidian vault is the user's personal information hub, and the **Homebase** dashboard reads it live. Save everything the user shares (thoughts, ideas, meeting notes, day updates) here. Capture generously. Read `00 Home/Now.md` first: it says who the user is and what matters.

## Folders
| Folder | Contents |
|---|---|
| `00 Home/` | `Start here`, `Now` (the living briefing), `Profile` (app settings), `Thoughts Log`, `Agents`, `Goal Map.canvas`, `*.base` tables |
| `01 Daily/` | One note per day, `YYYY-MM-DD.md`, from `90 Templates/Daily.md` |
| `02 Inbox/` | Quick thoughts not sorted yet (template `Thought.md`) |
| `03 Meetings/` | `YYYY-MM-DD Title.md` (template `Meeting.md`); link it from the day's daily note |
| `10 Projects/` | One folder per project, with a hub note named after it |
| `20 Work/` | Job or employer material |
| `30 Study/` | Courses, research |
| `40 Ideas/` | Developed ideas (template `Idea.md`) |
| `50 People/` | One note per person (template `Person.md`) |
| `60 Personal/` | Health, habits, personal goals |
| `90 Templates/` | Templates only |
| `99 Attachments/` | Images and files |

## Rules
- **`00 Home/Now.md` is the living briefing.** Whenever goals, this week's focus, decisions or waiting-on items change, update it in the same turn.
- Every note gets frontmatter with at least `type`, `date` (YYYY-MM-DD), `project`, `status`, `tags` and a one-line `summary`. Homebase depends on these fields.
- Hub notes (what the Projects page lists) have a `priority` number (1 = most important) and `type: product | project-note | work | study | personal`. Products that earn money also have `mrr` and `customers`. Paused projects have `status: paused` and no open tasks.
- `type` values: content, daily, weekly, thought, meeting, idea, person, product, project-note, client, plan, goal, work, study, dashboard.
- `status` values: inbox, new, draft, active, paused, ending, ended, open, delivered, dropped, lost, reference, archived.
- Tasks are `- [ ]` lines (closed: `- [x]`, cancelled: `- [-]`); add `📅 YYYY-MM-DD` for a due date. They show up on the Tasks page.
- When the user tells you about their day, append to today's daily note under `## 📝 Log` (create it from the template if missing).
- Settings for the app (name, goal, focus areas, content channels) live in `00 Home/Profile.md`. Edit its frontmatter when the user changes them.
- Agents shown in the Agent Office are the `agents:` list in `00 Home/Agents.md`.
- **Log every thought.** Whenever the user shares a thought, idea, plan or decision, big or small, append one line to `00 Home/Thoughts Log.md` under `## Log`: `- YYYY-MM-DD HH:MM · **Project** · the thought`. Big ones also get their own note, linked from the line. The Thoughts page in Homebase reads this log.
- Link with `[[Note name]]`. Don't rename notes without updating links.
- If the vault is a git repo, run `git pull --rebase` before editing and commit only when the user asks.
