# Sahada – Mimari Harita, Issue Listesi ve Fix Roadmap

## Tech stack tespiti

- **Ana uygulama:** React 19 + Vite 6 + TypeScript (web, mobile-responsive).
- **Native mobil:** `mobile/` altında React Native (Expo değil) yapısı var; ana ürün akışı şu an web (Vite) üzerinde.
- **Backend:** Express.js + MongoDB (server/, src/api/client.ts).
- **State:** Merkezi state App.tsx içinde (useState), store/ veya Redux yok.
- **Routing:** Programatik tek ekran state’i (`currentScreen` + `screenHistory`), URL/router yok.

Bu doküman ve P0 fix’ler web (Vite) codebase’ine göre yazıldı.

---

## A) Architecture map (1 sayfa)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SAHADA (Web – Vite)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ENTRY                                                                       │
│  index.html → index.tsx → App.tsx                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  NAVIGATION (in-app, no URL router)                                          │
│  • navigateTo(screen, params?) → setCurrentScreen; params: matchId, venueId,  │
│    reservationDetailsId → setMatchDetailsId etc.                              │
│  • goBack() → pop screenHistory; clear detail IDs when leaving match/venue   │
│  • ScreenName: welcome | login | dashboard | matchDetails | team | ...        │
├─────────────────────────────────────────────────────────────────────────────┤
│  STATE (single source of truth – App.tsx)                                    │
│  • currentUser, currentScreen, screenHistory                                 │
│  • matchDetailsId, venueDetailsId, reservationDetailsId                     │
│  • matches, venues, players, payments, transactions, polls, reservations   │
│  • rsvpStatus (global), joinRequests, transferRequests, teamProfile          │
│  • Data mutations: setMatches, setPlayers, handleRsvpChange, ...             │
├─────────────────────────────────────────────────────────────────────────────┤
│  API LAYER                                                                   │
│  • src/api/client.ts – ApiClient (fetch), getPlayers, getMatches, ...        │
│  • Not wired in App.tsx: app uses MOCK_* from constants.ts only              │
│  • server/api-server.ts – Express REST; server/db/mongodb.ts                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  STORAGE / AUTH                                                              │
│  • No persistent auth: currentUser in memory only (logout = clear state)     │
│  • No localStorage/sessionStorage for user or tokens in web app              │
│  • mobile/ uses AsyncStorage (AuthContext)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  NOTIFICATION                                                                │
│  • In-app: NotificationsScreen; no push, no deep link handling in web        │
│  • mobile/: linking.ts for deep links (sahada://match/:matchId)              │
├─────────────────────────────────────────────────────────────────────────────┤
│  CORE DOMAIN FLOWS                                                           │
│  • Match: Dashboard → match card click → matchDetails (matchId);             │
│    MatchCreate (admin) → handleCreateMatch → setMatches; MatchDetails RSVP   │
│  • Attendance: handleRsvpChange(matchId, status) → match.attendees updated   │
│  • Roster: MatchDetails RosterView (squad/waitlist from allPlayers);         │
│    LineupManager; no explicit “lock roster” or “last-minute change” UI      │
│  • Payment: PaymentLedger, payments state; status paid|pending|failed|refund  │
│  • Group: TeamList, MemberManagement, joinRequests, teamProfile               │
│  • Notification: NotificationsScreen (list only); no push/deep link           │
└─────────────────────────────────────────────────────────────────────────────┘

  DATA FLOW (simplified):
  User action → navigateTo / handler in App → setState (matches, players, …)
  → renderScreen() → pass state + handlers to screen components (Dashboard,
  MatchDetails, …). No API calls from App today; API client exists but unused.
```

---

## B) Issue list (Severity | Problem | Etki | Dosya(lar) | Önerilen fix)

| Severity | Problem | Etki | Dosya(lar) | Önerilen fix |
|----------|---------|------|------------|--------------|
| **P0** | Dashboard maç kartı `onNavigate('matchDetails', { id: nextMatch.id })` ile gidiyor; App sadece `params?.matchId` okuyor. | Ana sayfadan maç kartına tıklanınca matchDetailsId set edilmiyor, kullanıcı tekrar dashboard’a düşüyor. | screens/Dashboard.tsx (büyük kart onClick) | Paramı `{ matchId: nextMatch.id }` yap. **YAPILDI.** |
| **P0** | MatchDetails’te `match` bulunamazsa (geçersiz id veya boş liste) `allMatches[0]` undefined olabilir, `match.status` vb. crash. | Geçersiz/deleted match veya boş liste → runtime crash. | screens/MatchDetails.tsx | `match` null/undefined ise erken return ile “Maç bulunamadı” + Geri Dön. **YAPILDI.** |
| **P0** | goBack() matchDetails/venueDetails’ten çıkarken detail ID’leri temizlemiyor. | Stale state: sonra başka maça gidilince eski id kalabilir veya yanlış detay gösterilir. | App.tsx (goBack) | goBack içinde currentScreen matchDetails/venueDetails/reservationDetails ise ilgili setMatchDetailsId/setVenueDetailsId/setReservationDetailsId(null). **YAPILDI.** |
| **P1** | navigateTo'da params.id kullanılıyor (Dashboard); App matchId/venueId bekliyor. Param adı tutarsız. | Sadece Dashboard’da id vardı; diğer yerler matchId. Param adı standardize edilmeli. | screens/Dashboard.tsx | matchDetails için her yerde `matchId` kullan (yukarıdaki P0 fix). |
| **P1** | matchDetailsId set edilmeden matchDetails ekranı açılırsa (örn. deep link) App hemen dashboard’a yönlendiriyor; matchId validate edilmiyor. | Geçersiz matchId ile URL/deep link gelirse sadece dashboard’a atıyor, kullanıcıya “maç bulunamadı” mesajı yok. | App.tsx (case 'matchDetails') | Zaten MatchDetails içinde null guard eklendi; App tarafında opsiyonel: matchId formatı kontrolü. |
| **P1** | API client kullanılmıyor; tüm veri constants’tan. | Gerçek backend’e geçişte büyük refactor; network hata/retry/loading yok. | App.tsx, constants.ts, src/api/client.ts | Aşamalı: önce matches/players için API’yi çağır, loading/error state ekle; fallback mock. |
| **P1** | handleRsvpChange’de currentUser null kontrolü var ama match bulunamazsa state güncellenmiyor (sessiz fail). | RSVP tıklanır ama maç yoksa kullanıcı bilgilendirilmez. | App.tsx (handleRsvpChange) | Match bulunamazsa toast/alert veya MatchDetails’te zaten null guard var. |
| **P2** | MatchCreate’te kapasite (12/14/16) seçimi yok; sabit 14 kullanılıyor. | Domain kuralı (kapasite 12/14/16) UI’da yok. | screens/MatchCreate.tsx, types (Match.capacity) | Match’e capacity ekle (types’ta var); MatchCreate form’a capacity select ekle. |
| **P2** | RSVP’de “cancelled” tipi types’ta yoktu; iptal sonrası durum. | Sonradan iptal için ayrı state yok. | types.ts (RsvpStatus) | RsvpStatus’a 'cancelled' ekle. **YAPILDI.** |
| **P2** | Payment status’ta 'refund' yok. | Domain: PAID/PENDING/REFUND. | types.ts (Payment.status) | Payment.status’a 'refund' ekle. **YAPILDI.** |
| **P2** | Büyük listeler (players, matches) için FlatList/virtualization yok; web’de uzun listeler re-render. | 50+ oyuncu/maçta performans. | screens/TeamList, Match list, MatchCreate (players) | Web: virtualization (react-window) veya pagination; liste boyutu sınırla. |
| **P2** | Form validation: MatchCreate’te sadece alert; fiyat negatif, tarih geçmiş vb. | Hatalı maç oluşturulabilir. | screens/MatchCreate.tsx | Tarih min=today, price > 0, venueId required; hata mesajı inline/toast. |
| **P2** | Offline/cache yok. | Maç günü bağlantı koparsa veri görünmez. | - | Service worker (var ama dev’de kapalı); IndexedDB veya localStorage cache; sync sonrası. |
| **P2** | console.log’da kullanıcı adı, matchId vb. | Hassas veri log’da. | App.tsx, MatchDetails, vb. | Production’da log’ları kaldır veya env’e göre kapat. |
| **P2** | .env / secret’lar: API key, MongoDB URI dokümante ama client’ta VITE_ kullanımı sınırlı. | Yanlış kullanımda sızıntı riski. | .env.example, src/api/client.ts | Backend key’leri sadece server’da; client sadece VITE_* ; dokümante et. |

---

## C) Fix roadmap

### 1 haftalık sprint (P0 + kritik P1)

- **Gün 1–2:**  
  - P0: Dashboard matchDetails param `id` → `matchId`.  
  - P0: MatchDetails null match guard + “Maç bulunamadı” ekranı.  
  - P0: goBack’te matchDetailsId / venueDetailsId / reservationDetailsId temizleme.  
  - Domain: types’ta RsvpStatus ’cancelled’, Payment ’refund’, Match capacity (MatchCapacity 12|14|16).  
- **Gün 3:**  
  - Param validasyonu: matchDetails’e geçerli matchId gelmezse (deep link/manuel) MatchDetails içi guard ile “Maç bulunamadı” (zaten var).  
  - RSVP’de match bulunamazsa kullanıcıya bilgi (toast/alert).  
- **Gün 4:**  
  - MatchCreate’te kapasite (12/14/16) alanı ekleme ve Match’e kaydetme.  
- **Gün 5:**  
  - Test: Ana sayfa maç kartı → detay; geri → başka maç; geçersiz id; goBack sonrası doğru detay.

### 2 haftalık sprint (P1/P2)

- **Hafta 1:**  
  - API entegrasyonu: matches/players için API client kullanımı, loading/error state.  
  - MatchCreate form validation (tarih, fiyat, saha).  
- **Hafta 2:**  
  - Büyük listelerde performans (pagination veya virtualization).  
  - Offline: service worker + basit cache stratejisi.  
  - Log’ları production’da kapatma / env kontrolü.

---

## D) PR-ready değişiklik özeti ve nasıl test edilir

### 1) P0 – Dashboard matchDetails parametresi (YAPILDI)

- **Dosya:** `screens/Dashboard.tsx`  
- **Değişiklik:** Büyük maç kartı onClick’te `onNavigate('matchDetails', { id: nextMatch.id })` → `onNavigate('matchDetails', { matchId: nextMatch.id })`.
- **Test:**  
  1. Giriş yap (örn. 1).  
  2. Ana sayfada “Bugün” maç kartına tıkla.  
  3. Beklenen: Maç detay sayfası açılır (RSVP, kadro, sohbet görünür).  
  4. Önceki hata: Detay açılmaz, anında dashboard’a dönülürdü.

### 2) P0 – MatchDetails null match crash (YAPILDI)

- **Dosya:** `screens/MatchDetails.tsx`  
- **Değişiklik:**  
  - `const match = allMatches.find(...) ?? allMatches[0] ?? null;`  
  - `if (!match) { return ( ... "Maç bulunamadı" + Geri Dön butonu ); }`
- **Test:**  
  1. Geçersiz matchId ile ekrana gitmek için geçici olarak Dashboard’da `onNavigate('matchDetails', { matchId: 'invalid_id' })` yap veya App’te matchDetailsId’yi 'invalid_id' yap.  
  2. Beklenen: “Maç bulunamadı” mesajı ve “Geri Dön” butonu.  
  3. Geri Dön ile dashboard’a dönülmeli.

### 3) P0 – goBack’te detail ID’leri temizleme (YAPILDI)

- **Dosya:** `App.tsx` (goBack)  
- **Değişiklik:** goBack’in başında:  
  - `if (currentScreen === 'matchDetails') setMatchDetailsId(null);`  
  - `if (currentScreen === 'venueDetails') setVenueDetailsId(null);`  
  - `if (currentScreen === 'reservationDetails') setReservationDetailsId(null);`
- **Test:**  
  1. Maçlar listesinden Maç A’ya gir → detay.  
  2. Geri dön → Maçlar listesi.  
  3. Maç B’ye gir.  
  4. Beklenen: Maç B’nin detayı görünür (Maç A’nın değil).  
  5. Aynı akışı venueDetails için dene (varsa).

### 4) Domain tipleri (YAPILDI)

- **Dosya:** `types.ts`  
- **Değişiklikler:**  
  - `RsvpStatus`: `'cancelled'` eklendi.  
  - `Match`: `capacity?: MatchCapacity` (12|14|16) ve `MatchCapacity` tipi eklendi.  
  - `Payment.status`: `'refund'` eklendi.  
- **Test:**  
  - TypeScript build: `npm run build` hatasız olmalı.  
  - Mevcut kullanımlar (RsvpStatus, Payment.status, Match) değişmediği için UI davranışı aynı kalır; ileride cancelled/refund/capacity kullanılabilir.

---

## Domain kuralları (varsayılan – mevcut koda uyumlu)

- **Match kapasitesi:** 12 | 14 | 16 seçilebilir (types’ta `MatchCapacity` ve `Match.capacity` eklendi; UI’da MatchCreate’e alan eklenebilir).  
- **Attendance:** YES / NO / MAYBE / CANCELLED (RsvpStatus’a `'cancelled'` eklendi).  
- **Kadro dolunca:** WAITLIST (MatchDetails’te squad/waitlist zaten var; kapasite Match.capacity ile ileride 12/14/16’ya bağlanabilir).  
- **Payment:** PAID / PENDING / REFUND (Payment.status’a `'refund'` eklendi).

Bu doküman ve yapılan değişiklikler UI’yı bozmadan, mevcut ekran akışına uyacak şekilde yapıldı.
