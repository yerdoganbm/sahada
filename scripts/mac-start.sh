#!/usr/bin/env bash
# Mac: git pull + npx expo start (tek komut)
# Kullanım (repo kökünden):
#   npm run mobile:start
#   veya: ./scripts/mac-start.sh
# İlk sefer: chmod +x scripts/mac-start.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "→ git pull origin main"
git pull origin main

# Önce gerçek Watchman'ı kapat (varsa)
REAL_WATCHMAN=$(command -v watchman 2>/dev/null || true)
if [ -n "$REAL_WATCHMAN" ]; then
  "$REAL_WATCHMAN" shutdown-server 2>/dev/null || true
  "$REAL_WATCHMAN" watch-del-all 2>/dev/null || true
fi

# Watchman'ı "gizle": PATH'e sahte watchman koy, Metro hemen node crawler kullanır (sudo gerekmez)
STUB_DIR="$ROOT_DIR/.watchman-stub"
mkdir -p "$STUB_DIR"
printf '%s\n' '#!/bin/sh' 'exit 1' > "$STUB_DIR/watchman"
chmod +x "$STUB_DIR/watchman"
export PATH="$STUB_DIR:$PATH"
unset -v STUB_DIR

export CI=1
export EXPO_NO_WATCHMAN=1
export WATCHMAN_SOCK=/dev/null
echo "→ cd mobile && npx expo start (Watchman devre dışı, node crawler kullanılır)"
cd mobile && npx expo start
