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

    // Ejecutar cada migración de forma secuencial
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Ejecutar el SQL con tolerancia a errores
      return new Promise((resolve) => {
        db.exec(sql, (err) => {
          if (err) {
            // Ignorar errores comunes de migraciones
            if (err.message.includes('already exists') || 
                err.message.includes('duplicate') ||
                err.message.includes('no such table')) {
              console.log(`⚠️  ${file} - ${err.message.split(':')[1]?.trim() || 'Advertencia de esquema'}`);
            } else {
              console.warn(`⚠️  ${file} - Error: ${err.message}`);
            }
          } else {
            console.log(`✓ ${file} - Ejecutada`);
          }
          // Resolver sin fallar
          resolve();
        });
      });
    }

    console.log('✅ Migraciones completadas');
  } catch (error) {
    console.warn('⚠️  Error en migraciones (continuando):', error.message);
    // No fallar si hay errores en migraciones
  }
}

module.exports = {
  runMigrations
};
