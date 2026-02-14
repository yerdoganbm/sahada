# 🧪 SAHADA - Test Senaryoları

Bu dokümantasyon, uygulamanın tüm iş mantıklarını test etmek için hazırlanmış **rol bazlı** test senaryolarını içerir.

---

## 🎭 Test Kullanıcıları (Mock Data)

| Rol | Giriş ID | İsim | Yetkiler |
|-----|----------|------|----------|
| **Admin** | `1` | Ahmet Yılmaz | Tüm yetkiler |
| **Kaptan** | `7` | Mehmet Demir | Kadro, maç oluşturma |
| **Üye** | `2` | Can Öztürk | RSVP, profil |
| **Yeni Kullanıcı** | `999` | - | Profil oluşturma |

---

## 📱 TEST SENARYOSU 1: KURUCU & ADMİN (Yönetim Odaklı)

### 🎯 Amaç
Admin'in takım kurması, finansal işlemler yapması ve üye yönetimi yapabildiğini doğrulama.

### 📋 Adımlar

#### **A) Takım Kurulumu**
1. **Giriş Yap**
   - Login ekranında ID: `999` gir
   - ✅ **Beklenen:** `CreateProfile` ekranına yönlendirilmeli

2. **Takım Oluştur**
   - "Hemen Başla" butonuna tıkla
   - Takım adı: `Kuzey Yıldızları`
   - Kısaltma: `KZY`
   - Ana renk: `Yeşil (#10B981)`
   - İkincil renk: `Siyah (#000000)`
   - "Takımı Oluştur" butonuna tıkla
   - ✅ **Beklenen:** Dashboard'a yönlendirilmeli ve üstte **"KUZEY YILDIZLARI"** yazısı görünmeli

#### **B) Finansal İşlemler**
3. **Gelir Ekle**
   - Dashboard'da "Yönetim" → "Finansal Raporlar"
   - **"Gelir Ekle"** (yeşil) butonuna tıkla
   - Gelir Kaynağı: `Üye Aidatı`
   - Tutar: `500`
   - Tarih: `15 Şub 2026`
   - "Kaydet"
   - ✅ **Beklenen:** Kasa bakiyesi artmalı, işlem listesine eklenip **yeşil** (+₺500) görünmeli

4. **Gider Ekle**
   - **"Gider Ekle"** (kırmızı) butonuna tıkla
   - Ödeme Başlığı: `Halı Saha Kirası`
   - Tutar: `1200`
   - "Kaydet"
   - ✅ **Beklenen:** Kasa bakiyesi azalmalı (-₺1200), işlem listesinde **kırmızı** gözükmeli
   - ✅ **Net Bakiye:** +500 -1200 = **-700 TL** olmalı

#### **C) Üye Yönetimi**
5. **Üye Katılım İsteği Onaylama**
   - Dashboard → "Üyeler" (Hızlı İşlemler)
   - "Bekleyen İstekler" bölümüne scroll
   - **"Ali Veli"** için "Onayla" butonuna tıkla
   - ✅ **Beklenen:** 
     - `Ali Veli` oyuncular listesine eklenmeli
     - Bekleyen istekler sayısı 1 azalmalı

6. **Referanslı Oyuncu Önerisi - Admin Onayı**
   - Çıkış yap (Settings → Logout)
   - ID `2` ile giriş yap (Üye)
   - "Üyeler" → "Tanıdığın Birini Öner"
   - Ad: `Test Misafir`
   - Telefon: `0555 123 4567`
   - Mevki: `FWD`
   - Puan: `7`
   - "Gönder"
   - ✅ **Beklenen:** Alert: "Test Misafir başarıyla önerildi!"
   
7. **Admin Aday Havuzunda Görme**
   - Çıkış yap, ID `1` ile admin girişi
   - "Yönetim" → "Admin Paneli"
   - "Aday Havuzu" bölümüne scroll
   - ✅ **Beklenen:** 
     - **Test Misafir** "ONAY BEKLİYOR" badge'i ile görünmeli
     - Öneren: **Can Öztürk** yazmalı

8. **Deneme Sürecini Başlat**
   - **Test Misafir** için "Deneme Başlat" butonuna tıkla
   - ✅ **Beklenen:** 
     - Badge "DENEME" olmalı
     - "Eleme" ve "Asil Üye Yap" butonları gözükmeli

9. **Asil Üye Yapma**
   - "Asil Üye Yap" butonuna tıkla
   - ✅ **Beklenen:** 
     - Alert: "Tebrikler! Oyuncu artık takımın resmi bir üyesi."
     - Test Misafir listeden kaybolmalı (artık aday değil)
   - "Üyeler" sayfasına git
   - ✅ **Doğrulama:** Test Misafir oyuncular listesinde gözükmeli

