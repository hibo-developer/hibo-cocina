const db = require('./src/db/database');

console.log('📋 Verificando estructura de tablas...\n');

db.serialize(() => {
  console.log('TABLA INVENTARIO:');
  db.all('PRAGMA table_info(inventario)', (err, cols) => {
    cols?.forEach(c => console.log(`  - ${c.name} (${c.type})`));
    
    // Ver ejemplos
    db.all('SELECT * FROM inventario LIMIT 3', (err, rows) => {
      console.log('\nEjemplos:');
      rows?.forEach((r, i) => {
        console.log(`\n  Registro ${i+1}:`, JSON.stringify(r, null, 2).substring(0, 200));
      });
      
      setTimeout(() => {
        console.log('\n\nTABLA ESCANDALLOS:');
        db.all('PRAGMA table_info(escandallos)', (err, cols) => {
          cols?.forEach(c => console.log(`  - ${c.name} (${c.type})`));
          
          db.all('SELECT * FROM escandallos LIMIT 3', (err, rows) => {
            console.log('\nEjemplos:');
            rows?.forEach((r, i) => {
              console.log(`\n  Registro ${i+1}:`, JSON.stringify(r, null, 2).substring(0, 150));
            });
            
            setTimeout(() => process.exit(0), 100);
          });
        });
      }, 200);
    });
  });
});
