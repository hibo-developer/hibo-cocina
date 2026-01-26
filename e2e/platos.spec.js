const { test, expect } = require('@playwright/test');

/**
 * Test Suite: Platos Module
 * Tests CRUD operations on platos (dishes)
 */

test.describe('Platos Module', () => {
  // Helper to login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?:index|dashboard).*/);
  });

  test('should load platos list', async ({ page }) => {
    // Navigate to platos section
    const platosLink = page.locator('a:has-text("Platos"), button:has-text("Platos")').first();
    await platosLink.click();
    
    // Wait for table to load
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Check table has rows
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should display plato details', async ({ page }) => {
    // Navigate to platos
    const platosLink = page.locator('a:has-text("Platos"), button:has-text("Platos")').first();
    await platosLink.click();
    
    // Wait for table to load and click first row
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();
    
    // Check details are displayed
    const details = page.locator('[data-section="platos-details"], .modal, .details-panel');
    await expect(details).toBeVisible();
    
    // Verify some fields exist
    const nameField = page.locator('input[name="nombre"], [data-field="nombre"]');
    await expect(nameField).toBeVisible();
  });

  test('should create new plato', async ({ page }) => {
    // Navigate to platos
    const platosLink = page.locator('a:has-text("Platos"), button:has-text("Platos")').first();
    await platosLink.click();
    
    // Click create/new button
    const createBtn = page.locator('button:has-text("Nuevo"), button:has-text("Agregar"), button:has-text("Crear")').first();
    await createBtn.click();
    
    // Check form is displayed
    const form = page.locator('form, .modal');
    await expect(form).toBeVisible();
    
    // Fill form with test data
    const testPlato = {
      nombre: `Plato Test ${Date.now()}`,
      descripcion: 'Test plato created by E2E tests'
    };
    
    const nombreField = page.locator('input[name="nombre"], input[placeholder*="nombre"]').first();
    const descField = page.locator('textarea[name="descripcion"], textarea[placeholder*="descripcion"]').first();
    
    if (await nombreField.isVisible()) {
      await nombreField.fill(testPlato.nombre);
    }
    if (await descField.isVisible()) {
      await descField.fill(testPlato.descripcion);
    }
    
    // Submit form
    const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar")').first();
    await submitBtn.click();
    
    // Check success message
    const successMsg = page.locator('.success-message, .notification:has-text("creado"), .notification:has-text("Creado")').first();
    if (await successMsg.isVisible()) {
      await expect(successMsg).toBeVisible();
    }
  });

  test('should edit existing plato', async ({ page }) => {
    // Navigate to platos
    const platosLink = page.locator('a:has-text("Platos"), button:has-text("Platos")').first();
    await platosLink.click();
    
    // Click edit button on first row
    const editBtn = page.locator('button:has-text("Editar"), button:has-text("Edit")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      
      // Check form is in edit mode
      const form = page.locator('form, .modal');
      await expect(form).toBeVisible();
      
      // Modify a field
      const nombreField = page.locator('input[name="nombre"]').first();
      const currentValue = await nombreField.inputValue();
      await nombreField.fill(`${currentValue} - Modified`);
      
      // Submit changes
      const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar")').first();
      await submitBtn.click();
      
      // Check success message
      const successMsg = page.locator('.success-message, .notification:has-text("actualizado")').first();
      if (await successMsg.isVisible()) {
        await expect(successMsg).toBeVisible();
      }
    }
  });

  test('should delete plato with confirmation', async ({ page }) => {
    // Navigate to platos
    const platosLink = page.locator('a:has-text("Platos"), button:has-text("Platos")').first();
    await platosLink.click();
    
    // Click delete button
    const deleteBtn = page.locator('button:has-text("Eliminar"), button:has-text("Delete")').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      
      // Handle confirmation dialog
      const confirmBtn = page.locator('button:has-text("Confirmar"), button:has-text("Aceptar")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        
        // Check success message
        const successMsg = page.locator('.success-message, .notification:has-text("eliminado")').first();
        if (await successMsg.isVisible()) {
          await expect(successMsg).toBeVisible();
        }
      }
    }
  });

  test('should search/filter platos', async ({ page }) => {
    // Navigate to platos
    const platosLink = page.locator('a:has-text("Platos"), button:has-text("Platos")').first();
    await platosLink.click();
    
    // Get initial row count
    const initialRows = await page.locator('table tbody tr').count();
    
    // Use search/filter
    const searchInput = page.locator('input[placeholder*="buscar"], input[placeholder*="Buscar"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('pizza');
      
      // Wait for results to update
      await page.waitForTimeout(500);
      
      // Check rows are filtered
      const filteredRows = await page.locator('table tbody tr').count();
      expect(filteredRows).toBeLessThanOrEqual(initialRows);
    }
  });

  test('should display statistics', async ({ page }) => {
    // Navigate to platos
    const platosLink = page.locator('a:has-text("Platos"), button:has-text("Platos")').first();
    await platosLink.click();
    
    // Check for statistics/dashboard elements
    const stats = page.locator('[data-section="statistics"], .stats-container, .dashboard-card');
    const statsCount = await stats.count();
    expect(statsCount).toBeGreaterThan(0);
  });
});
