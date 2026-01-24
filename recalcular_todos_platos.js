const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');
const CalculadoraCostes = require('./src/services/CalculadoraCostes');

const calculadora = new CalculadoraCostes(db);

console.log('\n🔄 Recalculando costes de todos los platos con los nuevos precios...\n');

db.all(`SELECT id, codigo, nombre FROM platos WHERE id IN (SELECT DISTINCT plato_id FROM escandallos)`, [], async (err, platos) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
  
  console.log(`📋 ${platos.length} platos con escandallos\n`);
  
  let actualizados = 0;
  let errores = 0;
  let conCostes = 0;
  
  for (const plato of platos) {
    try {
      const resultado = await calculadora.actualizarCostePlato(plato.id);
      
      if (resultado.costeEscandallo > 0) {
        console.log(`✅ ${plato.codigo}: escandallo=${resultado.costeEscandallo.toFixed(3)}€, ración=${resultado.costeRacion.toFixed(3)}€`);
        conCostes++;
      }
      actualizados++;
    } catch (error) {
      console.error(`❌ ${plato.codigo}: ${error.message}`);
      errores++;
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ Procesados: ${actualizados}`);
  console.log(`📊 Con costes > 0: ${conCostes}`);
  console.log(`⚠️  Con coste = 0: ${actualizados - conCostes}`);
  console.log(`❌ Errores: ${errores}`);
  console.log(`${'='.repeat(80)}\n`);
  
  // Mostrar algunos ejemplos
  console.log('📋 Verificando algunos platos:\n');
  db.all(`
    SELECT codigo, nombre, coste_racion, coste_escandallo, peso_raciones 
    FROM platos 
    WHERE coste_escandallo > 0 
    ORDER BY coste_escandallo DESC 
    LIMIT 10
  `, [], (err, ejemplos) => {
    ejemplos.forEach(p => {
      const ratio = p.coste_racion / p.coste_escandallo;
      console.log(`${p.codigo} - ${p.nombre}`);
      console.log(`   Escandallo: ${p.coste_escandallo.toFixed(3)}€ | Ración: ${p.coste_racion.toFixed(3)}€ (${p.peso_raciones}kg) | Ratio: ${(ratio * 100).toFixed(1)}%`);
    });
    
    console.log('\n✅ Recálculo completado. Recarga el navegador para ver los cambios.\n');
    db.close();
  });
});
