import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for SAHADA App
 * Full E2E Testing Setup
 */
export default defineConfig({
  testDir: './tests',
  
  // Test timeouts
  timeout: 30 * 1000, // 30 seconds per test
  expect: {
    timeout: 5000 // 5 seconds for assertions
  },
  
  // Parallelization
  fullyParallel: false, // Sequential execution for stability
  forbidOnly: !!process.env.CI, // Fail on .only() in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  // Shared settings
  use: {
    // Base URL
    baseURL: 'http://localhost:3004',
    
    // Browser options
    headless: false, // Debug için görünür mod
    viewport: { width: 375, height: 812 }, // iPhone X boyutu
    
    // Tracing
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Test projeler (farklı cihazlar)
  projects: [
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
  ],

  // Web Server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3004',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
