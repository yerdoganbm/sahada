# 🚀 SAHADA MOBILE APP - BAŞLATMA REHBERİ

## ⚡ Hızlı Başlangıç

### 1️⃣ Önkoşullar

#### Windows için:
```powershell
# Node.js yüklü mü kontrol et
node --version  # 18+ olmalı

# Android Studio gerekli
# İndir: https://developer.android.com/studio
```

#### Mac için:
```bash
# Node.js
node --version

# Xcode (iOS için)
xcode-select --install

# CocoaPods
sudo gem install cocoapods
```

---

### 2️⃣ Kurulum

```bash
# Mobile klasörüne git
cd mobile

# Bağımlılıkları kur
npm install

# iOS için (sadece Mac)
cd ios
pod install
cd ..
```

---

### 3️⃣ Çalıştırma

#### Android (Windows + Mac):
```bash
# Metro bundler'ı başlat (ayrı terminal)
npm start

# Android emulator'u başlat (Android Studio'dan)
# Veya fiziksel cihaz bağla (USB debugging açık)

# Uygulamayı çalıştır (yeni terminal)
npm run android
```

#### iOS (sadece Mac):
```bash
# Metro bundler'ı başlat (ayrı terminal)
npm start

# iOS simulator'da çalıştır (yeni terminal)
npm run ios

# Veya belirli cihaz
npm run ios -- --simulator="iPhone 15 Pro"
```

---

## 🎯 İlk Çalıştırma Adımları

### Adım 1: Metro Bundler
```bash
cd mobile
npm start
```
✅ Metro bundler başlayacak (JavaScript bundler)

### Adım 2: Android Emulator Başlat
1. Android Studio'yu aç
2. Device Manager → Create Device → Pixel 5
3. Play Store olan bir image seç
4. Start emulator

### Adım 3: Uygulamayı Yükle
```bash
# Yeni terminal aç
cd mobile
npm run android
```

⏳ İlk defa 2-3 dakika sürebilir (native build)  
✅ Uygulama emulator'de açılacak!

---

## 📱 Test Kullanıcıları

Giriş ekranında:
```
Admin:   "1"     → Ahmet Yılmaz (tüm yetkiler)
Kaptan:  "7"     → Burak Yılmaz (kaptan yetkisi)
Üye:     "2"     → Mehmet Demir (standart üye)
```

---

## 🐛 Sorun Giderme

### Problem 1: Metro bundler başlamıyor
```bash
# Cache temizle
npm start -- --reset-cache
```

### Problem 2: "Command not found: adb"
```bash
# Android SDK path ekle (Windows)
# System Environment Variables → Path →
# Add: C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools
```

### Problem 3: "Unable to connect to development server"
```bash
# Metro bundler'ı yeniden başlat
npm start -- --reset-cache
```

### Problem 4: Build hataları
```bash
# Android
cd android
./gradlew clean
cd ..

# iOS (Mac only)
cd ios
pod deintegrate
pod install
cd ..
```

### Problem 5: "command not found: react-native"
```bash
# Global yükleme (isteğe bağlı)
npm install -g react-native-cli

# Veya npx ile çalıştır
npx react-native run-android
```

---

## 📂 Proje Dosya Yapısı

```
mobile/
├── src/
│   ├── App.tsx                 ✅ Ana uygulama
│   ├── screens/
│   │   ├── WelcomeScreen.tsx   ✅ Hoşgeldin ekranı
│   │   ├── LoginScreen.tsx     ✅ Giriş ekranı
│   │   ├── DashboardScreen.tsx ✅ Ana sayfa
│   │   ├── MatchesScreen.tsx   ✅ Maç listesi
│   │   ├── TeamScreen.tsx      ✅ Takım kadrosu
│   │   └── ProfileScreen.tsx   ✅ Profil
│   ├── navigation/             ✅ Navigation yapısı
│   ├── contexts/               ✅ Auth + Theme
│   └── theme/                  ✅ Renkler + tipografi
├── android/                    📱 Android native
├── ios/                        📱 iOS native (Mac)
├── index.js                    ✅ Entry point
├── package.json                ✅ Dependencies
└── README.md                   📖 Bu dosya
```

---

## 🎨 Özellikler

### ✅ Hazır Ekranlar (7)
1. Welcome Screen - Animasyonlu onboarding
2. Login Screen - Telefon ile giriş
3. Dashboard - Ana sayfa (match card, quick actions)
4. Matches - Maç listesi
5. Team - Takım kadrosu
6. Profile - Kullanıcı profili
7. Placeholder screens - Diğer ekranlar için

### ✅ Navigation
- Stack Navigation (ekranlar arası)
- Bottom Tab Navigation (4 tab)
- Deep Linking (sahada://match/123)

### ✅ Auth System
- Login/Logout
- Persistent storage (AsyncStorage)
- Mock users (test için)

### ✅ Theme System
- Dark mode
- Color tokens
- Typography scale
- Spacing system

---

## 🎯 Uygulama Akışı

```
1. Welcome Screen
   ↓ [Hemen Başla]
2. Login Screen
   ↓ [Telefon gir + Devam Et]
3. Dashboard (Bottom Tabs)
   ├─ Dashboard Tab
   ├─ Matches Tab
   ├─ Team Tab
   └─ Profile Tab
```

---

## 🔥 Hot Reload

Metro bundler çalışırken:
- **Android**: `R + R` (2 kez R)
- **iOS**: `Cmd + R`
- **Her ikisi**: Metro terminal'de `r`

Değişiklikleri görmek için sayfayı yenilemenize gerek yok!

---

## 📱 Fiziksel Cihazda Test

### Android:
1. USB Debugging aç (Ayarlar → Geliştirici Seçenekleri)
2. USB ile bağla
3. `npm run android`

### iOS (Mac only):
1. Xcode'da proje aç
2. Team seç (Apple ID)
3. Cihazı seç
4. Run (Cmd + R)

---

## 🎊 İlk Çalıştırma Başarılı!

Eğer uygulama başarıyla çalıştıysa göreceksiniz:

✅ **Welcome Screen** - Animasyonlu giriş ekranı  
✅ **Login Screen** - Telefon numarası giriş  
✅ **Dashboard** - Maç kartı, quick actions  
✅ **Bottom Tabs** - 4 tab (Dashboard, Matches, Team, Profile)  

---

## 💡 İpuçları

1. **Metro bundler her zaman açık olmalı**
2. **Emulator başlattıktan sonra bekleyin** (ilk defa 2-3 dk)
3. **Hot reload kullanın** - hızlı geliştirme
4. **Chrome DevTools** - Metro menüden "Debug" seçin

---

## 📞 Yardım

Sorun mu yaşıyorsun?

1. Metro bundler'ı yeniden başlat
2. Cache temizle: `npm start -- --reset-cache`
3. Node modules'u sil: `rm -rf node_modules && npm install`
4. Build temizle (Android): `cd android && ./gradlew clean`

---

**Hazırsın!** 🎉 

Şimdi kodu düzenle ve değişiklikleri anında gör!

```bash
cd mobile
npm start        # Terminal 1
npm run android  # Terminal 2 (veya npm run ios)
```
