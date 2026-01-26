/**
 * Tests para las rutas de PLATOS
 */
const request = require('supertest');
const { app, initializeTestDatabase } = require('./helpers/testHelper');

describe('Platos API Routes', () => {
  beforeAll(async () => {
    await initializeTestDatabase();
  });

  test('GET /api/platos debería retornar código 200', async () => {
    const response = await request(app)
      .get('/api/platos')
      .expect(200);

    expect(response.body).toBeDefined();
  });

  test('GET /api/platos debería retornar un array', async () => {
    const response = await request(app)
      .get('/api/platos')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/platos debería crear un plato válido', async () => {
    const nuevoPlato = {
      codigo: 'TEST001',
      nombre: 'Plato Test',
      descripcion: 'Descripción de test'
    };

    const response = await request(app)
      .post('/api/platos')
      .send(nuevoPlato)
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id');
  });
});
