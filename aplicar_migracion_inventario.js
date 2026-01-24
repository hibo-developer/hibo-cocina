const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'hibo-cocina.db');
const MIGRATION_FILE = path.join(__dirname, 'migrations', '007_actualizar_inventario_ingrediente_id.sql');

console.log('🔄 Aplicando migración de inventario...\n');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error al conectar:', err);
    process.exit(1);
  }
  console.log('✅ Conectado a la base de datos');
});

const migration = fs.readFileSync(MIGRATION_FILE, 'utf8');
const statements = migration.split(';').filter(s => s.trim());

let completed = 0;

function executeNext(index) {
  if (index >= statements.length) {
    console.log(`\n✅ Migración completada: ${completed} sentencias ejecutadas`);
    db.close();
    return;
  }
  
  const sql = statements[index].trim();
  if (!sql) {
    executeNext(index + 1);
    return;
  }
  
  db.run(sql, (err) => {
    if (err) {
      console.error(`❌ Error en sentencia ${index + 1}:`, err.message);
    } else {
      completed++;
      console.log(`✓ Sentencia ${index + 1} ejecutada`);
    }
    executeNext(index + 1);
  });
}

executeNext(0);
