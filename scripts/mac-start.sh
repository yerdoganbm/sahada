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

echo "→ cd mobile && npx expo start (Watchman kapalı, FSEvents hatası önlenir)"
cd mobile && CI=1 EXPO_NO_WATCHMAN=1 npx expo start
