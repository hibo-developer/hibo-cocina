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

// Inicializar base de datos de test ejecutando el script de inicialización
const { execSync } = require('child_process');

try {
  // Ejecutar script de inicialización de forma síncrona
  execSync('node scripts/export-schema.js && node scripts/init-test-db.js', {
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('[TEST SETUP] Test database initialized');
} catch (err) {
  console.error('[TEST SETUP] Error initializing test database:', err);
  process.exit(1);
}

// Ejecutar migraciones en beforeAll global
module.exports = {
  setupFilesAfterEnv: [],
  testEnvironment: 'node'
};



