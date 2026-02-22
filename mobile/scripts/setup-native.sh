#!/usr/bin/env bash
# Android ve iOS native projelerini mevcut React Native (mobile) klasorune ekler.
# Kullanim: repo kokunden: ./mobile/scripts/setup-native.sh
# Gereksinim: Node 18+, npx

set -e
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MOBILE_ROOT="$REPO_ROOT/mobile"
TEMP_NAME="SahadaRNTemp"
TEMP_PATH="$REPO_ROOT/$TEMP_NAME"

if [ ! -d "$MOBILE_ROOT" ]; then
  echo "mobile klasoru bulunamadi: $MOBILE_ROOT"
  exit 1
fi

echo "React Native 0.73.2 ile gecici proje olusturuluyor..."
cd "$REPO_ROOT"
npx react-native@0.73.2 init "$TEMP_NAME" --skip-install --pm npm || true

if [ -d "$TEMP_PATH/android" ]; then
  rm -rf "$MOBILE_ROOT/android"
  cp -R "$TEMP_PATH/android" "$MOBILE_ROOT/android"
  echo "android/ mobile icerisine kopyalandi."
fi
if [ -d "$TEMP_PATH/ios" ]; then
  rm -rf "$MOBILE_ROOT/ios"
  cp -R "$TEMP_PATH/ios" "$MOBILE_ROOT/ios"
  echo "ios/ mobile icerisine kopyalandi."
fi

rm -rf "$TEMP_PATH"
echo "Gecici proje silindi."

echo ""
echo "Sonraki adimlar:"
echo "  1. cd mobile && npm install"
echo "  2. Android: cd mobile && npx react-native run-android"
echo "  3. iOS (Mac): cd mobile/ios && pod install && cd .. && npx react-native run-ios"
echo "  Package name / bundle id: mobile/NATIVE_SETUP.md"
