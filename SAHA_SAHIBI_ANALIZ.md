# 🏟️ SAHA SAHİBİ SİSTEMİ - KAPSAMLI ANALİZ

**Tarih:** 14 Şubat 2026  
**Durum:** Planlama ve İmplementasyon

---

## 📊 MEVCUT DURUM vs İHTİYAÇLAR

### ✅ ŞU ANDA MEVCUT

1. **Venue (Saha) Veri Modeli:**
   - ✅ Temel saha bilgileri (isim, adres, fiyat)
   - ✅ Özellikler (features)
   - ✅ İletişim bilgileri
   - ✅ Organizatör notları (doorCode, contactPerson)
   - ✅ Fiyat geçmişi

2. **Ekranlar:**
   - ✅ VenueList (saha listesi)
   - ✅ VenueDetails (saha detayları)
   - ✅ VenueAdd (yeni saha ekleme)
   - ✅ BookingScreen (rezervasyon yapma)

3. **Temel İşlevler:**
   - ✅ Saha görüntüleme
   - ✅ Saha ekleme (sadece UI)
   - ✅ Rezervasyon yapma (takım tarafından)

---

### ❌ EKSİK OLAN (Saha Sahibi İçin)

#### 1. ROL YÖNETİMİ
- ❌ Saha sahibi rolü yok
- ❌ Saha sahibi yetkileri tanımlı değil
- ❌ Saha sahibi - saha ilişkisi yok

#### 2. REZERVASYON YÖNETİMİ
- ❌ Rezervasyon onaylama/reddetme
- ❌ Rezervasyon takvim görünümü
- ❌ Zaman dilimi yönetimi
- ❌ Doluluk oranı görüntüleme
- ❌ Son dakika rezervasyonları

#### 3. FİYATLANDIRMA
- ❌ Dinamik fiyatlandırma
- ❌ Zaman dilimlerine göre fiyat (prime time)
- ❌ Sezonluk fiyatlar
- ❌ İndirim kampanyaları
- ❌ Paket fiyatlar (10 maç paketi)

#### 4. SAHA YÖNETİMİ
- ❌ Saha durumu (açık/kapalı/bakımda)
- ❌ Kapasite yönetimi
- ❌ Ekipman yönetimi
- ❌ Bakım takvimi
- ❌ Çalışma saatleri

#### 5. FİNANSAL TAKİP
- ❌ Gelir raporu
- ❌ Rezervasyon gelir analizi
- ❌ Ödeme takibi
- ❌ Fatura oluşturma
- ❌ Komisyon hesaplama

#### 6. MÜŞTERİ YÖNETİMİ
- ❌ Takım listesi (müşteriler)
- ❌ Sadık müşteri sistemi
- ❌ Müşteri geçmişi
- ❌ Rating/yorum yönetimi
- ❌ İletişim geçmişi

#### 7. İSTATİSTİKLER
- ❌ Doluluk oranı
- ❌ En çok rezervasyon yapan takımlar
- ❌ Gelir trendleri
- ❌ Peak saatler analizi
- ❌ İptal oranları

#### 8. BİLDİRİMLER
- ❌ Yeni rezervasyon bildirimi
- ❌ İptal bildirimi
- ❌ Ödeme bildirimi
- ❌ Bakım hatırlatıcısı

---

## 🎯 SAHA SAHİBİ USER JOURNEY (Kullanıcı Yolculuğu)

### 1️⃣ KAYIT VE ONBOARDING

```
ADIM 1: Kayıt Ol
- Email/şifre ile kayıt
- Saha sahibi rolü seç
- Telefon doğrulama (SMS)

ADIM 2: Saha Bilgileri
- Saha adı, adres
- Fotoğraflar (min 3)
- Özellikler (duş, otopark, kantin)
- Kapasite (5v5, 7v7, 11v11)

ADIM 3: Fiyatlandırma
- Saat başı fiyat
- Hafta içi/hafta sonu farkı
- Prime time (18:00-22:00)
- İndirimler

ADIM 4: Çalışma Saatleri
- Açılış/kapanış saati
- Tatil günleri
- Özel günler (bayram)

ADIM 5: Ödeme Bilgileri
- Banka hesap no
- IBAN
- Komisyon oranı (%15-20)
```

