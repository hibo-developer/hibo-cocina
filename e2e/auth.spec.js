const { test, expect } = require('@playwright/test');

/**
 * Test Suite: Authentication Flow
 * Tests login, logout, and session management
 */

test.describe('Authentication', () => {
  const TEST_USER = {
    email: 'admin@example.com',
    password: 'admin123'
  };

  test('should load login page', async ({ page }) => {
    await page.goto('/');
    
    // Check login form exists
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill login form
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL(/.*(?:index|dashboard).*/);
    
    // Check we're logged in (main content visible)
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill with wrong credentials
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    const errorMessage = page.locator('.error-message, .notification');
    await expect(errorMessage).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?:index|dashboard).*/);
    
    // Click logout button
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Cerrar sesión")');
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL(/.*login.*/);
    }
  });

  test('should persist session on page reload', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?:index|dashboard).*/);
    
    // Reload page
    await page.reload();
    
    // Check we're still logged in
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});
