const db = require('./src/db/database');

console.log('🧹 Limpiando partidas incorrectas...\n');

db.serialize(() => {
  // Eliminar todas las partidas vacías
  db.run('DELETE FROM partidas_cocina WHERE nombre IS NULL OR nombre = ""', function(err) {
    if (err) {
      console.error('Error:', err);
      process.exit(1);
    }
    console.log(`✅ ${this.changes} partidas incorrectas eliminadas`);
    
    // Verificar cuántas quedan
    db.get('SELECT COUNT(*) as total FROM partidas_cocina', (err, row) => {
      console.log(`Partidas restantes: ${row?.total}`);
      
      if (row?.total > 0) {
        db.all('SELECT nombre, responsable FROM partidas_cocina LIMIT 10', (err, rows) => {
          console.log('\nPartidas válidas restantes:');
          rows?.forEach(r => console.log(`  - ${r.nombre} (${r.responsable || 'sin responsable'})`));
          process.exit(0);
        });
      } else {
        console.log('\n⚠️  No quedan partidas. Necesitas crear partidas manualmente o importar de otra hoja.');
        process.exit(0);
      }
    });
  });
});
