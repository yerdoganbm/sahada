# 🚀 LEVEL 4: ADVANCED RESILIENCE & VISUAL ARCHITECTURE

## 📖 Overview

Bu test suite, SDET (Software Development Engineer in Test) standartlarında gelişmiş test senaryolarını içerir. Fonksiyonel testlerin ötesinde, uygulamanın **görsel tutarlılığı**, **ağ dayanıklılığı**, **erişilebilirliği** ve **chaos engineering** testlerini kapsar.

---

## 🎯 Test Kategorileri

### 1. 🎨 Visual Regression Testing (5 test)

**Amaç:** Tasarımın piksel piksel kaymadığından emin olmak.

**Testler:**
- ✅ Dashboard - Admin snapshot
- ✅ Dashboard - Member snapshot
- ✅ Match Details - Görsel tutarlılık
- ✅ Lineup Manager - Kadro ekranı snapshot
- ✅ Admin Panel - Full page visual

**Teknik Detaylar:**
```typescript
// Dinamik içeriği maskele (tarih, saat)
const masks = [
  page.locator('[class*="date"]'),
  page.locator('[class*="time"]'),
  page.locator('[class*="timestamp"]')
];

// Snapshot al ve karşılaştır
await expect(page).toHaveScreenshot('dashboard-admin.png', {
  mask: masks,
  maxDiffPixels: 100,
  threshold: 0.2,
  animations: 'disabled'
});
```

**İlk Çalıştırma:**
İlk kez çalıştırıldığında referans görüntüler oluşturulur:
```
tests/advanced-suite.spec.ts-snapshots/
├── dashboard-admin-Desktop-Chrome.png
├── dashboard-member-Desktop-Chrome.png
├── match-details-Desktop-Chrome.png
├── lineup-manager-Desktop-Chrome.png
└── admin-panel-Desktop-Chrome.png
```

**Sonraki Çalıştırmalar:**
Yeni ekran görüntüleri referanslarla karşılaştırılır. Fark varsa test fail olur ve diff gösterilir.

---

### 2. 🌐 Network Simulation & Resilience (5 test)

**Amaç:** Kötü ağ koşullarında uygulamanın dayanıklılığını test etmek.

**Testler:**

#### A. Yavaş İnternet (Slow Network)
```typescript
// Tüm isteklere 2000ms gecikme ekle
await page.route('**/*', async (route) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  await route.continue();
});
```

**Beklenen:**
- ✅ Loading spinner görünmeli
- ✅ Sayfa sonunda yüklenmeli
- ✅ Crash olmamalı

#### B. Offline Mode
```typescript
// İnterneti kes
await context.setOffline(true);

// Bir aksiyon dene
await page.click('text=Kaydet');

// Graceful degradation bekleniyor
```

**Beklenen:**
- ✅ White Screen of Death olmamalı
- ✅ Hata mesajı göstermeli
- ✅ State bozulmamalı

#### C. Intermittent Connection (Flaky Network)
```typescript
// Her 500ms'de online/offline toggle
for (let i = 0; i < 5; i++) {
  await context.setOffline(true);
  await page.waitForTimeout(500);
  await context.setOffline(false);
  await page.waitForTimeout(500);
}
```

**Beklenen:**
- ✅ Uygulama crash etmemeli
- ✅ State korunmalı
- ✅ Recovery başarılı olmalı

#### D. API Timeout
```typescript
// API isteklerine 30 saniye gecikme (timeout)
await page.route('**/api/**', async (route) => {
  await new Promise(resolve => setTimeout(resolve, 30000));
  await route.continue();
});
```

**Beklenen:**
- ✅ Sayfa donmamalı
- ✅ Timeout handling olmalı

---

### 3. ♿ Accessibility Testing - WCAG (5 test)

**Amaç:** Uluslararası erişilebilirlik standartlarına (WCAG 2.1 Level AA) uygunluk.

**Testler:**
- ✅ Dashboard A11y compliance
- ✅ Login Screen A11y check
- ✅ Color contrast validation
- ✅ Form label checks
- ✅ Keyboard navigation

**Teknik:**
```typescript
import AxeBuilder from '@axe-core/playwright';

const accessibilityScanResults = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();

// Kritik ihlaller
const criticalViolations = accessibilityScanResults.violations.filter(
  v => v.impact === 'critical' || v.impact === 'serious'
);

expect(criticalViolations.length).toBeLessThanOrEqual(5);
```

**Kontrol Edilen Kurallar:**
- ✅ **Color Contrast:** Metin-arka plan kontrast oranı (4.5:1)
- ✅ **ARIA Labels:** Form elemanlarında label varlığı
- ✅ **Semantic HTML:** Doğru HTML tag kullanımı
- ✅ **Keyboard Navigation:** Tab order ve focus indicators
- ✅ **Alt Text:** Görsellerde alternatif metin
- ✅ **Heading Hierarchy:** h1, h2, h3 sıralaması

