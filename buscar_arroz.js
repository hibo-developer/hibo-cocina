const db = require('./src/db/database');

console.log('🔍 Buscando ingredientes con "arroz"...\n');

db.all(`SELECT id, nombre, tipo_entidad FROM ingredientes WHERE nombre LIKE '%arroz%' COLLATE NOCASE ORDER BY nombre LIMIT 10`, [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    console.log(`✅ Encontrados ${rows.length} ingredientes:\n`);
    rows.forEach(r => {
      console.log(`  ID: ${r.id.toString().padEnd(5)} - ${r.nombre} ${r.tipo_entidad ? `(${r.tipo_entidad})` : ''}`);
    });
  }
  db.close();
});