---

### 2️⃣ GÜNLÜK KULLANIM

```
Dashboard'a Giriş Yap
↓
Bugünkü Durumu Gör
- X rezervasyon
- Y boş saat
- Z₺ tahmini gelir
↓
Yeni Rezervasyon Bildirimi
↓
Rezervasyon Detayı
- Takım: Kuzey Yıldızları
- Tarih/Saat: 15 Şub, 20:00-21:30
- Kişi: 14 kişi
- Tutar: 1.400₺
↓
ONAYLA veya REDDET
↓
Onaylandı → Takıma bildirim
```

---

### 3️⃣ REZERVASYON YÖNETİMİ

```
Rezervasyonlar Ekranı
├─ Bugün (5 rezervasyon)
├─ Bu Hafta (24 rezervasyon)
├─ Bu Ay (88 rezervasyon)
└─ Geçmiş

Her Rezervasyon:
- Durum badge (Onaylı/Bekliyor/İptal)
- Takım bilgileri
- Saat dilimi
- Tutar
- Aksiyonlar (Görüntüle/İptal/İletişim)
```

---

### 4️⃣ TAKVİM GÖRÜNÜMÜ

```
Haftalık Takvim
┌─────────────────────────────────────┐
│  Pzt   Sal   Çar   Per   Cum   Cmt  │
├─────────────────────────────────────┤
│ 08:00 │  ✓  │  ✓  │  -  │  ✓  │  ✓  │
│ 10:00 │  ✓  │  -  │  ✓  │  ✓  │  ✓  │
│ 12:00 │  -  │  -  │  -  │  ✓  │  ✓  │
│ 14:00 │  -  │  ✓  │  -  │  ✓  │  ✓  │
│ 16:00 │  ✓  │  ✓  │  ✓  │  ✓  │  ✓  │
│ 18:00 │  ✓  │  ✓  │  ✓  │  ✓  │  ✓  │ ← Prime Time
│ 20:00 │  ✓  │  ✓  │  ✓  │  ✓  │  ✓  │
│ 22:00 │  ✓  │  -  │  ✓  │  ✓  │  ✓  │
└─────────────────────────────────────┘

✓ = Dolu (Yeşil)
- = Boş (Gri)
⚠ = Bekliyor (Sarı)
🔧 = Bakım (Kırmızı)
```

---

### 5️⃣ FİYATLANDIRMA YÖNETİMİ

```
Fiyat Tablosu
┌──────────────────────────────────┐
│ Zaman Dilimi    │ Hafta İçi │ Hafta Sonu │
├──────────────────────────────────┤
│ 08:00 - 12:00   │   800₺   │   1.000₺   │ (Sabah)
│ 12:00 - 16:00   │   900₺   │   1.100₺   │ (Öğlen)
│ 16:00 - 18:00   │ 1.000₺   │   1.200₺   │ (Akşam)
│ 18:00 - 22:00   │ 1.200₺   │   1.500₺   │ (Prime)
│ 22:00 - 24:00   │ 1.000₺   │   1.200₺   │ (Gece)
└──────────────────────────────────┘

Özel Günler:
- Bayram: +%20
- Şampiyonlar Ligi Günü: +%30
- Yağmur: -%10
```

---

### 6️⃣ FİNANSAL RAPOR

