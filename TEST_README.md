# 📚 Test Dokümantasyonu - İçindekiler

Bu klasörde uygulamanın tüm iş mantıklarını test etmek için hazırlanmış 3 farklı test dokümantasyonu bulunmaktadır.

---

## 📄 Dosyalar

### 1. 📘 [TEST_SCENARIOS.md](./TEST_SCENARIOS.md)
**Kullanım:** Detaylı test senaryoları  
**Kime Uygun:** QA Engineer, Product Manager, Developer  
**Süre:** 30-45 dakika  

**İçerik:**
- 4 farklı rol için kapsamlı test senaryoları
- Adım adım talimatlar
- Beklenen sonuçlar (✅ işaretli)
- Hata senaryoları (Negative Testing)
- Console log doğrulamaları
- State kontrol rehberi

**Ne Zaman Kullanılır:**
- İlk defa test yapılıyorsa
- Kapsamlı regression test gerekiyorsa
- Tüm özelliklerin test edilmesi isteniyorsa
- Test raporu hazırlanıyorsa

---

### 2. ✅ [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)
**Kullanım:** Hızlı doğrulama listesi  
**Kime Uygun:** Developer, QA Tester  
**Süre:** 10-15 dakika  

**İçerik:**
- Checkbox formatında test maddeleri (80+ item)
- Rol bazlı ayrılmış bölümler
- Yetki kontrol checkboxları
- UI/UX doğrulama listesi
- Kritik akış end-to-end testleri

**Ne Zaman Kullanılır:**
- Yeni feature eklendiğinde
- Bug fix sonrası doğrulama
- Pull request öncesi kontrol
- Release checklist olarak

---

### 3. 🚀 [QUICK_TEST.md](./QUICK_TEST.md)
**Kullanım:** 5 dakikalık hızlı test  
**Kime Uygun:** Developer (self-test), Demo hazırlık  
**Süre:** 5 dakika  

**İçerik:**
- 4 akış için copy-paste script
- Kritik checkpoint'ler
- Hata avlama ipuçları
- Test raporu şablonu
- Video demo senaryosu

**Ne Zaman Kullanılır:**
- Commit öncesi hızlı kontrol
- Demo öncesi son check
- Yeni developer'a onboarding
- CI/CD smoke test benzeri manuel test

---

## 🎯 Hangi Dosyayı Kullanmalıyım?

```
┌─────────────────────────────────────────────────┐
│  Senaryonuz                     │  Dosya         │
├─────────────────────────────────┼───────────────┤
│  İlk defa test yapıyorum        │  TEST_SCENARIOS│
│  Kapsamlı test istiyorum        │  TEST_SCENARIOS│
│  Bug raporu yazacağım           │  TEST_SCENARIOS│
├─────────────────────────────────┼───────────────┤
│  Feature ekledim, kontrol       │  TEST_CHECKLIST│
│  Pull request hazırlıyorum      │  TEST_CHECKLIST│
│  Release checklist              │  TEST_CHECKLIST│
├─────────────────────────────────┼───────────────┤
│  Commit öncesi kontrol          │  QUICK_TEST    │
│  Demo yapacağım                 │  QUICK_TEST    │
│  Hızlı smoke test               │  QUICK_TEST    │
└─────────────────────────────────┴───────────────┘
```

---

## 🚀 Hızlı Başlangıç

### Adım 1: Projeyi Çalıştır
```bash
npm install
npm run dev
```

### Adım 2: Test Dosyasını Seç
- Zaman varsa → `TEST_SCENARIOS.md`
- Orta hız → `TEST_CHECKLIST.md`
- Çok acele → `QUICK_TEST.md`

### Adım 3: Test Et
- Browser'da `localhost:5173` aç
- Seçtiğin dosyadaki adımları takip et
- Console'u aç (F12) ve logları gözlemle

### Adım 4: Raporla
- Sorun varsa → Issue aç (GitHub)
- Her şey OK → Checkbox'ları işaretle
- Önemli bug → Screenshot ekle

---

## 🎭 Test Kullanıcıları (Mock Data)

```javascript
// Login ekranında kullanılacak ID'ler:

Admin    → ID: 1  (Ahmet Yılmaz)
Kaptan   → ID: 7  (Mehmet Demir)
Üye      → ID: 2  (Can Öztürk)
Yeni     → ID: 999 (CreateProfile'a yönlendirir)
```

---

## 📊 Test Kapsama Alanları

### ✅ Kapsanan Özellikler (Business Logic Wired)
- [x] Authentication & RBAC
- [x] Team Setup & Profile Management
- [x] Match Creation (3-step wizard)
- [x] Match Score Entry
- [x] Lineup Manager (3 drafts)
- [x] RSVP per-match tracking
- [x] Financial Reports (Income + Expense)
- [x] Payment Ledger (Proof Upload)
- [x] Member Management (Join Requests)
- [x] Scouting & Trial Process (Guest → Member)
- [x] Venue Management (Add + Filter)
- [x] Booking System (Reservation → Match)
- [x] Admin Dashboard (Stats + Candidate Pool)
- [x] Profile Edit (Position, Rating changes)
- [x] Navigation & Back buttons

### ⏳ Kapsanmayan (Future Work)
- [ ] WhatsApp Integration (API)
- [ ] Image Upload (Profile photo)
- [ ] Poll Voting (UI hazır, logic partial)
- [ ] Tournament Bracket
- [ ] Leaderboard calculations
- [ ] Notification system
- [ ] Persist state (LocalStorage/API)

---

## 🐛 Bilinen Sınırlamalar

1. **Persist Yok:** Sayfa yenilendiğinde state sıfırlanır (LocalStorage planlanıyor)
2. **Mock Data:** Gerçek backend yok, tüm işlemler in-memory
3. **WhatsApp:** Sadece UI, gerçek entegrasyon yok
4. **Image Upload:** File input yok, avatar URL'ler sabit

---

## 📞 Destek

**Sorularınız için:**
- GitHub Issues
- Pull Request'lerde yorum
- README.md'yi kontrol edin

**Test sonuçlarını paylaşın:**
- Screenshot'lar ekleyin
- Console log'larını kopyalayın
- Adım adım ne yaptığınızı açıklayın

---

## 🎉 Test Başarı Kriterleri

✅ **Başarılı Test:**
- Tüm 4 akış çalışıyor
- Console'da kritik hata yok
- Alert mesajları anlamlı
- UI güncellemeleri anında
- Build hatasız

❌ **Başarısız Test:**
- Herhangi bir akış çalışmıyor
- Console'da kırmızı error var
- Butonlar tepki vermiyor
- Veri kaybolması var
- Build fail

---

**Son Güncelleme:** 2026-02-14  
**Test Doküman Versiyonu:** 1.0.0  
**Uygulama Versiyonu:** Build #latest

---

## 🔗 İlgili Dokümantasyon

- [../README.md](../README.md) - Proje ana dokümantasyonu
- [../App.tsx](../App.tsx) - State management merkezi
- [../types.ts](../types.ts) - TypeScript interface'leri
- [../constants.ts](../constants.ts) - Mock data

---

**Mutlu testler! 🚀**
