# Sahada — Firebase Kurulum Kılavuzu

## 1. Firebase Projesi Oluştur

1. [Firebase Console](https://console.firebase.google.com) → "Add project"
2. Proje adı: `sahada-prod` (veya istediğin ad)
3. Google Analytics: isteğe bağlı

## 2. Firebase Ürünleri Aktif Et

Firebase Console → Proje → Sol panel:

| Ürün | Nasıl |
|------|-------|
| **Authentication** | "Get started" → Sign-in methods → Email/Password → Enable |
| **Firestore** | "Create database" → "Start in test mode" → Region: `europe-west3` |
| **Storage** | "Get started" → "Start in test mode" → Region: `europe-west3` |

## 3. Web App Ekle

Firebase Console → Project Settings → "Add app" → Web (</>) 

Kopyalanan config değerlerini `.env.local`'e yapıştır:

```env
VITE_USE_FIREBASE=true
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=sahada-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sahada-xxx
VITE_FIREBASE_STORAGE_BUCKET=sahada-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

## 4. Firestore Rules Deploy

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # mevcut projeyi seç
firebase deploy --only firestore:rules
```

## 5. Storage Rules Deploy

`storage.rules` dosyasını oluştur:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /proofs/{teamId}/{reservationId}/{userId}/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

```bash
firebase deploy --only storage:rules
```

## 6. Mock Data Seed (opsiyonel)

```bash
# Önce serviceAccountKey.json indir
# Firebase Console → Project Settings → Service accounts → Generate new private key

mv ~/Downloads/serviceAccountKey.json ./serviceAccountKey.json
echo "serviceAccountKey.json" >> .gitignore

npm run seed:firestore
```

## 7. Demo Modu (Firebase olmadan)

```env
# .env.local
VITE_USE_FIREBASE=false
```

Bu modda tüm işlemler in-memory mock data ile çalışır.
Mock data: `constants.ts` dosyasında tanımlı.

## 8. Uçtan Uca Test Akışı

```
Captain flow:
1. WelcomeScreen → Oyuncu → Takım Kur
2. PhoneAuth → 1234 → Ad gir → CaptainDashboard
3. CaptainDashboard → Takım Kur → TeamSetup
4. IBAN ekle → rezervasyon yap → ödeme planı oluştur

Member flow:
1. WelcomeScreen → Oyuncu → Davet Koduyla Katıl
2. PhoneAuth → 1234 → MemberHome
3. MemberMatchDetails → RSVP → Ödeme Bildir → Dekont

Venue Owner flow:
1. LoginScreen → "Saha Sahibi Girişi" → demo: 5000000003
2. VenueOwnerDashboard → Bekleyen onaylar → Onayla/Reddet
3. Logout butonu (sağ üstte)
```

## Değişen/Eklenen Dosyalar

```
src/
  firebase/
    client.ts              ← Firebase init (web)
  data/
    IDataProvider.ts       ← Interface
    MockProvider.ts        ← Mock impl
    FirebaseProvider.ts    ← Firestore impl
    provider.ts            ← Selector
screens/
  PhoneAuth.tsx            ← Overflow fix + 4-box OTP
  MemberMatchDetails.tsx   ← Pro payment panel
  WelcomeScreen.tsx        ← Swipeable redesign
  VenueOwnerDashboard.tsx  ← Logout button added
components/
  PaymentProofModal.tsx    ← Pro dekont (EFT/Nakit/Kapora/Kısmi)
  ProviderBadge.tsx        ← LIVE/DEMO badge
App.tsx                    ← Screen transitions + logout fixes
firestore.rules            ← Security rules
.env.example               ← Env template
FIREBASE_SETUP.md          ← Bu dosya
```
