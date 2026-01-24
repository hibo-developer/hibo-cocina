const db = require('./src/db/database');

// Recrear el escandallo faltante
const escandallo = {
  plato_id: 37,
  ingrediente_id: 944,  // Aceite de ajo - BASE
  cantidad: 0.03,
  unidad: 'Kg'
};

console.log('➕ Insertando escandallo faltante:', escandallo);

db.run(
  `INSERT INTO escandallos (plato_id, ingrediente_id, cantidad, unidad) 
   VALUES (?, ?, ?, ?)`,
  [escandallo.plato_id, escandallo.ingrediente_id, escandallo.cantidad, escandallo.unidad],
  function(err) {
    if (err) {
      console.error('❌ Error:', err);
    } else {
      console.log(`✅ Escandallo insertado con ID: ${this.lastID}`);
    }
    
    // Verificar resultado
    db.all(
      `SELECT e.id, e.ingrediente_id, i.nombre, e.cantidad, e.unidad 
       FROM escandallos e 
       LEFT JOIN ingredientes i ON e.ingrediente_id = i.id 
       WHERE e.plato_id = 37 
       ORDER BY e.id`,
      [],
      (err, rows) => {
        if (err) {
          console.error('❌ Error:', err);
        } else {
          console.log(`\n✅ Escandallos finales del plato 37 (${rows.length} ingredientes):`);
          rows.forEach(row => {
            console.log(`  ✅ ID: ${row.id}, Ingrediente: ${row.nombre}, Cantidad: ${row.cantidad} ${row.unidad}`);
          });
        }
        db.close();
      }
    );
  }
);
