const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('🔄 APLICANDO MIGRACIÓN: Campo palabras_clave para alérgenos personalizados\n');
console.log('=' + '='.repeat(79));

const migracionSQL = fs.readFileSync('./migrations/009_alergenos_palabras_clave.sql', 'utf-8');

db.serialize(() => {
  // Verificar si la columna ya existe
  db.get(`PRAGMA table_info(alergenos_personalizados)`, [], (err, info) => {
    if (err) {
      console.error('❌ Error al verificar tabla:', err.message);
      db.close();
      process.exit(1);
    }
    
    db.exec(migracionSQL, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('❌ Error al aplicar migración:', err.message);
        db.close();
        process.exit(1);
      }
      
      console.log('\n✅ Campo "palabras_clave" agregado exitosamente a alergenos_personalizados');
      console.log('\n💡 Este campo permite definir palabras clave para detectar');
      console.log('   automáticamente alérgenos en ingredientes.');
      console.log('\n   Ejemplo: Para alérgeno "Chile Picante"');
      console.log('   Palabras clave: chile, picante, jalapeño, habanero\n');
      
      console.log('=' + '='.repeat(79) + '\n');
      db.close();
    });
  });
});