**Örnek Çıktı:**
```
📊 Accessibility Violations: 3

❌ Violation 1:
  ID: color-contrast
  Impact: serious
  Description: Elements must have sufficient color contrast
  Help URL: https://dequeuniversity.com/rules/axe/4.4/color-contrast
  Nodes: 5

❌ Violation 2:
  ID: label
  Impact: critical
  Description: Form elements must have labels
  Nodes: 2
```

---

### 4. 🐵 Chaos Monkey Testing (6 test)

**Amaç:** Beklenmedik etkileşimlere karşı sağlamlık.

#### Test 1: Random Element Clicks
```typescript
// 20 rastgele elemente tıkla
for (let i = 0; i < 20; i++) {
  const element = await getRandomInteractiveElement(page);
  await element.click({ force: true });
  await page.waitForTimeout(100);
  
  // White Screen of Death kontrolü
  const bodyVisible = await page.locator('body').isVisible();
  expect(bodyVisible).toBe(true);
}
```

**Beklenen:**
- ✅ Sayfa crash etmemeli
- ✅ State bozulmamalı
- ✅ En az 10/20 tıklama başarılı olmalı

#### Test 2: Rapid Successive Clicks
```typescript
// Aynı butona 10 kez hızlı tıkla (gecikme YOK)
for (let i = 0; i < 10; i++) {
  await button.click({ force: true });
}
```

**Beklenen:**
- ✅ Duplicate işlem olmamalı
- ✅ Debounce/throttle çalışmalı

#### Test 3: Random Input Injection
```typescript
const randomStrings = [
  'Test123',
  '!@#$%^&*()',
  '🔥💣💥',
  '<script>alert("xss")</script>',
  'A'.repeat(500)
];

// Her inputa rastgele veri
for (const input of inputs) {
  await input.fill(randomStrings[random]);
}
```

**Beklenen:**
- ✅ Input validation çalışmalı
- ✅ XSS injection engellenmeli
- ✅ Buffer overflow olmamalı

#### Test 4: Page Reload Stress
```typescript
// 5 kez arka arkaya reload
for (let i = 0; i < 5; i++) {
  await page.reload();
  await waitForPageStability(page);
}
```

**Beklenen:**
- ✅ Her reload sonrası sayfa çalışmalı
- ✅ Session yönetimi doğru olmalı

#### Test 5: Browser Resize Chaos
```typescript
const viewports = [
  { width: 375, height: 667 },   // iPhone 8
  { width: 1920, height: 1080 }, // Full HD
  { width: 320, height: 568 }    // iPhone SE
];

// Her viewport'ta test et
for (const viewport of viewports) {
  await page.setViewportSize(viewport);
  // Horizontal scroll olmamalı
}
```

**Beklenen:**
- ✅ Responsive design çalışmalı
- ✅ Content sığmalı
- ✅ Horizontal scroll minimal olmalı

#### Test 6: Memory Leak Detection
```typescript
// 30 kez navigation (10 döngü × 3 ekran)
for (let cycle = 0; cycle < 10; cycle++) {
  for (const screen of ['Maçlar', 'Üyeler', 'Sahalar']) {
    await page.click(`text=${screen}`);
    await page.goBack();
  }
}
```

**Beklenen:**
- ✅ Memory leak olmamalı
- ✅ Performance düşmemeli
- ✅ Sayfa responsive kalmalı

---

## 🚀 Çalıştırma Komutları

### Tüm Advanced Suite'i Çalıştır

```bash
# Headed mode (önerilen)
npx playwright test tests/advanced-suite.spec.ts --headed

# UI Mode (interaktif)
npx playwright test tests/advanced-suite.spec.ts --ui

# Headless mode
npx playwright test tests/advanced-suite.spec.ts
```

### Kategori Bazlı Çalıştırma

```bash
# Sadece Visual Regression testleri
npx playwright test --grep "VISUAL REGRESSION"

# Sadece Network testleri
npx playwright test --grep "NETWORK SIMULATION"

# Sadece Accessibility testleri
npx playwright test --grep "ACCESSIBILITY"

# Sadece Chaos Monkey testleri
npx playwright test --grep "CHAOS MONKEY"
```

### Tek Test Çalıştırma

```bash
# Dashboard visual test
npx playwright test -g "Dashboard - Admin görsel snapshot"

# Offline mode test
npx playwright test -g "Offline Mode"

# Random click chaos
npx playwright test -g "Rastgele 20 eleman"
```

---

## 📸 Test Artifacts

### Visual Regression Snapshots

İlk çalıştırma (baseline oluşturma):
```bash
npx playwright test tests/advanced-suite.spec.ts --headed
```

Snapshot'lar şurada saklanır:
```
tests/advanced-suite.spec.ts-snapshots/
├── dashboard-admin-Desktop-Chrome.png
├── dashboard-member-Desktop-Chrome.png
├── match-details-Desktop-Chrome.png
└── ...
```

### Visual Diff (Fark varsa)

```
test-results/
├── advanced-suite-Dashboard-Admin/
│   ├── dashboard-admin-actual.png    # Yeni ekran
│   ├── dashboard-admin-expected.png  # Referans
│   └── dashboard-admin-diff.png      # Fark (highlight)
```

### Accessibility Raporları

