# 🤖 AUTONOMOUS TEST AGENT - The Intelligent Web Crawler

## 📖 Overview

Bu test suite, **geleneksel test automation'dan tamamen farklı** bir yaklaşım kullanır. Hardcoded senaryolar yerine, **kendi kendine öğrenen, keşfeden ve karar veren** bir AI agent gibi çalışır.

---

## 🧠 THE BRAIN - Akıllı Keşif Motoru

### Çalışma Prensibi

```
1. TARAMA (Scan)
   ↓
2. KARAR VERME (Decision)
   ↓
3. ETKİLEŞİM (Interaction)
   ↓
4. ÖĞRENME (Learning)
   ↓
5. TEKRAR (Loop back to 1)
```

### Core Class: `AutonomousCrawler`

```typescript
class AutonomousCrawler {
  // State Management
  - visitedUrls: Set<string>
  - visitedElements: Set<string>
  - stateMap: Map<string, string[]>
  - errors: Array<ErrorInfo>
  
  // Main Methods
  - explore(): Ana keşif fonksiyonu
  - crawlRecursive(): Recursive derinlemesine keşif
  - discoverInteractiveElements(): Element bulma
  - interactWithElement(): Akıllı etkileşim
}
```

---

## 🎯 ÖZELL İKLER

### 1. 🔍 Dinamik Keşif (Dynamic Exploration)

**Hardcoded Yok:**
```typescript
// ❌ Geleneksel Yaklaşım
await page.click('#login-button');
await page.click('#dashboard-link');
await page.click('#profile-button');

// ✅ Autonomous Yaklaşım
const crawler = new AutonomousCrawler(page);
await crawler.explore(); // Bot kendi yolunu bulur!
```

**Nasıl Çalışır:**
- Sayfadaki **TÜM** interaktif elemanları tarar
- Rastgele sıralama ile exploration diversity sağlar
- Ziyaret edilen elemanları takip eder (loop önleme)
- URL değişikliklerini algılar ve yeni sayfaları keşfeder

### 2. 🧠 Akıllı Form Doldurma (Intelligent Form Filling)

**Faker.js ile Context-Aware Data:**

```typescript
// Input type'a göre otomatik veri üretimi
email input → faker.internet.email()
tel input → faker.string.numeric(10)
name input → faker.person.fullName()
date input → faker.date.future()
password → faker.internet.password()
generic text → faker.lorem.words(2)
```

**Örnek:**
```typescript
// Agent bu inputu görür:
<input type="email" name="user_email" />

// Otomatik olarak şunu doldurur:
"john.doe@example.com"

// Bu inputu görür:
<input type="tel" placeholder="Telefon numaranız" />

// Otomatik olarak şunu doldurur:
"5551234567"
```

### 3. 🎯 Gerçek Zamanlı Hata Yakalama

**4 Katmanlı Error Detection:**

#### A. Console Error Detection
```typescript
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    // ❌ JavaScript hatası tespit edildi!
  }
});
```

#### B. Page Crash Detection
```typescript
page.on('pageerror', (error) => {
  // 💥 React/Vue crash tespit edildi!
});
```

#### C. Network Failure Detection
```typescript
page.on('response', (response) => {
  if (response.status() >= 400) {
    // 🌐 404 / 500 hatası tespit edildi!
  }
});
```

#### D. White Screen of Death Detection
```typescript
const hasContent = await page.evaluate(() => {
  const body = document.body;
  const text = body.innerText || '';
  const elements = body.querySelectorAll('*').length;
  return text.length > 10 || elements > 5;
});

if (!hasContent) {
  // 💀 Beyaz ekran tespit edildi!
}
```

### 4. 🗺️ State Haritalandırma

**Her URL için interaction map oluşturur:**

