const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('🎯 TOP 10 PLATOS POR COSTE\n');
console.log('=' + '='.repeat(79) + '\n');

db.all(`SELECT codigo, nombre, coste_escandallo, coste_racion, peso_raciones 
        FROM platos 
        WHERE coste_escandallo > 0 
        ORDER BY coste_escandallo DESC 
        LIMIT 10`, [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  rows.forEach((r, idx) => {
    console.log(`${idx + 1}. ${r.codigo}: ${r.nombre}`);
    console.log(`   💰 Coste escandallo: ${r.coste_escandallo.toFixed(3)}€`);
    console.log(`   🍽️  Coste ración: ${r.coste_racion.toFixed(3)}€`);
    console.log(`   ⚖️  Peso raciones: ${r.peso_raciones || 0}kg`);
    console.log();
  });
  
  // Ahora ver el total
  db.get(`SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN coste_escandallo > 0 THEN 1 END) as con_coste,
            AVG(coste_escandallo) as promedio
          FROM platos 
          WHERE tipo_entidad = 'plato'`, [], (err2, stats) => {
    
    console.log('=' + '='.repeat(79));
    console.log('📊 ESTADÍSTICAS:');
    console.log(`   Total platos: ${stats.total}`);
    console.log(`   Con coste calculado: ${stats.con_coste}`);
    console.log(`   Coste promedio: ${stats.promedio.toFixed(3)}€`);
    
    db.close();
  });
});