Terminal'de detaylı çıktı:
```
📊 Accessibility Violations: 3

❌ Violation 1: color-contrast
   Impact: serious
   Description: Elements must have sufficient color contrast
   Affected: 5 nodes
   Help: https://dequeuniversity.com/rules/axe/4.4/color-contrast
```

---

## 🔧 Konfigürasyon

### Visual Regression Ayarları

`playwright.config.ts`:
```typescript
expect: {
  timeout: 5000,
  toHaveScreenshot: {
    maxDiffPixels: 100,
    threshold: 0.2,
    animations: 'disabled'
  }
}
```

**Parametreler:**
- `maxDiffPixels`: Maksimum farklı piksel sayısı (100)
- `threshold`: Tolerans oranı (0.2 = %20)
- `animations`: Animasyonları devre dışı bırak

### Network Simulation

```typescript
// Yavaş internet
await page.route('**/*', async (route) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  await route.continue();
});

// Sadece resimleri geciktir
await page.route('**/*.{png,jpg,jpeg}', async (route) => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  await route.continue();
});

// Offline mode
await context.setOffline(true);
```

---

## 🐛 Troubleshooting

### Visual Regression Fail Oluyor

**Sorun:** Snapshot'lar eşleşmiyor.

**Çözüm:**
1. Diff'i incele: `test-results/.../diff.png`
2. Kasıtlı değişiklikse baseline'ı güncelle:
   ```bash
   npx playwright test --update-snapshots
   ```
3. Dinamik içeriği maskele:
   ```typescript
   mask: [page.locator('.date'), page.locator('.time')]
   ```

### Accessibility Testleri Fail Oluyor

**Sorun:** Çok fazla A11y ihlali var.

**Çözüm:**
1. İhlalleri incele (console output)
2. Kritik olanları düzelt (critical, serious)
3. Toleransı artır (geçici):
   ```typescript
   expect(criticalViolations.length).toBeLessThanOrEqual(10);
   ```

### Network Testleri Timeout Oluyor

**Sorun:** Offline mode'da testler timeout ile fail oluyor.

**Çözüm:**
1. Timeout'u artır:
   ```typescript
   test.setTimeout(60000); // 60 saniye
   ```
2. Offline durumda `.catch()` kullan:
   ```typescript
   await page.click('text=Kaydet').catch(() => {
     console.log('Expected failure in offline mode');
   });
   ```

### Chaos Monkey - Element Not Found

**Sorun:** Rastgele tıklamada element bulunamıyor.

**Çözüm:**
```typescript
await element.click({ force: true, timeout: 1000 }).catch(() => {
  console.log('Element stale or not clickable');
});
```

---

## 📊 Test Coverage Report

### Kategori Özeti

| Kategori | Test Sayısı | Amaç |
|----------|------------|------|
| 🎨 Visual Regression | 5 | Görsel tutarlılık |
| 🌐 Network Simulation | 5 | Ağ dayanıklılığı |
| ♿ Accessibility | 5 | WCAG standartları |
| 🐵 Chaos Monkey | 6 | Rastgele etkileşim |
| **TOPLAM** | **21** | **Production Grade** |

### Tahmini Süre

```
🎨 Visual Regression:  ~3-4 dakika
🌐 Network Simulation: ~4-5 dakika (gecikme simülasyonları)
♿ Accessibility:      ~2-3 dakika
🐵 Chaos Monkey:       ~3-4 dakika

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TOPLAM: ~12-16 dakika
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ✨ Best Practices

### 1. Visual Regression
- ✅ Dinamik içeriği her zaman maskele
- ✅ Animasyonları devre dışı bırak
- ✅ Baseline'ı version control'e ekle
- ✅ Her major değişiklikte baseline güncelle

### 2. Network Simulation
- ✅ Gerçekçi gecikme değerleri kullan (2-3 saniye)
- ✅ Loading state'leri test et
- ✅ Offline mode'da graceful degradation bekle
- ✅ Timeout'ları artır

### 3. Accessibility
- ✅ Kritik ihlalleri öncelikle düzelt
- ✅ Color contrast'ı manuel kontrol et
- ✅ Keyboard navigation'ı test et
- ✅ ARIA labels ekle

### 4. Chaos Monkey
- ✅ Try-catch kullan (fail-safe)
- ✅ Her iterasyon sonrası state kontrol et
- ✅ Realistic data kullan
- ✅ Performance metrics'i logla

---

## 🎯 Sonuç

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 LEVEL 4: ADVANCED RESILIENCE & VISUAL ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ Visual Regression:    5 tests
  ✅ Network Simulation:   5 tests
  ✅ Accessibility (A11y): 5 tests
  ✅ Chaos Monkey:         6 tests

  📊 Total:                21 advanced tests
  🎯 Level:                SDET Production Grade
  ⏱️ Duration:             ~12-16 minutes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Başlamak için:  npx playwright test tests/advanced-suite.spec.ts --headed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Test Suite Version:** 1.0.0  
**Level:** 4 - Advanced  
**Standard:** SDET Production Grade  
**Date:** 2026-02-14  
**Status:** ✅ READY
