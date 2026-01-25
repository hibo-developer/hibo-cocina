const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'hibo-cocina.db');
const migrationPath = path.join(__dirname, 'migrations', '010_alergenos_oficiales.sql');

console.log('📋 Aplicando migración: Tabla de alérgenos oficiales');
console.log('Base de datos:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a la base de datos');
});

const migration = fs.readFileSync(migrationPath, 'utf8');

db.exec(migration, (err) => {
  if (err) {
    console.error('❌ Error al ejecutar migración:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('✅ Tabla alergenos_oficiales creada');
  console.log('✅ 14 alérgenos oficiales insertados con palabras clave');
  
  // Verificar datos insertados
  db.all('SELECT codigo, nombre, palabras_clave FROM alergenos_oficiales ORDER BY orden', (err, rows) => {
    if (err) {
      console.error('Error al verificar:', err);
    } else {
      console.log('\n📊 Alérgenos oficiales registrados:');
      rows.forEach(row => {
        const palabras = row.palabras_clave ? row.palabras_clave.split(',').slice(0, 3).join(', ') : '';
        console.log(`   ${row.nombre} (${row.codigo}): ${palabras}...`);
      });
    }
    
    db.close((err) => {
      if (err) {
        console.error('Error al cerrar:', err.message);
      } else {
        console.log('\n✅ Migración completada exitosamente');
      }
    });
  });
});
