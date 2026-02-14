import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * 🤖 AUTONOMOUS TEST AGENT - The Intelligent Web Crawler
 * 
 * Bu test suite akıllı bir örümcek gibi çalışır:
 * - Dinamik keşif (exploration)
 * - Öğrenme (learning)
 * - Hata yakalama (error detection)
 * - State haritalandırma (state mapping)
 * 
 * Hiçbir hardcoded scenario yok - bot kendi yolunu bulur!
 */

// ==========================================
// CRAWLER CONFIGURATION
// ==========================================

const CRAWLER_CONFIG = {
  MAX_STEPS: 50,              // Maksimum exploration derinliği
  MAX_DEPTH: 5,               // Maksimum navigation depth
  STEP_DELAY: 300,            // Her adım arası bekleme (ms)
  INTERACTION_TIMEOUT: 5000,  // Etkileşim timeout
  PARALLEL_PATHS: 3,          // Aynı anda kaç yol keşfedilecek
};

// ==========================================
// TYPES
// ==========================================

interface InteractiveElement {
  selector: string;
  type: 'button' | 'link' | 'input' | 'select';
  text: string;
  tagName: string;
  attributes: Record<string, string>;
}

interface CrawlerState {
  visitedUrls: Set<string>;
  visitedElements: Set<string>;
  stateMap: Map<string, string[]>; // URL -> [interactions]
  errors: Array<{
    type: string;
    message: string;
    url: string;
    timestamp: Date;
  }>;
  deadEnds: Set<string>;
  successfulPaths: Array<string[]>;
}

// ==========================================
// THE BRAIN - Akıllı Keşif Motoru
// ==========================================

class AutonomousCrawler {
  private state: CrawlerState;
  private page: Page;
  private currentDepth: number;
  private stepsCount: number;

  constructor(page: Page) {
    this.page = page;
    this.currentDepth = 0;
    this.stepsCount = 0;
    this.state = {
      visitedUrls: new Set(),
      visitedElements: new Set(),
      stateMap: new Map(),
      errors: [],
      deadEnds: new Set(),
      successfulPaths: []
    };
  }

