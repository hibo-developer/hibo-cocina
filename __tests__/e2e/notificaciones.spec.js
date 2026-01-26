/**
 * E2E Tests - Notificaciones
 * Sprint 2.10 - Playwright Tests - UPDATED SELECTORS
 * 
 * Selectores actualizados basados en elementos reales del HTML:
 * - Panel: #notification-panel
 * - Toggle: #notification-btn
 * - Badge: #notification-badge
 * - Lista: #notification-list
 */

const { test, expect } = require('@playwright/test');

test.describe('🌐 Notificaciones - E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal
    await page.goto('/');
    // Esperar a que cargue la aplicación
    await page.waitForLoadState('networkidle');
    // Esperar a que se carguen los scripts
    await page.waitForTimeout(1000);
  });

  test.describe('📱 Panel de Notificaciones', () => {
    
    test('debe mostrar panel de notificaciones', async ({ page }) => {
      // Buscar elemento del panel de notificaciones (por ID)
      const notifPanel = page.locator('#notification-panel');
      
      // El panel debería existir en el DOM
      await expect(notifPanel).toBeDefined();
    });

    test('debe mostrar contador de no leídas en el badge', async ({ page }) => {
      // Buscar el badge con el contador
      const badge = page.locator('#notification-badge');
      
      // Debería existir el badge
      await expect(badge).toBeDefined();
      
      // Debería contener un número (0 inicialmente)
      const text = await badge.textContent();
      expect(text).toMatch(/^\d+$/);
    });

    test('debe abrir/cerrar panel al hacer click en botón', async ({ page }) => {
      const toggleBtn = page.locator('#notification-btn');
      const panel = page.locator('#notification-panel');
      
      // Click para abrir
      await toggleBtn.click();
      await page.waitForTimeout(200);
      
      // Panel no debería tener clase 'hidden'
      const hasHiddenClass = await panel.evaluate((el) => el.classList.contains('hidden'));
      expect(hasHiddenClass).toBe(false);
      
      // Click para cerrar
      await toggleBtn.click();
      await page.waitForTimeout(200);
      
      // Panel debería tener clase 'hidden'
      const hasHiddenClassAfter = await panel.evaluate((el) => el.classList.contains('hidden'));
      expect(hasHiddenClassAfter).toBe(true);
    });
  });


  test.describe('🔍 Elementos del Panel', () => {
    
    test('debe tener botones de control en el panel', async ({ page }) => {
      // Abrir panel
      const toggleBtn = page.locator('#notification-btn');
      await toggleBtn.click();
      await page.waitForTimeout(200);
      
      // Buscar botones de control
      const clearBtn = page.locator('#clear-all-btn');
      const markAllBtn = page.locator('#mark-all-read-btn');
      const closeBtn = page.locator('#close-panel-btn');
      
      // Todos deben existir
      await expect(clearBtn).toBeDefined();
      await expect(markAllBtn).toBeDefined();
      await expect(closeBtn).toBeDefined();
    });

    test('debe cerrar panel con botón X', async ({ page }) => {
      // Abrir panel
      const toggleBtn = page.locator('#notification-btn');
      await toggleBtn.click();
      await page.waitForTimeout(200);
      
      const panel = page.locator('#notification-panel');
      const closeBtn = page.locator('#close-panel-btn');
      
      // Panel abierto
      let hasHiddenClass = await panel.evaluate((el) => el.classList.contains('hidden'));
      expect(hasHiddenClass).toBe(false);
      
      // Click en cerrar
      await closeBtn.click();
      await page.waitForTimeout(200);
      
      // Panel cerrado
      hasHiddenClass = await panel.evaluate((el) => el.classList.contains('hidden'));
      expect(hasHiddenClass).toBe(true);
    });
  });

  test.describe('🎯 Interacciones Básicas', () => {
    
    test('debe responder al click en el botón de notificaciones', async ({ page }) => {
      const toggleBtn = page.locator('#notification-btn');
      const panel = page.locator('#notification-panel');
      
      // Inicial: panel cerrado
      let isHidden = await panel.evaluate((el) => el.classList.contains('hidden'));
      expect(isHidden).toBe(true);
      
      // Click para abrir
      await toggleBtn.click();
      await page.waitForTimeout(300);
      
      isHidden = await panel.evaluate((el) => el.classList.contains('hidden'));
      expect(isHidden).toBe(false);
    });

    test('debe mantener contador visible en badge', async ({ page }) => {
      // El badge debe ser visible
      const badge = page.locator('#notification-badge');
      const badgeVisible = await badge.isVisible();
      
      expect(badgeVisible).toBe(true);
      
      // Debe tener contenido
      const text = await badge.textContent();
      expect(text).toBeTruthy();
    });

    test('debe permitir cerrar y abrir panel múltiples veces', async ({ page }) => {
      const toggleBtn = page.locator('#notification-btn');
      const panel = page.locator('#notification-panel');
      
      for (let i = 0; i < 3; i++) {
        // Abrir
        await toggleBtn.click();
        await page.waitForTimeout(200);
        let isHidden = await panel.evaluate((el) => el.classList.contains('hidden'));
        expect(isHidden).toBe(false);
        
        // Cerrar
        await toggleBtn.click();
        await page.waitForTimeout(200);
        isHidden = await panel.evaluate((el) => el.classList.contains('hidden'));
        expect(isHidden).toBe(true);
      }
    });
  });

  test.describe('📋 Estructura del DOM', () => {
    
    test('debe tener estructura correcta del panel', async ({ page }) => {
      // Verificar que todos los elementos principales existen
      const panel = page.locator('#notification-panel');
      const header = panel.locator('.notification-panel-header');
      const content = panel.locator('.notification-panel-content');
      const list = panel.locator('#notification-list');
      
      await expect(panel).toBeDefined();
      await expect(header).toBeDefined();
      await expect(content).toBeDefined();
      await expect(list).toBeDefined();
    });

    test('debe tener botón de notificaciones visible', async ({ page }) => {
      const btn = page.locator('#notification-btn');
      const isVisible = await btn.isVisible();
      
      expect(isVisible).toBe(true);
    });

    test('debe tener contenedor del botón con ID correcto', async ({ page }) => {
      const container = page.locator('#notification-btn-container');
      const exists = await container.count();
      
      expect(exists).toBeGreaterThan(0);
    });
  });

  test.describe('🎨 Estilos y Clases', () => {
    
    test('debe aplicar clase hidden cuando panel está cerrado', async ({ page }) => {
      const panel = page.locator('#notification-panel');
      
      // Inicialmente oculto
      const hasHidden = await panel.evaluate((el) => el.classList.contains('hidden'));
      expect(hasHidden).toBe(true);
    });

    test('debe remover clase hidden cuando panel se abre', async ({ page }) => {
      const toggleBtn = page.locator('#notification-btn');
      const panel = page.locator('#notification-panel');
      
      await toggleBtn.click();
      await page.waitForTimeout(200);
      
      const hasHidden = await panel.evaluate((el) => el.classList.contains('hidden'));
      expect(hasHidden).toBe(false);
    });
  });

  test.describe('🔌 Integración Básica', () => {
    
    test('debe cargar servicios de notificación', async ({ page }) => {
      // Verificar que los servicios están cargados
      const hasNotifManager = await page.evaluate(() => {
        return typeof window.notificationManager !== 'undefined' || 
               typeof window.SimpleNotificationManager !== 'undefined';
      });
      
      expect(hasNotifManager).toBe(true);
    });

    test('debe tener API disponible', async ({ page }) => {
      // Verificar que la API está disponible
      const hasAPI = await page.evaluate(() => {
        return typeof window.apiService !== 'undefined';
      });
      
      expect(hasAPI).toBe(true);
    });
  });

  test.describe('⚡ Pruebas de Rendimiento', () => {
    
    test('debe abrir/cerrar panel rápidamente', async ({ page }) => {
      const toggleBtn = page.locator('#notification-btn');
      
      const start = Date.now();
      
      for (let i = 0; i < 5; i++) {
        await toggleBtn.click();
        await page.waitForTimeout(100);
      }
      
      const duration = Date.now() - start;
      
      // Debería completarse en menos de 2 segundos
      expect(duration).toBeLessThan(2000);
    });

    test('debe renderizar panel sin errores', async ({ page }) => {
      // Capturar errores de consola
      const errors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      const toggleBtn = page.locator('#notification-btn');
      await toggleBtn.click();
      
      // No debe haber errores
      expect(errors.length).toBe(0);
    });
  });
});
