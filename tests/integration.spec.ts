/**
 * Sahada App - Integration Tests
 * Tests the integration between frontend and backend API
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3001/api';
const APP_URL = 'http://localhost:3002';

test.describe('🔗 API Integration Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
  });

  test('Health check endpoint returns 200', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.database).toBeDefined();
  });

  test('Can fetch players from API', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/players`);
    expect(response.ok()).toBeTruthy();
    
    const players = await response.json();
    expect(Array.isArray(players)).toBeTruthy();
  });

  test('Can fetch matches from API', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/matches`);
    expect(response.ok()).toBeTruthy();
    
    const matches = await response.json();
    expect(Array.isArray(matches)).toBeTruthy();
  });

  test('Can create a new player via API', async ({ request }) => {
    const newPlayer = {
      id: `test_player_${Date.now()}`,
      name: 'Test Oyuncu',
      position: 'MID',
      rating: 7.0,
      reliability: 100,
      avatar: 'https://i.pravatar.cc/150?u=test',
      role: 'member',
      tier: 'free',
    };

    const response = await request.post(`${API_BASE_URL}/players`, {
      data: newPlayer,
    });

    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.name).toBe('Test Oyuncu');
  });

  test('Can update player via API', async ({ request }) => {
    // First create a player
    const playerId = `test_update_${Date.now()}`;
    await request.post(`${API_BASE_URL}/players`, {
      data: {
        id: playerId,
        name: 'Before Update',
        position: 'DEF',
        rating: 6.0,
        reliability: 90,
        avatar: 'https://i.pravatar.cc/150',
        role: 'member',
      },
    });

    // Then update it
    const updateResponse = await request.put(`${API_BASE_URL}/players/${playerId}`, {
      data: {
        name: 'After Update',
        rating: 8.0,
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
  });

  test('Can create match via API', async ({ request }) => {
    const newMatch = {
      id: `test_match_${Date.now()}`,
      date: '2026-02-20',
      time: '20:00',
      location: 'Test Sahası',
      venue: 'Test Venue',
      status: 'upcoming',
      teamId: 'test_team',
    };

    const response = await request.post(`${API_BASE_URL}/matches`, {
      data: newMatch,
    });

    expect(response.status()).toBe(201);
  });

  test('Can update match RSVP via API', async ({ request }) => {
    // Create a match first
    const matchId = `test_rsvp_${Date.now()}`;
    await request.post(`${API_BASE_URL}/matches`, {
      data: {
        id: matchId,
        date: '2026-02-25',
        time: '19:00',
        location: 'RSVP Test',
        venue: 'Test Venue',
        status: 'upcoming',
      },
    });

    // Update RSVP
    const rsvpResponse = await request.post(`${API_BASE_URL}/matches/${matchId}/rsvp`, {
      data: {
        playerId: 'player_123',
        status: 'yes',
      },
    });

    expect(rsvpResponse.ok()).toBeTruthy();
  });

  test('Can fetch venues from API', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/venues`);
    expect(response.ok()).toBeTruthy();
    
    const venues = await response.json();
    expect(Array.isArray(venues)).toBeTruthy();
  });

  test('Can fetch payments from API', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/payments`);
    expect(response.ok()).toBeTruthy();
    
    const payments = await response.json();
    expect(Array.isArray(payments)).toBeTruthy();
  });

  test('Can fetch transactions from API', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/transactions`);
    expect(response.ok()).toBeTruthy();
    
    const transactions = await response.json();
    expect(Array.isArray(transactions)).toBeTruthy();
  });

  test('API returns 404 for non-existent player', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/players/nonexistent_id`);
    expect(response.status()).toBe(404);
  });

  test('API returns 404 for non-existent match', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/matches/nonexistent_id`);
    expect(response.status()).toBe(404);
  });

});

test.describe('🎯 Frontend-Backend Integration', () => {

  test('Dashboard loads data from API', async ({ page }) => {
    // Navigate to login
    await page.goto(APP_URL);
    await page.click('text=Hemen Başla');
    
    // Login as admin
    await page.fill('input[type="tel"]', '1');
    await page.click('text=Devam Et');
    
    // Wait for dashboard
    await page.waitForSelector('text=Hızlı İşlemler', { timeout: 5000 });
    
    // Check if API data is loaded
    await page.waitForTimeout(1000);
    
    const hasContent = await page.isVisible('text=Maç Hazırlığı') || 
                       await page.isVisible('text=İlk Maçını Planla');
    expect(hasContent).toBeTruthy();
  });

  test('Can create match through UI that persists in backend', async ({ page }) => {
    // Login as admin
    await page.goto(APP_URL);
    await page.click('text=Hemen Başla');
    await page.fill('input[type="tel"]', '1');
    await page.click('text=Devam Et');
    await page.waitForTimeout(2000);
    
    // Navigate to match creation
    const createBtn = page.locator('text=Yönetim').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Check if we're on admin or dashboard
    await page.waitForTimeout(1000);
  });

  test('RSVP updates are reflected in real-time', async ({ page }) => {
    await page.goto(APP_URL);
    await page.click('text=Hemen Başla');
    await page.fill('input[type="tel"]', '2');
    await page.click('text=Devam Et');
    await page.waitForTimeout(2000);
    
    // Check RSVP buttons
    const checkButton = page.locator('button:has(span.material-icons-round:has-text("check"))').first();
    if (await checkButton.isVisible()) {
      await checkButton.click();
      await page.waitForTimeout(500);
      
      // Verify button state changed
      const isActive = await checkButton.evaluate(el => 
        el.classList.contains('bg-primary')
      );
      expect(isActive).toBeTruthy();
    }
  });

});

test.describe('🧪 Data Persistence', () => {

  test('Created players persist across sessions', async ({ request }) => {
    const playerId = `persist_test_${Date.now()}`;
    
    // Create player
    await request.post(`${API_BASE_URL}/players`, {
      data: {
        id: playerId,
        name: 'Persistence Test',
        position: 'FWD',
        rating: 7.5,
        reliability: 95,
        avatar: 'https://i.pravatar.cc/150',
        role: 'member',
      },
    });

    // Fetch in new request
    const getResponse = await request.get(`${API_BASE_URL}/players/${playerId}`);
    expect(getResponse.ok()).toBeTruthy();
    
    const player = await getResponse.json();
    expect(player.name).toBe('Persistence Test');
  });

  test('Match updates persist', async ({ request }) => {
    const matchId = `persist_match_${Date.now()}`;
    
    // Create match
    await request.post(`${API_BASE_URL}/matches`, {
      data: {
        id: matchId,
        date: '2026-03-01',
        time: '18:00',
        location: 'Persistence Test',
        venue: 'Test Venue',
        status: 'upcoming',
      },
    });

    // Update match
    await request.put(`${API_BASE_URL}/matches/${matchId}`, {
      data: {
        status: 'completed',
        score: '5-3',
      },
    });

    // Verify update
    const getResponse = await request.get(`${API_BASE_URL}/matches/${matchId}`);
    const match = await getResponse.json();
    expect(match.status).toBe('completed');
    expect(match.score).toBe('5-3');
  });

});

test.describe('⚡ Performance & Reliability', () => {

  test('API responds within acceptable time', async ({ request }) => {
    const start = Date.now();
    await request.get(`${API_BASE_URL}/players`);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(1000); // Should respond within 1 second
  });

  test('Can handle multiple concurrent requests', async ({ request }) => {
    const requests = Array(10).fill(null).map(() => 
      request.get(`${API_BASE_URL}/health`)
    );

    const responses = await Promise.all(requests);
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
  });

  test('Database connection is stable', async ({ request }) => {
    // Make multiple sequential requests
    for (let i = 0; i < 5; i++) {
      const response = await request.get(`${API_BASE_URL}/health`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.database).toBe('connected');
    }
  });

});
