/**
 * Utilidad para ejecutar migraciones SQL
 */
const fs = require('fs');
const path = require('path');
const { getDatabase } = require('./database');

/**
 * Ejecutar todas las migraciones pendientes
 */
async function runMigrations() {
  try {
    const db = getDatabase();
    const migrationsDir = path.join(__dirname, '../../migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('ℹ️  No se encontró directorio de migraciones');
      return;
    }

    // Leer todos los archivos .sql
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📦 Encontradas ${files.length} migraciones`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Ejecutar el SQL
      return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
          if (err) {
            // Ignorar errores de tabla ya existente
            if (err.message.includes('already exists')) {
              console.log(`✓ ${file} - Ya existe`);
              resolve();
            } else {
              console.error(`✗ Error en ${file}:`, err.message);
              reject(err);
            }
          } else {
            console.log(`✓ ${file} - Ejecutada`);
            resolve();
          }
        });
      });
    }

    console.log('✅ Migraciones completadas');
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error.message);
    throw error;
  }
}

module.exports = {
  runMigrations
};
