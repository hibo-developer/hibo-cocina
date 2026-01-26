/**
 * Inicializar base de datos de test con esquema completo
 */
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const testDbPath = path.join(__dirname, '../data/test-hibo-cocina.db');
const schemaPath = path.join(__dirname, '../data/schema.sql');

// Eliminar base de datos de test si existe
try {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
    console.log('✅ Base de datos de test eliminada');
  }
} catch (err) {
  // Ignorar errores si el archivo está en uso por otro proceso Jest
  if (err.code !== 'EBUSY' && err.code !== 'EPERM') {
    console.error('❌ Error eliminando base de datos:', err);
    process.exit(1);
  }
  console.log('⏭️  Base de datos en uso, reutilizando existente');
  return; // No recrear si ya está en uso
}

// Leer esquema
const schema = fs.readFileSync(schemaPath, 'utf8');

// Crear nueva base de datos
const db = new sqlite3.Database(testDbPath, (err) => {
  if (err) {
    console.error('Error al crear base de datos:', err);
    process.exit(1);
  }
  console.log('✅ Base de datos de test creada');
});

// Aplicar esquema
db.exec(schema, (err) => {
  if (err) {
    console.error('Error al aplicar esquema:', err);
    process.exit(1);
  }
  console.log('✅ Esquema aplicado a base de datos de test');
  db.close();
});
