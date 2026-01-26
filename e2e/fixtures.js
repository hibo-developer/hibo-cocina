const { test, expect } = require('@playwright/test');

/**
 * Test fixtures and utilities
 */

// Default credentials para tests
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

/**
 * Fixture para login automático
 */
const authenticatedTest = test.extend({
  authenticatedPage: async ({ page }, use) => {
    // Login before test
    await page.goto('/');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL(/.*dashboard.*/);
    
    // Use the page in the test
    await use(page);
  }
});

module.exports = {
  test: authenticatedTest,
  expect,
  TEST_USER
};
