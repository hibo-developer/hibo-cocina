/**
 * Tests para platosController
 * Validar CRUD de platos
 */

const { request, app, registerAndLogin, makeAuthRequest } = require('../helpers/testHelper');

describe('Platos Controller', () => {
  let token;

  beforeAll(async () => {
    token = await registerAndLogin('platosuser', 'password123');
  });

  describe('POST /api/platos', () => {
    
    it('debe crear un plato válido', async () => {
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: 'PL001',
          nombre: 'Paella Valenciana',
          pvp: 25.50
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.codigo).toBe('PL001');
      expect(res.body.data.nombre).toBe('Paella Valenciana');
    });

    it('debe rechazar plato sin código', async () => {
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          nombre: 'Test Plato',
          pvp: 15.00
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('validación');
    });

    it('debe rechazar plato sin nombre', async () => {
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: 'PL002',
          pvp: 15.00
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar plato con PVP inválido (texto)', async () => {
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: 'PL003',
          nombre: 'Test',
          pvp: 'abc'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar plato con código duplicado', async () => {
      // Crear primero
      await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: 'DUP001',
          nombre: 'Plato Original',
          pvp: 20.00
        });

      // Intentar duplicado
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: 'DUP001',
          nombre: 'Plato Duplicado',
          pvp: 25.00
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('código');
    });

    it('debe rechazar sin autenticación', async () => {
      const res = await request(app)
        .post('/api/platos')
        .send({
          codigo: 'PL004',
          nombre: 'Test',
          pvp: 15.00
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/platos', () => {
    
    beforeAll(async () => {
      // Insertar algunos platos
      for (let i = 1; i <= 3; i++) {
        await makeAuthRequest('post', '/api/platos', token)
          .send({
            codigo: `LIST${i}`,
            nombre: `Plato Listado ${i}`,
            pvp: 10 + i
          });
      }
    });

    it('debe listar platos existentes', async () => {
      const res = await makeAuthRequest('get', '/api/platos', token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('debe contener platos creados', async () => {
      const res = await makeAuthRequest('get', '/api/platos', token);

      const platoIds = res.body.data.map(p => p.codigo);
      expect(platoIds).toContain('LIST1');
    });

    it('debe rechazar sin autenticación', async () => {
      const res = await request(app)
        .get('/api/platos');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/platos/:id', () => {
    let platoId;

    beforeAll(async () => {
      const createRes = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: 'GET001',
          nombre: 'Plato para GET',
          pvp: 18.50
        });
      platoId = createRes.body.data.id;
    });

    it('debe obtener un plato por ID', async () => {
      const res = await makeAuthRequest('get', `/api/platos/${platoId}`, token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(platoId);
      expect(res.body.data.codigo).toBe('GET001');
    });

    it('debe retornar 404 para plato inexistente', async () => {
      const res = await makeAuthRequest('get', '/api/platos/99999', token);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('no encontrado');
    });

    it('debe rechazar sin autenticación', async () => {
      const res = await request(app)
        .get(`/api/platos/${platoId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/platos/:id', () => {
    let platoId;

    beforeAll(async () => {
      const createRes = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: 'UPD001',
          nombre: 'Plato Original',
          pvp: 20.00
        });
      platoId = createRes.body.data.id;
    });

    it('debe actualizar un plato existente', async () => {
      const res = await makeAuthRequest('put', `/api/platos/${platoId}`, token)
        .send({
          nombre: 'Plato Actualizado',
          pvp: 25.00
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe('Plato Actualizado');
      expect(res.body.data.pvp).toBe(25.00);
    });

    it('debe rechazar actualización de plato inexistente', async () => {
      const res = await makeAuthRequest('put', '/api/platos/99999', token)
        .send({
          nombre: 'Test',
          pvp: 15.00
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar actualización sin autenticación', async () => {
      const res = await request(app)
        .put(`/api/platos/${platoId}`)
        .send({
          nombre: 'Test',
          pvp: 15.00
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/platos/:id', () => {
    let platoId;

    beforeAll(async () => {
      const createRes = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: 'DEL001',
          nombre: 'Plato para Eliminar',
          pvp: 15.00
        });
      platoId = createRes.body.data.id;
    });

    it('debe eliminar un plato existente', async () => {
      const res = await makeAuthRequest('delete', `/api/platos/${platoId}`, token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debe retornar 404 al eliminar plato inexistente', async () => {
      const res = await makeAuthRequest('delete', '/api/platos/99999', token);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar eliminación sin autenticación', async () => {
      const res = await request(app)
        .delete(`/api/platos/${platoId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