---

## ⚽ TEST SENARYOSU 2: TAKIM KAPTANI (Sahada Odaklı)

### 🎯 Amaç
Kaptanın maç oluşturma, kadro kurma ve maç sonucu girme yetkilerini test etme.

### 📋 Adımlar

#### **A) Maç Oluşturma**
1. **Login**
   - ID: `7` (Mehmet Demir - Kaptan)

2. **Yeni Maç Ekle**
   - Dashboard → "Maç Oluştur"
   - **Adım 1: Detaylar**
     - Tarih: Bugünden 3 gün sonra seç
     - Saat: `21:00`
     - Saha: `Altınordu Tesisleri`
     - Kişi Başı: `120`
     - Rakip: `Efsaneler FC`
     - "Devam Et"
   
3. **Kadro Seçimi**
   - **Adım 2: Kadro**
     - En az 8 oyuncu seç (checkbox'ları tıkla)
     - ✅ **Doğrulama:** Üstte "X Seçildi" sayısı artmalı
     - "Devam Et"
   
4. **Önizleme ve Kaydet**
   - **Adım 3: Onay**
     - Maç özeti ekranda gözükmeli:
       - Tarih/Saat
       - Saha: Altınordu Tesisleri
       - Davetli: X oyuncu
       - Kişi Başı: ₺120
     - "Maçı Yayınla" butonuna tıkla
   - ✅ **Beklenen:** 
     - Alert: "Maç başarıyla oluşturuldu! X oyuncuya bildirim gönderildi."
     - Dashboard'a dönülmeli
     - Yeni maç "Yaklaşan Maçlar" listesinde gözükmeli

#### **B) Kadro Oluşturma**
5. **Lineup Manager**
   - Dashboard → "Kadro Oluştur"
   - ✅ **Beklenen:** Saha görünümünde 14 oyuncu yerleşmiş olmalı
   - **Taslak B**'ye tıkla
   - ✅ **Doğrulama:** Kadro değişmeli, "Ofansif Ağırlıklı" yazısı görünmeli
   - **Taslak A**'ya geri dön
   - ✅ **Doğrulama:** "Dengeli (Önerilen)" görünmeli

6. **Güç Dengesi Kontrolü**
   - Sayfayı aşağı kaydır
   - ✅ **Beklenen:** 
     - "Güç Dengesi" bölümünde iki bar görünmeli
     - Takım A ve Takım B skorları görünmeli

#### **C) Maç Sonucu Girme**
7. **Maç Detayına Git**
   - Geri dön Dashboard'a
   - Oluşturduğun maça tıkla (veya herhangi bir "upcoming" maça)
   
8. **Skor Gir (Sadece Admin/Kaptan)**
   - ✅ **Kontrol:** "Maç Sonucunu Gir" butonu görünmeli (sarı)
   - Butona tıkla
   - Modal açılmalı
   - Ev Sahibi: `5`
   - Deplasman: `3`
   - "Kaydet"
   - ✅ **Beklenen:** 
     - Alert: "Maç sonucu kaydedildi!"
     - Modal kapanmalı
     - "Sonuç" alanında **5-3** gözükmeli

---

## 👤 TEST SENARYOSU 3: OYUNCU (Katılım Odaklı)

### 🎯 Amaç
Oyuncunun RSVP yapabilmesi, profil güncelleyebilmesi ve ödeme işlemlerini test etme.

### 📋 Adımlar

#### **A) RSVP (Maça Katılım)**
1. **Login**
   - ID: `2` (Can Öztürk - Üye)

2. **Maç Detayına Git**
   - Dashboard'da bir maça tıkla (upcoming olanlardan)

3. **"Katılıyorum" Seç**
   - **"Katılıyorum"** butonuna tıkla (yeşil olmalı)
   - ✅ **Beklenen:** 
     - Buton yeşil highlight olmalı
     - "Kadro Durumu" bölümünde sayı artmalı (örn: 11/14 → 12/14)
   
4. **Durumu Değiştir**
   - **"Katılmıyorum"** butonuna tıkla
   - ✅ **Beklenen:** 
     - Kırmızı highlight
     - Kadro sayısı azalmalı (12/14 → 11/14)
   
5. **"Belki" Seç**
   - **"Belki"** butonuna tıkla
   - ✅ **Doğrulama:** Belki butonu highlight olmalı

#### **B) Profil Güncelleme**
6. **Profil Sayfasına Git**
   - Header'da profil fotoğrafına tıkla (veya Dashboard → Hızlı İşlemler → "Profilim")

7. **Profil Düzenle**
   - "Profili Düzenle" butonuna tıkla
   - Ad: `Can Yeni Öztürk`
   - Mevki: `GK` → `DEF` olarak değiştir
   - Puan: `7.5` → `8.0`
   - "Kaydet"
   - ✅ **Beklenen:** 
     - Profil sayfasına dönülmeli
     - Yeni ad: **Can Yeni Öztürk**
     - Mevki badge: **DEF**
     - Puan: **8.0**

8. **Değişikliklerin Kadro'da Yansıması**
   - Dashboard → "Kadro Oluştur" (veya herhangi bir maçın kadrosuna git)
   - ✅ **Doğrulama:** Can Yeni Öztürk'ün mevkisi **DEF** ve puanı **8.0** gözükmeli

#### **C) Aidat Ödeme**
9. **Ödeme Sayfasına Git**
   - Dashboard → Hızlı İşlemler → "Cüzdan"

10. **IBAN Kopyala**
    - "IBAN Kopyala" butonuna tıkla
    - ✅ **Beklenen:** Alert: "IBAN Kopyalandı!"

11. **Dekont Yükle**
    - ✅ **Kontrol:** "Dekont Yükle" butonu (mavi) görünmeli
    - Butona tıkla
    - ✅ **Beklenen:** 
      - 1.5 saniye loading (refresh icon dönmeli)
      - Alert: "Dekont yüklendi! Yönetici onayından sonra ödemeniz işlenecek."
      - Kart üstünde "Onay Bekliyor" yazısı çıkmalı

12. **Admin Onayı**
    - Çıkış yap, ID `1` ile admin gir
    - "Cüzdan" sayfasına git
    - **Can Yeni Öztürk** için "ONAYLA" butonu (mavi, yanıp sönen) görünmeli
    - Butona tıkla
    - ✅ **Beklenen:** 
      - Badge "ÖDENDİ" (yeşil) olmalı
      - WhatsApp butonu kaybolmalı

---

## 🏟️ TEST SENARYOSU 4: SAHA İŞLETMENİ (Mekan Odaklı)

### 🎯 Amaç
Saha ekleme ve rezervasyon yapma işlemlerini test etme.

### 📋 Adımlar

#### **A) Yeni Saha Ekleme**
1. **Login**
   - ID: `1` (Admin - sadece admin saha ekleyebilir)

2. **Saha Ekle**
   - Dashboard → "Tesisler" → Sağ üst "+" butonu
   - Saha Adı: `Test Halı Saha`
   - İlçe: `Kadıköy`
   - Kapasite: `7v7`
   - Adres: `Test Mahallesi, Deneme Sokak No:5`
   - Ücret: `1500`
   - Telefon: `0555 999 8877`
   - "Sahayı Kaydet"
   - ✅ **Beklenen:** 
     - Loading icon gösterilmeli
     - Alert yok ama geri dönülmeli
     - Tesisler listesinde **Test Halı Saha** görünmeli

3. **Eklenen Sahayı Görüntüle**
   - Tesisler listesinde **Test Halı Saha** kartına tıkla
   - ✅ **Beklenen:** 
     - Saha detay sayfası açılmalı
     - Fiyat: **₺1.500/saat**
     - Kapasite: **7v7**
     - Telefon görünmeli

#### **B) Rezervasyon Yapma**
4. **Rezervasyon Ekranına Git**
   - Saha detay sayfasında **"Rezervasyon Yap"** butonuna tıkla

5. **Tarih Seç**
   - Tarih şeridi görünmeli (Bugün, Yarın, ...)
   - **"Yarın"** butonuna tıkla
   - ✅ **Doğrulama:** Yarın butonu yeşil highlight olmalı

6. **Saat Seç**
   - Saat kartları (16:00-17:00, 17:00-18:00, ...) görünmeli
   - ✅ **Kontrol:** Bazı slotlar "DOLU" (kırmızı) olabilir
   - **Müsait bir saat** seç (ör: 21:00-22:00)
   - ✅ **Beklenen:** Seçilen kart yeşil highlight olmalı

7. **Devam Et**
   - "Devam Et" butonuna tıkla
   - ✅ **Beklenen:** 
     - Özet sayfası açılmalı
     - Tarih: Yarın'ın tam tarihi
     - Saat: 21:00-22:00
     - Saha: Test Halı Saha
     - Toplam: ₺1.525 (Saha + Hizmet bedeli)

8. **Ödemeyi Onayla**
   - "Ödemeyi Onayla ve Bitir" butonuna tıkla
   - ✅ **Beklenen:** 
     - 2 saniye loading ("İşleminiz Yapılıyor")
     - Başarı ekranı: ✅ "Rezervasyon Onaylandı!"
     - "Maç Detaylarına Git" butonu görünmeli

9. **Maçın Oluştuğunu Doğrula**
   - "Maç Detaylarına Git" butonuna tıkla
   - ✅ **Beklenen:** Dashboard'a dönülmeli
   - Yaklaşan maçlar listesinde **yeni maç** gözükmeli:
     - Saha: **Test Halı Saha**
     - Tarih: **Yarın**
     - Saat: **21:00**

10. **Venue'ye Ait Maçları Filtrele**
    - Dashboard → "Tesisler" → **Test Halı Saha** detayına git
    - ✅ **Gelecek Özellik:** (Şu an manuel filtreleme gerekiyor)
    - Console'da `matches.filter(m => m.venueId === 'vX')` çalıştırarak doğrula
    - ✅ **Beklenen:** Az önce oluşturulan maç `venueId` içermeli

---

## 🐛 HATA SENARYOLARI (Negative Testing)

### **Yetki Kontrolleri**
1. **Üye Olarak Admin Sayfasına Girme Denemesi**
   - ID `2` ile giriş yap
   - URL'yi manuel değiştir veya direkt "Yönetim" butonuna bas
   - ✅ **Beklenen:** "Erişim Reddedildi" ekranı veya Dashboard'a redirect

2. **Oyuncu Olarak Maç Oluşturma**
   - ID `2` ile giriş
   - "Maç Oluştur" butonuna tıkla (eğer varsa)
   - ✅ **Beklenen:** "Erişim Reddedildi" mesajı

3. **Oyuncu Olarak Başkasının Skorunu Değiştirme**
   - ID `2` ile maç detayına git
   - ✅ **Beklenen:** "Maç Sonucunu Gir" butonu GÖRÜNMEMELİ

### **Veri Doğrulama**
4. **Boş Form Gönderimi**
   - Saha Ekle formunda hiçbir alan doldurmadan "Kaydet"
   - ✅ **Beklenen:** Alert: "Lütfen zorunlu alanları doldurunuz."

5. **Kadro Olmadan Maç Oluşturma**
   - Maç oluşturma akışında Adım 2'de hiç oyuncu seçme
   - "Devam Et"
   - ✅ **Beklenen:** Confirm dialog: "Hiç oyuncu seçmediniz. Kadroyu boş oluşturmak istiyor musunuz?"

---

## 📊 TEST ÇIKTILARI (Doğrulama Kriterleri)

### **Console Log'ları**
Her işlem sonrası console'da şu logları arayın:

```javascript
// Örnek başarılı işlem logları:
✅ Oyuncu önerisi gönderildi! Admin onayı bekleniyor.
⚽ Maç skoru güncelleniyor: match_123 -> 5-3
📤 Dekont yükleniyor: payment_456
💵 Gelir ekleniyor: ...
📅 Rezervasyon tamamlanıyor: ...
```

### **State Güncellemeleri**
Browser Dev Tools → React Developer Tools → Components:
- `App` component'inde:
  - `matches` array'inin uzunluğu değişmeli
  - `players` listesi güncellenmiş olmalı
  - `teamProfile` set edilmiş olmalı

### **UI Güncellemeleri**
- ✅ Modal'lar açılıp kapanmalı
- ✅ Alert mesajları doğru metinlerle çıkmalı
- ✅ Badge renkleri doğru olmalı (yeşil=başarı, kırmızı=hata, mavi=bekliyor)
- ✅ Sayfa geçişleri smooth olmalı

---

## 🚀 HİZLI TEST CHEAT SHEET

```bash
# 1. Admin Testi
Login: 1 → Yönetim → Finansal (Gelir Ekle ₺500) → Üyeler (Ali Veli Onayla)

# 2. Kaptan Testi  
Login: 7 → Maç Oluştur (3 adım) → Kadro Oluştur → Maça Git → Skor Gir (5-3)

# 3. Oyuncu Testi
Login: 2 → Maça Git → Katılıyorum → Profil Düzenle (DEF) → Cüzdan (Dekont Yükle)

# 4. Saha İşletmeni Testi
Login: 1 → Tesisler → Saha Ekle (Test Saha ₺1500) → Rezervasyon Yap (Yarın 21:00)
```

---

## 📝 NOTLAR

- **Mock Data:** Tüm testler `constants.ts`'deki sahte verilerle çalışır
- **Persist:** Sayfa yenileme yapılırsa state sıfırlanır (localStorage yok)
- **Build:** Test öncesi `npm run build` ile production build alınmalı
- **Browser:** Chrome/Edge önerilir (Dev Tools için)

---

**✅ Test Tamamlama Oranı Hedefi: %100**  
**🎯 Kritik Akışlar: 4/4 (Admin, Kaptan, Oyuncu, Saha)**  
**🐛 Bilinen Sınırlamalar: Profil resmi upload, gerçek API entegrasyonu yok**
