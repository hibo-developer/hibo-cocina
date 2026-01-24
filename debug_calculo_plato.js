const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('🔍 DEBUG: Verificando cálculo detallado de un plato\n');
console.log('=' + '='.repeat(79));

// Buscar el plato más simple (que solo use ingredientes AR-)
db.get(`SELECT p.id, p.codigo, p.nombre
        FROM platos p
        WHERE p.tipo_entidad = 'plato'
        AND EXISTS (SELECT 1 FROM escandallos WHERE plato_id = p.id)
        AND NOT EXISTS (
          SELECT 1 FROM escandallos e2
          JOIN ingredientes i2 ON e2.ingrediente_id = i2.id
          WHERE e2.plato_id = p.id 
          AND i2.codigo LIKE 'PL-%'
        )
        LIMIT 1`, [], (err, plato) => {
  
  if (err || !plato) {
    console.error('❌ Error:', err || 'No se encontró plato');
    db.close();
    return;
  }
  
  console.log(`\n📋 PLATO: ${plato.nombre} (${plato.codigo})\n`);
  
  // Ver todos los ingredientes con detalles
  db.all(`SELECT 
            e.id as escandallo_id,
            e.ingrediente_id,
            e.cantidad,
            e.unidad,
            i.codigo as ing_codigo,
            i.nombre as ing_nombre,
            i.coste_kilo,
            i.peso_neto_envase,
            i.tipo_entidad
          FROM escandallos e
          LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
          WHERE e.plato_id = ?
          ORDER BY e.id`, [plato.id], (err2, ings) => {
    
    if (err2) {
      console.error('❌ Error:', err2);
      db.close();
      return;
    }
    
    console.log(`Ingredientes (${ings.length}):\n`);
    
    let costeTotal = 0;
    
    ings.forEach((ing, idx) => {
      console.log(`${idx + 1}. ${ing.ing_codigo || 'NULL'} (${ing.tipo_entidad || 'NULL'})`);
      console.log(`   Nombre: ${ing.ing_nombre || '❌ SIN NOMBRE'}`);
      console.log(`   Cantidad: ${ing.cantidad} ${ing.unidad}`);
      console.log(`   Coste/kg: ${ing.coste_kilo !== null ? ing.coste_kilo + '€' : '❌ NULL'}`);
      console.log(`   Peso unidad: ${ing.peso_neto_envase !== null ? ing.peso_neto_envase + 'kg' : '❌ NULL'}`);
      
      // Calcular coste
      const unidadLower = (ing.unidad || '').toLowerCase();
      let cantidadKilos = 0;
      if (unidadLower === 'kg' || unidadLower === 'lt' || unidadLower === 'l') {
        cantidadKilos = ing.cantidad;
      } else if (unidadLower === 'ud' || unidadLower === 'un') {
        cantidadKilos = ing.cantidad * (ing.peso_neto_envase || 0);
      }
      
      const costeIngrediente = (ing.coste_kilo || 0) * cantidadKilos;
      costeTotal += costeIngrediente;
      
      console.log(`   → Cantidad en kg: ${cantidadKilos.toFixed(3)}`);
      console.log(`   → Coste ingrediente: ${costeIngrediente.toFixed(3)}€\n`);
    });
    
    console.log('=' + '='.repeat(79));
    console.log(`💰 COSTE TOTAL CALCULADO: ${costeTotal.toFixed(3)}€`);
    
    // Ver qué tiene guardado en la base de datos
    db.get(`SELECT coste_escandallo, coste_racion, peso_raciones 
            FROM platos WHERE id = ?`, [plato.id], (err3, costes) => {
      
      console.log(`💾 COSTE EN BASE DE DATOS:`);
      console.log(`   coste_escandallo: ${costes.coste_escandallo}€`);
      console.log(`   coste_racion: ${costes.coste_racion}€`);
      console.log(`   peso_raciones: ${costes.peso_raciones}kg`);
      
      db.close();
    });
  });
});
