const db = require('./src/db/database');

console.log('🔍 Analizando Inventario y Escandallos...\n');

db.serialize(() => {
  // Inventario
  console.log('📊 INVENTARIO:');
  db.get('SELECT COUNT(*) as total FROM inventario', (err, row) => {
    console.log(`  Total registros: ${row?.total}`);
  });
  
  db.get('SELECT COUNT(*) as vacios FROM inventario WHERE articulo IS NULL OR articulo = ""', (err, row) => {
    console.log(`  Registros vacíos: ${row?.vacios}`);
  });
  
  db.all('SELECT articulo, codigo_interno, inventario, grupo_conservacion FROM inventario WHERE articulo IS NOT NULL AND articulo != "" LIMIT 5', (err, rows) => {
    console.log('  Primeros 5 con datos:');
    rows?.forEach(r => console.log(`    - ${r.codigo_interno}: ${r.articulo} (Stock: ${r.inventario})`));
  });
  
  // Escandallos
  setTimeout(() => {
    console.log('\n📋 ESCANDALLOS:');
    db.get('SELECT COUNT(*) as total FROM escandallos', (err, row) => {
      console.log(`  Total registros: ${row?.total}`);
    });
    
    db.get('SELECT COUNT(*) as sin_plato FROM escandallos WHERE plato_id = 0 OR plato_id IS NULL', (err, row) => {
      console.log(`  Sin plato válido: ${row?.sin_plato}`);
    });
    
    db.get('SELECT COUNT(*) as sin_ingrediente FROM escandallos WHERE ingrediente_id = 0 OR ingrediente_id IS NULL', (err, row) => {
      console.log(`  Sin ingrediente válido: ${row?.sin_ingrediente}`);
    });
    
    db.all(`
      SELECT e.id, p.codigo as plato, i.nombre as ingrediente, e.cantidad, e.unidad
      FROM escandallos e
      LEFT JOIN platos p ON e.plato_id = p.id
      LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
      WHERE p.codigo IS NOT NULL
      LIMIT 5
    `, (err, rows) => {
      console.log('  Primeros 5 con datos válidos:');
      rows?.forEach(r => console.log(`    - ${r.plato}: ${r.ingrediente} (${r.cantidad} ${r.unidad})`));
      
      setTimeout(() => process.exit(0), 100);
    });
  }, 200);
});
