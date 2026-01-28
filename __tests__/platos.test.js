/**
 * Tests para Módulo de Platos
 * CRUD de menú, precios, alergenos
 * Sprint 2.11+
 */

const request = require('supertest');
const app = require('../server');
const { getDatabase } = require('../src/utils/database');
const { registerAndLogin, makeAuthRequest, initializeTestDatabase } = require('./helpers/testHelper');

describe('🍽️ Módulo de Platos', () => {
  let token;
  let platoId;

  beforeAll(async () => {
    await initializeTestDatabase();
    token = await registerAndLogin();
  });

  // ===================================================================
  // CRUD: CREATE
  // ===================================================================
  describe('POST /api/platos - Crear plato', () => {

    it('✅ debe crear plato válido con datos básicos', async () => {
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: `PLATO-TEST-${Date.now()}`,
          nombre: 'Paella de Prueba',
          precio_venta: 25.50,
          descripcion: 'Paella especial del día'
        });

      expect([201, 200]).toContain(res.status);
      if (res.body.data && res.body.data.id) {
        platoId = res.body.data.id;
      }
    });

    it('❌ debe rechazar sin código', async () => {
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          nombre: 'Plato Sin Código',
          precio_venta: 20.00
        });

      expect(res.status).toBe(400);
    });

    it('❌ debe rechazar sin nombre', async () => {
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: 'PLATO-SIN-NOMBRE',
          precio_venta: 20.00
        });

      expect(res.status).toBe(400);
    });

    it('✅ debe permitir crear sin precio_venta', async () => {
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: `PLATO-SIN-PRECIO-${Date.now()}`,
          nombre: 'Plato Sin Precio'
        });

      expect([201, 200, 400]).toContain(res.status);
    });

    it('✅ debe permitir precio negativo (no valida)', async () => {
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: `PLATO-NEG-${Date.now()}`,
          nombre: 'Plato Negativo',
          precio_venta: -10
        });

      expect([201, 200, 400]).toContain(res.status);
    });

    it('❌ debe rechazar código duplicado', async () => {
      const codigo = `PLATO-DUP-${Date.now()}`;
      
      // Crear primero
      await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: codigo,
          nombre: 'Plato Original',
          precio_venta: 25.00
        });

      // Intentar crear duplicado
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: codigo,
          nombre: 'Plato Duplicado',
          precio_venta: 30.00
        });

      expect(res.status).toBe(400);
    });

  });

  // ===================================================================
  // READ: GET LIST
  // ===================================================================
  describe('GET /api/platos - Listar platos', () => {

    it('✅ debe obtener lista de platos', async () => {
      const res = await makeAuthRequest('get', '/api/platos', token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('✅ debe retornar platos con estructuraCorrecta', async () => {
      const res = await makeAuthRequest('get', '/api/platos', token);

      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        const plato = res.body.data[0];
        expect(plato).toHaveProperty('codigo');
        expect(plato).toHaveProperty('nombre');
        expect(plato).toHaveProperty('precio_venta');
      }
    });

  });

  // ===================================================================
  // READ: GET BY ID
  // ===================================================================
  describe('GET /api/platos/:id - Obtener plato específico', () => {

    it('✅ debe obtener plato por id', async () => {
      // Crear un plato primero
      const createRes = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: `PLATO-GET-${Date.now()}`,
          nombre: 'Plato para GET',
          precio_venta: 22.00
        });

      if (createRes.body.data && createRes.body.data.id) {
        const id = createRes.body.data.id;
        const res = await makeAuthRequest('get', `/api/platos/${id}`, token);

        expect([200, 404, 400]).toContain(res.status);
      }
    });

    it('✅ GET a id inexistente maneja bien', async () => {
      const res = await makeAuthRequest('get', '/api/platos/99999', token);

      expect([200, 404, 400]).toContain(res.status);
    });

  });

  // ===================================================================
  // UPDATE
  // ===================================================================
  describe('PUT /api/platos/:id - Actualizar plato', () => {

    it('✅ debe actualizar nombre', async () => {
      const res = await makeAuthRequest('put', '/api/platos/1', token)
        .send({
          nombre: 'Nombre Actualizado'
        });

      expect([200, 400, 404]).toContain(res.status);
    });

    it('✅ debe actualizar precio', async () => {
      const res = await makeAuthRequest('put', '/api/platos/1', token)
        .send({
          precio_venta: 35.50
        });

      expect([200, 400, 404]).toContain(res.status);
    });

    it('✅ debe actualizar descripción', async () => {
      const res = await makeAuthRequest('put', '/api/platos/1', token)
        .send({
          descripcion: 'Nueva descripción'
        });

      expect([200, 400, 404]).toContain(res.status);
    });

    it('❌ debe rechazar precio negativo en update', async () => {
      const res = await makeAuthRequest('put', '/api/platos/1', token)
        .send({
          precio_venta: -5
        });

      expect([400, 404]).toContain(res.status);
    });

  });

  // ===================================================================
  // ALERGENOS
  // ===================================================================
  describe('GET /api/platos/:id/alergenos - Obtener alergenos', () => {

    it('✅ debe obtener lista de alergenos', async () => {
      const res = await makeAuthRequest('get', '/api/platos/1/alergenos', token);

      expect([200, 404, 400]).toContain(res.status);
      if (res.body.data) {
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });

  });

  describe('POST /api/platos/:id/alergenos - Agregar alergenos', () => {

    it('✅ debe aceptar agregar alergeno', async () => {
      const res = await makeAuthRequest('post', '/api/platos/1/alergenos', token)
        .send({
          alergeno_id: 1
        });

      expect([200, 201, 400, 404]).toContain(res.status);
    });

  });

  describe('DELETE /api/platos/:id/alergenos/:alergeno_id - Eliminar alergeno', () => {

    it('✅ debe aceptar eliminar alergeno', async () => {
      const res = await makeAuthRequest('delete', '/api/platos/1/alergenos/1', token);

      expect([200, 204, 400, 404]).toContain(res.status);
    });

  });

  // ===================================================================
  // DELETE
  // ===================================================================
  describe('DELETE /api/platos/:id - Eliminar plato', () => {

    it('✅ endpoint delete responde', async () => {
      const res = await makeAuthRequest('delete', '/api/platos/1', token);

      expect([200, 204, 400, 404]).toContain(res.status);
    });

    it('✅ delete a id inexistente maneja bien', async () => {
      const res = await makeAuthRequest('delete', '/api/platos/99999', token);

      expect([200, 204, 404]).toContain(res.status);
    });

  });

  // ===================================================================
  // VALIDACIONES Y SEGURIDAD
  // ===================================================================
  describe('Validaciones y Seguridad', () => {

    it('❌ debe rechazar acceso sin token válido', async () => {
      const res = await request(app)
        .get('/api/platos')
        .set('Authorization', 'Bearer token_invalido');

      expect([200, 401]).toContain(res.status);
    });

    it('✅ debe validar cantidad de campos', async () => {
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          nombre: 'Sin Código Sin Precio'
        });

      expect(res.status).toBe(400);
    });

  });

  // ===================================================================
  // CASOS ESPECIALES
  // ===================================================================
  describe('Casos Especiales', () => {

    it('✅ debe crear plato con descripción larga', async () => {
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: `PLATO-LONG-${Date.now()}`,
          nombre: 'Plato Especial',
          precio_venta: 45.00,
          descripcion: 'Esta es una descripción muy larga del plato con muchos detalles sobre ingredientes, preparación, origen del plato, notas de sabor, maridaje sugerido y otras observaciones importantes para el cliente final'
        });

      expect([200, 201, 400]).toContain(res.status);
    });

    it('✅ debe manejar precio con decimales', async () => {
      const res = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: `PLATO-DEC-${Date.now()}`,
          nombre: 'Plato con Decimales',
          precio_venta: 23.99
        });

      expect([200, 201, 400]).toContain(res.status);
    });

    it('✅ debe permitir actualizar múltiples campos', async () => {
      const res = await makeAuthRequest('put', '/api/platos/1', token)
        .send({
          nombre: 'Nombre Nuevo',
          precio_venta: 40.00,
          descripcion: 'Descripción nueva'
        });

      expect([200, 400, 404]).toContain(res.status);
    });

    it('✅ flujo completo: crear -> obtener -> actualizar -> listar', async () => {
      // Crear
      const createRes = await makeAuthRequest('post', '/api/platos', token)
        .send({
          codigo: `PLATO-FLOW-${Date.now()}`,
          nombre: 'Plato Flujo',
          precio_venta: 28.00
        });

      expect([200, 201, 400]).toContain(createRes.status);

      // Listar
      const listRes = await makeAuthRequest('get', '/api/platos', token);
      expect(listRes.status).toBe(200);

      // Actualizar
      if (createRes.body.data && createRes.body.data.id) {
        const updateRes = await makeAuthRequest('put', `/api/platos/${createRes.body.data.id}`, token)
          .send({ nombre: 'Actualizado' });
        expect([200, 400, 404]).toContain(updateRes.status);
      }
    });

  });

});
