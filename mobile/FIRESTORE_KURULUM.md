# Firestore kurulumu – Mock veri yok, tüm veri Firestore’da

Uygulama artık **Firebase Firestore** kullanıyor; mock veri veya harici API yok. Giriş, takım, maç ve saha verileri Firestore’dan okunup yazılıyor.

---

## 1. Firebase Console

1. [Firebase Console](https://console.firebase.google.com) → Projenizi seçin (örn. **sahada-16b2d**).
2. Sol menüden **Build** → **Firestore Database** → **Create database** (yoksa).
3. **Test mode** ile başlayın (geliştirme için); production’da kuralları sıkılaştırın.
4. **Rules** sekmesine gidin; `mobile/firestore.rules` dosyasındaki kuralları yapıştırın (veya kendi kurallarınızı yazın).

---

## 2. Koleksiyonlar

Firestore’da aşağıdaki koleksiyonlar kullanılıyor. İlk veriyi elle veya script ile ekleyebilirsiniz.

### users

| Alan       | Tip     | Açıklama                    |
|-----------|---------|-----------------------------|
| name      | string  | Ad soyad                    |
| phone     | string  | Telefon (giriş için aranır) |
| email     | string? | E-posta                     |
| teamId    | string? | Bağlı takım doc id          |
| role      | string  | admin, member, guest        |
| position  | string  | GK, DEF, MID, FWD           |
| rating    | number  | 0–10                        |
| reliability | number | 0–100                       |
| avatar    | string? | URL                         |
| isCaptain | boolean? |                             |

### teams

| Alan        | Tip    |
|-------------|--------|
| name        | string |
| shortName   | string? |
| inviteCode  | string |
| primaryColor | string? |
| secondaryColor | string? |

### matches

| Alan           | Tip    |
|----------------|--------|
| teamId         | string? |
| venueId        | string? |
| matchDate      | string (YYYY-MM-DD) |
| matchTime      | string |
| location       | string? |
| venue          | string? |
| status         | string (upcoming, completed, cancelled) |
| pricePerPerson | number? |
| capacity       | number? |
| attendees      | array (örn. [{ playerId, status: 'YES'\|'NO'\|'MAYBE' }]) |

### venues

| Alan          | Tip     |
|---------------|---------|
| name          | string  |
| location      | string? |
| address       | string? |
| pricePerHour  | number? |
| rating        | number? |
| primaryImageUrl | string? |
| features      | array?  |

---

## 3. İlk veri (test için)

Firebase Console → Firestore → **Start collection**:

1. **venues** koleksiyonu: Bir doküman ekleyin (örn. id otomatik), alanlar: `name`, `location`, `pricePerHour`, `rating`.
2. **teams** koleksiyonu: Bir takım ekleyin; doc id’yi kopyalayın (örn. `team1`).
3. **users** koleksiyonu: Bir kullanıcı ekleyin; `name`, `phone` (örn. `05321234567`), `teamId` (yukarıdaki takım id), `role: admin`, `position: MID`, `rating: 7`, `reliability: 100`.
4. **matches** (isteğe bağlı): `teamId`, `venueId`, `matchDate`, `matchTime`, `status: upcoming`, `attendees: []`.

Bu telefon numarasıyla uygulamada giriş yapabilirsiniz.

---

## 4. Index (gerekirse)

Sorgular “teamId + matchDate” gibi bileşik kullanıyorsa Firestore hata mesajında index linki verir. Linke tıklayıp index’i oluşturun.

---

## 5. iOS Developer hesabı

**Firestore ve giriş için iOS Developer hesabı gerekmez.** Sadece push bildirimleri (APNs) için Apple Developer hesabı istenir. Veritabanı ve kimlik doğrulama tamamen Firebase üzerinden çalışır.
