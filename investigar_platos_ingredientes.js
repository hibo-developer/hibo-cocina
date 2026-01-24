const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('🔍 Investigando relación escandallos-ingredientes-platos...\n');

// Buscar un ingrediente_id que sea un plato (PL-)
db.get(`SELECT e.ingrediente_id, i.codigo as ing_codigo, i.nombre as ing_nombre, i.tipo_entidad
        FROM escandallos e
        LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
        WHERE i.codigo LIKE 'PL-%'
        LIMIT 1`, [], (err, row) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  if (!row) {
    console.log('⚠️ No se encontró ningún escandallo con plato como ingrediente');
    db.close();
    return;
  }
  
  console.log(`📋 Escandallo con plato como ingrediente:`);
  console.log(`   ingrediente_id: ${row.ingrediente_id}`);
  console.log(`   Código: ${row.ing_codigo}`);
  console.log(`   Nombre: ${row.ing_nombre}`);
  console.log(`   Tipo: ${row.tipo_entidad}\n`);
  
  // Ahora buscar ese mismo código en la tabla platos
  db.get(`SELECT id, codigo, nombre, coste_escandallo, peso_raciones, tipo_entidad
          FROM platos
          WHERE codigo = ?`, [row.ing_codigo], (err2, plato) => {
    if (err2) {
      console.error('❌ Error:', err2);
      db.close();
      return;
    }
    
    if (plato) {
      console.log(`✅ El mismo código existe en tabla PLATOS:`);
      console.log(`   id: ${plato.id}`);
      console.log(`   código: ${plato.codigo}`);
      console.log(`   nombre: ${plato.nombre}`);
      console.log(`   coste_escandallo: ${plato.coste_escandallo}€`);
      console.log(`   peso_raciones: ${plato.peso_raciones} kg`);
      console.log(`   tipo_entidad: ${plato.tipo_entidad}`);
      
      const costeKilo = plato.peso_raciones > 0 
        ? plato.coste_escandallo / plato.peso_raciones 
        : 0;
      console.log(`   ➡️ coste_kilo equivalente: ${costeKilo}€/kg\n`);
      
      console.log('💡 PROBLEMA IDENTIFICADO:');
      console.log('   - CalculadoraCostes busca coste_kilo en tabla ingredientes');
      console.log('   - Pero los platos (elaborados) tienen coste_escandallo en tabla platos');
      console.log('   - Solución: Calcular coste_kilo = coste_escandallo / peso_raciones');
    } else {
      console.log(`⚠️ No se encontró en tabla platos`);
    }
    
    db.close();
  });
});
