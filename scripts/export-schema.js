/**
 * Exportar esquema de la base de datos principal
 */
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/hibo-cocina.db');
const schemaPath = path.join(__dirname, '../data/schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al abrir base de datos:', err);
    process.exit(1);
  }
});

db.all(`SELECT sql FROM sqlite_master WHERE sql NOT NULL AND name != 'sqlite_sequence'`, [], (err, rows) => {
  if (err) {
    console.error('Error al obtener esquema:', err);
    process.exit(1);
  }
  
  const schema = rows.map(row => row.sql + ';').join('\n\n');
  fs.writeFileSync(schemaPath, schema);
  console.log(`✅ Esquema exportado a ${schemaPath}`);
  db.close();
});
