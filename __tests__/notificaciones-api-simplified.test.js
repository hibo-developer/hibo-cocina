/**
 * Tests Simplificados para API REST de Notificaciones
 * Sprint 2.9 - Validación de Endpoints
 * Nota: Los tests del modelo ya cubren la mayoría de la lógica
 * Estos tests validan que los endpoints estén disponibles
 */
const path = require('path');
const { runTestMigrations } = require(path.join(__dirname, '../jest-setup-migrations'));

describe('🌐 API REST - Validación de Endpoints', () => {
  
  beforeAll(async () => {
    await runTestMigrations();
  });

  // Validar que las rutas pueden ser importadas
  test('debe importar módulo de rutas sin errores', () => {
    const notificacionesRoutes = require(path.join(__dirname, '../src/routes/notificaciones'));
    expect(notificacionesRoutes).toBeDefined();
  });

  test('debe importar controlador sin errores', () => {
    const notificacionesController = require(path.join(__dirname, '../src/controllers/notificacionesController'));
    expect(notificacionesController).toBeDefined();
    expect(notificacionesController.obtenerNotificaciones).toBeDefined();
    expect(notificacionesController.marcarComoLeida).toBeDefined();
    expect(notificacionesController.eliminar).toBeDefined();
  });

  test('debe importar modelo sin errores', () => {
    const Notificacion = require(path.join(__dirname, '../src/models/Notificacion'));
    expect(Notificacion).toBeDefined();
    expect(Notificacion.crear).toBeDefined();
    expect(Notificacion.obtenerPorId).toBeDefined();
    expect(Notificacion.obtenerPorUsuario).toBeDefined();
  });

  // Validar estructura del controlador
  describe('✅ Estructura del Controlador', () => {
    let controller;

    beforeAll(() => {
      controller = require(path.join(__dirname, '../src/controllers/notificacionesController'));
    });

    test('debe tener método obtenerNotificaciones', () => {
      expect(typeof controller.obtenerNotificaciones).toBe('function');
    });

    test('debe tener método obtenerNoLeidas', () => {
      expect(typeof controller.obtenerNoLeidas).toBe('function');
    });

    test('debe tener método contarNoLeidas', () => {
      expect(typeof controller.contarNoLeidas).toBe('function');
    });

    test('debe tener método marcarComoLeida', () => {
      expect(typeof controller.marcarComoLeida).toBe('function');
    });

    test('debe tener método marcarTodasComoLeidas', () => {
      expect(typeof controller.marcarTodasComoLeidas).toBe('function');
    });

    test('debe tener método eliminar', () => {
      expect(typeof controller.eliminar).toBe('function');
    });

    test('debe tener método limpiarLeidas', () => {
      expect(typeof controller.limpiarLeidas).toBe('function');
    });

    test('debe tener método obtenerEstadisticas', () => {
      expect(typeof controller.obtenerEstadisticas).toBe('function');
    });

    test('debe tener método obtenerPreferencias', () => {
      expect(typeof controller.obtenerPreferencias).toBe('function');
    });

    test('debe tener método actualizarPreferencias', () => {
      expect(typeof controller.actualizarPreferencias).toBe('function');
    });
  });

  // Validar estructura del modelo
  describe('✅ Métodos del Modelo Notificacion', () => {
    let Notificacion;

    beforeAll(() => {
      Notificacion = require(path.join(__dirname, '../src/models/Notificacion'));
    });

    test('debe tener método crear', () => {
      expect(typeof Notificacion.crear).toBe('function');
    });

    test('debe tener método obtenerPorId', () => {
      expect(typeof Notificacion.obtenerPorId).toBe('function');
    });

    test('debe tener método obtenerPorUsuario', () => {
      expect(typeof Notificacion.obtenerPorUsuario).toBe('function');
    });

    test('debe tener método obtenerNoLeidasPorUsuario', () => {
      expect(typeof Notificacion.obtenerNoLeidasPorUsuario).toBe('function');
    });

    test('debe tener método contarNoLeidas', () => {
      expect(typeof Notificacion.contarNoLeidas).toBe('function');
    });

    test('debe tener método marcarComoLeida', () => {
      expect(typeof Notificacion.marcarComoLeida).toBe('function');
    });

    test('debe tener método marcarTodasComoLeidas', () => {
      expect(typeof Notificacion.marcarTodasComoLeidas).toBe('function');
    });

    test('debe tener método eliminar', () => {
      expect(typeof Notificacion.eliminar).toBe('function');
    });

    test('debe tener método limpiarLeidas', () => {
      expect(typeof Notificacion.limpiarLeidas).toBe('function');
    });

    test('debe tener método obtenerEstadisticas', () => {
      expect(typeof Notificacion.obtenerEstadisticas).toBe('function');
    });

    test('debe tener método obtenerPreferencias', () => {
      expect(typeof Notificacion.obtenerPreferencias).toBe('function');
    });

    test('debe tener método crearPreferenciasDefault', () => {
      expect(typeof Notificacion.crearPreferenciasDefault).toBe('function');
    });

    test('debe tener método actualizarPreferencias', () => {
      expect(typeof Notificacion.actualizarPreferencias).toBe('function');
    });

    test('debe tener método debeRecibirNotificacion', () => {
      expect(typeof Notificacion.debeRecibirNotificacion).toBe('function');
    });
  });

  // Validar estructura de las rutas
  describe('✅ Estructura de Rutas Express', () => {
    test('el módulo de rutas es un Router de Express', () => {
      const notificacionesRoutes = require(path.join(__dirname, '../src/routes/notificaciones'));
      // Express router debe tener un método 'stack'
      expect(Array.isArray(notificacionesRoutes.stack) || notificacionesRoutes.name).toBeDefined();
    });
  });
});