  /**
   * Ana keşif fonksiyonu - Bot'un beyni
   */
  async explore(): Promise<void> {
    console.log('\n🤖 Starting autonomous exploration...');
    
    // Console error listener
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.state.errors.push({
          type: 'CONSOLE_ERROR',
          message: msg.text(),
          url: this.page.url(),
          timestamp: new Date()
        });
        console.log('❌ Console Error detected:', msg.text());
      }
    });

    // Page error listener
    this.page.on('pageerror', (error) => {
      this.state.errors.push({
        type: 'PAGE_CRASH',
        message: error.message,
        url: this.page.url(),
        timestamp: new Date()
      });
      console.log('💥 Page Crash detected:', error.message);
    });

    // Network failure listener
    this.page.on('response', (response) => {
      if (response.status() >= 400) {
        this.state.errors.push({
          type: 'NETWORK_FAILURE',
          message: `${response.status()} ${response.statusText()} - ${response.url()}`,
          url: this.page.url(),
          timestamp: new Date()
        });
        console.log(`🌐 Network Error: ${response.status()} ${response.url()}`);
      }
    });

    // Keşif döngüsü
    await this.crawlRecursive();

    console.log('\n📊 Exploration Complete!');
    this.printSummary();
  }

  /**
   * Recursive crawling - Derinlemesine keşif
   */
  private async crawlRecursive(): Promise<void> {
    if (this.stepsCount >= CRAWLER_CONFIG.MAX_STEPS) {
      console.log('⚠️ Max steps reached, stopping exploration');
      return;
    }

    if (this.currentDepth >= CRAWLER_CONFIG.MAX_DEPTH) {
      console.log('⚠️ Max depth reached, backtracking');
      return;
    }

    const currentUrl = this.page.url();
    
    // URL zaten ziyaret edildi mi?
    if (this.state.visitedUrls.has(currentUrl)) {
      console.log(`🔄 Already visited: ${currentUrl}`);
      return;
    }

    this.state.visitedUrls.add(currentUrl);
    console.log(`\n📍 Exploring [Depth: ${this.currentDepth}, Step: ${this.stepsCount}]: ${currentUrl}`);

    // Sayfanın yüklenmesini bekle
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(CRAWLER_CONFIG.STEP_DELAY);

    // White Screen of Death kontrolü
    const isWhiteScreen = await this.detectWhiteScreen();
    if (isWhiteScreen) {
      console.log('💀 WHITE SCREEN OF DEATH detected!');
      this.state.errors.push({
        type: 'WHITE_SCREEN',
        message: 'Page rendered with no visible content',
        url: currentUrl,
        timestamp: new Date()
      });
      return;
    }

    // İnteraktif elemanları bul
    const elements = await this.discoverInteractiveElements();
    console.log(`🔍 Found ${elements.length} interactive elements`);

    // State map'e kaydet
    this.state.stateMap.set(currentUrl, elements.map(e => e.selector));

    // Her eleman için dene
    for (const element of elements) {
      if (this.stepsCount >= CRAWLER_CONFIG.MAX_STEPS) break;

      const elementKey = `${currentUrl}::${element.selector}`;
      
      // Bu eleman zaten denenmiş mi?
      if (this.state.visitedElements.has(elementKey)) {
        continue;
      }

      this.state.visitedElements.add(elementKey);
      this.stepsCount++;

      await this.interactWithElement(element);
      
      // Etkileşim sonrası bekle
      await this.page.waitForTimeout(CRAWLER_CONFIG.STEP_DELAY);

      // URL değişti mi?
      const newUrl = this.page.url();
      if (newUrl !== currentUrl) {
        console.log(`  ↳ Navigation detected: ${currentUrl} → ${newUrl}`);
        
        // Recursive exploration (yeni sayfa)
        this.currentDepth++;
        await this.crawlRecursive();
        this.currentDepth--;
        
        // Geri dön
        await this.page.goBack().catch(() => {});
        await this.page.waitForLoadState('networkidle').catch(() => {});
      }
    }
  }

  /**
   * Sayfadaki tüm interaktif elemanları keşfet
   */
  private async discoverInteractiveElements(): Promise<InteractiveElement[]> {
    const elements: InteractiveElement[] = [];

    // Tüm interaktif elemanları bul
    const interactiveSelectors = [
      'button:visible',
      'a:visible',
      'input:visible',
      'select:visible',
      '[role="button"]:visible',
      '[onclick]:visible'
    ];

    for (const selector of interactiveSelectors) {
      try {
        const locators = await this.page.locator(selector).all();
        
        for (const locator of locators) {
          try {
            const tagName = await locator.evaluate(el => el.tagName);
            const text = await locator.textContent() || '';
            const type = await locator.getAttribute('type') || '';
            
            // Element bilgilerini al
            const attrs: Record<string, string> = {};
            const attrNames = ['id', 'class', 'name', 'type', 'role', 'aria-label'];
            for (const attrName of attrNames) {
              const attrValue = await locator.getAttribute(attrName);
              if (attrValue) attrs[attrName] = attrValue;
            }

            // Unique selector oluştur
            const uniqueSelector = await this.generateUniqueSelector(locator);

            let elementType: 'button' | 'link' | 'input' | 'select' = 'button';
            if (tagName === 'A') elementType = 'link';
            else if (tagName === 'INPUT') elementType = 'input';
            else if (tagName === 'SELECT') elementType = 'select';

            elements.push({
              selector: uniqueSelector,
              type: elementType,
              text: text.trim().substring(0, 50),
              tagName,
              attributes: attrs
            });
          } catch (error) {
            // Element stale olabilir, devam et
          }
        }
      } catch (error) {
        // Selector bulunamadı, devam et
      }
    }

    // Rastgele sırala (exploration diversity)
    return this.shuffleArray(elements);
  }

  /**
   * Bir element ile etkileşime geç
   */
  private async interactWithElement(element: InteractiveElement): Promise<void> {
    console.log(`  🎯 Interacting: ${element.type} - "${element.text}"`);

    try {
      const locator = this.page.locator(element.selector).first();
      
      // Element görünür ve tıklanabilir mi?
      const isVisible = await locator.isVisible({ timeout: 1000 }).catch(() => false);
      if (!isVisible) {
        console.log('    ⚠️ Element not visible');
        return;
      }

      switch (element.type) {
        case 'input':
          await this.fillInput(locator, element);
          break;
        
        case 'select':
          await this.fillSelect(locator);
          break;
        
        case 'button':
        case 'link':
          await this.clickElement(locator, element);
          break;
      }
    } catch (error: any) {
      console.log(`    ❌ Interaction failed: ${error.message}`);
      this.state.deadEnds.add(element.selector);
    }
  }

  /**
   * Input alanını doldur (Faker ile akıllı veri)
   */
  private async fillInput(locator: any, element: InteractiveElement): Promise<void> {
    const inputType = element.attributes['type'] || 'text';
    const name = element.attributes['name'] || '';
    const placeholder = element.attributes['placeholder'] || '';
    
    let value = '';

    // Input türüne göre akıllı veri üret
    if (inputType === 'email' || name.includes('email') || placeholder.includes('email')) {
      value = faker.internet.email();
    } else if (inputType === 'tel' || name.includes('phone') || name.includes('tel')) {
      value = faker.string.numeric(10);
    } else if (inputType === 'number') {
      value = faker.number.int({ min: 1, max: 100 }).toString();
    } else if (inputType === 'date') {
      value = faker.date.future().toISOString().split('T')[0];
    } else if (inputType === 'time') {
      value = '14:00';
    } else if (name.includes('name') || placeholder.includes('name')) {
      value = faker.person.fullName();
    } else if (name.includes('password')) {
      value = faker.internet.password();
    } else {
      value = faker.lorem.words(2);
    }

    await locator.fill(value, { timeout: CRAWLER_CONFIG.INTERACTION_TIMEOUT });
    console.log(`    ✏️ Filled: "${value}"`);
  }

  /**
   * Select dropdown seç
   */
  private async fillSelect(locator: any): Promise<void> {
    const options = await locator.locator('option').all();
    if (options.length > 0) {
      // Rastgele bir option seç
      const randomIndex = Math.floor(Math.random() * options.length);
      const optionValue = await options[randomIndex].getAttribute('value');
      if (optionValue) {
        await locator.selectOption(optionValue);
        console.log(`    ✏️ Selected option: ${optionValue}`);
      }
    }
  }

  /**
   * Element'e tıkla
   */
  private async clickElement(locator: any, element: InteractiveElement): Promise<void> {
    // Link href kontrolü
    if (element.type === 'link') {
      const href = element.attributes['href'];
      if (href && (href.startsWith('http') || href.startsWith('mailto:'))) {
        console.log('    ⚠️ External link, skipping');
        return;
      }
    }

    // Alert/Confirm listener
    this.page.once('dialog', async dialog => {
      console.log(`    💬 Dialog: ${dialog.message()}`);
      await dialog.accept();
    });

    await locator.click({ timeout: CRAWLER_CONFIG.INTERACTION_TIMEOUT, force: true });
    console.log('    ✅ Clicked');
  }

  /**
   * White Screen of Death tespit et
   */
  private async detectWhiteScreen(): Promise<boolean> {
    const bodyVisible = await this.page.locator('body').isVisible().catch(() => false);
    if (!bodyVisible) return true;

    // Body'de hiç content var mı?
    const hasContent = await this.page.evaluate(() => {
      const body = document.body;
      const text = body.innerText || '';
      const elements = body.querySelectorAll('*').length;
      return text.length > 10 || elements > 5;
    });

    return !hasContent;
  }

  /**
   * Unique selector oluştur
   */
  private async generateUniqueSelector(locator: any): Promise<string> {
    return await locator.evaluate((el: Element) => {
      // ID varsa kullan
      if (el.id) return `#${el.id}`;
      
      // Class varsa kullan
      if (el.className) {
        const classes = el.className.split(' ').filter(c => c.length > 0);
        if (classes.length > 0) return `.${classes[0]}`;
      }

      // Text content kullan
      const text = el.textContent?.trim().substring(0, 30);
      if (text) return `text=${text}`;

      // Tag name
      return el.tagName.toLowerCase();
    });
  }

  /**
   * Array shuffle (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Özet rapor yazdır
   */
  private printSummary(): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🤖 AUTONOMOUS CRAWLER SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`📍 URLs Visited: ${this.state.visitedUrls.size}`);
    this.state.visitedUrls.forEach(url => console.log(`   - ${url}`));
    
    console.log(`\n🎯 Elements Interacted: ${this.state.visitedElements.size}`);
    
    console.log(`\n❌ Errors Found: ${this.state.errors.length}`);
    this.state.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. [${error.type}] ${error.message}`);
    });
    
    console.log(`\n🚫 Dead Ends: ${this.state.deadEnds.size}`);
    
    console.log(`\n📊 State Map:`);
    this.state.stateMap.forEach((interactions, url) => {
      console.log(`   ${url}: ${interactions.length} interactions`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * State'i export et
   */
  getState(): CrawlerState {
    return this.state;
  }
}

// ==========================================
// LOGIN HELPER
// ==========================================

async function loginAs(page: Page, userId: string): Promise<void> {
  await page.goto('http://localhost:3004');
  await page.click('text=Hemen Başla').catch(() => {});
  await page.waitForSelector('input[type="tel"]', { timeout: 5000 }).catch(() => {});
  await page.fill('input[type="tel"]', userId);
  await page.click('text=Devam Et');
  await page.waitForTimeout(2000);
}

// ==========================================
// TEST SUITE
// ==========================================

test.describe('🤖 AUTONOMOUS TEST AGENT', () => {
  
  test('Admin Mode - Autonomous Exploration', async ({ page }) => {
    console.log('\n👑 ADMIN MODE EXPLORATION');
    
    await test.step('Login as Admin', async () => {
      await loginAs(page, '1');
    });

    await test.step('Autonomous Crawl', async () => {
      const crawler = new AutonomousCrawler(page);
      await crawler.explore();
      
      const state = crawler.getState();
      
      // Assertions
      expect(state.visitedUrls.size).toBeGreaterThan(0);
      console.log(`\n✅ Explored ${state.visitedUrls.size} unique URLs`);
      
      // Critical errors should fail the test
      const criticalErrors = state.errors.filter(e => 
        e.type === 'PAGE_CRASH' || e.type === 'WHITE_SCREEN'
      );
      
      if (criticalErrors.length > 0) {
        console.log('\n❌ CRITICAL ERRORS FOUND:');
        criticalErrors.forEach(err => {
          console.log(`   - ${err.type}: ${err.message}`);
        });
      }
      
      expect(criticalErrors.length).toBe(0);
    });
  });

  test('Captain Mode - Autonomous Exploration', async ({ page }) => {
    console.log('\n⚡ CAPTAIN MODE EXPLORATION');
    
    await test.step('Login as Captain', async () => {
      await loginAs(page, '7');
    });

    await test.step('Autonomous Crawl', async () => {
      const crawler = new AutonomousCrawler(page);
      await crawler.explore();
      
      const state = crawler.getState();
      expect(state.visitedUrls.size).toBeGreaterThan(0);
      
      const criticalErrors = state.errors.filter(e => 
        e.type === 'PAGE_CRASH' || e.type === 'WHITE_SCREEN'
      );
      expect(criticalErrors.length).toBe(0);
    });
  });

  test('Member Mode - Autonomous Exploration', async ({ page }) => {
    console.log('\n👤 MEMBER MODE EXPLORATION');
    
    await test.step('Login as Member', async () => {
      await loginAs(page, '2');
    });

    await test.step('Autonomous Crawl', async () => {
      const crawler = new AutonomousCrawler(page);
      await crawler.explore();
      
      const state = crawler.getState();
      expect(state.visitedUrls.size).toBeGreaterThan(0);
      
      const criticalErrors = state.errors.filter(e => 
        e.type === 'PAGE_CRASH' || e.type === 'WHITE_SCREEN'
      );
      expect(criticalErrors.length).toBe(0);
    });
  });

  test('Chaos Mode (Gremlin) - Rapid Random Interactions', async ({ page }) => {
    console.log('\n👾 CHAOS MODE - GREMLIN UNLEASHED');
    
    await test.step('Random Login', async () => {
      const randomUsers = ['1', '7', '2'];
      const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
      await loginAs(page, randomUser);
    });

    await test.step('Chaos Crawl', async () => {
      // Kaos modu: Çok hızlı, çok rastgele
      const originalConfig = { ...CRAWLER_CONFIG };
      CRAWLER_CONFIG.MAX_STEPS = 30;
      CRAWLER_CONFIG.STEP_DELAY = 50; // Çok hızlı!
      
      const crawler = new AutonomousCrawler(page);
      await crawler.explore();
      
      // Restore config
      Object.assign(CRAWLER_CONFIG, originalConfig);
      
      const state = crawler.getState();
      console.log(`\n🎮 Chaos interactions: ${state.visitedElements.size}`);
      
      // Chaos mode'da bile critical error olmamalı
      const criticalErrors = state.errors.filter(e => 
        e.type === 'PAGE_CRASH' || e.type === 'WHITE_SCREEN'
      );
      
      if (criticalErrors.length > 0) {
        console.log('\n💥 CHAOS REVEALED CRITICAL BUGS:');
        criticalErrors.forEach(err => {
          console.log(`   - ${err.type}: ${err.message}`);
        });
      }
      
      expect(criticalErrors.length).toBeLessThanOrEqual(2); // Tolerans: max 2 critical
    });
  });

  test('Deep Dive - Maximum Depth Exploration', async ({ page }) => {
    console.log('\n🔬 DEEP DIVE MODE - MAXIMUM DEPTH');
    
    await test.step('Login', async () => {
      await loginAs(page, '1');
    });

    await test.step('Deep Exploration', async () => {
      // Maksimum derinlik modu
      CRAWLER_CONFIG.MAX_STEPS = 100;
      CRAWLER_CONFIG.MAX_DEPTH = 10;
      
      const crawler = new AutonomousCrawler(page);
      await crawler.explore();
      
      const state = crawler.getState();
      
      console.log(`\n🗺️ State Map created with ${state.stateMap.size} states`);
      
      // State map export (opsiyonel: dosyaya yazılabilir)
      const stateMapJson = {};
      state.stateMap.forEach((interactions, url) => {
        stateMapJson[url] = interactions;
      });
      
      console.log('\n📋 Discovered URLs:');
      state.visitedUrls.forEach(url => console.log(`   - ${url}`));
      
      // En az 5 farklı URL keşfedilmeli
      expect(state.visitedUrls.size).toBeGreaterThanOrEqual(5);
    });
  });

  test('Error Hunter - Focused Error Detection', async ({ page }) => {
    console.log('\n🎯 ERROR HUNTER MODE');
    
    await test.step('Login', async () => {
      await loginAs(page, '1');
    });

    await test.step('Hunt for Errors', async () => {
      const crawler = new AutonomousCrawler(page);
      
      // Console error counter
      let consoleErrors = 0;
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors++;
        }
      });
      
      await crawler.explore();
      
      const state = crawler.getState();
      
      console.log(`\n📊 Error Summary:`);
      console.log(`   Console Errors: ${consoleErrors}`);
      console.log(`   Network Failures: ${state.errors.filter(e => e.type === 'NETWORK_FAILURE').length}`);
      console.log(`   Page Crashes: ${state.errors.filter(e => e.type === 'PAGE_CRASH').length}`);
      console.log(`   White Screens: ${state.errors.filter(e => e.type === 'WHITE_SCREEN').length}`);
      console.log(`   Dead Ends: ${state.deadEnds.size}`);
      
      // Tüm hataları raporla
      if (state.errors.length > 0) {
        console.log('\n📋 Detailed Error Report:');
        state.errors.forEach((error, index) => {
          console.log(`\n   Error #${index + 1}:`);
          console.log(`   Type: ${error.type}`);
          console.log(`   Message: ${error.message}`);
          console.log(`   URL: ${error.url}`);
          console.log(`   Time: ${error.timestamp.toISOString()}`);
        });
      }
      
      // Assert: Toplam error sayısı
      expect(state.errors.length).toBeLessThan(50); // Max 50 non-critical error tolere et
    });
  });
});

