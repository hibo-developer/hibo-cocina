const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/hibo-cocina.db');

console.log('\n🧹 LIMPIEZA DE REGISTROS DE INVENTARIO HUÉRFANOS\n');

// Primero contar cuántos vamos a eliminar
db.get(`
  SELECT COUNT(*) as cantidad
  FROM inventario i
  WHERE NOT EXISTS (SELECT 1 FROM ingredientes ing WHERE ing.id = i.ingrediente_id)
`, (err, row) => {
  if (err) {
    console.error('❌ Error al contar:', err);
    process.exit(1);
  }
  
  const cantidadAEliminar = row.cantidad;
  console.log(`📊 Registros huérfanos a eliminar: ${cantidadAEliminar}`);
  
  // Ahora eliminar los registros huérfanos
  db.run(`
    DELETE FROM inventario
    WHERE NOT EXISTS (SELECT 1 FROM ingredientes ing WHERE ing.id = inventario.ingrediente_id)
  `, function(err) {
    if (err) {
      console.error('❌ Error al eliminar:', err);
      process.exit(1);
    }
    
    console.log(`✅ Registros eliminados: ${this.changes}`);
    
    // Verificar el resultado
    db.get('SELECT COUNT(*) as total FROM inventario', (err, row) => {
      if (err) {
        console.error('❌ Error al contar finales:', err);
        process.exit(1);
      }
      
      console.log(`✅ Registros finales en inventario: ${row.total}`);
      console.log(`\n🎉 Limpieza completada exitosamente!\n`);
      
      db.close();
      process.exit(0);
    });
  });
});
