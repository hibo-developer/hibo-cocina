/**
 * Tests para las rutas de PLATOS
 */
const request = require('supertest');
const path = require('path');
const { initializeTestDatabase } = require('./helpers/testHelper');

// Mock de Express
const express = require('express');
const bodyParser = require('body-parser');

describe('Platos API Routes', () => {
  let app;
  let server;

  beforeAll(async () => {
    await initializeTestDatabase();
    
    app = express();
    app.use(bodyParser.json());
    
    // Importar rutas
    const platosRoutes = require('../src/routes/platos');
    app.use('/api/platos', platosRoutes);
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

    expect(Array.isArray(response.body)).toBe(true);
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

    expect(response.body).toBeDefined();
    expect(response.body.id).toBeDefined();
  });
});
