# 📖 Scout Sistemi Kullanım Kılavuzu

## 🎯 Hızlı Başlangıç

### 1️⃣ Scout Dashboard'a Erişim

**Yöntem A: Admin Dashboard'dan**
```
Giriş Yap (Admin) → Dashboard → Hızlı Aksiyonlar → "Scout Merkezi"
```

**Yöntem B: Üye Yönetimi'nden**
```
Dashboard → Admin Panel → Üye Yönetimi → Sağ Üst "Scout" Butonu
```

---

## 🆕 Yeni Aday Ekleme

### Adım Adım:

1. **Scout Dashboard** ekranına git
2. Sağ üstteki **"Aday Ekle"** butonuna tıkla
3. Formu doldur:
   - ✅ **Ad Soyad:** Örn: "Emre Kaya"
   - ✅ **Yaş:** Örn: "22"
   - ✅ **Mevki:** GK / DEF / MID / FWD
   - ✅ **Telefon:** "5XX XXX XX XX"
   - ✅ **Kaynak:** Nereden keşfedildi?
     - Referans (Takım üyesi önerdi)
     - Açık Deneme
     - Turnuva
     - Sosyal Medya
     - Diğer
   - ⚪ **Notlar:** (Opsiyonel) İlk izlenim
4. **"Adayı Ekle"** butonuna tıkla
5. ✅ Başarı mesajı görünür

### Sonuç:
- Oyuncu **"İzleniyor"** (scouting) durumunda **Aday Havuzu**'na eklenir
- 0/3 deneme maçı durumunda başlar

---

## 📝 Scout Raporu Oluşturma

### Ne Zaman Rapor Oluşturulmalı?
- ✅ Oyuncu ilk kez deneme maçında sahaya çıktığında
- ✅ Her 1-2 maçta bir performans güncellemesi
- ✅ Deneme süreci sonunda final değerlendirmesi

### Adım Adım:

#### 🔹 Adım 1: Oyuncu Seçimi
1. Scout Dashboard → **"Rapor Oluştur"** veya
2. Scout Reports ekranına git
3. Değerlendirmek istediğin oyuncuyu seç
   - Sadece `İzleniyor` veya `Deneme` durumundakiler listede
4. **"Devam Et"** butonuna tıkla

#### 🔹 Adım 2: Detaylı Değerlendirme
**A. Teknik Yetenekler**
```
Değerlendirme Ölçeği: 1-10
- 1-3: Zayıf
- 4-6: Orta
- 7-8: İyi
- 9-10: Mükemmel
```

Slider'ları kaydırarak puanla:
- 🎯 Top Kontrolü
- 🎯 Pas
- 🎯 Şut
- 🎯 Dribling
- 🎯 İlk Dokunuş

**B. Fiziksel Özellikler**
- 🏃 Hız
- 💪 Dayanıklılık
- 🔥 Güç
- 🤸 Çeviklik

**C. Zihinsel Özellikler**
- 🧠 Pozisyon Alma
- 🧠 Karar Verme
- 🧠 Oyun Okuma
- 🧠 Çalışkanlık
- 🧠 Takım Oyunu

**D. Potansiyel**
- 🌟 Gelecek potansiyeli (1-10)

💡 **Not:** Genel puan otomatik hesaplanır:
```
Overall = (Teknik × 40%) + (Fiziksel × 30%) + (Zihinsel × 30%)
```

#### 🔹 Adım 3: Öneri & Notlar
1. **Öneri Seç:**
   - 🟢 **Hemen İmzala** → Kesinlikle alınmalı
   - 🟡 **Deneme Uzat** → Daha fazla maç görmeli
   - 🔵 **Daha İzle** → Henüz karar vermek için erken
   - 🔴 **Reddet** → Takıma uygun değil

2. **Güçlü Yönler:** (En az 1 tane)
   - Örn: "Mükemmel pas yeteneği"
   - Örn: "Yüksek çalışkanlık"
   - "+" butonuyla yeni ekle

3. **Zayıf Yönler:** (En az 1 tane)
   - Örn: "Fiziksel güç düşük"
   - Örn: "Hava topu zayıf"

4. **Detaylı Notlar:** (Serbest metin)
   - Maç içi gözlemler
   - Özel durumlar
   - Gelişim önerileri

5. **"Raporu Kaydet"** butonuna tıkla

### Sonuç:
- Rapor oyuncunun profiline eklenir
- Ortalama puan güncellenir
- Admin panelde karar almak için kullanılır

---

## 🎯 Deneme Süreci Yönetimi

### Deneme Başlatma
1. **Aday Havuzu** → Durumu "İzleniyor" olan oyuncu
2. **"Deneme Başlat"** butonuna tıkla (Admin/Kaptan)
3. Durum `in_trial` olarak güncellenir
4. Oyuncu artık maç kadrolarına seçilebilir
5. Varsayılan: 3 deneme maçı hakkı

### Deneme Takibi
**İlerleme Göstergesi:**
```
[▓▓▓▓▓▓░░░░] 2/3 Maç (%66)
```
- Her maç sonrası sayaç otomatik artar
- Progress bar görsel olarak gösterilir

---

## ✅ Karar Verme Süreci

