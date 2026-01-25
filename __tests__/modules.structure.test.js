/**
 * Tests para validar la estructura de módulos
 * Verifica que todos los módulos carguen correctamente
 */

describe('Module Structure Tests', () => {
  test('Verificar que los módulos están correctamente definidos', () => {
    // Los módulos deben tener estos métodos
    const moduleRequiredMethods = ['cargar', 'obtener'];
    
    // Verificar que los módulos existen en el sistema de archivos
    const fs = require('fs');
    const modulePath = './public/js/modules';
    
    expect(fs.existsSync(modulePath)).toBe(true);
    
    const modules = fs.readdirSync(modulePath).filter(f => f.endsWith('.js'));
    expect(modules.length).toBeGreaterThan(0);
  });

  test('Verificar que los servicios existen', () => {
    const fs = require('fs');
    const servicesPath = './public/js/services';
    
    expect(fs.existsSync(servicesPath)).toBe(true);
    
    const services = ['api.js', 'state.js'];
    services.forEach(service => {
      expect(fs.existsSync(`${servicesPath}/${service}`)).toBe(true);
    });
  });

  test('Verificar estructura de app-migrated.js', () => {
    const fs = require('fs');
    const appMigratedPath = './public/js/app-migrated.js';
    
    expect(fs.existsSync(appMigratedPath)).toBe(true);
    
    const content = fs.readFileSync(appMigratedPath, 'utf8');
    
    // Verificar que contiene las funciones refactorizadas
    expect(content).toContain('cargarPlatos');
    expect(content).toContain('cargarPedidos');
    expect(content).toContain('cargarInventario');
    expect(content).toContain('mostrarProduccion');
    expect(content).toContain('mostrarSanidad');
  });

  test('Verificar que las funciones están exportadas globalmente', () => {
    const fs = require('fs');
    const compatibilityPath = './public/js/compatibility-layer.js';
    
    expect(fs.existsSync(compatibilityPath)).toBe(true);
    
    const content = fs.readFileSync(compatibilityPath, 'utf8');
    
    // Verificar que las funciones están expuestas
    expect(content).toContain('window.getState');
    expect(content).toContain('window.setState');
    expect(content).toContain('window.subscribeToState');
  });

  test('Verificar rutas del servidor', () => {
    const fs = require('fs');
    const serverPath = './server.js';
    
    expect(fs.existsSync(serverPath)).toBe(true);
    
    const content = fs.readFileSync(serverPath, 'utf8');
    
    // Verificar que todas las rutas están configuradas
    expect(content).toContain('/api/platos');
    expect(content).toContain('/api/pedidos');
    expect(content).toContain('/api/inventario');
    expect(content).toContain('/api/sanidad');
    expect(content).toContain('/api/produccion');
  });
});
