# Android ve iOS Native Proje Oluşturma

Bu projede `android/` ve `ios/` klasörleri yoksa, aşağıdaki yöntemle React Native CLI ile oluşturabilirsiniz.

## Gereksinimler

- Node.js 18+
- React Native CLI: `npm install -g react-native-cli` (isteğe bağlı)
- **Android:** JDK 17, Android Studio, ANDROID_HOME
- **iOS:** Xcode (yalnızca macOS), CocoaPods (`sudo gem install cocoapods`)

## Yöntem: Geçici proje ile android/ios kopyalama

Aynı React Native sürümünü kullanarak geçici bir proje oluşturup `android` ve `ios` klasörlerini kopyalayın.

### 1. Sürümü kontrol edin

`mobile/package.json` içinde `react-native` sürümüne bakın (örn. `0.73.2`).

### 2. Geçici proje oluşturun

`mobile` klasörü içinden:

```bash
cd mobile
npx react-native@0.73.2 init SahadaMobileTemp --version 0.73.2
```

Bu işlem `mobile/SahadaMobileTemp/` altında `android` ve `ios` oluşturur.

### 3. Klasörleri taşıyın

```bash
# Windows (PowerShell) - mobile içindeyken
Move-Item -Path .\SahadaMobileTemp\android -Destination .\android
Move-Item -Path .\SahadaMobileTemp\ios -Destination .\ios

# macOS / Linux
mv SahadaMobileTemp/android ./
mv SahadaMobileTemp/ios ./
```

### 4. Geçici klasörü silin

```bash
# Windows
Remove-Item -Recurse -Force .\SahadaMobileTemp

# macOS / Linux
rm -rf SahadaMobileTemp
```

### 5. Uygulama adını ayarlayın (isteğe bağlı)

- **Android:** `android/app/build.gradle` içinde `applicationId` ve `res/values/strings.xml` içinde `app_name` (örn. "Sahada").
- **iOS:** Xcode ile `ios/SahadaMobileTemp.xcworkspace` açın; target ve bundle identifier'ı güncelleyin (örn. `com.sahada.app`). İsterseniz proje adını "SahadaMobile" yapın.

### 6. iOS bağımlılıkları

```bash
cd ios
pod install
cd ..
```

### 7. Çalıştırma

```bash
# Android (emulator veya cihaz)
npm run android

# iOS (yalnızca macOS, simülatör)
npm run ios
```

## Notlar

- İlk kez `pod install` çalıştırıldığında süre uzun sürebilir.
- Android emulator için: `ANDROID_HOME` ve `platform-tools` path’i ayarlı olmalı.
- `react-native run-android` bazen `adb` bulunamadı hatası verir; Android Studio’dan bir emulator başlatıp tekrar deneyin.

## Alternatif: Expo (yönetilen)

Mevcut proje “bare” React Native kullandığı için bu adımlar CLI ile native klasör eklemek içindir. Yeni bir projeyi sıfırdan Expo ile kurmak isterseniz `expo init` kullanılabilir; mevcut kodu Expo’ya taşımak ayrı bir uyarlama gerektirir.