```
Aylık Gelir Raporu (Şubat 2026)
┌─────────────────────────────────┐
│ Toplam Rezervasyon:  45         │
│ Toplam Gelir:        54.000₺    │
│ Komisyon (%15):      -8.100₺    │
│ Net Gelir:           45.900₺    │
├─────────────────────────────────┤
│ Doluluk Oranı:       78%        │
│ Ortalama/Rezerv:     1.200₺     │
│ İptal Oranı:         8%         │
└─────────────────────────────────┘

Haftalık Trend:
Hafta 1: 10.800₺ ████████░░
Hafta 2: 13.500₺ ██████████
Hafta 3: 12.600₺ █████████░
Hafta 4: 17.100₺ ███████████████
```

---

### 7️⃣ MÜŞTERİ YÖNETİMİ

```
En İyi Müşteriler (Bu Ay)
┌───────────────────────────────────┐
│ 🥇 Kuzey Yıldızları  → 8 rezervasyon  │
│ 🥈 Güney Fırtınası   → 6 rezervasyon  │
│ 🥉 Doğu Şampiyonları → 5 rezervasyon  │
└───────────────────────────────────┘

Sadık Müşteri Programı:
- 5 rezervasyon → %5 indirim
- 10 rezervasyon → %10 indirim
- 20 rezervasyon → %15 indirim + Ücretsiz içecek
```

---

### 8️⃣ SAHA DURUMU YÖNETİMİ

```
Saha Durumu
◉ Açık (Normal çalışıyor)
○ Kapalı (Bugün kapalı)
○ Bakımda (Çim yenileniyor)
○ Kısmi Kapalı (Sadece ön saha)

Bakım Takvimi:
- 20 Şubat: Çim bakımı (08:00-12:00)
- 25 Şubat: Aydınlatma tamiri
- 1 Mart: Zemin yenileme
```

---

## 🏗️ VERİ MODELİ GÜNCELLEMELERİ

### 1. Yeni Tipler (types.ts'ye eklenecek)

```typescript
// Saha sahibi rolü
export type PlayerRole = 'admin' | 'member' | 'guest' | 'venue_owner';

// Rezervasyon durumu
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// Saha durumu
export type VenueStatus = 'active' | 'closed' | 'maintenance' | 'partially_available';

// Fiyat tipi
export type PriceType = 'weekday_morning' | 'weekday_afternoon' | 'weekday_prime' | 
                        'weekend_morning' | 'weekend_afternoon' | 'weekend_prime';

// Rezervasyon
export interface Reservation {
  id: string;
  venueId: string;
  teamId: string;
  teamName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // dakika
  price: number;
  status: ReservationStatus;
  participants: number;
  contactPerson: string;
  contactPhone: string;
  notes?: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'cash' | 'credit_card' | 'bank_transfer';
}

// Saha sahibi profili
export interface VenueOwner extends Player {
  role: 'venue_owner';
  venueIds: string[]; // Sahip olduğu sahalar
  businessInfo: {
    companyName?: string;
    taxNumber?: string;
    iban: string;
    bankName: string;
    accountHolder: string;
  };
  commissionRate: number; // %15, %20 gibi
  totalRevenue: number;
  totalReservations: number;
  rating: number; // Saha sahibi değerlendirmesi
  responseTime: number; // Ortalama yanıt süresi (dakika)
}

// Güncellenen Venue
export interface Venue {
  id: string;
  ownerId: string; // Saha sahibinin ID'si
  name: string;
  district: string;
  address: string;
  images: string[]; // Çoklu fotoğraf
  description: string;
  capacity: '5v5' | '7v7' | '11v11' | 'multi';
  
  // Fiyatlandırma
  pricing: {
    weekdayMorning: number;
    weekdayAfternoon: number;
    weekdayPrime: number;
    weekendMorning: number;
    weekendAfternoon: number;
    weekendPrime: number;
  };
  
  // Çalışma saatleri
  workingHours: {
    monday: { open: string; close: string; isClosed: boolean };
    tuesday: { open: string; close: string; isClosed: boolean };
    wednesday: { open: string; close: string; isClosed: boolean };
    thursday: { open: string; close: string; isClosed: boolean };
    friday: { open: string; close: string; isClosed: boolean };
    saturday: { open: string; close: string; isClosed: boolean };
    sunday: { open: string; close: string; isClosed: boolean };
  };
  
  status: VenueStatus;
  rating: number;
  reviewCount: number;
  features: string[];
  phone: string;
  email?: string;
  
  // İstatistikler
  stats: {
    totalReservations: number;
    totalRevenue: number;
    averageRating: number;
    occupancyRate: number; // %78 gibi
    cancelRate: number;
  };
  
  organizerNotes?: {
    doorCode?: string;
    contactPerson: string;
    contactPhone: string;
    lastUpdate: string;
    customNotes: string;
  };
  
  priceHistory?: { date: string; price: number; reason: string }[];
  createdAt: string;
  updatedAt: string;
}

// Saha değerlendirmesi
export interface VenueReview {
  id: string;
  venueId: string;
  teamId: string;
  teamName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  response?: {
    text: string;
    date: string;
  };
}

// Saha istatistikleri
export interface VenueStatistics {
  venueId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: string;
  
  reservations: {
    total: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
  
  revenue: {
    gross: number;
    commission: number;
    net: number;
  };
  
  occupancy: {
    totalSlots: number;
    bookedSlots: number;
    rate: number; // yüzde
  };
  
  peakHours: {
    hour: number;
    reservationCount: number;
  }[];
  
  topTeams: {
    teamId: string;
    teamName: string;
    reservationCount: number;
    totalSpent: number;
  }[];
}
```

