# Homebase

Your Obsidian vault as a living, **local** dashboard. No hosting, no login, no cloud: Homebase reads a folder of Markdown notes (an [Obsidian](https://obsidian.md) vault) and shows your goals, projects, tasks, content pipeline, people, daily journal and an "agent office" for your AI assistants. Edit notes in Obsidian, in the **+ Add** page, or by talking to an AI assistant such as Claude Code, and the dashboard refreshes itself within seconds.

It works fine **without any AI**: a first-run screen fills your vault in a minute. With an AI assistant, the vault ships with conventions (`CLAUDE.md`) and a morning briefing hook, so the assistant already knows how everything is laid out.

## Quick start
Requirements: [Node.js](https://nodejs.org) 20+ and [Obsidian](https://obsidian.md).

```bash
git clone <this repo> homebase && cd homebase
./install.sh            # installs dependencies, adds a "Homebase" launcher to your app menu (Linux)
./start.sh              # starts the app and opens http://localhost:3333
```
First launch creates your vault at `~/Homebase` from `starter-vault/` and walks you through setup. Then open that folder in Obsidian (**Open vault in Obsidian** in the sidebar does it). On macOS or Windows use `npm install && npm run dev` and open http://localhost:3333.

Already have a vault? `./install.sh ~/path/to/vault` (or set `VAULT_PATH`, or edit `homebase.config.json`). Homebase only needs the frontmatter conventions below; everything else in your vault is left alone.

## How it reads your vault
| Page | Reads from |
|---|---|
| Overview | `00 Home/Profile.md` (name, goal, focus areas, countdowns), `00 Home/Now.md`, tasks, content, today's daily note |
| Projects | notes with a `priority` number and `type: product / project-note / work / study / personal` |
| Tasks | every `- [ ]` (add `📅 2026-12-31` for a due date) |
| Content | notes with `type: content` and a `stage` |
| Agent Office | the `agents:` list in `00 Home/Agents.md` |
| Goal Map | `00 Home/Goal Map.canvas` |
| Journal | `01 Daily/` |
| People | `50 People/` |
| Focus | `00 Home/Activity/*.md` (optional, time tracking written by a script) |

Everything personal (your name, goal, focus areas, content channels, room names, timezone) lives in `00 Home/Profile.md`; the app code has none of it. See `starter-vault/00 Home/Start here.md`.

Homebase writes to your vault in only two places: the first-run setup and the **+ Add** page. Nothing else is modified.

## Using it with an AI assistant
Open the vault folder (not this repo) in Claude Code or any assistant that reads `CLAUDE.md`. The vault's `.claude/settings.json` loads `Now.md` at the start of each session. Back your vault up however you like; `git init` plus the Obsidian Git plugin works well.

## Develop
Next.js 16 (App Router), Tailwind 4, framer-motion. `lib/vault.ts` reads and parses the vault, `lib/data.ts` shapes it for each page, `lib/write.ts` holds the few writes. `starter-vault/` is what new users get.

MIT licensed.