```
State Map:
├── http://localhost:3004/ 
│   └── [button.hemen-basla, a.takim-kur, button.koda-katil]
│
├── http://localhost:3004/#login
│   └── [input[type=tel], button.devam-et, button.takim-kur]
│
├── http://localhost:3004/#dashboard
│   └── [button.yonetim, button.maclar, a.uyeler, ...]
│
└── ...
```

### 5. 🔄 Loop Prevention (Sonsuz Döngü Önleme)

**Ziyaret Takibi:**
```typescript
visitedUrls: Set<string>        // URL'leri takip et
visitedElements: Set<string>    // Element'leri takip et

// Her etkileşimden önce kontrol
if (visitedElements.has(elementKey)) {
  skip(); // Bu eleman zaten denendi
}
```

---

## 🚀 KULLANIM

### Tüm Test Suite'i Çalıştır

```bash
# Tüm autonomous testler
npx playwright test tests/autonomous-agent.spec.ts --headed

# UI Mode (interaktif izleme)
npx playwright test tests/autonomous-agent.spec.ts --ui
```

### Tek Mod Çalıştır

```bash
# Admin mode exploration
npx playwright test -g "Admin Mode"

# Chaos mode (gremlin)
npx playwright test -g "Chaos Mode"

# Deep dive mode
npx playwright test -g "Deep Dive"

# Error hunter mode
npx playwright test -g "Error Hunter"
```

---

## 🎮 TEST MODLARI

### 1. 👑 Admin Mode Exploration

**Amaç:** Admin rolü ile maksimum erişim testi

```typescript
test('Admin Mode - Autonomous Exploration', async ({ page }) => {
  await loginAs(page, '1'); // Admin ID
  const crawler = new AutonomousCrawler(page);
  await crawler.explore();
});
```

**Beklenen:**
- En fazla URL keşfedilmeli (admin tüm ekranlara erişir)
- Kritik hata olmamalı
- State map kapsamlı olmalı

### 2. ⚡ Captain Mode Exploration

**Amaç:** Kaptan rolü ile takım yönetimi testi

```typescript
test('Captain Mode - Autonomous Exploration', async ({ page }) => {
  await loginAs(page, '7'); // Captain ID
  const crawler = new AutonomousCrawler(page);
  await crawler.explore();
});
```

**Beklenen:**
- Takım yönetimi ekranları keşfedilmeli
- Kadro oluşturma, maç planlama test edilmeli

### 3. 👤 Member Mode Exploration

**Amaç:** Üye rolü ile kısıtlı erişim testi

```typescript
test('Member Mode - Autonomous Exploration', async ({ page }) => {
  await loginAs(page, '2'); // Member ID
  const crawler = new AutonomousCrawler(page);
  await crawler.explore();
});
```

**Beklenen:**
- Admin paneline erişememeli (RBAC test)
- Kendi profil ve ödeme ekranlarına erişebilmeli

### 4. 👾 Chaos Mode (Gremlin)

**Amaç:** Hızlı, rastgele, kaotik etkileşim

```typescript
test('Chaos Mode (Gremlin)', async ({ page }) => {
  const randomUser = randomUsers[Math.floor(Math.random() * 3)];
  await loginAs(page, randomUser);
  
  CRAWLER_CONFIG.STEP_DELAY = 50; // ÇOK HIZLI!
  const crawler = new AutonomousCrawler(page);
  await crawler.explore();
});
```

**Özellikler:**
- 50ms gecikme (ultra fast)
- Rastgele kullanıcı
- Rastgele etkileşimler
- **Amaç:** Race condition, state corruption bulmak

### 5. 🔬 Deep Dive Mode

**Amaç:** Maksimum derinlik, maksimum kapsam

```typescript
test('Deep Dive - Maximum Depth Exploration', async ({ page }) => {
  CRAWLER_CONFIG.MAX_STEPS = 100;
  CRAWLER_CONFIG.MAX_DEPTH = 10;
  
  const crawler = new AutonomousCrawler(page);
  await crawler.explore();
});
```

