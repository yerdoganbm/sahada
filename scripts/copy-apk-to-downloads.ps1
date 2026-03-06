# Copy release APK to Downloads as sahadav2.apk
$apkPath = 'c:\Users\YUNUS\Desktop\sahada\sahada\mobile\android\app\build\outputs\apk\release\app-release.apk'
$destPath = 'C:\Users\YUNUS\Downloads\sahadav2.apk'
if (Test-Path $apkPath) { Copy-Item $apkPath $destPath -Force; Write-Host 'APK kopyalandi:' $destPath } else { Write-Host 'APK yok. Proje kokunden: cd mobile\android; .\gradlew.bat assembleRelease' }
