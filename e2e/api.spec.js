const { test, expect } = require('@playwright/test');

/**
 * Test Suite: API Integration Tests
 * Tests backend API endpoints and data integrity
 */

test.describe('API Integration', () => {
  const BASE_URL = 'http://localhost:3000/api';
  let authToken = '';

  test.beforeAll(async () => {
    // This would need a proper setup - token from auth endpoint
    // For now, tests will check public endpoints
  });

  test('should respond to health check', async ({ page }) => {
    const response = await page.request.get(`http://localhost:3000/api/health`);
    
    // Check status
    expect(response.status()).toBe(200);
    
    // Check response body
    const data = await response.json();
    expect(data).toHaveProperty('version');
  });

  test('should return platos list', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/platos`);
    
    // Check status
    expect(response.status()).toBe(200);
    
    // Check response structure
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should return platos with pagination', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/platos?limit=10&offset=0`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should return platos statistics', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/platos/estadisticas`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('total');
    expect(data.data).toHaveProperty('activos');
  });

  test('should return ingredientes list', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/ingredientes`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should return pedidos list', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/pedidos`);
    
    // Status might be 200 or 401 depending on auth
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
  });

  test('should return pedidos statistics', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/pedidos/estadisticas`);
    
    const data = await response.json();
    if (response.status() === 200) {
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('total');
    }
  });

  test('should return inventario list', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/inventario`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should return escandallos list', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/escandallos`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should handle 404 errors gracefully', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/nonexistent-endpoint`);
    
    expect(response.status()).toBe(404);
  });

  test('should enforce rate limiting', async ({ page }) => {
    // Make multiple rapid requests
    const requests = [];
    for (let i = 0; i < 150; i++) {
      requests.push(
        page.request.get(`${BASE_URL}/platos`)
      );
    }
    
    const responses = await Promise.all(requests);
    
    // Should have some 429 (Too Many Requests) responses
    const rateLimited = responses.filter(r => r.status() === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('should validate request headers', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/platos`, {
      headers: {
        'User-Agent': 'Playwright Test'
      }
    });
    
    expect(response.status()).toBe(200);
  });

  test('should handle JSON responses correctly', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/platos`);
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });
});
