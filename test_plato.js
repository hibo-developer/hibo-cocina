const db = require('./src/db/database');

db.get('SELECT * FROM platos WHERE codigo = ?', ['PL-1'], (err, plato) => {
  if (!plato) {
    console.log('Plato PL-1 no encontrado');
    process.exit();
    return;
  }

  console.log('\n📋 PLATO PL-1:');
  console.log('  Nombre:', plato.nombre);
  console.log('  Peso ración:', plato.peso_raciones, 'kg');

  db.all(`
    SELECT e.*, 
           i.codigo as ing_codigo, 
           i.nombre as ing_nombre, 
           i.coste_kilo 
    FROM escandallos e
    JOIN ingredientes i ON e.ingrediente_id = i.id
    WHERE e.plato_id = ?
  `, [plato.id], (err2, esc) => {
    console.log('  Escandallos:', esc.length);
    console.log('');

    if (esc.length === 0) {
      console.log('  ⚠️  Sin ingredientes');
    } else {
      esc.forEach(e => {
        console.log(`  - ${e.ing_codigo} (${e.ing_nombre})`);
        console.log(`    Cantidad: ${e.cantidad} ${e.unidad}`);
        console.log(`    Coste/kg: €${e.coste_kilo}`);
      });
    }

    process.exit();
  });
});
