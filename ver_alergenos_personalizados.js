const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('🔍 Buscando tablas de alérgenos...\n');

// Buscar tablas
db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%alergeno%'`, (err, tables) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  console.log('📋 Tablas encontradas:', tables);
  
  if (tables.length > 0) {
    const tableName = tables[0].name;
    console.log(`\n📊 Consultando ${tableName}...\n`);
    
    db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) {
        console.error('❌ Error:', err);
      } else {
        console.log('✅ Alérgenos personalizados:');
        console.log(JSON.stringify(rows, null, 2));
      }
      db.close();
    });
  } else {
    console.log('\n⚠️ No se encontraron tablas de alérgenos personalizados');
    db.close();
  }
});
