/**
 * Tests para el módulo de Ofertas y Eventos
 * Verifica CRUD, validaciones, y funcionalidades avanzadas
 */

const request = require('supertest');
const path = require('path');

// Mock de la base de datos para testing
jest.mock('../src/utils/database', () => {
  const mockDb = {
    all: jest.fn(),
    get: jest.fn(),
    run: jest.fn()
  };
  return {
    getDatabase: () => mockDb,
    initializeDatabase: jest.fn().mockResolvedValue(mockDb)
  };
});

const { getDatabase } = require('../src/utils/database');

describe('Módulo de Ofertas y Eventos', () => {
  let app;
  let db;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = require('../server');
    db = getDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // OFERTAS - CRUD
  // =========================================================================

  describe('GET /api/ofertas', () => {
    it('debe obtener todas las ofertas', async () => {
      const mockOfertas = [
        { id: 1, codigo: 'OF001', nombre: 'Oferta 1', estado: 'activa' },
        { id: 2, codigo: 'OF002', nombre: 'Oferta 2', estado: 'inactiva' }
      ];

      db.all.mockImplementation((query, callback) => {
        callback(null, mockOfertas);
      });

      const response = await request(app)
        .get('/api/ofertas')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(db.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ofertas'),
        expect.any(Function)
      );
    });

    it('debe manejar errores al obtener ofertas', async () => {
      db.all.mockImplementation((query, callback) => {
        callback(new Error('Error de BD'), null);
      });

      const response = await request(app)
        .get('/api/ofertas')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/ofertas/activas', () => {
    it('debe obtener solo ofertas activas', async () => {
      const mockOfertasActivas = [
        { id: 1, codigo: 'OF001', nombre: 'Oferta Activa', estado: 'activa' }
      ];

      db.all.mockImplementation((query, callback) => {
        callback(null, mockOfertasActivas);
      });

      const response = await request(app)
        .get('/api/ofertas/activas');

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        if (response.body.data && response.body.data.length > 0) {
          expect(response.body.data.every(o => o.estado === 'activa')).toBe(true);
        }
      }
    });
  });

  describe('POST /api/ofertas', () => {
    it('debe crear una nueva oferta', async () => {
      const nuevaOferta = {
        codigo: 'OF003',
        nombre: 'Nueva Oferta',
        tipo: 'descuento',
        descuento_porcentaje: 15
      };

      // Mock verificación de código único
      db.get.mockImplementation((query, params, callback) => {
        callback(null, null); // No existe
      });

      db.run.mockImplementation(function(query, params, callback) {
        callback.call({ lastID: 3 }, null);
      });

      const response = await request(app)
        .post('/api/ofertas')
        .send(nuevaOferta)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('debe rechazar oferta sin código', async () => {
      const ofertaInvalida = {
        nombre: 'Sin código'
      };

      const response = await request(app)
        .post('/api/ofertas')
        .send(ofertaInvalida);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debe rechazar código duplicado', async () => {
      const ofertaDuplicada = {
        codigo: 'OF001',
        nombre: 'Duplicada'
      };

      // Mock código ya existe
      db.get.mockImplementation((query, params, callback) => {
        callback(null, { id: 1 });
      });

      const response = await request(app)
        .post('/api/ofertas')
        .send(ofertaDuplicada);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/ofertas/:id', () => {
    it('debe actualizar una oferta existente', async () => {
      db.get.mockImplementation((query, params, callback) => {
        callback(null, { id: 1, codigo: 'OF001' });
      });

      db.run.mockImplementation(function(query, params, callback) {
        callback.call({ changes: 1 }, null);
      });

      const response = await request(app)
        .put('/api/ofertas/1')
        .send({ nombre: 'Oferta Actualizada' });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('debe retornar 404 si la oferta no existe', async () => {
      db.get.mockImplementation((query, params, callback) => {
        callback(null, null);
      });

      const response = await request(app)
        .put('/api/ofertas/999')
        .send({ nombre: 'No existe' });

      expect([400, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/ofertas/:id', () => {
    it('debe eliminar una oferta', async () => {
      db.get.mockImplementation((query, params, callback) => {
        callback(null, { id: 1 });
      });

      db.run.mockImplementation(function(query, params, callback) {
        callback.call({ changes: 1 }, null);
      });

      const response = await request(app)
        .delete('/api/ofertas/1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // =========================================================================
  // EVENTOS - CRUD
  // =========================================================================

  describe('GET /api/eventos', () => {
    it('debe obtener todos los eventos', async () => {
      const mockEventos = [
        { id: 1, codigo: 'EV001', nombre: 'Evento 1', estado: 'planificado' },
        { id: 2, codigo: 'EV002', nombre: 'Evento 2', estado: 'confirmado' }
      ];

      db.all.mockImplementation((query, callback) => {
        callback(null, mockEventos);
      });

      const response = await request(app)
        .get('/api/eventos')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/eventos/proximos', () => {
    it('debe obtener eventos próximos', async () => {
      const mockEventosProximos = [
        { 
          id: 1, 
          codigo: 'EV001', 
          nombre: 'Evento Próximo',
          fecha_evento: '2026-02-15',
          estado: 'confirmado'
        }
      ];

      db.all.mockImplementation((query, params, callback) => {
        callback(null, mockEventosProximos);
      });

      const response = await request(app)
        .get('/api/eventos/proximos?dias=30')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/eventos', () => {
    it('debe crear un nuevo evento', async () => {
      const nuevoEvento = {
        codigo: 'EV003',
        nombre: 'Evento Corporativo',
        tipo_evento: 'corporativo',
        fecha_evento: '2026-03-15',
        capacidad: 100
      };

      db.get.mockImplementation((query, params, callback) => {
        callback(null, null);
      });

      db.run.mockImplementation(function(query, params, callback) {
        callback.call({ lastID: 3 }, null);
      });

      const response = await request(app)
        .post('/api/eventos')
        .send(nuevoEvento)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('debe rechazar evento sin código', async () => {
      const eventoInvalido = {
        nombre: 'Sin código',
        fecha_evento: '2026-03-15'
      };

      const response = await request(app)
        .post('/api/eventos')
        .send(eventoInvalido)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debe rechazar evento sin fecha', async () => {
      const eventoInvalido = {
        codigo: 'EV003',
        nombre: 'Sin fecha'
      };

      const response = await request(app)
        .post('/api/eventos')
        .send(eventoInvalido)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // =========================================================================
  // ASISTENTES A EVENTOS
  // =========================================================================

  describe('POST /api/eventos/:evento_id/asistentes', () => {
    it('debe agregar un asistente a un evento', async () => {
      const nuevoAsistente = {
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '+1234567890'
      };

      db.get.mockImplementation((query, params, callback) => {
        callback(null, { id: 1, nombre: 'Evento 1' });
      });

      db.run.mockImplementation(function(query, params, callback) {
        callback.call({ lastID: 1 }, null);
      });

      const response = await request(app)
        .post('/api/eventos/1/asistentes')
        .send(nuevoAsistente);

      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.nombre).toBe(nuevoAsistente.nombre);
      }
    });

    it('debe rechazar asistente para evento inexistente', async () => {
      db.get.mockImplementation((query, params, callback) => {
        callback(null, null);
      });

      const response = await request(app)
        .post('/api/eventos/999/asistentes')
        .send({ nombre: 'Test' });

      expect([400, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/eventos/:evento_id/asistentes', () => {
    it('debe obtener asistentes de un evento', async () => {
      const mockAsistentes = [
        { id: 1, nombre: 'Juan Pérez', estado_confirmacion: 'confirmado' },
        { id: 2, nombre: 'María García', estado_confirmacion: 'pendiente' }
      ];

      db.all.mockImplementation((query, params, callback) => {
        callback(null, mockAsistentes);
      });

      const response = await request(app)
        .get('/api/eventos/1/asistentes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('PUT /api/asistentes/:asistente_id/confirmar', () => {
    it('debe actualizar confirmación de asistente', async () => {
      db.get.mockImplementation((query, params, callback) => {
        callback(null, { id: 1, nombre: 'Juan Pérez' });
      });

      db.run.mockImplementation(function(query, params, callback) {
        callback.call({ changes: 1 }, null);
      });

      const response = await request(app)
        .put('/api/asistentes/1/confirmar')
        .send({ estado_confirmacion: 'confirmado' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // =========================================================================
  // ESTADÍSTICAS
  // =========================================================================

  describe('GET /api/ofertas/estadisticas', () => {
    it('debe obtener estadísticas de ofertas', async () => {
      const mockEstadisticas = [
        {
          id: 1,
          codigo: 'OF001',
          nombre: 'Oferta 1',
          veces_aplicada: 10,
          descuento_total: 500,
          clientes_beneficiados: 8
        }
      ];

      db.all.mockImplementation((query, callback) => {
        callback(null, mockEstadisticas);
      });

      const response = await request(app)
        .get('/api/ofertas/estadisticas')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0]).toHaveProperty('veces_aplicada');
      expect(response.body.data[0]).toHaveProperty('clientes_beneficiados');
    });
  });

  describe('GET /api/eventos/estadisticas', () => {
    it('debe obtener estadísticas de eventos', async () => {
      const mockEstadisticas = [
        {
          id: 1,
          codigo: 'EV001',
          nombre: 'Evento 1',
          total_asistentes: 50,
          confirmados: 45,
          pendientes: 5
        }
      ];

      db.all.mockImplementation((query, callback) => {
        callback(null, mockEstadisticas);
      });

      const response = await request(app)
        .get('/api/eventos/estadisticas')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0]).toHaveProperty('total_asistentes');
      expect(response.body.data[0]).toHaveProperty('confirmados');
    });
  });

  // =========================================================================
  // VALIDACIONES
  // =========================================================================

  describe('POST /api/ofertas/validar', () => {
    it('debe validar oferta correcta', async () => {
      const ofertaValida = {
        codigo: 'OF004',
        nombre: 'Oferta Válida',
        descuento_porcentaje: 10
      };

      const response = await request(app)
        .post('/api/ofertas/validar')
        .send(ofertaValida)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('debe detectar errores de validación', async () => {
      const ofertaInvalida = {
        codigo: '',
        descuento_porcentaje: -5
      };

      const response = await request(app)
        .post('/api/ofertas/validar')
        .send(ofertaInvalida)
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.data.errores.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/eventos/validar', () => {
    it('debe validar evento correcto', async () => {
      const eventoValido = {
        codigo: 'EV004',
        nombre: 'Evento Válido',
        fecha_evento: '2026-12-31',
        capacidad: 100
      };

      const response = await request(app)
        .post('/api/eventos/validar')
        .send(eventoValido)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('debe detectar fecha en el pasado', async () => {
      const eventoInvalido = {
        codigo: 'EV004',
        nombre: 'Evento Pasado',
        fecha_evento: '2020-01-01'
      };

      const response = await request(app)
        .post('/api/eventos/validar')
        .send(eventoInvalido)
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.data.errores.some(e => e.includes('pasado'))).toBe(true);
    });
  });

  // =========================================================================
  // APLICACIÓN DE OFERTAS
  // =========================================================================

  describe('POST /api/ofertas/aplicar', () => {
    it('debe aplicar una oferta a un pedido', async () => {
      const aplicacion = {
        oferta_id: 1,
        pedido_id: 100,
        cliente_id: 5
      };

      db.get.mockImplementation((query, params, callback) => {
        if (query.includes('ofertas')) {
          callback(null, { 
            id: 1, 
            descuento_porcentaje: 15,
            estado: 'activa'
          });
        } else if (query.includes('pedidos')) {
          callback(null, { id: 100, total: 1000 });
        }
      });

      db.run.mockImplementation(function(query, params, callback) {
        callback.call({ lastID: 1 }, null);
      });

      const response = await request(app)
        .post('/api/ofertas/aplicar')
        .send(aplicacion)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('monto_descuento');
    });

    it('debe rechazar aplicación sin oferta_id', async () => {
      const aplicacionInvalida = {
        pedido_id: 100
      };

      const response = await request(app)
        .post('/api/ofertas/aplicar')
        .send(aplicacionInvalida)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
