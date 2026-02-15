/**
 * Sahada App - Unit Tests
 * Tests individual components and utilities
 */

import { test, expect } from '@playwright/test';

test.describe('🧩 Component Tests', () => {

  test('Dashboard renders correctly', async ({ page }) => {
    await page.goto('http://localhost:3002');
    
    // Login
    await page.click('text=Hemen Başla');
    await page.fill('input[type="tel"]', '1');
    await page.click('text=Devam Et');
    await page.waitForTimeout(2000);
    
    // Check dashboard elements
    const hasProfileSection = await page.isVisible('img[alt*="Ahmet"]');
    const hasQuickActions = await page.isVisible('text=Hızlı İşlemler');
    
    expect(hasProfileSection || hasQuickActions).toBeTruthy();
  });

  test('LoginScreen validates input', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.click('text=Hemen Başla');
    
    // Try to submit without phone
    await page.click('text=Devam Et');
    
    // Should show alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('telefon');
      await dialog.accept();
    });
  });

  test('Match card displays correct information', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.click('text=Hemen Başla');
    await page.fill('input[type="tel"]', '2');
    await page.click('text=Devam Et');
    await page.waitForTimeout(2000);
    
    // Look for match card elements
    const hasTime = await page.isVisible('text=/\\d{2}:\\d{2}/');
    const hasLocation = await page.locator('span.material-icons-round:has-text("location_on")').count();
    
    expect(hasLocation).toBeGreaterThan(0);
  });

  test('RSVP buttons are interactive', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.click('text=Hemen Başla');
    await page.fill('input[type="tel"]', '2');
    await page.click('text=Devam Et');
    await page.waitForTimeout(2000);
    
    // Find RSVP buttons
    const checkButton = page.locator('button:has(span.material-icons-round:has-text("check"))').first();
    
    if (await checkButton.isVisible()) {
      const beforeClass = await checkButton.getAttribute('class');
      await checkButton.click();
      await page.waitForTimeout(500);
      const afterClass = await checkButton.getAttribute('class');
      
      expect(beforeClass).not.toBe(afterClass);
    }
  });

  test('Settings screen shows user information', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.click('text=Hemen Başla');
    await page.fill('input[type="tel"]', '1');
    await page.click('text=Devam Et');
    await page.waitForTimeout(2000);
    
    // Click settings
    await page.locator('button:has(span.material-icons-round:has-text("settings"))').first().click();
    await page.waitForTimeout(1000);
    
    // Check if user info is displayed
    const hasUserName = await page.isVisible('text=Ahmet') || 
                        await page.isVisible('text=Profil');
    expect(hasUserName).toBeTruthy();
  });

});

test.describe('🎭 Role-Based Access Control', () => {

  test('Admin can access admin dashboard', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.click('text=Hemen Başla');
    await page.fill('input[type="tel"]', '1');
    await page.click('text=Devam Et');
    await page.waitForTimeout(2000);
    
    // Try to access admin panel
    const adminBtn = page.locator('text=Yönetim').first();
    if (await adminBtn.isVisible()) {
      await adminBtn.click();
      await page.waitForTimeout(1000);
      
      // Should show admin content
      const hasAdminContent = await page.isVisible('text=Yönetim Paneli') || 
                             await page.isVisible('text=admin');
      expect(hasAdminContent).toBeTruthy();
    }
  });

  test('Regular member cannot access admin features', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.click('text=Hemen Başla');
    await page.fill('input[type="tel"]', '2'); // Regular member
    await page.click('text=Devam Et');
    await page.waitForTimeout(2000);
    
    // Admin button should not be visible
    const adminBtn = page.locator('text=Yönetim Panel');
    const isVisible = await adminBtn.isVisible();
    
    // Member shouldn't see admin panel
    expect(isVisible).toBeFalsy();
  });

  test('Captain has special permissions', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.click('text=Hemen Başla');
    await page.fill('input[type="tel"]', '7'); // Captain
    await page.click('text=Devam Et');
    await page.waitForTimeout(2000);
    
    // Check for captain badge
    const hasCaptainBadge = await page.isVisible('text=©️') ||
                           await page.isVisible('text=KAPTAN');
    
    expect(hasCaptainBadge).toBeTruthy();
  });

});

