const db = require('./src/db/database');

const PLATO_ID = 37;
const IDS_ORIGINALES = [39574, 39587];  // Los IDs que queremos conservar

console.log('🧹 Limpiando duplicados del plato', PLATO_ID);
console.log('📌 Conservando solo IDs:', IDS_ORIGINALES);

// Primero, ver qué hay actualmente
db.all('SELECT id, ingrediente_id, cantidad, unidad FROM escandallos WHERE plato_id = ?', [PLATO_ID], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  console.log(`\n📊 Escandallos actuales del plato ${PLATO_ID}:`, rows.length);
  rows.forEach(row => {
    const esOriginal = IDS_ORIGINALES.includes(row.id);
    console.log(`  ${esOriginal ? '✅' : '❌'} ID: ${row.id}, Ingrediente: ${row.ingrediente_id}, Cantidad: ${row.cantidad} ${row.unidad}`);
  });
  
  // Eliminar todos EXCEPTO los originales
  const placeholders = IDS_ORIGINALES.map(() => '?').join(',');
  const sql = `DELETE FROM escandallos WHERE plato_id = ? AND id NOT IN (${placeholders})`;
  
  db.run(sql, [PLATO_ID, ...IDS_ORIGINALES], function(err) {
    if (err) {
      console.error('❌ Error al eliminar:', err);
    } else {
      console.log(`\n✅ Duplicados eliminados. Filas afectadas: ${this.changes}`);
    }
    
    // Verificar resultado final
    db.all('SELECT id, ingrediente_id, cantidad, unidad FROM escandallos WHERE plato_id = ?', [PLATO_ID], (err, rowsFinales) => {
      if (err) {
        console.error('❌ Error:', err);
      } else {
        console.log(`\n✅ Escandallos finales del plato ${PLATO_ID}:`, rowsFinales.length);
        rowsFinales.forEach(row => {
          console.log(`  ✅ ID: ${row.id}, Ingrediente: ${row.ingrediente_id}, Cantidad: ${row.cantidad} ${row.unidad}`);
        });
      }
      db.close();
    });
  });
});
