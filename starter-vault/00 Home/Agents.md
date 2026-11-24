---
type: dashboard
status: active
tags: [dashboard, agents]
summary: "The agents and routines that work for you. Feeds the Agent Office page in Homebase"
agents:
  - id: assistant
    name: My Assistant
    role: Keeps the vault current: logs your day, updates Now.md
    team: Personal
    room: Ops
    kind: AI assistant
    schedule: "Whenever you talk to it"
    status: idle
    task: "Waiting for your next message"
    project: Now
    color: "#5FB58C"
    log: []
---
# 🤖 Agents

Add an entry to `agents:` for every assistant, routine or automation you run. `room` is one of the Agent Office rooms (HQ, Sales, Studio, Build, Ops; rename them in `Profile.md`). `status` is working, idle, waiting or blocked.
