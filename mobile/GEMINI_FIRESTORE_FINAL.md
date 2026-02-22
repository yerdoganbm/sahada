# Sahada – Firestore Koleksiyonları (Final)

**Amaç:** Mock veri kullanan tüm alanlar Firestore’dan beslenecek. Bu dosyadaki promptu Firebase Console → Ask Gemini’ye yapıştır.

---

## Prompt (Firebase Console Ask Gemini’ye kopyala-yapıştır)

```
Sahada adlı bir halı saha / takım yönetimi uygulaması (mobil + web) için Cloud Firestore veritabanını oluştur. Proje ID'mi kendin kontrol et veya sahada-16b2d kullan.

## ADIM 1: Veritabanı
Eğer Firestore veritabanı yoksa "Create database" ile oluştur (test mode veya production).

## ADIM 2: Koleksiyonları ve dokümanları sırayla oluştur

Aşağıdaki koleksiyonları TAM OLARAK belirtilen alan yapılarıyla oluştur. Her koleksiyon için en az 1 örnek doküman ekle. Önce teams, sonra users (teamId ile), sonra diğerleri.

---

### 1. teams (önce bunu oluştur)
| Alan | Tip | Zorunlu |
|------|-----|---------|
| name | string | evet |
| shortName | string | hayır |
| inviteCode | string | evet |
| primaryColor | string | hayır |
| secondaryColor | string | hayır |
| createdAt | timestamp | hayır |

Örnek doküman: name "Sahada Demo Takım", shortName "SDT", inviteCode "DEMO2025", primaryColor "#10B981", secondaryColor "#0B0F1A"

---

### 2. users
| Alan | Tip | Zorunlu |
|------|-----|---------|
| name | string | evet |
| phone | string | evet (giriş için, benzersiz) |
| email | string | hayır |
| teamId | string | hayır (teams doc id) |
| role | string | evet: "admin" \| "member" \| "guest" \| "venue_owner" |
| position | string | evet: "GK" \| "DEF" \| "MID" \| "FWD" |
| rating | number | hayır (0-10) |
| reliability | number | hayır (0-100) |
| avatar | string | hayır (URL) |
| isCaptain | boolean | hayır |
| tier | string | hayır: "free" \| "premium" \| "partner" |
| shirtNumber | number | hayır |
| createdAt | timestamp | hayır |

Örnek 3 doküman (teamId = ilk teams koleksiyonundaki doc id):

**Doküman 1 – Admin:**
- name: "Demo Admin"
- phone: "05321234567"
- email: "admin@demo.com"
- role: "admin"
- position: "MID"
- rating: 7
- reliability: 100
- teamId: "<teams doc id>"
- avatar: "https://i.pravatar.cc/150?u=admin"
- isCaptain: true
- tier: "premium"

**Doküman 2 – Üye 1:**
- name: "Mehmet Demir"
- phone: "05329876543"
- email: "mehmet@demo.com"
- role: "member"
- position: "FWD"
- rating: 6.5
- reliability: 90
- teamId: "<teams doc id>"
- avatar: "https://i.pravatar.cc/150?u=mehmet"
- shirtNumber: 10
- tier: "free"

**Doküman 3 – Üye 2:**
- name: "Caner Erkin"
- phone: "05335556677"
- email: "caner@demo.com"
- role: "member"
- position: "DEF"
- rating: 7.2
- reliability: 95
- teamId: "<teams doc id>"
- avatar: "https://i.pravatar.cc/150?u=caner"
- shirtNumber: 3
- tier: "free"

---

### 3. venues
| Alan | Tip | Zorunlu |
|------|-----|---------|
| name | string | evet |
| location | string | evet |
| address | string | hayır |
| pricePerHour | number | evet |
| rating | number | hayır (0-5) |
| primaryImageUrl | string | hayır (veya image) |
| features | array | hayır (string[]) |
| ownerId | string | hayır (users doc id) |

Örnek 2 doküman:
- name "Olimpik Halı Saha", location "Kadıköy", address "Fenerbahçe Mah. Kalamış Cad. No:88", pricePerHour 1200, rating 4.8, features ["Otopark","Duş","Kafe"]
- name "Merkez Arena", location "Beşiktaş", pricePerHour 1000, rating 4.5, features ["Duş"]

---

### 4. matches
| Alan | Tip | Zorunlu |
|------|-----|---------|
| teamId | string | hayır |
| venueId | string | hayır |
| matchDate | string | evet (YYYY-MM-DD) |
| matchTime | string | evet (örn "20:00") |
| date | string | hayır (aynı) |
| time | string | hayır (aynı) |
| location | string | hayır |
| venue | string | hayır (saha adı) |
| status | string | evet: "upcoming" \| "completed" \| "cancelled" |
| pricePerPerson | number | hayır |
| capacity | number | hayır (örn 14) |
| attendees | array | hayır: [{ playerId: string, status: "YES"|"NO"|"MAYBE" }] |
| score | string | hayır |
| createdAt | timestamp | hayır |

Örnek 2 doküman (teamId ve venueId yerine kendi doc id'lerini koy):

**Doküman 1 – Yaklaşan maç:**
- matchDate: "2025-02-23"
- matchTime: "20:00"
- date: "2025-02-23"
- time: "20:00"
- location: "Kadıköy"
- venue: "Olimpik Halı Saha"
- status: "upcoming"
- teamId: "<teams doc id>"
- venueId: "<venues doc id>"
- pricePerPerson: 120
- capacity: 14
- attendees: []
- createdAt: (timestamp)

**Doküman 2 – Tamamlanmış maç:**
- matchDate: "2025-02-16"
- matchTime: "21:00"
- date: "2025-02-16"
- time: "21:00"
- location: "Beşiktaş"
- venue: "Merkez Arena"
- status: "completed"
- score: "3-2"
- teamId: "<teams doc id>"
- venueId: "<venues doc id>"
- pricePerPerson: 150
- capacity: 14
- attendees: [
    { playerId: "<users doc id 1>", status: "YES" },
    { playerId: "<users doc id 2>", status: "YES" }
  ]
- createdAt: (timestamp)

---

### 5. join_requests (katılım istekleri)
| Alan | Tip | Zorunlu |
|------|-----|---------|
| teamId | string | evet |
| name | string | evet |
| phone | string | evet |
| position | string | evet: "GK"|"DEF"|"MID"|"FWD" |
| avatar | string | hayır |
| status | string | evet: "pending" \| "approved" \| "rejected" |
| referrerId | string | hayır (öneren user id) |
| createdAt | timestamp | hayır |

Örnek 1 doküman: teamId = teams doc id, name "Ali Veli", phone "05321112233", position "MID", status "pending"

---

### 6. notifications (bildirimler)
| Alan | Tip | Zorunlu |
|------|-----|---------|
| userId | string | hayır (hedef kullanıcı) |
| teamId | string | hayır |
| type | string | evet: "match" \| "payment" \| "squad" \| "social" \| "system" |
| title | string | evet |
| message | string | hayır (veya body) |
| body | string | hayır |
| isRead | boolean | hayır |
| read | boolean | hayır |
| actionScreen | string | hayır (yönlendirme) |
| createdAt | timestamp | hayır |
| time | string | hayır (örn "10 dk önce") |

Örnek 2 doküman:
- type "match", title "Maç hatırlatması", message "Yarın 20:00 maçına 2 saat kaldı.", isRead false
- type "payment", title "Ödeme hatırlatması", message "Bu ayın aidat ödemesi bekleniyor.", isRead true

---

### 7. payments (ödeme kayıtları)
| Alan | Tip | Zorunlu |
|------|-----|---------|
| playerId | string | evet |
| playerName | string | hayır |
| teamId | string | hayır |
| amount | number | evet |
| dueDate | string | hayır |
| status | string | evet: "PAID" \| "PENDING" \| "REFUND" |
| month | string | hayır |
| proofUrl | string | hayır |

Örnek 2 doküman:
- playerId = users doc id, amount 150, status "PAID", month "2025-02"
- playerId = users doc id, amount 150, status "PENDING"

---

### 8. transactions (finansal işlemler – gelir/gider)
| Alan | Tip | Zorunlu |
|------|-----|---------|
| teamId | string | hayır |
| type | string | evet: "income" \| "expense" |
| category | string | hayır: "aidat"|"saha_kirasi"|"ekipman"|"diger"|"gelir" |
| amount | number | evet (negatif = gider) |
| date | string | evet |
| description | string | hayır |
| title | string | hayır |
| status | string | hayır |

Örnek 2 doküman:
- type "income", amount 2100, date "2025-02-12", description "14 Oyuncu Katılımı"
- type "expense", amount -1800, date "2025-02-12", description "Saha Kirası"

---

### 9. polls (anketler)
| Alan | Tip | Zorunlu |
|------|-----|---------|
| teamId | string | hayır |
| question | string | evet |
| options | array | evet: [{ id: string, text: string, votes: number }] |
| totalVotes | number | hayır |
| expiresAt | string | hayır |
| endDate | string | hayır |
| voters | array | hayır (string[]) |
| createdAt | timestamp | hayır |

Örnek 1 doküman: question "Bu haftanın MVP'si kim?", options [{ id:"o1", text:"Ahmet", votes:5 }, { id:"o2", text:"Mehmet", votes:2 }], totalVotes 7

---

### 10. reservations (rezervasyonlar – saha sahibi)
| Alan | Tip | Zorunlu |
|------|-----|---------|
| venueId | string | evet |
| venueName | string | hayır |
| teamName | string | hayır |
| date | string | evet (YYYY-MM-DD) |
| startTime | string | evet |
| endTime | string | evet |
| duration | number | hayır (dakika) |
| price | number | hayır |
| status | string | evet: "pending"|"confirmed"|"completed"|"cancelled" |
| participants | number | hayır |
| contactPerson | string | hayır |
| contactPhone | string | hayır |
| paymentStatus | string | hayır |
| createdAt | timestamp | hayır |

Örnek 1 doküman: venueId = venues doc id, date yarın, startTime "20:00", endTime "21:30", status "pending"

---

### 11. talent_pool (scout – yetenek havuzu)
| Alan | Tip | Zorunlu |
|------|-----|---------|
| teamId | string | hayır |
| name | string | evet |
| position | string | evet |
| contactNumber | string | hayır |
| avatar | string | hayır |
| discoveredBy | string | hayır (user id) |
| discoveredDate | string | hayır |
| source | string | hayır: "referral"|"scout" |
| status | string | hayır: "in_trial"|"pending_approval"|"promoted" |
| trialMatchesPlayed | number | hayır |
| trialMatchesTotal | number | hayır |
| averageScore | number | hayır |
| potentialRating | number | hayır |

Örnek 1 doküman: name "Emre Kaya", position "MID", contactNumber "05327778899", status "in_trial", averageScore 7.3

---

### 12. scout_reports (scout raporları)
| Alan | Tip | Zorunlu |
|------|-----|---------|
| playerId | string | hayır (talent_pool veya users) |
| scoutId | string | hayır |
| scoutName | string | hayır |
| date | string | hayır |
| overallScore | number | hayır |
| potential | number | hayır |
| recommendation | string | hayır |
| strengths | array | hayır (string[]) |
| weaknesses | array | hayır (string[]) |
| detailedNotes | string | hayır |

Örnek 1 doküman: overallScore 7.5, recommendation "sign_now", strengths ["Pas","Çalışkanlık"]

---

### 13. tournament_teams (turnuva takımları – opsiyonel)
| Alan | Tip |
|------|-----|
| name | string |
| logo | string |
| stats | map: { played, won, drawn, lost, gf, ga, points } |

---

### 14. bracket_matches (turnuva fikstür – opsiyonel)
| Alan | Tip |
|------|-----|
| round | string: "quarter"|"semi"|"final" |
| team1 | map |
| team2 | map |
| winnerId | string |
| date | string |

---

## ADIM 3: Referans bağlantıları
- users dokümanlarındaki teamId = teams koleksiyonundaki bir doc id olmalı
- matches dokümanlarındaki venueId = venues doc id, teamId = teams doc id
- join_requests.teamId = teams doc id
- payments.playerId = users doc id

## ADIM 4: Composite index (gerekirse)
users koleksiyonu için: teamId (Ascending) + role (Ascending)
matches koleksiyonu için: teamId (Ascending) + matchDate (Descending)

Tüm koleksiyonları ve örnek dokümanları oluştur. Firebase Console'da adım adım nereye tıklayacağımı, hangi alanları gireceğimi Türkçe anlat. Mümkünse doğrudan koleksiyonları ve dokümanları oluştur.
```

