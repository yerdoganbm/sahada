# Sahada App - Yapı ve Kimlik Doğrulama Dokümantasyonu

## 📋 Genel Bakış

`App.tsx` dosyası, Sahada uygulamasının merkezi state yönetimini, kimlik doğrulama (Auth), rol tabanlı yetkilendirme (RBAC) ve navigasyon mantığını içermektedir.

## 🔐 Kimlik Doğrulama Sistemi

### Test Senaryoları

Uygulamada aşağıdaki sabit test senaryoları mevcuttur:

| Giriş | Kullanıcı | Rol | Özellikler |
|-------|-----------|-----|------------|
| `1` | Ahmet Yılmaz | **Admin** | Tüm yönetici yetkilerine sahip, maç oluşturma, finansal raporlar |
| `7` | Burak Yılmaz | **Kaptan** | Kaptan yetkileri, üye özellikleri |
| `2` | Mehmet Demir | **Üye** | Standart üye özellikleri |
| Bilinmeyen | Yeni Kullanıcı | - | `CreateProfile` ekranına yönlendirilir |

### Login Screen Kullanımı

```typescript
// LoginScreen component'inde
<LoginScreen onLogin={handleLogin} />

// handleLogin fonksiyonu:
// - Kullanıcıyı MOCK_PLAYERS içinde arar
// - Bulunan kullanıcının role'üne göre yetkilendirir
// - Bilinmeyen kullanıcıları profil oluşturma sayfasına yönlendirir
```

## 🎯 State Yönetimi

### Ana State'ler

```typescript
// Kullanıcı ve Navigasyon
const [currentUser, setCurrentUser] = useState<Player | null>(null);
const [currentScreen, setCurrentScreen] = useState<ScreenName>('welcome');
const [screenHistory, setScreenHistory] = useState<ScreenName[]>([]);

// Mock Data
const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
const [venues, setVenues] = useState<Venue[]>(MOCK_VENUES);
const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);
const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS);
const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
const [polls, setPolls] = useState<Poll[]>(MOCK_POLLS);

// Ek State'ler
const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('pending');
const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
const [teamProfile, setTeamProfile] = useState<TeamProfile | null>(null);
```

## 🔒 Rol Tabanlı Erişim Kontrolü (RBAC)

### Korumalı Admin Ekranları

Aşağıdaki ekranlara **sadece admin veya partner** kullanıcılar erişebilir:

- `admin` - Admin Dashboard
- `matchCreate` - Maç Oluşturma
- `financialReports` - Finansal Raporlar

```typescript
// RBAC Kontrolü
if (currentUser.role !== 'admin' && currentUser.tier !== 'partner') {
  alert('Bu özelliğe sadece yöneticiler erişebilir.');
  navigateTo('dashboard');
  return null;
}
```

### Korumalı Üye Ekranları

Aşağıdaki ekranlara **giriş yapmış tüm kullanıcılar** erişebilir:

- `dashboard` - Ana Sayfa
- `matches` - Maçlar
- `team` - Takım
- `profile` - Profil
- Ve daha fazlası...

```typescript
// Auth Kontrolü
if (!currentUser) {
  navigateTo('login');
  return null;
}
```

## 🧭 Navigasyon Sistemi

### navigateTo Fonksiyonu

```typescript
const navigateTo = (screen: ScreenName, params?: any) => {
  // 1. RBAC Kontrolü
  // 2. Parametre işleme (matchId, venueId)
  // 3. Geçmiş yönetimi
  // 4. Ekran değişimi
};
```

### goBack Fonksiyonu

```typescript
const goBack = () => {
  // Screen history'den önceki ekrana döner
  // History boşsa, currentUser durumuna göre
  // dashboard veya welcome'a yönlendirir
};
```

## 📱 Ekran Yapısı

### Public Screens (Giriş Gerektirmez)
- `welcome` - Hoşgeldin Ekranı
- `login` - Giriş Ekranı
- `joinTeam` - Takıma Katıl
- `createProfile` - Profil Oluştur
- `teamSetup` - Takım Kurulumu

### Protected Member Screens (Giriş Gerektirir)
- `dashboard` - Ana Sayfa
- `matches` - Maçlar
- `matchDetails` - Maç Detayları
- `team` - Takım Listesi
- `profile` - Profil
- `editProfile` - Profil Düzenle
- `payments` - Ödemeler
- `members` - Üye Yönetimi
- `venues` - Sahalar
- `venueDetails` - Saha Detayları
- `venueAdd` - Saha Ekle
- `lineupManager` - Kadro Yöneticisi
- `squadShare` - Kadro Paylaşım
- `settings` - Ayarlar
- `leaderboard` - Sıralama
- `subscription` - Abonelik
- `polls` - Anketler
- `booking` - Rezervasyon
- `tournament` - Turnuva
- `whatsappCenter` - WhatsApp Entegrasyonu
- `attendance` - Yoklama
- `reserveSystem` - Yedek Sistemi
- `messageLogs` - Mesaj Logları
- `notifications` - Bildirimler

