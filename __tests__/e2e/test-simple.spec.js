/**
 * Test simple para verificar si los elementos de notificaciones existen
 */

const { test, expect } = require('@playwright/test');

test.describe('🔍 Debug - Verificar elementos', () => {
  
  test('debe cargar la página principal', async ({ page }) => {
    // Capturar todos los errores de consola ANTES de navegar
    const consoleMessages = [];
    page.on('console', msg => {
      const message = `[${msg.type().toUpperCase()}] ${msg.text()}`;
      consoleMessages.push(message);
      console.log(message); // Mostrar en tiempo real
    });
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Esperar a que se inicialice todo
    await page.waitForTimeout(3000);
    
    // Mostrar en los logs de Playwright
    console.log('=== TOTAL CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => {
      console.log(msg);
    });
  });

  test('debe verificar si #notification-btn existe', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar que el elemento existe
    const btn = await page.locator('#notification-btn').count();
    console.log(`Botones encontrados: ${btn}`);
    
    expect(btn).toBeGreaterThan(0);
  });

  test('debe verificar si #notification-panel existe', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const panel = await page.locator('#notification-panel').count();
    console.log(`Paneles encontrados: ${panel}`);
    
    expect(panel).toBeGreaterThan(0);
  });

  test('debe evaluar window.notificationManager', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Evaluar en el contexto de la página
    const hasManager = await page.evaluate(() => {
      console.log('Tipos disponibles:');
      console.log('  - window.NotificationManager:', typeof window.NotificationManager);
      console.log('  - window.notificationManager:', typeof window.notificationManager);
      console.log('  - window.SimpleNotificationManager:', typeof window.SimpleNotificationManager);
      console.log('  - window.simpleNotificationManager:', typeof window.simpleNotificationManager);
      
      // Buscar qué hay en window
      const notifKeys = Object.keys(window).filter(k => k.toLowerCase().includes('notif'));
      console.log('Claves con "notif":', notifKeys);
      
      return {
        hasNotificationManager: typeof window.notificationManager !== 'undefined',
        hasSimpleNotificationManager: typeof window.simpleNotificationManager !== 'undefined',
        allNotifKeys: notifKeys
      };
    });
    
    console.log('Result:', hasManager);
    
    // Al menos uno debe existir
    expect(hasManager.hasNotificationManager || hasManager.hasSimpleNotificationManager).toBe(true);
  });

  test('debe verificar el DOM directamente', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Evaluar qué hay en el DOM
    const domInfo = await page.evaluate(() => {
      return {
        hasNotificationBtn: document.getElementById('notification-btn') !== null,
        hasNotificationPanel: document.getElementById('notification-panel') !== null,
        hasNotificationBadge: document.getElementById('notification-badge') !== null,
        hasNotificationList: document.getElementById('notification-list') !== null,
        bodyHTML: document.body.innerHTML.substring(0, 500) // Primeros 500 caracteres
      };
    });
    
    console.log('DOM Info:', domInfo);
    
    expect(domInfo.hasNotificationBtn || domInfo.hasNotificationPanel).toBe(true);
  });
});
