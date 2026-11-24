#!/usr/bin/env bash
# Starts Homebase (if not already running) and opens it in the browser.
cd "$(dirname "$0")"
PORT="${PORT:-3333}"
[ -d node_modules ] || npm install --no-audit --no-fund
if ! curl -s -o /dev/null "http://localhost:$PORT/api/version"; then
  mkdir -p "${TMPDIR:-/tmp}"
  setsid nohup npm run dev > "${TMPDIR:-/tmp}/homebase.log" 2>&1 < /dev/null &
  for i in $(seq 1 80); do curl -s -o /dev/null "http://localhost:$PORT/api/version" && break; sleep 0.5; done
fi
( xdg-open "http://localhost:$PORT" || open "http://localhost:$PORT" ) >/dev/null 2>&1 &
