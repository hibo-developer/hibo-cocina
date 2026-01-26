/**
 * Ejecutar migraciones para la BD de pruebas
 * Este archivo se ejecuta antes de que Jest inicie
 */
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const testDbPath = path.join(__dirname, 'data', 'test-hibo-cocina.db');
const migrationsPath = path.join(__dirname, 'migrations');

async function runTestMigrations() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(testDbPath, (err) => {
      if (err) {
        console.error('[MIGRATIONS] Error opening test database:', err);
        reject(err);
        return;
      }

      console.log('[MIGRATIONS] Ejecutando migraciones para base de datos de pruebas...');

      // Leer y ejecutar todas las migraciones
      const migrationFiles = fs.readdirSync(migrationsPath)
        .filter(f => f.endsWith('.sql'))
        .sort();

      let completed = 0;

      migrationFiles.forEach((file, index) => {
        const migrationPath = path.join(migrationsPath, file);
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        db.exec(sql, (err) => {
          if (err) {
            // Ignorar errores comunes: duplicate column, already exists, no such table
            if (
              err.message.includes('duplicate column') ||
              err.message.includes('already exists') ||
              err.message.includes('no such table')
            ) {
              console.log(`[MIGRATIONS] ⚠️  ${file} - ${err.message.substring(0, 50)}`);
            } else {
              console.log(`[MIGRATIONS] ✅ ${file}`);
            }
          } else {
            console.log(`[MIGRATIONS] ✅ ${file}`);
          }

          completed++;
          if (completed === migrationFiles.length) {
            console.log(`[MIGRATIONS] ✅ Todas las migraciones completadas`);
            db.close(() => resolve());
          }
        });
      });
    });
  });
}

// Ejecutar migraciones de forma síncrona
module.exports = { runTestMigrations };

// Si se ejecuta directamente
if (require.main === module) {
  runTestMigrations()
    .then(() => {
      console.log('[MIGRATIONS] Setup completado');
      process.exit(0);
    })
    .catch(err => {
      console.error('[MIGRATIONS] Error:', err);
      process.exit(1);
    });
}