### Protected Admin Screens (Admin/Partner Erişimi)
- `admin` - Admin Dashboard
- `matchCreate` - Maç Oluştur
- `financialReports` - Finansal Raporlar

## 🔄 Data Mutation Handlers

```typescript
// Maç Oluşturma
const handleMatchCreate = (match: Match) => {
  setMatches(prev => [...prev, match]);
  navigateTo('dashboard');
};

// Saha Ekleme
const handleVenueAdd = (venue: Venue) => {
  setVenues(prev => [...prev, venue]);
  goBack();
};

// İşlem Ekleme
const handleTransactionAdd = (transaction: Transaction) => {
  setTransactions(prev => [...prev, transaction]);
};

// Profil Tamamlama
const handleProfileComplete = () => {
  // Yeni kullanıcı oluştur ve dashboard'a yönlendir
};

// Takım Kurulum Tamamlama
const handleTeamSetupComplete = (team: TeamProfile) => {
  setTeamProfile(team);
  navigateTo('dashboard');
};
```

## 🎨 UI Tasarımı

**ÖNEMLİ:** Bu dosyada hiçbir UI tasarımı, CSS sınıfı veya layout yapısı değiştirilmemiştir. Sadece state yönetimi ve koşullu renderlama mantığı eklenmiştir.

## 🔍 Prop Geçişi

Tüm ekranlara gerekli prop'lar standart şekilde geçilmektedir:

```typescript
// Örnek Dashboard prop'ları
<Dashboard 
  onNavigate={navigateTo}
  currentUser={currentUser}
  rsvpStatus={rsvpStatus}
  onRsvpChange={setRsvpStatus}
  transferRequests={transferRequests}
  allMatches={matches}
  allPlayers={players}
  teamProfile={teamProfile}
/>

// Örnek Admin prop'ları
<AdminDashboard 
  onBack={goBack}
  onNavigate={navigateTo}
  currentUser={currentUser}
  joinRequests={joinRequests}
  matches={matches}
  payments={payments}
  players={players}
/>
```

## 🚀 Kullanım Örnekleri

### Test için Giriş Yapma

1. **Admin Olarak Giriş:**
   - Telefon numarası alanına `1` yazın
   - Veya "admin" içeren bir değer yazın

2. **Kaptan Olarak Giriş:**
   - Telefon numarası alanına `7` yazın
   - Veya "kaptan" içeren bir değer yazın

3. **Üye Olarak Giriş:**
   - Telefon numarası alanına `2` yazın

4. **Yeni Kullanıcı:**
   - Bilinmeyen bir değer girin
   - Otomatik olarak profil oluşturma sayfasına yönlendirileceksiniz

### Ekranlar Arası Gezinme

```typescript
// Bir ekrana gitme
onNavigate('matches')

// Parametreli navigasyon
onNavigate('matchDetails', { matchId: 'm1' })

// Geri dönme
onBack()
```

## ✅ Kontrol Listesi

- [x] State Yönetimi (currentUser, currentScreen, screenHistory)
- [x] Kimlik Doğrulama (handleLogin fonksiyonu)
- [x] Sabit Test Senaryoları (ID 1, 7, 2)
- [x] RBAC (admin, matchCreate, financialReports koruma)
- [x] Navigasyon Bağlantıları (tüm ekranlar bağlı)
- [x] Prop Geçişleri (currentUser, navigateTo, goBack)
- [x] Geri Dönüş Mantığı (screenHistory ile)
- [x] UI Tasarımı Korunmuş (hiçbir görsel değişiklik yok)
- [x] Import'lar Korunmuş (tüm ekranlar import edilmiş)

## 📝 Notlar

- Tüm ekranlar `renderScreen()` switch yapısında tanımlanmıştır
- Her protected ekranda auth kontrolü yapılmaktadır
- Admin ekranlarında hem auth hem de role kontrolü vardır
- Navigate fonksiyonu RBAC kontrolünü otomatik yapar
- Screen history ile geri dönüş sistemi çalışmaktadır
- Tüm prop'lar ilgili ekranlara doğru şekilde geçilmektedir

## 🐛 Debug İpuçları

Console'da aşağıdaki logları görebilirsiniz:

```
✅ Yönetici olarak giriş yapıldı: Ahmet Yılmaz
✅ Kaptan olarak giriş yapıldı: Burak Yılmaz
✅ Üye olarak giriş yapıldı: Mehmet Demir
❌ Kullanıcı bulunamadı, profil oluşturma ekranına yönlendiriliyor...
⚠️ Giriş yapmanız gerekiyor!
⚠️ Yetkiniz yok! Sadece yöneticiler erişebilir.
```

---

**Son Güncelleme:** 2026-02-14  
**Versiyon:** 1.0.0