---

## Kısa Özet – Koleksiyon Listesi

| # | Koleksiyon | Kullanıldığı yer |
|---|------------|------------------|
| 1 | teams | Takım kurulumu, davet kodu |
| 2 | users | Giriş, profil, kadro, üye yönetimi |
| 3 | venues | Saha listesi, maç oluşturma |
| 4 | matches | Maçlar, RSVP, MatchDetails |
| 5 | join_requests | MemberManagement – katılım istekleri |
| 6 | notifications | NotificationsScreen |
| 7 | payments | PaymentLedger, DebtList |
| 8 | transactions | FinancialReports |
| 9 | polls | PollsScreen |
| 10 | reservations | VenueOwner, Booking |
| 11 | talent_pool | ScoutDashboard, TalentPool |
| 12 | scout_reports | ScoutReports |
| 13 | tournament_teams | TournamentScreen |
| 14 | bracket_matches | TournamentScreen |

---

## PostgreSQL (CREATE TABLE + INSERT)

`scripts/schema.sql` – tablolar, `scripts/seed-data.sql` – örnek veri:

```bash
createdb sahada
psql -U postgres -d sahada -f scripts/schema.sql
psql -U postgres -d sahada -f scripts/seed-data.sql
```

---

## Seed script ile Firestore yükleme

Firestore’a SQL yerine **seed script** ile veri gönderebilirsin:

1. Proje kökünde: `npm run seed:firestore`
2. Önce **service account** indir: Firebase Console → Proje Ayarları → Service Accounts → **Generate new private key**
3. İndirilen JSON’u proje köküne `service-account.json` olarak kaydet
4. Çalıştır: `npm run seed:firestore`

Tüm örnek veriler (teams, users, venues, matches, join_requests, notifications, payments, transactions, polls) otomatik oluşturulur.

---

## Manuel kullanım (Gemini / Console)

1. Bu dosyadaki **Prompt** bölümünü kopyala
2. Firebase Console → Firestore Database → Ask Gemini
3. Promptu yapıştır, çalıştır
4. Proje ID'ni (sahada-16b2d) kendi projenle değiştir
5. Gemini oluşturduktan sonra mobil uygulama Firestore'dan veri çekecek; mock veri kaldırılacak
