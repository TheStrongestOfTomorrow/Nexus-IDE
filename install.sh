#!/usr/bin/env bash
set -euo pipefail

# One-line installer for Nexus IDE:
# curl -fsSL https://raw.githubusercontent.com/TheStrongestOfTomorrow/Nexus-IDE/main/install.sh | bash

REPO="github:TheStrongestOfTomorrow/Nexus-IDE#main"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Nexus IDE requires Node.js 18+ and npm. Install them from https://nodejs.org/ and run this command again." >&2
  exit 1
fi

node_major="$(node -p "process.versions.node.split('.')[0]")"
if [ "$node_major" -lt 18 ]; then
  echo "Nexus IDE requires Node.js 18 or newer (found $(node --version))." >&2
  exit 1
fi

echo "Installing Nexus IDE from $REPO..."
npm install --global "$REPO"
echo
echo "Nexus IDE is installed. Start it with: nexus-ide"
echo "Updates are checked on startup and every 30 minutes while it is running."