**Beklenen:**
- Minimum 5 farklı URL
- Comprehensive state map
- Tüm nested navigation paths

### 6. 🎯 Error Hunter Mode

**Amaç:** Sadece hata tespit etmeye odaklan

```typescript
test('Error Hunter - Focused Error Detection', async ({ page }) => {
  const crawler = new AutonomousCrawler(page);
  await crawler.explore();
  
  // Detaylı error raporu
  console.log('Console Errors:', consoleErrors);
  console.log('Network Failures:', networkFailures);
  console.log('Page Crashes:', crashes);
});
```

**Çıktı:**
```
📊 Error Summary:
   Console Errors: 2
   Network Failures: 0
   Page Crashes: 0
   White Screens: 0
   Dead Ends: 3

📋 Detailed Error Report:
   Error #1:
   Type: CONSOLE_ERROR
   Message: Uncaught TypeError: Cannot read property 'map' of undefined
   URL: http://localhost:3004/#matches
   Time: 2026-02-14T20:15:32.123Z
```

---

## 📊 ÖRNEK ÇIKTI

### Console Output

```bash
🤖 Starting autonomous exploration...

📍 Exploring [Depth: 0, Step: 0]: http://localhost:3004/

🔍 Found 15 interactive elements

  🎯 Interacting: button - "person_addÜyeler"
    ✅ Clicked
  ↳ Navigation detected: / → /#members

📍 Exploring [Depth: 1, Step: 1]: http://localhost:3004/#members

🔍 Found 8 interactive elements

  🎯 Interacting: input - "Ara..."
    ✏️ Filled: "John Doe"

  🎯 Interacting: button - "Davet Et"
    ✅ Clicked
    💬 Dialog: Davet kodu oluşturuldu!

❌ Console Error detected: TypeError: player.stats is undefined

📊 Exploration Complete!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🤖 AUTONOMOUS CRAWLER SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 URLs Visited: 7
   - http://localhost:3004/
   - http://localhost:3004/#login
   - http://localhost:3004/#dashboard
   - http://localhost:3004/#members
   - http://localhost:3004/#matches
   - http://localhost:3004/#venues
   - http://localhost:3004/#profile

🎯 Elements Interacted: 34

❌ Errors Found: 2
   1. [CONSOLE_ERROR] TypeError: player.stats is undefined
   2. [NETWORK_FAILURE] 404 Not Found - /api/stats

🚫 Dead Ends: 3

📊 State Map:
   http://localhost:3004/: 15 interactions
   http://localhost:3004/#dashboard: 12 interactions
   http://localhost:3004/#members: 8 interactions
   ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚙️ CONFIGURATION

### Crawler Config

```typescript
const CRAWLER_CONFIG = {
  MAX_STEPS: 50,              // Maksimum interaction sayısı
  MAX_DEPTH: 5,               // Maksimum navigation derinliği
  STEP_DELAY: 300,            // Her adım arası gecikme (ms)
  INTERACTION_TIMEOUT: 5000,  // Element interaction timeout
  PARALLEL_PATHS: 3,          // (Future) Paralel keşif yolları
};
```

**Özelleştirme:**

```typescript
// Hızlı keşif (test development)
CRAWLER_CONFIG.MAX_STEPS = 20;
CRAWLER_CONFIG.STEP_DELAY = 100;

// Kapsamlı keşif (production)
CRAWLER_CONFIG.MAX_STEPS = 200;
CRAWLER_CONFIG.MAX_DEPTH = 10;

