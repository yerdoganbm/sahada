# Android ve iOS native projelerini mevcut React Native (mobile) klasorune ekler.
# Kullanim: mobile klasorunde iken: ..\scripts\setup-native.ps1 veya repo kokunden: .\mobile\scripts\setup-native.ps1
# Gereksinim: Node 18+, npx erisilebilir.

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not $RepoRoot) { $RepoRoot = Join-Path (Get-Location) ".." }
$MobileRoot = Join-Path $RepoRoot "mobile"
$TempName = "SahadaRNTemp"
$TempPath = Join-Path $RepoRoot $TempName

if (-not (Test-Path $MobileRoot)) {
  Write-Error "mobile klasoru bulunamadi: $MobileRoot"
  exit 1
}

Write-Host "React Native 0.73.2 ile gecici proje olusturuluyor..."
Push-Location $RepoRoot
try {
  npx react-native@0.73.2 init $TempName --skip-install --pm npm 2>&1
  if (-not (Test-Path (Join-Path $TempPath "android"))) {
    Write-Host "Uyari: android klasoru olusmadi. iOS/Pod hatasi olabilir; android yine de kopyalanabilir."
  }
  if (Test-Path (Join-Path $TempPath "android")) {
    if (Test-Path (Join-Path $MobileRoot "android")) {
      Remove-Item -Recurse -Force (Join-Path $MobileRoot "android")
    }
    Copy-Item -Recurse (Join-Path $TempPath "android") (Join-Path $MobileRoot "android")
    Write-Host "android/ mobile icerisine kopyalandi."
  }
  if (Test-Path (Join-Path $TempPath "ios")) {
    if (Test-Path (Join-Path $MobileRoot "ios")) {
      Remove-Item -Recurse -Force (Join-Path $MobileRoot "ios")
    }
    Copy-Item -Recurse (Join-Path $TempPath "ios") (Join-Path $MobileRoot "ios")
    Write-Host "ios/ mobile icerisine kopyalandi."
  }
} finally {
  Pop-Location
}

if (Test-Path $TempPath) {
  Remove-Item -Recurse -Force $TempPath
  Write-Host "Gecici proje silindi."
}

Write-Host ""
Write-Host "Sonraki adimlar:"
Write-Host "  1. cd mobile && npm install"
Write-Host "  2. Android: cd android && .\gradlew assembleDebug  (veya Android Studio ile ac)"
Write-Host "  3. iOS (sadece Mac): cd ios && pod install && cd .. && npx react-native run-ios"
Write-Host "  Package name / bundle id degistirmek icin: mobile/NATIVE_SETUP.md"
