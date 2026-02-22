# Push bildirimleri (FCM / APNs)

**Firebase’i sıfırdan kuracaksanız:** Adım adım kurulum için **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** dosyasını kullanın.

---

## Backend

- **POST /api/push-tokens** – Body: `{ "token": "...", "platform": "ios" | "android" }`. Giriş gerekli (Bearer token veya X-User-Id).
- Token’lar MongoDB `push_tokens` koleksiyonunda saklanır.

## Mobil kurulum

### 1. Firebase projesi

1. [Firebase Console](https://console.firebase.google.com) → Proje oluştur.
2. Android ve iOS uygulamalarını ekleyin (paket adı / bundle ID: `com.sahada.app` veya sizin değeriniz).
3. Android: `google-services.json` indirip `mobile/android/app/` içine koyun.
4. iOS: `GoogleService-Info.plist` indirip Xcode projesine ekleyin; APNs key veya sertifika yapılandırın.

### 2. Bağımlılıklar (zaten var)

- `@react-native-firebase/app`
- `@react-native-firebase/messaging`
- `@notifee/react-native` (yerel bildirimler)

### 3. Token’ı backend’e gönderme

Giriş yaptıktan sonra FCM token’ı alıp API’ye kaydedin:

```ts
import messaging from '@react-native-firebase/messaging';
import { registerPushToken } from './src/services/push';

// İzin iste (iOS)
const authStatus = await messaging().requestPermission();

if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
  const token = await messaging().getToken();
  await registerPushToken(token);
}
```

Bu çağrıyı `AuthContext` içinde `user` set edildikten sonra veya `App.tsx`’te yapabilirsiniz.

### 4. Deep link (bildirim tıklama)

`linking.ts` zaten tanımlı:

- `sahada://match/:matchId` → Maç detayı
- `sahada://venue/:venueId` → Saha detayı
- `sahada://user/:userId` → Profil

Bildirim payload’ında `data` ile bu path’leri gönderin; React Navigation Linking ilgili ekrana açar.

### 5. Arka planda bildirim

- Android: Notifee veya FCM ile arka plan handler.
- iOS: APNs + `messaging().onMessage()` / `onNotificationOpenedApp`.

Detay için: [React Native Firebase – Messaging](https://rnfirebase.io/messaging/usage).