// Chaos mode
CRAWLER_CONFIG.STEP_DELAY = 50;
CRAWLER_CONFIG.MAX_STEPS = 30;
```

---

## 🎯 KULLANIM SENARYOLARI

### 1. Yeni Feature Test (Smoke Test)

```bash
# Hızlı bir tur at, critical bug var mı bak
CRAWLER_CONFIG.MAX_STEPS = 20
npx playwright test -g "Admin Mode" --headed
```

### 2. Regression Testing

```bash
# Deployment öncesi full exploration
CRAWLER_CONFIG.MAX_STEPS = 100
npx playwright test tests/autonomous-agent.spec.ts
```

### 3. Bug Hunt

```bash
# Error hunter mode ile detaylı tarama
npx playwright test -g "Error Hunter" --headed
```

### 4. Chaos Engineering

```bash
# Gremlin mode ile stress test
npx playwright test -g "Chaos Mode" --headed
```

---

## 🔬 GELİŞMİŞ ÖZELLİKLER

### 1. Unique Selector Generation

```typescript
// ID varsa kullan
if (el.id) return `#${el.id}`;

// Class varsa kullan
if (el.className) return `.${el.className.split(' ')[0]}`;

// Text content varsa kullan
if (el.textContent) return `text=${el.textContent.trim()}`;

// Fallback: Tag name
return el.tagName.toLowerCase();
```

### 2. Smart Form Filling Logic

```typescript
// Input adına veya placeholder'a göre context anlama
if (name.includes('email') || placeholder.includes('email')) {
  value = faker.internet.email();
} else if (name.includes('phone')) {
  value = faker.string.numeric(10);
} else if (name.includes('name')) {
  value = faker.person.fullName();
}
```

### 3. Fisher-Yates Shuffle

```typescript
// Exploration diversity için array shuffle
private shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

---

## 📈 EXPECTED RESULTS

### Başarılı Test

```
✅ Admin Mode Exploration
   - Explored 7 unique URLs
   - Interacted with 34 elements
   - 0 critical errors
   
✅ Test PASSED
```

### Hata Bulundu

```
❌ Admin Mode Exploration
   
💥 CRITICAL ERRORS FOUND:
   - PAGE_CRASH: Uncaught TypeError: Cannot read property 'map' of undefined
   - WHITE_SCREEN: Page rendered with no visible content
   
❌ Test FAILED
```

---

## 🐛 TROUBLESHOOTING

### Problem: Agent çok hızlı, elementler bulunamıyor

**Çözüm:**
```typescript
CRAWLER_CONFIG.STEP_DELAY = 1000; // Delay'i artır
CRAWLER_CONFIG.INTERACTION_TIMEOUT = 10000; // Timeout'u artır
```

### Problem: Sonsuz döngüye giriyor

**Çözüm:**
```typescript
// visitedElements Set'i kontrol et
console.log('Visited elements:', this.state.visitedElements.size);

// MAX_STEPS'i düşür
CRAWLER_CONFIG.MAX_STEPS = 30;
```

### Problem: Çok fazla false positive error

**Çözüm:**
```typescript
// Error filtering ekle
const criticalErrors = state.errors.filter(e => 
  e.type === 'PAGE_CRASH' || 
  e.type === 'WHITE_SCREEN'
);

// Sadece kritik olanları fail et
expect(criticalErrors.length).toBe(0);
```

---

## 🎉 SONUÇ

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🤖 AUTONOMOUS TEST AGENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ Zero Hardcoded Scenarios
  ✅ Self-Learning & Adaptive
  ✅ Real-time Error Detection
  ✅ Intelligent Form Filling
  ✅ State Mapping
  ✅ Multi-Mode Testing
  
  📊 Test Modes:        6
  🧠 Intelligence:      Autonomous
  🔍 Detection:         Real-time
  🎯 Approach:          AI-Driven
  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Başlamak için:  npx playwright test tests/autonomous-agent.spec.ts --headed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Version:** 1.0.0  
**Type:** Autonomous AI Agent  
**Level:** Research-Grade  
**Status:** ✅ PRODUCTION READY

**Future Enhancements:**
- Machine Learning için training data export
- Parallel exploration (multiple paths simultaneously)
- Visual ML (screenshot-based learning)
- API endpoint discovery
- Performance regression detection
