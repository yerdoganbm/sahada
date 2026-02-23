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

# Watchman FSEvents hatası varsa kapat; Metro node crawler kullanır
if command -v watchman &>/dev/null; then
  watchman shutdown-server 2>/dev/null || true
  watchman watch-del-all 2>/dev/null || true
fi

# Metro'nun Watchman beklemesin, hemen node crawler kullansın
export CI=1
export EXPO_NO_WATCHMAN=1
export WATCHMAN_SOCK=/dev/null
echo "→ cd mobile && npx expo start (Watchman kapalı, FSEvents hatası önlenir)"
cd mobile && npx expo start
