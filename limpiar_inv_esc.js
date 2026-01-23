const db = require('./src/db/database');

console.log('🧹 Limpiando Inventario y Escandallos incorrectos...\n');

db.serialize(() => {
  // Limpiar escandallos con plato_id = 0
  db.run('DELETE FROM escandallos WHERE plato_id = 0 OR plato_id IS NULL', function(err) {
    if (err) {
      console.error('Error limpiando escandallos:', err);
    } else {
      console.log(`✅ ${this.changes} escandallos incorrectos eliminados`);
    }
    
    db.get('SELECT COUNT(*) as total FROM escandallos', (err, row) => {
      console.log(`   Escandallos restantes: ${row?.total}\n`);
    });
  });
  
  // Limpiar inventario con articulo_id = 1 o cantidad = 0
  setTimeout(() => {
    db.run('DELETE FROM inventario WHERE articulo_id = 1 OR cantidad = 0', function(err) {
      if (err) {
        console.error('Error limpiando inventario:', err);
      } else {
        console.log(`✅ ${this.changes} registros de inventario incorrectos eliminados`);
      }
      
      db.get('SELECT COUNT(*) as total FROM inventario', (err, row) => {
        console.log(`   Inventario restante: ${row?.total}\n`);
        
        console.log('⚠️  NOTA: Inventario y Escandallos necesitan reimportarse correctamente');
        console.log('   La estructura actual no coincide con lo esperado en el frontend.\n');
        
        setTimeout(() => process.exit(0), 100);
      });
    });
  }, 300);
});