---

## 🎨 YENİ EKRANLAR

### 1. VenueOwnerDashboard
```
┌─────────────────────────────────────┐
│  🏟️ Saha Sahibi Dashboard          │
├─────────────────────────────────────┤
│                                      │
│  📊 Bugünün Özeti                   │
│  ├─ 5 Rezervasyon (3 onaylı, 2 bekliyor) │
│  ├─ 12 Boş Saat                     │
│  └─ 6.000₺ Tahmini Gelir            │
│                                      │
│  🔔 Son Bildirimler                 │
│  • Yeni rezervasyon - Kuzey Yıldızları │
│  • İptal - Güney Fırtınası          │
│                                      │
│  📅 Hızlı Aksiyonlar                │
│  [Rezervasyonlar] [Takvim] [Raporlar] │
│                                      │
│  📈 Haftalık Trend                  │
│  [Gelir Grafiği]                    │
│                                      │
└─────────────────────────────────────┘
```

### 2. ReservationManagement
```
┌─────────────────────────────────────┐
│  📋 Rezervasyon Yönetimi            │
├─────────────────────────────────────┤
│  Filtreler: [Tümü] [Bekliyor] [Onaylı] │
│                                      │
│  ⏳ Bekleyen Onay (2)               │
│  ┌─────────────────────────────┐   │
│  │ Kuzey Yıldızları            │   │
│  │ 15 Şub, 20:00-21:30         │   │
│  │ 14 kişi · 1.400₺            │   │
│  │ [ONAYLA] [REDDET]           │   │
│  └─────────────────────────────┘   │
│                                      │
│  ✅ Onaylı Rezervasyonlar (24)     │
│  ┌─────────────────────────────┐   │
│  │ Doğu Şampiyonları           │   │
│  │ 16 Şub, 18:00-19:30         │   │
│  │ 10 kişi · 1.200₺            │   │
│  │ [DETAY] [İLETİŞİM]          │   │
│  └─────────────────────────────┘   │
│                                      │
└─────────────────────────────────────┘
```

### 3. VenueCalendar
```
Haftalık takvim görünümü (yukarıda açıklandı)
```

### 4. VenueFinancialReports
```
Gelir/gider raporları, grafikler
```

### 5. VenueSettings
```
Fiyatlandırma, çalışma saatleri, saha durumu
```

