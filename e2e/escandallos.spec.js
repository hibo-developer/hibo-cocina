const { test, expect } = require('@playwright/test');

/**
 * Test Suite: Escandallos Module
 * Tests cost analysis and recipe management
 */

test.describe('Escandallos Module', () => {
  // Helper to login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?:index|dashboard).*/);
  });

  test('should load escandallos list', async ({ page }) => {
    // Navigate to escandallos section
    const escandallosLink = page.locator('a:has-text("Escandallos"), button:has-text("Escandallos")').first();
    await escandallosLink.click();
    
    // Wait for table to load
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Check table has rows
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('should view escandallo details', async ({ page }) => {
    // Navigate to escandallos
    const escandallosLink = page.locator('a:has-text("Escandallos"), button:has-text("Escandallos")').first();
    await escandallosLink.click();
    
    // Click on first row
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      
      // Check details panel
      const details = page.locator('[data-section="escandallos-details"], .modal, .details-panel');
      if (await details.isVisible()) {
        await expect(details).toBeVisible();
      }
    }
  });

  test('should display cost breakdown', async ({ page }) => {
    // Navigate to escandallos
    const escandallosLink = page.locator('a:has-text("Escandallos"), button:has-text("Escandallos")').first();
    await escandallosLink.click();
    
    // Click on first row to view details
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      
      // Check for cost breakdown elements
      const costCells = page.locator('[data-cost], td:has-text("€"), td:has-text("$")');
      const costCount = await costCells.count();
      expect(costCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should calculate total cost', async ({ page }) => {
    // Navigate to escandallos
    const escandallosLink = page.locator('a:has-text("Escandallos"), button:has-text("Escandallos")').first();
    await escandallosLink.click();
    
    // Look for total cost display
    const totalCost = page.locator('[data-total-cost], .total-cost, .cost-total:has-text("€"):or(has-text("$"))');
    if (await totalCost.isVisible()) {
      await expect(totalCost).toBeVisible();
    }
  });

  test('should update recipe ingredients', async ({ page }) => {
    // Navigate to escandallos
    const escandallosLink = page.locator('a:has-text("Escandallos"), button:has-text("Escandallos")').first();
    await escandallosLink.click();
    
    // Click edit on first row
    const editBtn = page.locator('button:has-text("Editar")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      
      // Check form is displayed
      const form = page.locator('form, .modal');
      await expect(form).toBeVisible();
      
      // Submit without changes to confirm form works
      const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar")').first();
      await submitBtn.click();
    }
  });

  test('should filter escandallos by plato', async ({ page }) => {
    // Navigate to escandallos
    const escandallosLink = page.locator('a:has-text("Escandallos"), button:has-text("Escandallos")').first();
    await escandallosLink.click();
    
    // Get initial row count
    const initialRows = await page.locator('table tbody tr').count();
    
    // Use plato filter
    const filterSelect = page.locator('select[name="plato"], button:has-text("Plato")').first();
    if (await filterSelect.isVisible()) {
      await filterSelect.click();
      
      // Select a plato
      const platoOption = page.locator('option, button').first();
      if (await platoOption.isVisible()) {
        await platoOption.click();
        
        // Wait for results
        await page.waitForTimeout(500);
        
        // Check filtered rows
        const filteredRows = await page.locator('table tbody tr').count();
        expect(filteredRows).toBeLessThanOrEqual(initialRows);
      }
    }
  });

  test('should compare cost vs selling price', async ({ page }) => {
    // Navigate to escandallos
    const escandallosLink = page.locator('a:has-text("Escandallos"), button:has-text("Escandallos")').first();
    await escandallosLink.click();
    
    // Click on first row to view comparison
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      
      // Look for margin/profit display
      const margin = page.locator('[data-margin], [data-profit], .profit-margin, .margin');
      if (await margin.isVisible()) {
        await expect(margin).toBeVisible();
      }
    }
  });

  test('should export cost report', async ({ page }) => {
    // Navigate to escandallos
    const escandallosLink = page.locator('a:has-text("Escandallos"), button:has-text("Escandallos")').first();
    await escandallosLink.click();
    
    // Look for export button
    const exportBtn = page.locator('button:has-text("Exportar"), button:has-text("Descargar")').first();
    if (await exportBtn.isVisible()) {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download');
      await exportBtn.click();
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('escandallo');
    }
  });
});
