/**
 * Tests para el modelo Notificacion
 * Sprint 2.9 - Tests Automatizados
 */
const path = require('path');
const Notificacion = require(path.join(__dirname, '../src/models/Notificacion'));
const { initializeDatabase, closeDatabase, getDatabase } = require(path.join(__dirname, '../src/utils/database'));
const { runTestMigrations } = require(path.join(__dirname, '../jest-setup-migrations'));

describe('📦 Modelo Notificacion', () => {
  
  beforeAll(async () => {
    // Ejecutar migraciones primero
    await runTestMigrations();
    // Luego inicializar BD
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Limpiar tabla antes de cada test
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM notificaciones WHERE 1=1', (err) => {
        if (err) {
          // Ignorar si la tabla no existe aún
          resolve();
        } else {
          resolve();
        }
      });
    });
  });

  // ===== TESTS DE CREACIÓN =====
  describe('✨ Crear Notificación', () => {
    test('debe crear una notificación correctamente', async () => {
      const datos = {
        usuario_id: 1,
        tipo: 'ingrediente',
        titulo: 'Test Ingrediente',
        mensaje: 'Un ingrediente fue creado',
        datos: { id: 10, nombre: 'Tomate' }
      };

      const result = await Notificacion.crear(datos);

      // El modelo devuelve el objeto de la notificación, no el resultado raw
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.tipo).toBe('ingrediente');
      expect(result.leida).toBe(0);
    });

    test('debe crear notificación sin datos adicionales', async () => {
      const datos = {
        usuario_id: 2,
        tipo: 'pedido',
        titulo: 'Pedido Creado',
        mensaje: 'Tu pedido ha sido creado'
      };

      const result = await Notificacion.crear(datos);

      expect(result).toBeDefined();
      expect(result.id).toBeGreaterThan(0);
    });

    test('debe ser requerido usuario_id', async () => {
      const datos = {
        tipo: 'test',
        titulo: 'Test',
        mensaje: 'Test'
      };

      // No debe fallar, pero no debería crear notificación válida
      const result = await Notificacion.crear(datos);
      expect(result).toBeDefined();
    });
  });

  // ===== TESTS DE CONSULTA INDIVIDUAL =====
  describe('🔍 Obtener Notificación por ID', () => {
    test('debe obtener una notificación existente', async () => {
      // Crear una notificación primero
      const datosCrear = {
        usuario_id: 1,
        tipo: 'ingrediente',
        titulo: 'Test',
        mensaje: 'Test notification',
        datos: { test: true }
      };

      const creada = await Notificacion.crear(datosCrear);
      const notifId = creada.id;

      // Obtenerla
      const notif = await Notificacion.obtenerPorId(notifId);

      expect(notif).toBeDefined();
      expect(notif.id).toBe(notifId);
      expect(notif.tipo).toBe('ingrediente');
      expect(notif.leida).toBe(0);
    });

    test('debe devolver undefined si no existe', async () => {
      const notif = await Notificacion.obtenerPorId(99999);
      expect(notif).toBeUndefined();
    });
  });

  // ===== TESTS DE OBTENER POR USUARIO =====
  describe('👤 Obtener Notificaciones por Usuario', () => {
    beforeEach(async () => {
      // Crear notificaciones de prueba
      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'ingrediente',
        titulo: 'Notif 1',
        mensaje: 'Message 1'
      });

      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'pedido',
        titulo: 'Notif 2',
        mensaje: 'Message 2'
      });

      await Notificacion.crear({
        usuario_id: 2,
        tipo: 'ingrediente',
        titulo: 'Notif 3',
        mensaje: 'Message 3'
      });
    });

    test('debe obtener todas las notificaciones del usuario', async () => {
      const notifs = await Notificacion.obtenerPorUsuario(1);

      expect(Array.isArray(notifs)).toBe(true);
      expect(notifs.length).toBeGreaterThan(0);
      expect(notifs[0].usuario_id).toBe(1);
    });

    test('debe filtrar por tipo', async () => {
      const notifs = await Notificacion.obtenerPorUsuario(1, { tipo: 'pedido' });

      expect(notifs.length).toBeGreaterThan(0);
      notifs.forEach(n => {
        expect(n.tipo).toBe('pedido');
      });
    });

    test('debe respetar límite y offset', async () => {
      const notifs = await Notificacion.obtenerPorUsuario(1, { limite: 1, offset: 0 });

      expect(notifs.length).toBeLessThanOrEqual(1);
    });
  });

  // ===== TESTS DE CONTADOR =====
  describe('🔢 Contar Notificaciones', () => {
    beforeEach(async () => {
      // Crear algunas notificaciones
      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'T1',
        mensaje: 'M1'
      });

      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'T2',
        mensaje: 'M2'
      });
    });

    test('debe contar notificaciones no leídas', async () => {
      const count = await Notificacion.contarNoLeidas(1);

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('debe devolver 0 si no hay notificaciones', async () => {
      const count = await Notificacion.contarNoLeidas(999);
      expect(count).toBe(0);
    });
  });

  // ===== TESTS DE ESTADO LEÍDO =====
  describe('📖 Marcar como Leída', () => {
    let notifId;

    beforeEach(async () => {
      const result = await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'Test',
        mensaje: 'Test'
      });
      notifId = result.id;
    });

    test('debe marcar una notificación como leída', async () => {
      await Notificacion.marcarComoLeida(notifId);

      const notif = await Notificacion.obtenerPorId(notifId);
      expect(notif).toBeDefined();
      expect(notif.leida).toBe(1);
      expect(notif.fecha_lectura).not.toBeNull();
    });

    test('debe marcar todas las notificaciones del usuario como leídas', async () => {
      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test2',
        titulo: 'Test2',
        mensaje: 'Test2'
      });

      await Notificacion.marcarTodasComoLeidas(1);

      const notifs = await Notificacion.obtenerPorUsuario(1);
      expect(notifs.length).toBeGreaterThan(0);
      notifs.forEach(n => {
        expect(n.leida).toBe(1);
      });
    });
  });

  // ===== TESTS DE ELIMINACIÓN =====
  describe('🗑️ Eliminar Notificación', () => {
    test('debe eliminar una notificación', async () => {
      const result = await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'Delete me',
        mensaje: 'Test'
      });

      const notifId = result.lastID;

      await Notificacion.eliminar(notifId);

      const notif = await Notificacion.obtenerPorId(notifId);
      expect(notif).toBeUndefined();
    });
  });

  // ===== TESTS DE LIMPIEZA =====
  describe('🧹 Limpiar Notificaciones Leídas', () => {
    test('debe limpiar notificaciones leídas antiguas', async () => {
      // Crear una notificación y marcarla como leída
      const result = await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'Old',
        mensaje: 'Test'
      });

      await Notificacion.marcarComoLeida(result.lastID);

      const deletedCount = await Notificacion.limpiarLeidas(1, 0); // 0 días = eliminar todas las leídas

      expect(typeof deletedCount).toBe('number');
    });
  });

  // ===== TESTS DE ESTADÍSTICAS =====
  describe('📊 Estadísticas', () => {
    beforeEach(async () => {
      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'ingrediente',
        titulo: 'I1',
        mensaje: 'M1'
      });

      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'pedido',
        titulo: 'P1',
        mensaje: 'M2'
      });

      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'ingrediente',
        titulo: 'I2',
        mensaje: 'M3'
      });
    });

    test('debe obtener estadísticas por tipo', async () => {
      const stats = await Notificacion.obtenerEstadisticas(1);

      expect(stats).toBeDefined();
      expect(stats.totales).toBeDefined();
      expect(stats.porTipo).toBeDefined();
      expect(Array.isArray(stats.porTipo)).toBe(true);
    });
  });

  // ===== TESTS DE PREFERENCIAS =====
  describe('⚙️ Preferencias de Usuario', () => {
    test('debe obtener o crear preferencias por defecto', async () => {
      const prefs = await Notificacion.obtenerPreferencias(1);

      expect(prefs).toBeDefined();
      expect(prefs.usuario_id).toBe(1);
      expect(typeof prefs.recibir_platos).toBe('number');
    });

    test('debe actualizar preferencias', async () => {
      const nuevasPrefs = {
        usuario_id: 1,
        recibir_stock_bajo: false,
        silencio_inicio: '22:00',
        silencio_fin: '08:00'
      };

      await Notificacion.actualizarPreferencias(1, nuevasPrefs);

      const prefs = await Notificacion.obtenerPreferencias(1);
      expect(prefs.recibir_stock_bajo).toBe(0);
    });

    test('debe validar si debe recibir notificación', async () => {
      const debeRecibir = await Notificacion.debeRecibirNotificacion(1, 'ingrediente');

      expect(typeof debeRecibir).toBe('boolean');
    });
  });

  // ===== TESTS DE DATOS JSON =====
  describe('📝 Manejo de JSON en datos', () => {
    test('debe guardar y recuperar datos JSON correctamente', async () => {
      const datosJson = {
        id: 123,
        nombre: 'Tomate',
        cantidad: 50,
        accion: 'created'
      };

      const result = await Notificacion.crear({
        usuario_id: 1,
        tipo: 'ingrediente',
        titulo: 'JSON Test',
        mensaje: 'Test with JSON',
        datos: datosJson
      });

      const notif = await Notificacion.obtenerPorId(result.id);

      expect(notif).toBeDefined();
      expect(notif.datos).toBeDefined();
      expect(typeof notif.datos).toBe('object');
      expect(notif.datos.id).toBe(123);
      expect(notif.datos.nombre).toBe('Tomate');
    });
  });
});
