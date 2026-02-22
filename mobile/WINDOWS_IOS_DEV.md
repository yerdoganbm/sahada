# Windows’ta geliştirip iPhone’da test etmek

Mac’iniz yok; uygulamayı Windows’ta geliştiriyorsunuz ve gerçek iPhone’unuzda test etmek istiyorsunuz. Bu dokümanda seçenekler özetleniyor.

---

## Durum

- **Kod geliştirme:** Windows’ta yapılır (VS Code, Cursor, vb.). Tüm JS/TS ve React Native kodu platformdan bağımsız.
- **Android build & çalıştırma:** Windows’ta yapılır (`npx react-native run-android`, emulator veya cihaz).
- **iOS build:** Xcode sadece macOS’ta çalıştığı için **Windows’ta yerel iOS build alamazsınız.** iPhone’a yüklemek için iOS’u bir şekilde **Mac’te veya bulutta** derlemeniz gerekir.

---

## Seçenek 1: Expo EAS Build (önerilen, Mac gerekmez)

Expo Application Services (EAS), iOS uygulamasını **bulutta** (Apple’a uyumlu Mac’lerde) derler. Siz Windows’ta geliştirirsiniz; build’i EAS yapar, siz iPhone’a yüklersiniz.

### Adımlar (kısaca)

1. **Expo’ya geçiş (mevcut projeyi EAS ile build etmek):**  
   Proje zaten React Native CLI. İki yol var:
   - **A) Sadece EAS Build kullanmak (projeyi Expo’ya çevirmeden):** “Bare” React Native projeleri de EAS ile build edilebilir. `eas.json` ve `app.json`/`app.config.js` ekleyip `eas build --platform ios` çalıştırırsınız. Detay: [Expo – Bare Workflow](https://docs.expo.dev/build/setup/#bare-react-native-projects).
   - **B) Projeyi Expo SDK’ya taşımak:** Daha fazla değişiklik gerekir; uzun vadede Expo kullanacaksanız mantıklı.

2. **Hesap:** [expo.dev](https://expo.dev) hesabı açın, `eas login`.

3. **iOS için gerekli olanlar (EAS’ta):**
   - **Apple Developer hesabı** (ücretli).
   - **EAS’a Apple kimlik bilgileri:** İlk kez `eas build --platform ios` çalıştırdığınızda EAS, sertifika/provisioning için sizi yönlendirir. Mümkünse **Apple ID + App-Specific Password** veya **Distribution certificate + Provisioning profile** yüklemeniz istenir. Bunları **Windows’ta** Expo sayfasından veya `eas credentials` ile yapabilirsiniz; Mac gerekmez.

4. **Firebase (push):**  
   `GoogleService-Info.plist` dosyasını projeye ekleyin (`ios/SahadaMobile/` içine veya EAS’ın beklediği yere). EAS Build bu dosyayı kullanır. APNs key’i Firebase Console’da yükleyin; build’i EAS yaptığı için Xcode’u siz açmazsınız, ama APNs yapılandırması Firebase tarafında olmalı.

5. **Build & yükleme:**
   ```bash
   cd mobile
   npx eas-cli build --platform ios --profile development
   ```
   Build bittikten sonra EAS size bir link verir. iPhone’dan bu linke girip uygulamayı yüklersiniz (veya TestFlight / internal distribution).

**Özet:** Windows’ta kod yazarsınız, `eas build --platform ios` derlemesini bulutta yapar, iPhone’da test edersiniz. Mac gerekmez.

---

## Seçenek 2: Bulut Mac (MacStadium, AWS EC2 Mac, vb.)

Bir “Mac in the cloud” kiralayıp uzaktan bağlanırsınız. O Mac’te Xcode kurar, `pod install` ve `npx react-native run-ios --device` veya Archive ile IPA üretirsiniz. Firebase/APNs yapılandırmasını da o Mac’te yaparsınız.

- **Artı:** Mevcut React Native CLI akışı aynen çalışır.
- **Eksi:** Aylık maliyet, uzaktan masaüstü kullanımı.

---

## Seçenek 3: CI/CD ile iOS build (GitHub Actions, vb.)

GitHub Actions’da `macos-latest` runner kullanarak her commit’te veya manuel tetiklemeyle iOS build alabilirsiniz. Sertifika ve provisioning profile’ı GitHub’da secret olarak tutarsınız; workflow Xcode ile derleyip IPA veya TestFlight’a yükler.

- **Artı:** Otomatik build, Mac satın almanız gerekmez.
- **Eksi:** İlk kurulum (sertifika, profile, Firebase plist) biraz uğraştırır; bazen bir kez Mac ile yapıp export etmek gerekebilir.

---

## Seçenek 4: Ara sıra Mac kullanmak

Okul / iş / arkadaş Mac’i varsa: Projeyi bir kez o Mac’e atıp (Git ile), Xcode’da açın, Firebase + APNs + Push Notifications capability’yi orada yapın. IPA veya TestFlight build’i alın. Sonra Windows’ta geliştirmeye devam edin; yeni özellikler için tekrar Mac’te build alırsınız.

---

## Ne yapmanız mantıklı?

| Hedef | Öneri |
|-------|--------|
| “Hiç Mac’e dokunmadan iOS’u da çıkarayım” | **Expo EAS Build** (Seçenek 1). Projeyi “bare” olarak EAS’a bağlayın veya zamanla Expo’ya taşıyın. |
| “Mevcut React Native yapısını değiştirmek istemiyorum” | **Bulut Mac** (kısa süreli) veya **GitHub Actions** ile iOS build. |
| “Yılda birkaç kez Mac’e erişebilirim” | **Ara sıra Mac** ile build + Firebase/APNs kurulumu. |

---

## Bu projede (Sahada mobile) pratik adımlar

1. **Şu an:** Windows’ta Android ve ortak kodu (JS/TS) geliştirmeye devam edin. iOS klasörü (`ios/`) varsa bile Windows’ta `run-ios` çalıştıramazsınız; sorun değil.
2. **iOS build için:** Yukarıdaki seçeneklerden birini seçin (en az efor: EAS Build).
3. **Firebase / push (iPhone):**  
   - `GoogleService-Info.plist` dosyasını projeye ekleyin (dosyayı Firebase Console’dan indirip `ios/...` altına koyabilirsiniz; EAS veya bir Mac’teki Xcode bu dosyayı kullanır).  
   - APNs key’i Apple Developer’da oluşturup Firebase Console’a yükleyin (bu adımlar Mac gerektirmez; sadece web).
4. **Test:** EAS veya bulut/CI’dan aldığınız build’i iPhone’unuza yükleyip push ve diğer özellikleri test edin.

Özet: **Uygulama Windows’ta geliştirilebilir; iOS sürümü için build’i EAS veya bulut Mac / CI ile alıp iPhone’da test edebilirsiniz.** Günlük geliştirme tamamen Windows’ta yapılır.
