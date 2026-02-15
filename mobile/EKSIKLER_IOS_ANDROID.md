# 📱 Sahada Mobile – iOS & Android Eksikler (Sonraki Süreç)

Bu doküman, React Native mobil uygulamanın production’a (App Store / Play Store) çıkması için **bundan sonra tamamlanması gereken** başlıkları listeler.

---

## 1. 🔴 Native proje yapısı

| Eksik | Açıklama | Öncelik |
|-------|----------|---------|
| **android/** | React Native CLI ile `npx react-native init` veya mevcut projede `android` klasörü oluşturulmalı; yoksa `npm run android` çalışmaz. | P0 |
| **ios/** | Xcode projesi (Mac); `npx react-native init` veya `ios` klasörü. `pod install` gerekli. | P0 |
| **Splash screen** | `react-native-bootsplash` veya native splash (Android `res/drawable`, iOS `LaunchScreen.storyboard`). | P1 |
| **App ikonu** | Android: `mipmap-*`, iOS: `AppIcon` asset. Tüm çözünürlükler. | P1 |

---

## 2. 🔴 Placeholder ekranlar → gerçek ekranlar

Şu an **PlaceholderScreens** (“Yakında…” metni) kullanılan ekranlar gerçek işlevle değiştirilmeli:

| Ekran | Dosya | Yapılacak |
|-------|--------|-----------|
| Maç Detayları | `MatchDetailsScreen` | Web’deki `MatchDetails` akışı (RSVP, kadro, skor, MVP). |
| Saha Detayları | `VenueDetailsScreen` | Saha bilgisi, rezervasyon, harita/konum. |
| Ayarlar | `SettingsScreen` | Bildirim tercihleri, tema, çıkış. |
| Takım Kurulumu | `TeamSetupScreen` | Web’deki `TeamSetup` (takım adı, davet kodu, kurucu bilgisi). |
| Maç Oluştur | `MatchCreateScreen` | Tarih, saha, kapasite, kadro seçimi (admin). |
| Yönetim Paneli | `AdminDashboardScreen` | Admin özet, üye/maç/ödeme yönetimi. |

Web tarafındaki `screens/` (TypeScript/React) ile mantık paylaşılabilir veya mobil için aynı akışlar React Native bileşenleriyle yazılabilir.

---

## 3. 🟠 Auth & güvenlik

| Eksik | Açıklama |
|-------|----------|
| **Gerçek API auth** | Şu an mock (telefon → sabit kullanıcı). SMS/OTP veya backend token (JWT) entegrasyonu. |
| **Biyometrik giriş** | `react-native-biometrics` paketi var; “Face ID / Touch ID ile giriş” akışı bağlanmalı. |
| **Session / token saklama** | AsyncStorage/MMKV’de token; refresh ve süre kontrolü. |
| **Çıkış her yerde** | Ayarlar + gerekirse profil; `AuthContext.logout` ve storage temizliği. |

---

## 4. 🟠 API & veri

| Eksik | Açıklama |
|-------|----------|
| **API client** | Web’deki `src/api/client.ts` ile uyumlu veya mobil için `axios` instance (baseURL, auth header). |
| **Maç / kadro / kullanıcı listesi** | Mock yerine API’den çekme; loading ve hata durumları. |
| **Offline / cache** | İsteğe bağlı: son maçlar/kadro cache; network yokken sınırlı görüntüleme. |

---

## 5. 🟠 Push bildirimleri

| Eksik | Açıklama |
|-------|----------|
| **FCM (Android)** | `@react-native-firebase/messaging` kurulumu; `google-services.json` ve Firebase projesi. |
| **APNs (iOS)** | Firebase veya doğrudan APNs; sertifikalar ve provisioning. |
| **Token kaydı** | Cihaz token’ını backend’e gönderme; maç daveti / ödeme hatırlatma konuları. |
| **Bildirim tıklama** | Deep link (örn. `sahada://match/:id`) → `linking.ts` ile ilgili ekrana yönlendirme. |

`@notifee/react-native` yerel bildirimler için kullanılabilir.

---

## 6. 🟡 Platform özellikleri

| Özellik | Android | iOS |
|---------|---------|-----|
| **Konum** | `@react-native-community/geolocation` izin ve kullanım. | `Info.plist` içinde konum açıklamaları (NSLocationWhenInUseUsageDescription). |
| **Kamera / galeri** | `react-native-image-picker` izin ve kullanım (profil/saha fotoğrafı). | Aynı; iOS için `Info.plist` kamera ve fotoğraf açıklamaları. |
| **Haptic** | `react-native-haptic-feedback` butonlarda. | Aynı. |
| **Paylaşım** | `react-native-share` (maç daveti, kadro linki). | Aynı. |
| **Contacts** | `react-native-contacts` izin; “arkadaşını davet” (opsiyonel). | Aynı; iOS contacts izin metni. |

---

## 7. 🟡 Store’a çıkış

### Android (Play Store)

- **Signing:** Keystore (release); `android/app/build.gradle` içinde `signingConfigs`.  
- **Package name:** Son haline göre sabitlenmeli (örn. `com.sahada.app`).  
- **Version code / version name:** Her release’te artırılmalı.  
- **Privacy policy URL:** Store listelemesinde gerekli.  
- **Uygulama içi izinler:** Konum, bildirim, kamera vb. için kullanım yerinde açıklama.

### iOS (App Store)

- **Apple Developer hesabı:** Ücretli.  
- **Bundle ID:** Xcode’da sabit (örn. `com.sahada.app`).  
- **Provisioning & signing:** Distribution profil ve sertifika.  
- **App Store Connect:** Uygulama oluşturma, ekran görüntüleri, açıklama, gizlilik politikası.  
- **Privacy:** App Privacy formu (hangi veriler toplanıyor).  
- **İzin metinleri:** Konum, kamera, bildirim vb. `Info.plist` (NSCameraUsageDescription, NSPhotoLibraryUsageDescription, vb.).

---

## 8. 🟢 İsteğe bağlı iyileştirmeler

- **Dark/Light tema:** Web ile uyumlu tema seçimi (AsyncStorage + context).  
- **Çoklu dil (i18n):** `react-i18next` veya benzeri; TR/EN.  
- **E2E test:** Detox veya Maestro ile kritik akışlar (giriş, maç detay, RSVP).  
- **Crash raporlama:** Firebase Crashlytics veya Sentry.  
- **Analytics:** Firebase Analytics veya mevcut Neuro Core ile event’lerin mobilde de gönderilmesi.

---

## Özet öncelik sırası

1. **P0:** `android/` ve `ios/` native projelerinin oluşturulması / doğrulanması; uygulamanın cihazda/simülatörde açılması.  
2. **P1:** Placeholder ekranların tek tek gerçek ekranlarla değiştirilmesi (en az: Maç Detay, Ayarlar, Takım Kurulumu).  
3. **P1:** Gerçek auth (API + token) ve isteğe bağlı biyometrik.  
4. **P2:** Push (FCM/APNs), API entegrasyonu, konum/kamera/paylaşım.  
5. **P3:** Store’a çıkış (sertifika, metadata, gizlilik) ve opsiyonel iyileştirmeler.

Bu sırayla ilerlenirse mobil uygulama önce test edilebilir, sonra store’a hazır hale getirilebilir.
