# Homebase guide: where things are and how to get around

This guide is for anyone who cloned Homebase. It answers three questions: *where do I click*, *where does my data live*, and *how do I change things*.

## 1. The two folders (don't mix them up)
| | What it is | Where |
|---|---|---|
| **The app** | The code that draws the dashboard. This repo. | wherever you cloned it, e.g. `~/homebase` |
| **Your vault** | Your notes: plain Markdown files you also open in Obsidian. Your data lives here, never in the repo. | `~/Homebase` by default, or the path you gave `./install.sh` |

The app finds your vault in this order: the `VAULT_PATH` environment variable, then `homebase.config.json` (`{ "vault": "~/path" }`), then `~/Homebase`. If the folder doesn't exist or is empty, the app creates it from `starter-vault/` and shows the setup screen. Don't put the app folder inside the vault.

## 2. The sidebar, page by page
| Page | What you see | Where its data comes from | How to add to it |
|---|---|---|---|
| **Overview** | Greeting, countdowns, goal ring, focus areas, this week, due soon, waiting on | `00 Home/Profile.md` + `00 Home/Now.md` + tasks | Edit those two notes |
| **Projects** | Your projects ranked by priority | Notes with a `priority` number and `type: product / project-note / work / study / personal` | **+ Add → Project** |
| **Tasks** | Every open task, grouped by project, with filters | Every `- [ ]` line in the vault (`📅 2026-12-31` = due date) | **+ Add → Task** |
| **Thoughts** | A timeline of everything that came to mind, big or small, with search, filters and project tags | `00 Home/Thoughts Log.md` (the running log), plus `02 Inbox/`, `40 Ideas/` and the "💭 Thoughts & rants" bullets in daily notes | Type into the box at the top of the page: it appends one line to the log |
| **Content** | A board of your content pipeline (idea → posted) | Notes with `type: content` and a `stage` | Copy `90 Templates/Content Piece.md` |
| **Focus** | Where your time went (needs the optional activity logger) | `00 Home/Activity/*.md` | Optional, see below |
| **Agent Office** | A top-down floor plan of your AI agents. Your roster plus live Claude Code sessions on this computer (working / waiting). Agents and sessions that stop are kept in an **Archive** below. | The `agents:` list in `00 Home/Agents.md`, and `~/.claude/projects` (read-only, optional) | Edit that list. Set an agent's `status: retired` to keep it as history instead of deleting it |
| **Goal Map** | Your goals and projects as a canvas | `00 Home/Goal Map.canvas` (an Obsidian canvas) | Edit it in Obsidian |
| **Journal** | A timeline of your days | `01 Daily/YYYY-MM-DD.md` | **+ Add → Log entry**, or Obsidian's daily note |
| **People** | The people in your life and work | `50 People/` | **+ Add → Person** |
| **Tools** | What you built and the tools you use (apps, services, AI), grouped by category, with link, cost and what each is for | `70 Tools/` (notes with `type: tool`, `kind: built` or `used`) | **+ Add → Tool**, or copy `90 Templates/Tool.md` |

**+ Add** (bottom of the sidebar) writes straight into your vault: task, log entry, thought, idea, person, project or tool. **Open vault in Obsidian** opens the same folder in Obsidian.

## 3. The thoughts flow
Thoughts come in every size, so there are three ways to keep them, and the Thoughts page shows all of them together:
1. **The log (default).** Type into the box on **Thoughts**, or tell your assistant. Each thought becomes one line in `00 Home/Thoughts Log.md`: `- 2026-11-24 14:05 · **Project** · the thought`. Small thoughts and big ones both start here, and you can back-fill old ones by hand (where did each project begin?).
   Click a log thought to open it on its own page. Add follow-ups there (a change, an update, where it went) and they are saved as a thread in `00 Home/Thoughts/<date> <words>.md`, created on the first follow-up. A one-liner never needs one.
   Thoughts are the reasons and ideas. What you decided or did because of one goes on the **Decisions** page: one note each in `00 Home/Decisions/` (`type: decision`, optional `thought_id` linking back). Log one from a thought's page and it shows under "What came of it" there and "came from" on Decisions.
2. **A note of its own.** When a thought grows, make a note for it in `02 Inbox/` (or `40 Ideas/` once it's developed) and link it from the log line with `[[Note name]]`.
3. **The journal.** Quick rants and reflections in a daily note under **💭 Thoughts & rants** also appear on the page (tagged *Journal*).

## 4. Your vault folders
| Folder | What goes there |
|---|---|
| `00 Home/` | `Start here`, `Now` (your living briefing), `Profile` (app settings), `Thoughts Log`, `Agents`, `Goal Map.canvas`, `*.base` tables |
| `01 Daily/` | One note per day |
| `02 Inbox/` | Unsorted thoughts |
| `03 Meetings/` | `YYYY-MM-DD Title.md` |
| `10 Projects/` | One folder per project, with a hub note named after it |
| `20 Work/`, `30 Study/`, `60 Personal/` | Job, learning, personal goals |
| `40 Ideas/` | Developed ideas |
| `50 People/` | One note per person |
| `70 Tools/` | One note per tool you built or use |
| `90 Templates/` | Templates only |
| `99 Attachments/` | Images and files |

## 5. Changing settings (name, goal, focus areas)
Everything personal is in the frontmatter of `00 Home/Profile.md`: your name, timezone, tagline, goal and target, focus areas (the cards on Overview), countdowns, priorities, content channels and Agent Office room names. `00 Home/Start here.md` in your vault explains each field. Save the note and the dashboard updates within a few seconds. To run the setup screen again, set `setup: false` in `Profile.md`.

## 6. Using it with an AI assistant
Open the **vault** folder (not the app) in Claude Code or any assistant that reads `CLAUDE.md`. The vault's `CLAUDE.md` explains the conventions and its `.claude/settings.json` loads `Now.md` at the start of each session, so the assistant already knows who you are. Then just talk: "log my day", "add a project called X", "what's due this week?". Without AI, everything above still works by hand.

## 7. Running and fixing
| I want to… | Do this |
|---|---|
| Start the app | `./start.sh` (or the Homebase entry in your app menu on Linux) |
| Use another port | `PORT=3400 ./start.sh` (and `npm run dev -- -p 3400` for a manual start) |
| Point at another vault | `./install.sh ~/path/to/vault` or `VAULT_PATH=~/path npm run dev` |
| Page keeps reloading or looks stale | Close old browser tabs, stop the app, `rm -rf .next`, start again |
| Back up my vault | `git init` in the vault plus the Obsidian Git plugin works well |

## 8. The optional Focus page
Focus charts time spent per project from daily files like `00 Home/Activity/2026-11-24.md` (frontmatter: `type: activity`, `active_minutes`, `priority_minutes`, `late_minutes`, `projects`, `by_project`, `sessions`). Homebase doesn't ship the logger that writes them, so the page is empty until you add one.

## Calendar
The **Calendar** page puts your Google events, open tasks with a 📅 date, notes in `03 Meetings/` and daily notes on one month grid. To show Google events, copy the calendar's secret iCal address (Google Calendar → Settings → your calendar → Integrate calendar → *Secret address in iCal format*) into `homebase.config.json` as `"calendar"` (a list of addresses works too), or set `CALENDAR_ICAL`. It is read-only and refreshes every 5 minutes. Treat the address like a password; the config file is not committed.
