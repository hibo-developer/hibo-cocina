/**
 * Jest Setup File
 * Configuración global para todas las pruebas
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Usar base de datos de prueba
const testDbPath = path.join(__dirname, 'data', 'test-hibo-cocina.db');
process.env.DATABASE_PATH = testDbPath;

// Limpiar BD anterior de pruebas
try {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
} catch (e) {
  // Ignorar errores si el archivo está en uso
}

// Deshabilitar Redis en tests - usar memoryStore
process.env.REDIS_ENABLED = 'false';
process.env.NODE_ENV = 'test';

// Mock de Redis si se intenta usar
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    connect: jest.fn(),
    quit: jest.fn(),
    on: jest.fn()
  }))
}));

jest.mock('ioredis', () => {
  return jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    connect: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
    flushdb: jest.fn()
  }));
});

console.log('[TEST SETUP] Redis disabled for testing');
console.log(`[TEST SETUP] Using database: ${process.env.DATABASE_PATH}`);

// Ejecutar migraciones en beforeAll global
module.exports = {
  setupFilesAfterEnv: [],
  testEnvironment: 'node'
};



