# Native projeler (Android / iOS)

Bu klasörde React Native JS/TS kodu var; **android/** ve **ios/** klasörleri ilk kurulumda yoktur. Aşağıdaki yöntemlerden biriyle ekleyin.

## Yöntem 1: Otomatik betik (önerilen)

**Windows (PowerShell):**
```powershell
cd c:\Users\YUNUS\Desktop\sahada\sahada
.\mobile\scripts\setup-native.ps1
```

**macOS/Linux:**
```bash
cd /path/to/sahada
chmod +x mobile/scripts/setup-native.sh
./mobile/scripts/setup-native.sh
```

Betik geçici bir React Native 0.73.2 projesi oluşturup `android` ve `ios` klasörlerini `mobile/` içine kopyalar.

## Yöntem 2: Manuel

1. Boş bir dizinde:  
   `npx react-native@0.73.2 init SahadaTemp --skip-install --pm npm`
2. Oluşan `SahadaTemp/android` ve `SahadaTemp/ios` klasörlerini bu `mobile/` klasörünün içine kopyalayın.
3. `SahadaTemp` klasörünü silebilirsiniz.

## Sonraki adımlar

- **mobile/** içinde: `npm install`
- **Android:** Android Studio veya `npx react-native run-android` (emulator veya cihaz)
- **iOS (sadece Mac):** `cd ios && pod install && cd .. && npx react-native run-ios`

## Uygulama adı ve paket kimliği

- Varsayılan React Native proje adı **SahadaTemp** olabilir; uygulama adını **Sahada** yapmak için:
  - **Android:** `android/app/build.gradle` içinde `applicationId` ve `res/values/strings.xml` içinde `app_name`
  - **iOS:** Xcode’da hedef adı ve Bundle Identifier (örn. `com.sahada.app`)

`app.json` içinde `"name": "SahadaMobile"` (kayıt adı) ve `"displayName": "Sahada"` zaten ayarlı; native tarafında sadece gösterim adı ve bundle/package id’yi isterseniz güncelleyin.
