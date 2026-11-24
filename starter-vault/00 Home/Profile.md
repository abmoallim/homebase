---
type: dashboard
status: active
tags: [dashboard, settings]
summary: "Your Homebase settings: name, goal, focus areas. The app reads this note; edit it here or just tell Claude."
setup: false            # Homebase's first-run screen sets this to true
name: ""
timezone: ""            # e.g. Africa/Nairobi. Empty = this computer's timezone
tagline: ""             # one line shown under the greeting
source_label: "Focus area"   # what to call the cards on the Overview (e.g. "Income source")
goal:
  label: "Main goal"
  short: ""
  unit: ""              # e.g. "$"
  target: 0
sources: []             # cards on the Overview, see "Start here" for the format
countdowns: []          # [{label: "Launch", date: "2027-01-01"}]
priorities: []          # [{n: 1, label: "My first project"}]
channels: []            # content channels: [{id: youtube, label: YouTube, color: "#E0735A"}]
rooms: []               # rename Agent Office rooms: [{id: HQ, label: "My HQ"}]
---
# ⚙️ Profile

Settings for the Homebase app. Everything lives in the frontmatter above.
