const db = require('./src/db/database');

console.log('🧹 LIMPIEZA DE ESCANDALLOS HUÉRFANOS\n');
console.log('═'.repeat(80));

// Primero contar cuántos hay
db.get(`
  SELECT COUNT(*) as total
  FROM escandallos e
  LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
  WHERE e.ingrediente_id IS NOT NULL 
    AND e.ingrediente_id > 0 
    AND i.id IS NULL
`, (err, result) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  const total = result.total;
  console.log(`\n📊 Total de escandallos huérfanos a eliminar: ${total}`);
  
  if (total === 0) {
    console.log('✅ No hay escandallos huérfanos. Base de datos limpia.');
    db.close();
    return;
  }
  
  console.log('\n⚠️  Procediendo con la eliminación...\n');
  
  // Eliminar escandallos huérfanos
  db.run(`
    DELETE FROM escandallos 
    WHERE id IN (
      SELECT e.id
      FROM escandallos e
      LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
      WHERE e.ingrediente_id IS NOT NULL 
        AND e.ingrediente_id > 0 
        AND i.id IS NULL
    )
  `, function(err) {
    if (err) {
      console.error('❌ Error al eliminar:', err);
    } else {
      console.log(`✅ Eliminados ${this.changes} escandallos huérfanos exitosamente`);
      console.log('\n📊 Verificando resultado...');
      
      // Verificar que ya no hay huérfanos
      db.get(`
        SELECT COUNT(*) as restantes
        FROM escandallos e
        LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
        WHERE e.ingrediente_id IS NOT NULL 
          AND e.ingrediente_id > 0 
          AND i.id IS NULL
      `, (err, result) => {
        if (err) {
          console.error('❌ Error:', err);
        } else {
          if (result.restantes === 0) {
            console.log('✅ Base de datos limpia. No quedan escandallos huérfanos.');
          } else {
            console.log(`⚠️  Aún quedan ${result.restantes} escandallos huérfanos.`);
          }
        }
        db.close();
      });
    }
  });
});
