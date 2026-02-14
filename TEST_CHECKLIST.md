# ✅ Test Checklist - Hızlı Doğrulama

## 🎭 Kullanıcı Rolleri
- [ ] ID `1` - Admin girişi çalışıyor
- [ ] ID `7` - Kaptan girişi çalışıyor  
- [ ] ID `2` - Üye girişi çalışıyor
- [ ] ID `999` - Yeni kullanıcı CreateProfile'a yönlendiriliyor

---

## 👑 ADMIN TESTLERİ

### Takım Kurulumu
- [ ] TeamSetup form çalışıyor
- [ ] Takım adı Dashboard'da görünüyor
- [ ] Renk seçimi uygulanıyor

### Finansal İşlemler
- [ ] ✅ Gelir Ekle butonu var ve çalışıyor
- [ ] ✅ Gider Ekle butonu var ve çalışıyor
- [ ] Kasa bakiyesi doğru hesaplanıyor
- [ ] İşlemler listede yeşil/kırmızı görünüyor

### Üye Yönetimi
- [ ] ✅ Join Request onaylama çalışıyor
- [ ] Onaylanan üye oyuncular listesinde
- [ ] ✅ Aday Havuzu görünüyor
- [ ] ✅ Deneme süreci başlatma çalışıyor
- [ ] ✅ Asil üye yapma çalışıyor
- [ ] Rol değiştirme çalışıyor

---

## ⚽ KAPTAN TESTLERİ

### Maç Oluşturma
- [ ] ✅ 3 adımlı form çalışıyor
- [ ] Saha seçimi yapılabiliyor
- [ ] ✅ Oyuncu seçimi çalışıyor (checkbox)
- [ ] ✅ Maç Dashboard'da görünüyor
- [ ] ✅ VenueId kaydediliyor

### Kadro Yönetimi
- [ ] LineupManager açılıyor
- [ ] Taslak A/B/C arası geçiş çalışıyor
- [ ] Saha görünümü (PitchView) render oluyor
- [ ] Güç dengesi barları görünüyor

### Maç Sonucu
- [ ] ✅ "Maç Sonucunu Gir" butonu görünüyor (sadece admin/kaptan)
- [ ] ✅ Skor modal'ı açılıyor
- [ ] ✅ Skor kaydediliyor
- [ ] ✅ Maç "completed" oluyor

---

## 👤 OYUNCU TESTLERİ

### RSVP (Katılım)
- [ ] ✅ "Katılıyorum" butonu çalışıyor
- [ ] ✅ "Belki" butonu çalışıyor
- [ ] ✅ "Katılmıyorum" butonu çalışıyor
- [ ] ✅ Kadro sayısı değişiyor (X/14)
- [ ] ✅ Her maç için ayrı RSVP kaydediliyor

### Profil
- [ ] Profil görüntüleme çalışıyor
- [ ] ✅ Profil düzenleme çalışıyor
- [ ] ✅ Ad değişikliği kaydediliyor
- [ ] ✅ Mevki değişikliği kaydediliyor
- [ ] ✅ Puan değişikliği kaydediliyor
- [ ] ✅ Değişiklikler kadro'da yansıyor

### Ödeme
- [ ] Ödeme sayfası açılıyor
- [ ] ✅ IBAN kopyalama çalışıyor
- [ ] ✅ "Dekont Yükle" butonu görünüyor
- [ ] ✅ Dekont yükleme çalışıyor
- [ ] ✅ Status "waiting_approval" oluyor
- [ ] ✅ Admin onaylayınca "paid" oluyor

---

## 🏟️ SAHA İŞLETMENİ TESTLERİ

### Saha Ekleme
- [ ] ✅ VenueAdd form açılıyor
- [ ] ✅ Zorunlu alanlar kontrol ediliyor
- [ ] ✅ Saha kaydediliyor
- [ ] ✅ Saha listesinde görünüyor
- [ ] ✅ Saha detayları doğru

### Rezervasyon
- [ ] ✅ BookingScreen açılıyor
- [ ] ✅ Tarih seçimi çalışıyor
- [ ] ✅ Saat slotları görünüyor
- [ ] ✅ Dolu/Boş durumu gösteriliyor
- [ ] ✅ Özet sayfası doğru bilgileri gösteriyor
- [ ] ✅ Rezervasyon tamamlanıyor
- [ ] ✅ Maç oluşuyor
- [ ] ✅ VenueId maçta kaydediliyor

---

## 🔒 YETKİ KONTROLÜ

- [ ] Üye admin sayfasına giremiyor
- [ ] Üye maç oluşturamıyor
- [ ] Üye finansal raporları göremiyor
- [ ] Oyuncu skor giremiyor
- [ ] Login olmadan dashboard açılmıyor

---

## 🐛 HATA KONTROLÜ

- [ ] Boş form gönderilemiyor
- [ ] Geçersiz ID ile giriş CreateProfile'a yönlendiriliyor
- [ ] Modal kapatma (X) butonları çalışıyor
- [ ] Geri dön (back) butonları çalışıyor
- [ ] Alert mesajları anlamlı

---

## 📱 UI/UX KONTROLÜ

- [ ] Butonlar tıklanıyor (active scale effect)
- [ ] Loading state'leri görünüyor
- [ ] Badge renkleri doğru (yeşil/kırmızı/mavi/sarı)
- [ ] Modal'lar blur backdrop ile açılıyor
- [ ] Sayfa geçişleri smooth
- [ ] Header sticky çalışıyor
- [ ] Mobile responsive (viewport test)

---

## 🔍 CONSOLE KONTROLÜ

### Başarılı İşlemler
```javascript
✅ Oyuncu önerisi gönderildi!
✅ Maç sonucu güncellendi!
✅ Dekont yüklendi!
✅ Gelir kaydedildi!
✅ Maç oluşturuldu!
```

### Hata Olmaması Gereken
```javascript
❌ undefined is not an object
❌ Cannot read property 'id' of undefined
❌ Network error (API yok, normal)
```

---

## 🎯 KRİTİK AKIŞLAR (End-to-End)

### Akış 1: Tam Üyelik Süreci
1. [ ] ID 999 ile giriş → Profil oluştur
2. [ ] ID 2 ile giriş → Oyuncu öner
3. [ ] ID 1 ile giriş → Deneme başlat → Asil üye yap
4. [ ] Yeni üye oyuncular listesinde

### Akış 2: Maçtan Skora
1. [ ] ID 7 ile maç oluştur
2. [ ] ID 2 ile maça katıl (RSVP: Yes)
3. [ ] ID 7 ile skor gir
4. [ ] Maç "completed", skor görünüyor

### Akış 3: Rezervasyondan Maça
1. [ ] ID 1 ile saha ekle
2. [ ] Rezervasyon yap
3. [ ] Dashboard'da maç görünüyor
4. [ ] VenueId doğru

### Akış 4: Ödemeden Onaya
1. [ ] ID 2 ile dekont yükle
2. [ ] ID 1 ile onayla
3. [ ] Status "paid" oluyor

---

## 📊 PERFORMANS

- [ ] Build başarılı (npm run build)
- [ ] Bundle size < 500 KB
- [ ] İlk yükleme < 3 saniye
- [ ] Sayfa geçişleri < 300ms
- [ ] Console'da hata yok

---

## ✅ TAMAMLAMA

**Test Edilen Özellik Sayısı:** ___ / 80+  
**Kritik Hata Sayısı:** ___  
**Minor Hata Sayısı:** ___  

**Notlar:**
_______________________________________________
_______________________________________________
_______________________________________________

**Test Eden:** _______________  
**Tarih:** _______________  
**Build Version:** _______________
