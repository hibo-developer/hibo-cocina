/**
 * Helper para tests
 * Proporciona utilidades comunes para todos los tests
 */

const request = require('supertest');
const app = require('../../server');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Crear base de datos de prueba
 */
function createTestDatabase() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, '../../data', 'test-hibo-cocina.db');
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

/**
 * Limpiar base de datos de prueba
 */
function cleanupTestDatabase(db) {
  return new Promise((resolve, reject) => {
    db.exec(`
      DELETE FROM platos;
      DELETE FROM ingredientes;
      DELETE FROM escandallos;
      DELETE FROM inventario;
      DELETE FROM pedidos;
      DELETE FROM partidas_cocina;
      DELETE FROM control_sanidad;
      DELETE FROM usuarios;
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Cerrar base de datos
 */
function closeDatabase(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Registrar usuario de prueba y obtener token
 */
async function registerAndLogin(username = 'testuser', password = 'testpass123') {
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ username, password });

  if (registerRes.status !== 201) {
    throw new Error(`Failed to register: ${registerRes.body.error}`);
  }

  const token = registerRes.body.data.token;
  return token;
}

/**
 * Helper para hacer requests autenticados
 */
function makeAuthRequest(method, path, token) {
  const req = request(app)[method](path);
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return req;
}

/**
 * Insertar plato de prueba
 */
function insertTestPlato(db, codigo = 'TEST001', nombre = 'Test Plato', pvp = 10.50) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO platos (codigo, nombre, pvp) VALUES (?, ?, ?)',
      [codigo, nombre, pvp],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

/**
 * Insertar ingrediente de prueba
 */
function insertTestIngrediente(db, codigo = 'ING001', nombre = 'Test Ingrediente') {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO ingredientes (codigo, nombre) VALUES (?, ?)',
      [codigo, nombre],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

module.exports = {
  request,
  app,
  createTestDatabase,
  cleanupTestDatabase,
  closeDatabase,
  registerAndLogin,
  makeAuthRequest,
  insertTestPlato,
  insertTestIngrediente
};
