/**
 * Jest Setup File
 * Configuración global para todas las pruebas
 */

const path = require('path');

// Usar base de datos de prueba
process.env.DATABASE_PATH = path.join(__dirname, 'data', 'test-hibo-cocina.db');

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

