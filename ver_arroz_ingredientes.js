const db = require('./src/db/database');

console.log('🔍 Buscando ingredientes de arroz (tipo ingrediente)...\n');

db.all(`SELECT id, nombre, tipo_entidad, coste_kilo FROM ingredientes 
        WHERE nombre LIKE '%arroz%' 
        AND (tipo_entidad = 'ingrediente' OR tipo_entidad IS NULL)
        COLLATE NOCASE 
        ORDER BY nombre`, [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    console.log(`✅ Encontrados ${rows.length} ingredientes de arroz:\n`);
    rows.forEach(r => {
      console.log(`  ID: ${r.id.toString().padEnd(5)} - ${r.nombre.padEnd(40)} - €${r.coste_kilo || '0.00'}/kg`);
    });
    
    console.log('\n📋 El plato actual tiene:');
    db.all('SELECT e.id, e.ingrediente_id, i.nombre, e.cantidad, e.unidad FROM escandallos e LEFT JOIN ingredientes i ON e.ingrediente_id = i.id WHERE e.plato_id = 37', [], (err, esc) => {
      if (err) {
        console.error('❌ Error:', err);
      } else {
        esc.forEach(e => {
          console.log(`  - ${e.nombre}: ${e.cantidad} ${e.unidad}`);
        });
      }
      db.close();
    });
  }
});
