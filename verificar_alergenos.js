const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('🔍 VERIFICACIÓN DE ALÉRGENOS\n');
console.log('=' + '='.repeat(79));

// Los 14 alérgenos según normativa europea
const alergenosRequeridos = [
  'gluten',        // 1. Cereales con gluten
  'crustaceos',    // 2. Crustáceos
  'ovoproductos',  // 3. Huevos
  'pescado',       // 4. Pescado
  'cacahuetes',    // 5. Cacahuetes
  'soja',          // 6. Soja
  'lacteos',       // 7. Lácteos
  'frutos_secos',  // 8. Frutos de cáscara
  'apio',          // 9. Apio
  'mostaza',       // 10. Mostaza
  'sesamo',        // 11. Sésamo
  'sulfitos',      // 12. Sulfitos
  'altramuces',    // 13. Altramuces
  'moluscos'       // 14. Moluscos
];

db.all('PRAGMA table_info(ingredientes)', [], (err, cols) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  console.log('\n📋 ALÉRGENOS EN TABLA INGREDIENTES:\n');
  
  const columnasActuales = cols.map(c => c.name);
  const alergenosEncontrados = [];
  const alergenosFaltantes = [];
  
  alergenosRequeridos.forEach((alergeno, idx) => {
    if (columnasActuales.includes(alergeno)) {
      console.log(`   ✅ ${idx + 1}. ${alergeno}`);
      alergenosEncontrados.push(alergeno);
    } else {
      console.log(`   ❌ ${idx + 1}. ${alergeno} - FALTA`);
      alergenosFaltantes.push(alergeno);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN:');
  console.log(`   Total requeridos: 14`);
  console.log(`   Encontrados: ${alergenosEncontrados.length}`);
  console.log(`   Faltantes: ${alergenosFaltantes.length}`);
  
  if (alergenosFaltantes.length > 0) {
    console.log('\n⚠️  FALTA AGREGAR:');
    alergenosFaltantes.forEach(a => console.log(`   - ${a}`));
    
    console.log('\n💡 Se generará migración SQL para agregar las columnas faltantes...\n');
    
    // Generar SQL para agregar columnas
    const migracionSQL = alergenosFaltantes.map(a => 
      `ALTER TABLE ingredientes ADD COLUMN ${a} INTEGER DEFAULT 0;`
    ).join('\n');
    
    console.log('-- MIGRACIÓN SQL --');
    console.log(migracionSQL);
    console.log('-- FIN MIGRACIÓN --\n');
    
    // También para tabla platos
    const migracionPlatos = alergenosFaltantes.map(a => 
      `ALTER TABLE platos ADD COLUMN ${a} INTEGER DEFAULT 0;`
    ).join('\n');
    
    console.log('-- MIGRACIÓN TABLA PLATOS --');
    console.log(migracionPlatos);
    console.log('-- FIN MIGRACIÓN --\n');
  } else {
    console.log('\n✅ Todos los alérgenos están presentes\n');
  }
  
  db.close();
});
