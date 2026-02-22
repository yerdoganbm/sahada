# Firebase kurulumu – Sahada Mobile

Push bildirimleri (FCM) ve isteğe bağlı Analytics için Firebase kullanılıyor. Aşağıdaki adımları tamamlamanız yeterli.

**Mac’iniz yoksa (Windows’ta geliştiriyorsanız):** iOS build’i bulutta (örn. Expo EAS) alabilirsiniz. Rehber: **[WINDOWS_IOS_DEV.md](./WINDOWS_IOS_DEV.md)**. Firebase için `GoogleService-Info.plist` dosyasını projeye eklemeniz yeterli; APNs key’i Firebase Console’da (web) yapılandırılır.

---

## Ön koşul

- **android/** ve **ios/** klasörleri olmalı. Yoksa önce:
  ```powershell
  .\mobile\scripts\setup-native.ps1
  cd mobile && npm install
  ```

---

## 1. Firebase projesi oluşturma

1. [Firebase Console](https://console.firebase.google.com) → **Proje ekle** (veya mevcut projeyi seç).
2. Proje adı: örn. **Sahada**.
3. (İsteğe bağlı) Google Analytics’i açın/kapatın.

---

## 2. Android uygulamasını ekleme

1. Firebase projesinde **Proje ayarları** (dişli) → **Genel** → **Uygulamanızı ekleyin** → **Android**.
2. **Android paket adı:** Projenizdeki değerle aynı olmalı.
   - Henüz değiştirmediyseniz: `com.sahada.app` veya React Native şablonundaki paket adı (örn. `com.sahadatemp`).
   - Paket adını görmek için: `android/app/build.gradle` içinde `applicationId`.
3. (İsteğe bağlı) Uygulama takma adı, SHA-1 (Google Sign-In kullanacaksanız).
4. **Kaydet** → **google-services.json** indir.

### 2.1 google-services.json yerleştirme

- İndirilen **google-services.json** dosyasını şu konuma kopyalayın:
  ```
  mobile/android/app/google-services.json
  ```
- Bu dosyayı **versiyon kontrolüne ekleyin** (veya `.gitignore`’da bırakıp CI’da env ile üretin).

### 2.2 Android Gradle (Firebase plugin)

**Proje düzeyi** `android/build.gradle`:

```groovy
buildscript {
  dependencies {
    // ... mevcut
    classpath 'com.google.gms:google-services:4.4.0'
  }
}
```

**Uygulama düzeyi** `android/app/build.gradle` (dosyanın **en sonuna** ekleyin):

```groovy
apply plugin: 'com.google.gms.google-services'
```

Değişiklikten sonra:

```bash
cd mobile/android && ./gradlew clean
cd .. && npx react-native run-android
```

---

## 3. iPhone (iOS) için yapılacaklar

Aşağıdaki adımlar **sadece Mac** üzerinde Xcode ile yapılır. Push bildirimlerini test etmek için **gerçek iPhone** kullanın (simülatörde push sınırlı çalışır).

### 3.0 Gereksinimler
- Mac + Xcode
- Apple Developer hesabı (ücretli; APNs key için)
- **ios/** klasörü (yoksa `.\mobile\scripts\setup-native.ps1` çalıştırın)

### 3.1 Firebase’e iOS uygulaması ekleme

1. Firebase Console → **Proje ayarları** (dişli) → **Genel** → **Uygulamanızı ekleyin** → **iOS**.
2. **Apple paket kimliği (Bundle ID):** Xcode’daki ile birebir aynı olmalı (örn. `com.sahada.app`). Xcode’da: proje seç → hedef → **General** → **Bundle Identifier**.
3. (İsteğe bağlı) Uygulama takma adı, App Store ID.
4. **Kaydet** → **GoogleService-Info.plist** indir.

### 3.2 GoogleService-Info.plist’i Xcode’a ekleme

- **Projede zaten var:** `mobile/GoogleService-Info.plist` (Firebase projesi `sahada-16b2d`, Bundle ID `com.sahada.mobile`).  
- **ios/ klasörü oluşturduğunuzda:** Bu dosyayı `ios/SahadaMobile/` (veya ana uygulama klasörünüz) içine kopyalayın; Xcode’da sol paneldeki proje ağacına sürükleyip bırakın.
- Açılan pencerede: **Copy items if needed** işaretli, **Add to targets** içinde uygulama hedefi (SahadaMobile) seçili olsun.
- **Finish**.

### 3.3 APNs anahtarı (Firebase’in iPhone’a push gönderebilmesi için)

1. [developer.apple.com](https://developer.apple.com/account) → giriş → **Certificates, Identifiers & Profiles** → **Keys**.
2. **+** ile yeni key → isim verin (örn. “Sahada APNs”) → **Apple Push Notifications service (APNs)** kutusunu işaretleyin → **Continue** → **Register**.
3. **Key ID**’yi not alın. **Download** ile .p8 dosyasını indirin (bir kez indirilir, saklayın).
4. **Firebase Console** → **Proje ayarları** → **Cloud Messaging** sekmesi → aşağı kaydırın → **Apple uygulama yapılandırması**.
5. **APNs Authentication Key** bölümünde .p8 dosyasını yükleyin; **Key ID** ve **Team ID** (Apple Developer hesabındaki), **Bundle ID** girin → **Yükle**.

### 3.4 Xcode’da Push Notifications

- Xcode’da projeyi açın → sol üstten uygulama hedefini seçin (SahadaMobile) → **Signing & Capabilities**.
- **+ Capability** → **Push Notifications** ekleyin.
- (Önerilen) **+ Capability** → **Background Modes** → **Remote notifications** kutusunu işaretleyin.

### 3.5 Bildirim izin metni (isteğe bağlı)

Kullanıcıya “Bildirimlere izin verir misiniz?” çıksın diye:

- **Info.plist** (Xcode’da veya `ios/SahadaMobile/Info.plist`) içine ekleyin:
  - Key: `NSUserNotificationUsageDescription` veya Firebase/Messaging kendi metnini kullanabilir. React Native Firebase genelde sistem izin diyaloğunu kullanır; ek metin isterseniz bu key’i ekleyebilirsiniz.

### 3.6 Pod install ve cihazda çalıştırma

```bash
cd mobile/ios
pod install
cd ..
npx react-native run-ios --device
```

Cihaz seçmek için: `npx react-native run-ios --device "iPhone adı"`. Simülatör yerine **gerçek iPhone** kullanın; push testi için iPhone’un internete bağlı ve uygulama giriş yapmış olmalı (token backend’e kaydedilir).

### 3.7 iPhone kontrol listesi

| Adım | Yapıldı mı? |
|------|-------------|
| Firebase’e iOS uygulaması eklendi (Bundle ID doğru) | ☐ |
| GoogleService-Info.plist indirilip Xcode’a eklendi | ☐ |
| Apple Developer’da APNs key (.p8) oluşturuldu | ☐ |
| APNs key Firebase Console’a yüklendi | ☐ |
| Xcode: Push Notifications capability eklendi | ☐ |
| Xcode: Background Modes → Remote notifications | ☐ |
| `pod install` yapıldı | ☐ |
| Gerçek iPhone’da çalıştırıldı | ☐ |

---

## 4. Uygulama tarafında ne hazır?

- **Bağımlılıklar:** `@react-native-firebase/app`, `@react-native-firebase/messaging`, `@notifee/react-native` package.json’da tanımlı.
- **Token gönderimi:** Giriş sonrası `registerPushTokenIfAvailable()` çağrılıyor (AuthContext). Firebase kuruluysa FCM token alınır ve **POST /api/push-tokens** ile backend’e gönderilir.
- **Backend:** `POST /api/push-tokens` endpoint’i hazır; token’lar MongoDB’de saklanıyor.

Yani sizin yapmanız gereken: yalnızca **Firebase Console + konfig dosyaları (google-services.json / GoogleService-Info.plist + Android Gradle + iOS APNs)**.

---

## 5. Kontrol listesi

| Adım | Android | iOS |
|------|---------|-----|
| Firebase projesi + Android uygulaması ekle | ✅ | – |
| Firebase projesi + iOS uygulaması ekle | – | ✅ |
| google-services.json → android/app/ | ✅ | – |
| GoogleService-Info.plist → Xcode projesine | – | ✅ |
| android/build.gradle → google-services classpath | ✅ | – |
| android/app/build.gradle → apply plugin | ✅ | – |
| APNs key (.p8) Firebase’e yükle | – | ✅ |
| Xcode: Push Notifications capability | – | ✅ |
| pod install (iOS) | – | ✅ |

---

## 6. Test

1. Uygulamayı giriş yapmış kullanıcıyla çalıştırın (API veya mock).
2. Log’larda FCM token veya “Token kaydedildi” benzeri bir mesaj görebilirsiniz.
3. Firebase Console → **Cloud Messaging** → **Send your first message** ile test bildirimi gönderin (cihaz FCM token’ı kayıtlı olmalı).

---

## 7. Sorun giderme

- **Android: “Default FirebaseApp is not initialized”**  
  → google-services.json doğru konumda mı? `apply plugin: 'com.google.gms.google-services'` app/build.gradle’ın **en sonunda** mı?

- **iOS: Token alınamıyor**  
  → APNs key yüklendi mi? Push Notifications capability eklendi mi? Gerçek cihazda test edin (simülatörde push sınırlı).

- **Bildirim gelmiyor**  
  → Backend’de o kullanıcının push token’ı kayıtlı mı? Firebase Console’dan manuel test mesajı göndererek deneyin.

Detaylı kullanım: [React Native Firebase – Messaging](https://rnfirebase.io/messaging/usage).
