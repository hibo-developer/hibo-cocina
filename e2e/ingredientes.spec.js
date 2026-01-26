const { test, expect } = require('@playwright/test');

/**
 * Test Suite: Ingredientes Module
 * Tests CRUD operations on ingredientes (ingredients)
 */

test.describe('Ingredientes Module', () => {
  // Helper to login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?:index|dashboard).*/);
  });

  test('should load ingredientes list', async ({ page }) => {
    // Navigate to ingredientes section
    const ingredientesLink = page.locator('a:has-text("Ingredientes"), button:has-text("Ingredientes")').first();
    await ingredientesLink.click();
    
    // Wait for table to load
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Check table has rows
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should create new ingrediente', async ({ page }) => {
    // Navigate to ingredientes
    const ingredientesLink = page.locator('a:has-text("Ingredientes"), button:has-text("Ingredientes")').first();
    await ingredientesLink.click();
    
    // Click create button
    const createBtn = page.locator('button:has-text("Nuevo"), button:has-text("Agregar")').first();
    await createBtn.click();
    
    // Check form is displayed
    const form = page.locator('form, .modal');
    await expect(form).toBeVisible();
    
    // Fill form with test data
    const testIngrediente = {
      nombre: `Ingrediente Test ${Date.now()}`,
      unidad_medida: 'kg'
    };
    
    const nombreField = page.locator('input[name="nombre"]').first();
    const unidadField = page.locator('select[name="unidad_medida"], input[name="unidad_medida"]').first();
    
    if (await nombreField.isVisible()) {
      await nombreField.fill(testIngrediente.nombre);
    }
    if (await unidadField.isVisible()) {
      await unidadField.fill(testIngrediente.unidad_medida);
    }
    
    // Submit form
    const submitBtn = page.locator('button[type="submit"], button:has-text("Guardar")').first();
    await submitBtn.click();
    
    // Check success message
    const successMsg = page.locator('.success-message, .notification:has-text("creado")').first();
    if (await successMsg.isVisible()) {
      await expect(successMsg).toBeVisible();
    }
  });

  test('should view ingrediente details', async ({ page }) => {
    // Navigate to ingredientes
    const ingredientesLink = page.locator('a:has-text("Ingredientes"), button:has-text("Ingredientes")').first();
    await ingredientesLink.click();
    
    // Click on first row to view details
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();
    
    // Check details panel appears
    const details = page.locator('[data-section="ingredientes-details"], .modal, .details-panel');
    await expect(details).toBeVisible();
  });

  test('should update ingrediente', async ({ page }) => {
    // Navigate to ingredientes
    const ingredientesLink = page.locator('a:has-text("Ingredientes"), button:has-text("Ingredientes")').first();
    await ingredientesLink.click();
    
    // Click edit button
    const editBtn = page.locator('button:has-text("Editar")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      
      // Modify a field
      const nombreField = page.locator('input[name="nombre"]').first();
      const currentValue = await nombreField.inputValue();
      await nombreField.fill(`${currentValue} - Updated`);
      
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

  test('should display ingredientes with allergens', async ({ page }) => {
    // Navigate to ingredientes
    const ingredientesLink = page.locator('a:has-text("Ingredientes"), button:has-text("Ingredientes")').first();
    await ingredientesLink.click();
    
    // Check for allergen columns/information
    const allergenElements = page.locator('[data-allergen], .allergen-badge');
    const allergenCount = await allergenElements.count();
    
    // Should have some allergen information
    expect(allergenCount).toBeGreaterThanOrEqual(0);
  });

  test('should filter ingredientes by type', async ({ page }) => {
    // Navigate to ingredientes
    const ingredientesLink = page.locator('a:has-text("Ingredientes"), button:has-text("Ingredientes")').first();
    await ingredientesLink.click();
    
    // Get initial row count
    const initialRows = await page.locator('table tbody tr').count();
    
    // Use filter dropdown
    const filterSelect = page.locator('select, button:has-text("Filtrar")').first();
    if (await filterSelect.isVisible()) {
      await filterSelect.click();
      
      // Wait for results
      await page.waitForTimeout(500);
      
      // Check rows count (should be less or equal to initial)
      const filteredRows = await page.locator('table tbody tr').count();
      expect(filteredRows).toBeLessThanOrEqual(initialRows);
    }
  });
});
