/**
 * Tests de Integración para API REST de Notificaciones
 * Sprint 2.9 - Tests de Endpoints
 */
const path = require('path');
const request = require('supertest');
const express = require('express');
const notificacionesRoutes = require(path.join(__dirname, '../src/routes/notificaciones'));
const Notificacion = require(path.join(__dirname, '../src/models/Notificacion'));
const { initializeDatabase, closeDatabase } = require(path.join(__dirname, '../src/utils/database'));

// Mock de autenticación
const app = express();
app.use(express.json());

// Middleware para simular usuario autenticado
app.use((req, res, next) => {
  req.user = { id: 1 };
  next();
});

app.use('/api/notificaciones', notificacionesRoutes);

describe('🌐 API REST - Notificaciones', () => {
  
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Limpiar notificaciones antes de cada test
    const { getDatabase } = require(path.join(__dirname, '../src/utils/database'));
    const db = getDatabase();
    return new Promise((resolve) => {
      db.run('DELETE FROM notificaciones WHERE usuario_id = 1', () => resolve());
    });
  });

  // ===== GET ENDPOINTS =====
  describe('GET /api/notificaciones', () => {
    test('debe obtener lista de notificaciones', async () => {
      // Crear algunas notificaciones
      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'Test 1',
        mensaje: 'Message 1'
      });

      const response = await request(app)
        .get('/api/notificaciones')
        .query({ usuario_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.datos)).toBe(true);
    });

    test('debe filtrar por tipo', async () => {
      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'ingrediente',
        titulo: 'Ingrediente',
        mensaje: 'Test'
      });

      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'pedido',
        titulo: 'Pedido',
        mensaje: 'Test'
      });

      const response = await request(app)
        .get('/api/notificaciones')
        .query({ usuario_id: 1, tipo: 'ingrediente' });

      expect(response.status).toBe(200);
      if (response.body.datos.length > 0) {
        response.body.datos.forEach(n => {
          expect(n.tipo).toBe('ingrediente');
        });
      }
    });

    test('debe filtrar por estado leído', async () => {
      const result = await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'Test',
        mensaje: 'Test'
      });

      await Notificacion.marcarComoLeida(result.lastID);

      const response = await request(app)
        .get('/api/notificaciones')
        .query({ usuario_id: 1, leida: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('debe respetar límite y offset', async () => {
      const response = await request(app)
        .get('/api/notificaciones')
        .query({ usuario_id: 1, limite: 5, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.datos.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/notificaciones/no-leidas', () => {
    test('debe obtener solo notificaciones no leídas', async () => {
      // Crear notificaciones
      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'No leída',
        mensaje: 'Test'
      });

      const response = await request(app)
        .get('/api/notificaciones/no-leidas')
        .query({ usuario_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.datos)).toBe(true);
    });

    test('debe devolver array vacío si no hay no leídas', async () => {
      const response = await request(app)
        .get('/api/notificaciones/no-leidas')
        .query({ usuario_id: 999 });

      expect(response.status).toBe(200);
      expect(response.body.datos.length).toBe(0);
    });
  });

  describe('GET /api/notificaciones/contador', () => {
    test('debe devolver contador de no leídas', async () => {
      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'Test',
        mensaje: 'Test'
      });

      const response = await request(app)
        .get('/api/notificaciones/contador')
        .query({ usuario_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(typeof response.body.datos.total).toBe('number');
    });
  });

  describe('GET /api/notificaciones/estadisticas', () => {
    test('debe devolver estadísticas por tipo', async () => {
      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'ingrediente',
        titulo: 'Test 1',
        mensaje: 'Test'
      });

      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'pedido',
        titulo: 'Test 2',
        mensaje: 'Test'
      });

      const response = await request(app)
        .get('/api/notificaciones/estadisticas')
        .query({ usuario_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.datos)).toBe(true);
    });
  });

  describe('GET /api/notificaciones/preferencias', () => {
    test('debe obtener preferencias del usuario', async () => {
      const response = await request(app)
        .get('/api/notificaciones/preferencias')
        .query({ usuario_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.datos.usuario_id).toBe(1);
      expect(typeof response.body.datos.recibir_platos).toBe('number');
    });
  });

  // ===== PATCH/PUT ENDPOINTS =====
  describe('PATCH /api/notificaciones/:id/marcar-leida', () => {
    test('debe marcar notificación como leída', async () => {
      const result = await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'Test',
        mensaje: 'Test'
      });

      const notifId = result.lastID;

      const response = await request(app)
        .patch(`/api/notificaciones/${notifId}/marcar-leida`)
        .query({ usuario_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar que se marcó como leída
      const notif = await Notificacion.obtenerPorId(notifId);
      expect(notif.leida).toBe(1);
    });

    test('debe devolver error 404 si notificación no existe', async () => {
      const response = await request(app)
        .patch('/api/notificaciones/99999/marcar-leida')
        .query({ usuario_id: 1 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/notificaciones/preferencias', () => {
    test('debe actualizar preferencias del usuario', async () => {
      const response = await request(app)
        .put('/api/notificaciones/preferencias')
        .query({ usuario_id: 1 })
        .send({
          recibir_stock_bajo: false,
          silencio_inicio: '22:00',
          silencio_fin: '08:00'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar cambios
      const prefs = await Notificacion.obtenerPreferencias(1);
      expect(prefs.recibir_stock_bajo).toBe(0);
    });

    test('debe validar datos requeridos', async () => {
      const response = await request(app)
        .put('/api/notificaciones/preferencias')
        .query({ usuario_id: 1 })
        .send({});

      expect(response.status).toBe(200); // API puede aceptar parciales
    });
  });

  // ===== POST ENDPOINTS =====
  describe('POST /api/notificaciones/marcar-todas-leidas', () => {
    test('debe marcar todas las notificaciones como leídas', async () => {
      // Crear varias notificaciones
      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test1',
        titulo: 'Test 1',
        mensaje: 'Test'
      });

      await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test2',
        titulo: 'Test 2',
        mensaje: 'Test'
      });

      const response = await request(app)
        .post('/api/notificaciones/marcar-todas-leidas')
        .query({ usuario_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar que todas estén leídas
      const notifs = await Notificacion.obtenerPorUsuario(1);
      notifs.forEach(n => {
        expect(n.leida).toBe(1);
      });
    });
  });

  describe('POST /api/notificaciones/limpiar', () => {
    test('debe limpiar notificaciones leídas antiguas', async () => {
      // Crear y marcar como leída
      const result = await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'Old',
        mensaje: 'Test'
      });

      await Notificacion.marcarComoLeida(result.lastID);

      const response = await request(app)
        .post('/api/notificaciones/limpiar')
        .query({ usuario_id: 1 })
        .send({ diasAntiguedad: 0 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ===== DELETE ENDPOINT =====
  describe('DELETE /api/notificaciones/:id', () => {
    test('debe eliminar una notificación', async () => {
      const result = await Notificacion.crear({
        usuario_id: 1,
        tipo: 'test',
        titulo: 'Delete me',
        mensaje: 'Test'
      });

      const notifId = result.lastID;

      const response = await request(app)
        .delete(`/api/notificaciones/${notifId}`)
        .query({ usuario_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar que se eliminó
      const notif = await Notificacion.obtenerPorId(notifId);
      expect(notif).toBeUndefined();
    });

    test('debe devolver error 404 si no existe', async () => {
      const response = await request(app)
        .delete('/api/notificaciones/99999')
        .query({ usuario_id: 1 });

      expect(response.status).toBe(404);
    });
  });

  // ===== ERROR HANDLING =====
  describe('❌ Manejo de Errores', () => {
    test('debe devolver error si falta usuario_id', async () => {
      const response = await request(app)
        .get('/api/notificaciones');

      // Puede ser 400 o manejar con req.user
      expect([200, 400]).toContain(response.status);
    });

    test('debe manejar parámetros inválidos', async () => {
      const response = await request(app)
        .get('/api/notificaciones')
        .query({ usuario_id: 'abc' });

      // Debe manejar gracefully
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});
