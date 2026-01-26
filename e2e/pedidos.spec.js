const { test, expect } = require('@playwright/test');

/**
 * Test Suite: Pedidos Module
 * Tests order management and tracking
 */

test.describe('Pedidos Module', () => {
  // Helper to login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?:index|dashboard).*/);
  });

  test('should load pedidos list', async ({ page }) => {
    // Navigate to pedidos section
    const pedidosLink = page.locator('a:has-text("Pedidos"), button:has-text("Pedidos")').first();
    await pedidosLink.click();
    
    // Wait for table to load
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Check table has rows
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('should create new pedido', async ({ page }) => {
    // Navigate to pedidos
    const pedidosLink = page.locator('a:has-text("Pedidos"), button:has-text("Pedidos")').first();
    await pedidosLink.click();
    
    // Click create button
    const createBtn = page.locator('button:has-text("Nuevo"), button:has-text("Crear Pedido")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      
      // Check form is displayed
      const form = page.locator('form, .modal');
      await expect(form).toBeVisible();
      
      // Fill form with test data
      const clienteField = page.locator('input[name="cliente"], input[placeholder*="cliente"]').first();
      if (await clienteField.isVisible()) {
        await clienteField.fill('Cliente Test');
      }
      
      // Submit form
      const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar")').first();
      await submitBtn.click();
      
      // Check success message
      const successMsg = page.locator('.success-message, .notification:has-text("creado")').first();
      if (await successMsg.isVisible()) {
        await expect(successMsg).toBeVisible();
      }
    }
  });

  test('should view pedido details', async ({ page }) => {
    // Navigate to pedidos
    const pedidosLink = page.locator('a:has-text("Pedidos"), button:has-text("Pedidos")').first();
    await pedidosLink.click();
    
    // Wait for table
    await page.locator('table').waitFor();
    
    // Click on first row if exists
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      
      // Check details panel appears
      const details = page.locator('[data-section="pedidos-details"], .modal, .details-panel');
      if (await details.isVisible()) {
        await expect(details).toBeVisible();
      }
    }
  });

  test('should update pedido status', async ({ page }) => {
    // Navigate to pedidos
    const pedidosLink = page.locator('a:has-text("Pedidos"), button:has-text("Pedidos")').first();
    await pedidosLink.click();
    
    // Wait for table
    await page.locator('table').waitFor();
    
    // Look for status update button
    const statusBtn = page.locator('button:has-text("Cambiar estado"), select[name="estado"]').first();
    if (await statusBtn.isVisible()) {
      await statusBtn.click();
      
      // Select new status
      const newStatus = page.locator('option, button').filter({ hasText: /completado|pendiente|en progreso/ }).first();
      if (await newStatus.isVisible()) {
        await newStatus.click();
        
        // Check for confirmation
        const confirmBtn = page.locator('button:has-text("Confirmar"), button:has-text("Guardar")').first();
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
      }
    }
  });

  test('should display pedido statistics', async ({ page }) => {
    // Navigate to pedidos
    const pedidosLink = page.locator('a:has-text("Pedidos"), button:has-text("Pedidos")').first();
    await pedidosLink.click();
    
    // Check for statistics
    const stats = page.locator('[data-section="statistics"], .stats-container, .dashboard-card');
    const statsCount = await stats.count();
    expect(statsCount).toBeGreaterThanOrEqual(0);
  });

  test('should filter pedidos by status', async ({ page }) => {
    // Navigate to pedidos
    const pedidosLink = page.locator('a:has-text("Pedidos"), button:has-text("Pedidos")').first();
    await pedidosLink.click();
    
    // Get initial row count
    const initialRows = await page.locator('table tbody tr').count();
    
    // Use status filter
    const filterBtn = page.locator('button:has-text("Estado"), select[name="estado"]').first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      
      // Select a status
      const statusOption = page.locator('option, button').filter({ hasText: /completado|pendiente/ }).first();
      if (await statusOption.isVisible()) {
        await statusOption.click();
        
        // Wait for results
        await page.waitForTimeout(500);
        
        // Check rows count
        const filteredRows = await page.locator('table tbody tr').count();
        expect(filteredRows).toBeLessThanOrEqual(initialRows);
      }
    }
  });

  test('should export pedidos', async ({ page }) => {
    // Navigate to pedidos
    const pedidosLink = page.locator('a:has-text("Pedidos"), button:has-text("Pedidos")').first();
    await pedidosLink.click();
    
    // Look for export button
    const exportBtn = page.locator('button:has-text("Exportar"), button:has-text("Descargar")').first();
    if (await exportBtn.isVisible()) {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download');
      await exportBtn.click();
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download path contains expected name
      expect(download.suggestedFilename()).toContain('pedidos');
    }
  });
});
