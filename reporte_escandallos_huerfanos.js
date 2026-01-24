const db = require('./src/db/database');

console.log('📋 REPORTE DE ESCANDALLOS HUÉRFANOS\n');
console.log('═'.repeat(80));

// 1. Resumen por plato
db.all(`
  SELECT 
    p.codigo as plato_codigo,
    p.nombre as plato_nombre,
    COUNT(e.id) as total_huerfanos
  FROM escandallos e
  LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
  LEFT JOIN platos p ON e.plato_id = p.id
  WHERE e.ingrediente_id IS NOT NULL 
    AND e.ingrediente_id > 0 
    AND i.id IS NULL
  GROUP BY p.id, p.codigo, p.nombre
  ORDER BY total_huerfanos DESC
  LIMIT 30
`, (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    console.log(`\n📊 TOP 30 Platos con escandallos huérfanos:\n`);
    rows.forEach((r, i) => {
      console.log(`${(i+1).toString().padStart(3)}. ${r.plato_codigo} - ${r.plato_nombre}`);
      console.log(`     ${r.total_huerfanos} ingredientes sin datos\n`);
    });
    console.log(`\nTotal de platos afectados: ${rows.length}`);
  }
  
  setTimeout(() => db.close(), 500);
});
