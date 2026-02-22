# Firestore – Oluşturulacak tablolar (koleksiyonlar) – eksiksiz liste

Sahada mobil uygulaması için Firestore’da **4 koleksiyon** oluşturacaksınız. Hepsi aşağıda alan alan yazılı.

---

## 1. **users** (koleksiyon)

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| name | string | Evet | Kullanıcı adı soyadı |
| phone | string | Hayır* | Telefon (girişte aranır; en az phone veya email biri dolu olmalı) |
| email | string | Hayır | E-posta (girişte aranır) |
| teamId | string | Hayır | Bağlı takım doküman id’si (teams koleksiyonu) |
| role | string | Evet | `admin` \| `member` \| `guest` \| `venue_owner` |
| position | string | Hayır | `GK` \| `DEF` \| `MID` \| `FWD` |
| rating | number | Hayır | 0–10, varsayılan 7 |
| reliability | number | Hayır | 0–100, varsayılan 100 |
| avatar | string | Hayır | Profil fotoğrafı URL |
| isCaptain | boolean | Hayır | Kaptan mı |
| shirtNumber | number | Hayır | Forma numarası 1–99 |
| tier | string | Hayır | `free` \| `premium` \| `partner` |
| createdAt | timestamp | Hayır | Oluşturulma zamanı (serverTimestamp) |

\* Giriş için `phone` veya `email` en az biri dolu olmalı.

---

## 2. **teams** (koleksiyon)

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| name | string | Evet | Takım adı |
| shortName | string | Hayır | Kısa ad (örn. SDT) |
| inviteCode | string | Evet | Davet kodu (benzersiz olmalı) |
| primaryColor | string | Hayır | Ana renk hex (örn. #10B981) |
| secondaryColor | string | Hayır | İkincil renk hex (örn. #0B0F1A) |
| createdAt | timestamp | Hayır | Oluşturulma zamanı (serverTimestamp) |

---

## 3. **venues** (koleksiyon)

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| name | string | Evet | Saha adı |
| location | string | Hayır | Konum / ilçe adı |
| address | string | Hayır | Adres metni |
| pricePerHour | number | Hayır | Saatlik fiyat (TL) |
| rating | number | Hayır | 0–5 puan |
| primaryImageUrl | string | Hayır | Kapak görseli URL (uygulama `image` olarak okur) |
| image | string | Hayır | Alternatif kapak URL |
| features | array | Hayır | Özellik listesi (örn. ["Soyunma", "Duş"]) |
| coordinates | map | Hayır | `latitude` (number), `longitude` (number) |
| createdAt | timestamp | Hayır | Oluşturulma zamanı |

---

## 4. **matches** (koleksiyon)

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| teamId | string | Hayır | Takım doküman id’si (teams) |
| venueId | string | Hayır | Saha doküman id’si (venues) |
| matchDate | string | Evet | Maç tarihi YYYY-MM-DD |
| matchTime | string | Evet | Maç saati (örn. 20:00) |
| date | string | Hayır | matchDate ile aynı (uygulama okurken kullanır) |
| time | string | Hayır | matchTime ile aynı |
| location | string | Hayır | Maç yeri adresi/metin |
| venue | string | Hayır | Saha adı (gösterim için) |
| status | string | Evet | `upcoming` \| `completed` \| `cancelled` |
| score | string | Hayır | Skor (örn. 5-3) |
| pricePerPerson | number | Hayır | Kişi başı ücret |
| capacity | number | Hayır | Kapasite (12, 14 veya 16) |
| waitlistEnabled | boolean | Hayır | Bekleme listesi açık mı |
| attendees | array | Hayır | Her eleman: `{ playerId: string, status: "YES" \| "NO" \| "MAYBE" }` |
| mvpVotes | array | Hayır | Her eleman: `{ playerId: string, voterId: string }` |
| mvpWinner | string | Hayır | MVP kazanan kullanıcı id’si |
| createdAt | timestamp | Hayır | Oluşturulma zamanı (serverTimestamp) |

---

## Özet

| # | Koleksiyon | Açıklama |
|---|------------|----------|
| 1 | **users** | Oyuncular / kullanıcılar (giriş: phone veya email) |
| 2 | **teams** | Takımlar |
| 3 | **venues** | Halı sahalar |
| 4 | **matches** | Maçlar (attendees maça göre bu dokümanda) |

Toplam **4 tablo (koleksiyon)**. Başka koleksiyon yok; uygulama sadece bunları kullanıyor.
