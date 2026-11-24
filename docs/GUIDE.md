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
| **Thoughts** | Everything you've thought out loud, with search and filters | `02 Inbox/` (unsorted), `40 Ideas/`, and the "💭 Thoughts & rants" bullets in your daily notes | Type into the box at the top of the page |
| **Content** | A board of your content pipeline (idea → posted) | Notes with `type: content` and a `stage` | Copy `90 Templates/Content Piece.md` |
| **Focus** | Where your time went (needs the optional activity logger) | `00 Home/Activity/*.md` | Optional, see below |
| **Agent Office** | A top-down floor plan of your AI agents and what each is doing | The `agents:` list in `00 Home/Agents.md` | Edit that list |
| **Goal Map** | Your goals and projects as a canvas | `00 Home/Goal Map.canvas` (an Obsidian canvas) | Edit it in Obsidian |
| **Journal** | A timeline of your days | `01 Daily/YYYY-MM-DD.md` | **+ Add → Log entry**, or Obsidian's daily note |
| **People** | The people in your life and work | `50 People/` | **+ Add → Person** |

**+ Add** (bottom of the sidebar) writes straight into your vault: task, log entry, thought, idea, person or project. **Open vault in Obsidian** opens the same folder in Obsidian.

## 3. The thoughts flow
Capture first, sort later:
1. Type a thought into the box on **Thoughts**. It lands in `02 Inbox/` as its own note (`status: inbox`).
2. Develop the ones that matter: move the note to `40 Ideas/` (or turn it into a project).
3. Quick rants and reflections can also go straight into the daily note under **💭 Thoughts & rants**. They show up on the Thoughts page under *From journal*.

## 4. Your vault folders
| Folder | What goes there |
|---|---|
| `00 Home/` | `Start here`, `Now` (your living briefing), `Profile` (app settings), `Agents`, `Goal Map.canvas`, `*.base` tables |
| `01 Daily/` | One note per day |
| `02 Inbox/` | Unsorted thoughts |
| `03 Meetings/` | `YYYY-MM-DD Title.md` |
| `10 Projects/` | One folder per project, with a hub note named after it |
| `20 Work/`, `30 Study/`, `60 Personal/` | Job, learning, personal goals |
| `40 Ideas/` | Developed ideas |
| `50 People/` | One note per person |
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