### Ne Zaman Karar Verilir?
- Oyuncu tüm deneme maçlarını tamamladığında (örn: 3/3)
- "Karar Ver" butonu aktif olur

### Adım Adım:

1. **Scout Dashboard** → "Karar Bekleyen Adaylar" bölümü
   - veya **Aday Havuzu** → İlgili oyuncu
2. **"Karar Ver"** butonuna tıkla

3. **Karar Seçenekleri:**
   
   **🟢 İmzala (Sign)**
   - Oyuncu `signed` durumuna geçer
   - Otomatik olarak `players` listesine eklenir
   - Takım kadrosunda görünür hale gelir
   - Artık normal maçlara katılabilir
   
   **🟡 Deneme Süresi Uzat (Extend Trial)**
   - +3 maç ek süre verilir
   - Durum `in_trial` olarak kalır
   - Daha fazla değerlendirme imkanı
   
   **🔴 Reddet (Reject)**
   - Oyuncu `rejected` durumuna geçer
   - Aday havuzundan çıkarılır (arşiv)
   - Takım kadrosuna eklenmez

4. **Karar Notu Yaz:** (Zorunlu)
   - Kararın gerekçesi
   - Örn: "Teknik olarak yeterli ancak fizik gelişmeli"
   - Örn: "Mükemmel performans, hemen imzalandı"

5. **"Kararı Onayla"** butonuna tıkla

### Sonuç:
- Karar oyuncunun profiline kaydedilir
- Kararı veren kişi (Admin ID) loglanır
- Tarih damgası eklenir

---

## 📊 Raporları İnceleme

### Scout Dashboard'da Görüntüleme

**Tab 1: Genel (Overview)**
- Toplam istatistikler
- Karar bekleyen adaylar listesi
- Hızlı aksiyonlar

**Tab 2: Aktif (Active Trials)**
- Deneme sürecindeki oyuncular
- İlerleme durumları (X/3 maç)
- Ortalama puanlar
- Hızlı karar verme

**Tab 3: Raporlar (Reports)**
- Son oluşturulan scout raporları
- Oyuncu adı, scout adı, tarih
- Genel puan ve öneriler
- Güçlü/zayıf yönler özeti

---

## 🎨 Arayüz Renk Rehberi

| Durum | Renk | Badge |
|-------|------|-------|
| İzleniyor | 🔵 Mavi | `İzleniyor` |
| Deneme | 🟡 Sarı | `Deneme` |
| Onaylı | 🟢 Yeşil | `Onaylandı` |
| Reddedildi | 🔴 Kırmızı | `Reddedildi` |
| İmzalandı | 🟣 Mor (Primary) | `İmzalandı` |

---

## 💡 İpuçları & En İyi Uygulamalar

### ✅ Yapılması Gerekenler:
1. **İlk Maçta Rapor Oluştur:** Oyuncu deneme maçına çıktığında hemen rapor tut
2. **Objektif Ol:** Kişisel önyargılardan kaçın, verilerle konuş
3. **Notları Detaylandır:** "İyi oynadı" yerine "Pas başarı oranı %85, pozisyon alma mükemmel"
4. **Güçlü/Zayıf Dengesi:** Her iki tarafı da değerlendir
5. **Potansiyeli Ayrı Değerlendir:** Mevcut performans ≠ Gelecek potansiyeli

### ❌ Yapılmaması Gerekenler:
1. **Tek Maçla Karar Verme:** En az 2-3 maç değerlendirme yap
2. **Aşırı Tolerans:** "Belki gelişir" diye sürekli uzatma
3. **Raporsuz Karar:** Her karar scout raporuyla desteklenmeli
4. **Subjektif Notlar:** "Sevmedim" yerine "Takım oyununa uyum sorunu"

---

## 🔧 Sorun Giderme

### Oyuncu Listede Görünmüyor
- ✅ Durumu kontrol et (sadece `scouting` ve `in_trial` görünür)
- ✅ Filter sekmesini değiştir (All / İzleniyor / Deneme)

### Rapor Oluşturamıyorum
- ✅ Oyuncu deneme sürecinde mi? (in_trial veya scouting)
- ✅ Giriş yapan kullanıcı yetkili mi?

### Karar Ver Butonu Pasif
- ✅ Oyuncu deneme maçlarını tamamladı mı? (X/3 = 3/3)
- ✅ Daha önce karar verilmiş mi? (finalDecision var mı)

### İmzaladığım Oyuncu Kadroda Yok
- ✅ Sayfa yenilendi mi? (F5 veya hard refresh)
- ✅ `players` listesinde kontrol et (Team → Kadro)
- ✅ Console log hatalarını incele

---

## 📱 Mobil Kullanım

Tüm scout ekranları mobil uyumlu tasarlanmıştır:
- ✅ Responsive layout
- ✅ Touch-friendly slider'lar
- ✅ Swipeable tabs
- ✅ Bottom sheet modals
- ✅ Safe area desteği

---

## 📞 Destek

Sorularınız için:
- 📧 Email: support@sahada.app
- 💬 Discord: #scout-system-help
- 📚 Docs: [SCOUT_SYSTEM_DOCUMENTATION.md](./SCOUT_SYSTEM_DOCUMENTATION.md)

---

**Hazırlayan:** Sahada Dev Team
**Versiyon:** 1.0.0
**Tarih:** 2026-02-14
