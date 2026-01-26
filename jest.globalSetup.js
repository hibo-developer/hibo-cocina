/**
 * Jest Global Setup
 * Inicializa la base de datos de test con el esquema y migraciones
 */
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { runTestMigrations } = require('./jest-setup-migrations');

module.exports = async () => {
  const testDbPath = path.join(__dirname, 'data', 'test-hibo-cocina.db');
  const schemaPath = path.join(__dirname, 'data', 'schema.sql');

  // Apuntar a la BD de test
  process.env.DATABASE_PATH = testDbPath;
  process.env.REDIS_ENABLED = 'false';
  process.env.NODE_ENV = 'test';

  // Eliminar BD previa si no está bloqueada
  try {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log('[GLOBAL SETUP] Eliminada BD de test previa');
    }
  } catch (err) {
    console.warn('[GLOBAL SETUP] No se pudo eliminar BD de test (puede estar en uso):', err.code);
  }

  // Crear nueva BD y aplicar esquema si existe
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await new Promise((resolve, reject) => {
      const db = new sqlite3.Database(testDbPath, (err) => {
        if (err) return reject(err);
      });
      db.exec(schema, (err) => {
        if (err) {
          console.error('[GLOBAL SETUP] Error aplicando esquema:', err.message);
          reject(err);
        } else {
          console.log('[GLOBAL SETUP] Esquema aplicado a BD de test');
          db.close(() => resolve());
        }
      });
    });
  } else {
    // Si no hay schema.sql, crear una BD vacía para migraciones
    await new Promise((resolve, reject) => {
      const db = new sqlite3.Database(testDbPath, (err) => {
        if (err) return reject(err);
        db.close(() => resolve());
      });
    });
  }

  // Ejecutar migraciones de prueba (idempotente)
  try {
    await runTestMigrations();
  } catch (err) {
    console.warn('[GLOBAL SETUP] Migraciones tuvieron avisos:', err?.message || err);
  }

  console.log('[GLOBAL SETUP] Base de datos de test lista');
};
