#!/usr/bin/env bash
# One-time setup: installs dependencies, creates your vault (if you don't have one yet),
# and adds a "Homebase" launcher to your app menu (Linux).
# Usage: ./install.sh [path/to/vault]     (default vault: ~/Homebase)
set -e
cd "$(dirname "$0")"
HERE="$(pwd)"
npm install --no-audit --no-fund
if [ -n "$1" ]; then
  V="$(cd "$(dirname "$1")" 2>/dev/null && pwd)/$(basename "$1")"
  printf '{ "vault": "%s" }\n' "$V" > homebase.config.json
  echo "Vault: $V"
fi
if [ "$(uname)" = "Linux" ]; then
  mkdir -p "$HOME/.local/share/applications" "$HOME/.local/share/icons/hicolor/256x256/apps"
  cp app/icon.png "$HOME/.local/share/icons/hicolor/256x256/apps/homebase.png"
  cat > "$HOME/.local/share/applications/homebase.desktop" <<DESK
[Desktop Entry]
Type=Application
Name=Homebase
Comment=Your Obsidian vault as a living dashboard
Exec=$HERE/start.sh
Icon=homebase
Terminal=false
Categories=Office;
DESK
  echo "Added Homebase to your app menu."
fi
echo
echo "Done. Start it with ./start.sh (or open Homebase from your app menu)."
echo "First launch creates your vault and walks you through setup. Open the vault folder in Obsidian to edit it."
