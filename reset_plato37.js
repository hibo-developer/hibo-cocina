const db = require('./src/db/database');

console.log('🧹 Limpiando y recreando escandallos del plato 37...');

// Paso 1: Eliminar todos
db.run('DELETE FROM escandallos WHERE plato_id = 37', [], function(err) {
  if (err) {
    console.error('❌ Error al eliminar:', err);
    db.close();
    return;
  }
  
  console.log(`✅ Eliminados ${this.changes} escandallos`);
  
  // Paso 2: Insertar los 2 correctos
  const sql = `INSERT INTO escandallos (plato_id, ingrediente_id, cantidad, unidad) VALUES (?, ?, ?, ?), (?, ?, ?, ?)`;
  db.run(sql, [37, 944, 0.03, 'Kg', 37, 951, 0.3, 'Kg'], function(err) {
    if (err) {
      console.error('❌ Error al insertar:', err);
      db.close();
      return;
    }
    
    console.log('✅ 2 escandallos insertados');
    
    // Paso 3: Verificar
    db.all('SELECT id, ingrediente_id, cantidad, unidad FROM escandallos WHERE plato_id = 37 ORDER BY id', [], (err, rows) => {
      if (err) {
        console.error('❌ Error:', err);
      } else {
        console.log(`\n📊 Escandallos finales del plato 37: ${rows.length}`);
        rows.forEach(r => console.log(`  ID: ${r.id}, Ingrediente: ${r.ingrediente_id}, Cantidad: ${r.cantidad} ${r.unidad}`));
      }
      db.close();
    });
  });
});