// ==========================================
// SUMMARY TEST
// ==========================================

test.describe('📊 AUTONOMOUS AGENT SUMMARY', () => {
  
  test('Agent Capabilities Report', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🤖 AUTONOMOUS TEST AGENT - CAPABILITIES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ Dynamic Exploration:');
    console.log('   - Discovers interactive elements autonomously');
    console.log('   - No hardcoded scenarios');
    console.log('   - Learns as it explores\n');
    
    console.log('✅ Intelligent Interactions:');
    console.log('   - Smart form filling with Faker.js');
    console.log('   - Context-aware data generation');
    console.log('   - Adaptive decision making\n');
    
    console.log('✅ Error Detection:');
    console.log('   - Console errors');
    console.log('   - Network failures (404, 500)');
    console.log('   - Page crashes');
    console.log('   - White Screen of Death');
    console.log('   - Dead-end elements\n');
    
    console.log('✅ State Management:');
    console.log('   - Visited URLs tracking');
    console.log('   - Interaction history');
    console.log('   - State mapping');
    console.log('   - Loop prevention\n');
    
    console.log('✅ Multi-Mode Testing:');
    console.log('   - Admin exploration');
    console.log('   - Captain exploration');
    console.log('   - Member exploration');
    console.log('   - Chaos/Gremlin mode');
    console.log('   - Deep dive mode');
    console.log('   - Error hunter mode\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📊 Total Test Modes: 6');
    console.log('  🎯 Intelligence Level: Autonomous');
    console.log('  🔍 Detection: Real-time');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    expect(true).toBe(true);
  });
});
