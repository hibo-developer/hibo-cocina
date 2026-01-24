const db = require('./src/db/database');

console.log('➕ Agregando Arroz la fallera al escandallo del plato 37...\n');

db.run(`INSERT INTO escandallos (plato_id, ingrediente_id, cantidad, unidad) 
        VALUES (37, 65, 0.06, 'Kg')`, function(err) {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  console.log(`✅ Arroz agregado con ID: ${this.lastID}\n`);
  
  // Verificar todos los escandallos del plato
  db.all(`SELECT e.id, e.ingrediente_id, i.nombre, e.cantidad, e.unidad 
          FROM escandallos e 
          LEFT JOIN ingredientes i ON e.ingrediente_id = i.id 
          WHERE e.plato_id = 37 
          ORDER BY e.id`, [], (err, rows) => {
    if (err) {
      console.error('❌ Error:', err);
    } else {
      console.log(`📋 Escandallos finales del plato "ARROZ VERDURAS HORNO" (${rows.length} ingredientes):\n`);
      rows.forEach(r => {
        console.log(`  ✅ ${r.nombre.padEnd(40)} - ${r.cantidad} ${r.unidad}`);
      });
    }
    db.close();
  });
});
