const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('🔍 Verificando costes en la base de datos...\n');

// 1. Verificar ingredientes con coste_kilo
db.all(`SELECT id, codigo, nombre, coste_kilo 
        FROM ingredientes 
        WHERE coste_kilo IS NOT NULL AND coste_kilo > 0 
        LIMIT 10`, [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  console.log(`✅ ${rows.length} ingredientes con coste_kilo (primeros 10):`);
  rows.forEach(r => {
    console.log(`   ${r.codigo}: ${r.nombre} = ${r.coste_kilo}€/kg`);
  });
  
  console.log('\n🔍 Verificando escandallo del primer plato...\n');
  
  // 2. Verificar escandallos de un plato con JOIN a ingredientes
  db.all(`SELECT 
            p.id as plato_id,
            p.nombre as plato_nombre,
            e.ingrediente_id,
            e.cantidad,
            e.unidad,
            i.codigo as ingrediente_codigo,
            i.nombre as ingrediente_nombre,
            i.coste_kilo
          FROM platos p
          JOIN escandallos e ON p.id = e.plato_id
          LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
          WHERE p.id = (SELECT id FROM platos WHERE codigo LIKE 'PL-%' LIMIT 1)
          LIMIT 5`, [], (err2, rows2) => {
    if (err2) {
      console.error('❌ Error:', err2);
      db.close();
      return;
    }
    
    if (rows2.length === 0) {
      console.log('⚠️  No se encontraron escandallos');
      db.close();
      return;
    }
    
    console.log(`📋 Plato: ${rows2[0].plato_nombre} (ID: ${rows2[0].plato_id})`);
    console.log('   Ingredientes en escandallo:');
    rows2.forEach(r => {
      console.log(`   - ${r.ingrediente_codigo || 'SIN CODIGO'}: ${r.ingrediente_nombre || 'SIN NOMBRE'}`);
      console.log(`     Cantidad: ${r.cantidad} ${r.unidad}, Coste/kg: ${r.coste_kilo || '❌ NULL'}€`);
    });
    
    db.close();
  });
});