### 6. CustomerManagement
```
Müşteri listesi, sadakat programı
```

---

## 💻 İMPLEMENTASYON PLANI

### AŞAMA 1: Veri Modeli (1 gün)
```typescript
✅ types.ts güncelleme
✅ Reservation interface
✅ VenueOwner interface
✅ Venue güncelleme
✅ VenueStatistics interface
```

### AŞAMA 2: Mock Data (1 gün)
```typescript
✅ Saha sahibi kullanıcı
✅ Rezervasyon mock data
✅ İstatistik mock data
```

### AŞAMA 3: Ekranlar (3-5 gün)
```typescript
✅ VenueOwnerDashboard
✅ ReservationManagement
✅ VenueCalendar
✅ VenueFinancialReports
✅ VenueSettings
```

### AŞAMA 4: İşlevsellik (2-3 gün)
```typescript
✅ Rezervasyon onaylama/reddetme
✅ Fiyat güncelleme
✅ Saha durumu değiştirme
✅ İstatistik hesaplama
```

### AŞAMA 5: Entegrasyon (1-2 gün)
```typescript
✅ Takım rezervasyon akışı
✅ Bildirimler
✅ Navigation
```

**TOPLAM SÜRE:** 8-12 gün

---

## 🎯 ÖNCELİK SIRASI

### 🔴 Kritik (Hemen)
1. Saha sahibi rolü ekleme
2. Rezervasyon veri modeli
3. Temel dashboard
4. Rezervasyon onaylama/red

### 🟠 Yüksek (1 hafta içinde)
5. Takvim görünümü
6. Fiyatlandırma yönetimi
7. Finansal raporlar
8. Bildirim sistemi

### 🟡 Orta (2-3 hafta)
9. Müşteri yönetimi
10. İstatistikler
11. Saha durumu yönetimi
12. İndirim sistemi

### ⚪ Düşük (1+ ay)
13. Sadık müşteri programı
14. Otomatik fiyatlandırma
15. AI önerileri
16. Entegre ödeme

---

## 💰 GELİR MODELİ (Platform İçin)

### Komisyon Yapısı
```
Rezervasyon başına %15-20 komisyon

Örnek:
- Rezervasyon: 1.000₺
- Komisyon (%15): -150₺
- Saha sahibine: 850₺
```

### Abonelik Paketleri (Saha Sahibi İçin)

**🆓 Ücretsiz**
- 1 saha
- %20 komisyon
- Temel özellikler
- Email destek

**💎 Premium - 299₺/ay**
- 3 sahaya kadar
- %15 komisyon
- Gelişmiş raporlar
- WhatsApp destek
- Öncelikli listeleme

**🏆 Pro - 599₺/ay**
- Sınırsız saha
- %12 komisyon
- AI önerileri
- Özel hesap yöneticisi
- Marketing desteği

---

## 📱 MOBİL UYGULAMASI ÖZELLİKLERİ

Saha sahibi için ayrı mobil app:

1. **Hızlı Onay:** Push notification → 1 tık onay
2. **Durum Güncelleme:** Sahayı kapatma
3. **Fiyat Değişikliği:** Anlık fiyat güncellemesi
4. **Mesajlaşma:** Takımlarla direkt iletişim
5. **QR Kod Check-in:** Takım geldiğinde QR okut

---

## 🎉 SONUÇ

**Şu an durum:**
- Saha yönetimi %30 tamamlanmış (sadece görüntüleme)
- Saha sahibi özellikleri %0

**Gerekli çalışma:**
- 8-12 gün (full-time)
- ~40-50 saat kodlama
- ~20 saat test

**Sonuç:**
- Tam özellikli saha sahibi sistemi
- İki taraflı platform (takım + saha sahibi)
- Komisyon gelir modeli

---

**Bir sonraki adım:** Mock data ve temel ekranları oluşturalım! 🚀
