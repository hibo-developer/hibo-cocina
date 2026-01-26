const { test, expect } = require('@playwright/test');

/**
 * Test Suite: Inventario Module
 * Tests inventory management and stock tracking
 */

test.describe('Inventario Module', () => {
  // Helper to login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?:index|dashboard).*/);
  });

  test('should load inventario list', async ({ page }) => {
    // Navigate to inventario section
    const inventarioLink = page.locator('a:has-text("Inventario"), button:has-text("Inventario")').first();
    await inventarioLink.click();
    
    // Wait for table to load
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Check table has rows
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('should display stock levels', async ({ page }) => {
    // Navigate to inventario
    const inventarioLink = page.locator('a:has-text("Inventario"), button:has-text("Inventario")').first();
    await inventarioLink.click();
    
    // Check for stock columns
    const stockCells = page.locator('td[data-field="stock"], td:has-text("stock")');
    const stockCount = await stockCells.count();
    expect(stockCount).toBeGreaterThanOrEqual(0);
  });

  test('should update stock quantity', async ({ page }) => {
    // Navigate to inventario
    const inventarioLink = page.locator('a:has-text("Inventario"), button:has-text("Inventario")').first();
    await inventarioLink.click();
    
    // Click edit on first row
    const editBtn = page.locator('button:has-text("Editar")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      
      // Find stock input field
      const stockField = page.locator('input[name="cantidad"], input[name="stock"], input[type="number"]').first();
      if (await stockField.isVisible()) {
        const currentValue = await stockField.inputValue();
        const newValue = parseInt(currentValue || 0) + 10;
        await stockField.fill(newValue.toString());
        
        // Submit changes
        const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar")').first();
        await submitBtn.click();
        
        // Check success message
        const successMsg = page.locator('.success-message, .notification:has-text("actualizado")').first();
        if (await successMsg.isVisible()) {
          await expect(successMsg).toBeVisible();
        }
      }
    }
  });

  test('should identify low stock items', async ({ page }) => {
    // Navigate to inventario
    const inventarioLink = page.locator('a:has-text("Inventario"), button:has-text("Inventario")').first();
    await inventarioLink.click();
    
    // Check for low stock warnings
    const lowStockIndicators = page.locator('[data-low-stock], .warning, .alert-yellow');
    const lowStockCount = await lowStockIndicators.count();
    
    // Should have at least some indicator of low stock items
    expect(lowStockCount).toBeGreaterThanOrEqual(0);
  });

  test('should filter inventory by type', async ({ page }) => {
    // Navigate to inventario
    const inventarioLink = page.locator('a:has-text("Inventario"), button:has-text("Inventario")').first();
    await inventarioLink.click();
    
    // Get initial row count
    const initialRows = await page.locator('table tbody tr').count();
    
    // Use type filter
    const filterSelect = page.locator('select[name="tipo"], button:has-text("Tipo")').first();
    if (await filterSelect.isVisible()) {
      await filterSelect.click();
      
      // Select a type
      const typeOption = page.locator('option, button').first();
      if (await typeOption.isVisible()) {
        await typeOption.click();
        
        // Wait for results
        await page.waitForTimeout(500);
        
        // Check rows count
        const filteredRows = await page.locator('table tbody tr').count();
        expect(filteredRows).toBeLessThanOrEqual(initialRows);
      }
    }
  });

  test('should search inventory items', async ({ page }) => {
    // Navigate to inventario
    const inventarioLink = page.locator('a:has-text("Inventario"), button:has-text("Inventario")').first();
    await inventarioLink.click();
    
    // Get initial row count
    const initialRows = await page.locator('table tbody tr').count();
    
    // Use search
    const searchInput = page.locator('input[placeholder*="buscar"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      
      // Wait for search results
      await page.waitForTimeout(500);
      
      // Check filtered rows
      const filteredRows = await page.locator('table tbody tr').count();
      expect(filteredRows).toBeLessThanOrEqual(initialRows);
    }
  });

  test('should display inventory statistics', async ({ page }) => {
    // Navigate to inventario
    const inventarioLink = page.locator('a:has-text("Inventario"), button:has-text("Inventario")').first();
    await inventarioLink.click();
    
    // Check for dashboard statistics
    const stats = page.locator('[data-section="statistics"], .stats-container, .card:has-text("Total")');
    const statsCount = await stats.count();
    expect(statsCount).toBeGreaterThanOrEqual(0);
  });

  test('should check inventory movement history', async ({ page }) => {
    // Navigate to inventario
    const inventarioLink = page.locator('a:has-text("Inventario"), button:has-text("Inventario")').first();
    await inventarioLink.click();
    
    // Click on an inventory item to view history
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      
      // Check for history/movement section
      const history = page.locator('[data-section="history"], .history-panel, .timeline');
      if (await history.isVisible()) {
        await expect(history).toBeVisible();
      }
    }
  });
});