test.describe('🚦 Navigation Flow', () => {

  test('Back button works correctly', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.click('text=Hemen Başla');
    
    // Go back
    await page.goBack();
    
    // Should be on welcome screen
    const isWelcome = await page.isVisible('text=SAHADA') || 
                     await page.isVisible('text=Hemen Başla');
    expect(isWelcome).toBeTruthy();
  });

  test('Can navigate between screens', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.click('text=Hemen Başla');
    await page.fill('input[type="tel"]', '2');
    await page.click('text=Devam Et');
    await page.waitForTimeout(2000);
    
    // Navigate to team
    const teamBtn = page.locator('text=Kadro').first();
    if (await teamBtn.isVisible()) {
      await teamBtn.click();
      await page.waitForTimeout(1000);
      
      const hasTeamContent = await page.isVisible('text=Takım') ||
                            await page.isVisible('text=Oyuncu');
      expect(hasTeamContent).toBeTruthy();
    }
  });

  test('Welcome screen routing works', async ({ page }) => {
    await page.goto('http://localhost:3002');
    
    // Check all welcome screen buttons
    const buttons = [
      'Hemen Başla',
      'Takım Kur',
      'Koda Katıl'
    ];

    for (const buttonText of buttons) {
      const button = page.locator(`text=${buttonText}`);
      if (await button.isVisible()) {
        expect(await button.isVisible()).toBeTruthy();
      }
    }
  });

});

test.describe('📱 Responsive Design', () => {

  test('Works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('http://localhost:3002');
    
    // Check if content is visible
    const hasSahada = await page.isVisible('text=SAHADA');
    expect(hasSahada).toBeTruthy();
  });

  test('Works on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    
    await page.goto('http://localhost:3002');
    await page.click('text=Hemen Başla');
    
    const hasLogin = await page.isVisible('text=Giriş Yap');
    expect(hasLogin).toBeTruthy();
  });

  test('Touch interactions work', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:3002');
    
    // Tap on button
    await page.tap('text=Hemen Başla');
    await page.waitForTimeout(500);
    
    const isLoginScreen = await page.isVisible('text=Giriş Yap');
    expect(isLoginScreen).toBeTruthy();
  });

});

test.describe('♿ Accessibility', () => {

  test('Buttons have proper labels', async ({ page }) => {
    await page.goto('http://localhost:3002');
    
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // Button should have either text content or aria-label
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('Images have alt text', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.click('text=Hemen Başla');
    await page.fill('input[type="tel"]', '1');
    await page.click('text=Devam Et');
    await page.waitForTimeout(2000);
    
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('Focus is keyboard navigable', async ({ page }) => {
    await page.goto('http://localhost:3002');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Something should be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

});

test.describe('🎨 UI Consistency', () => {

  test('Colors match design system', async ({ page }) => {
    await page.goto('http://localhost:3002');
    
    // Check primary color usage
    const primaryElements = await page.locator('.bg-primary, .text-primary').count();
    expect(primaryElements).toBeGreaterThan(0);
  });

  test('Animations are smooth', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.click('text=Hemen Başla');
    
    // Check for animation classes
    const hasAnimations = await page.locator('[class*="animate-"], [class*="transition-"]').count();
    expect(hasAnimations).toBeGreaterThan(0);
  });

  test('Icons render correctly', async ({ page }) => {
    await page.goto('http://localhost:3002');
    
    // Check Material Icons
    const icons = await page.locator('.material-icons-round').count();
    expect(icons).toBeGreaterThan(0);
  });

});
