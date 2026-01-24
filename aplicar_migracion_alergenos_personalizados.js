const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('🔄 APLICANDO MIGRACIÓN: Sistema de alérgenos personalizados\n');
console.log('=' + '='.repeat(79));

const migracionSQL = fs.readFileSync('./migrations/008_alergenos_personalizados.sql', 'utf-8');

db.serialize(() => {
  db.exec(migracionSQL, (err) => {
    if (err) {
      console.error('❌ Error al aplicar migración:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('\n✅ Tablas creadas exitosamente:\n');
    console.log('   ✅ alergenos_personalizados');
    console.log('   ✅ ingredientes_alergenos_personalizados');
    console.log('   ✅ platos_alergenos_personalizados');
    
    // Verificar que las tablas se crearon
    db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%alergenos%'`, [], (err, tables) => {
      if (!err) {
        console.log('\n📋 Tablas de alérgenos en la BD:');
        tables.forEach(t => console.log(`   - ${t.name}`));
      }
      
      // Insertar algunos ejemplos opcionales
      console.log('\n💡 Sistema listo para agregar alérgenos personalizados');
      console.log('   Ejemplos de uso:');
      console.log('   - Ajo');
      console.log('   - Cebolla');
      console.log('   - Tomate');
      console.log('   - Picante');
      console.log('   - Conservantes específicos');
      console.log('   - etc.\n');
      
      console.log('=' + '='.repeat(79) + '\n');
      db.close();
    });
  });
});
