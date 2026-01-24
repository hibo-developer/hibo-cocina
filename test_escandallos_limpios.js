const db = require('./src/db/database');

console.log('🧪 PRUEBA DE ESCANDALLOS DESPUÉS DE LIMPIEZA\n');
console.log('═'.repeat(80));

// 1. Verificar que no hay huérfanos
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
  } else {
    console.log(`✅ Escandallos huérfanos: ${result.total} (debería ser 0)`);
  }
});

// 2. Verificar ARROZ AL HORNO específicamente
db.all(`
  SELECT 
    e.id,
    e.plato_id,
    e.ingrediente_id,
    e.cantidad,
    e.unidad,
    e.coste,
    i.nombre as ingrediente_nombre,
    i.coste_kilo,
    p.nombre as plato_nombre,
    p.precio_venta,
    CASE 
      WHEN e.coste > 0 THEN e.coste
      WHEN i.coste_kilo > 0 AND LOWER(e.unidad) IN ('kg', 'kilo', 'kilos') THEN e.cantidad * i.coste_kilo
      WHEN i.coste_kilo > 0 AND LOWER(e.unidad) IN ('g', 'gr', 'gramo', 'gramos') THEN (e.cantidad / 1000.0) * i.coste_kilo
      ELSE 0
    END as coste_calculado
  FROM escandallos e
  LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
  LEFT JOIN platos p ON e.plato_id = p.id
  WHERE p.codigo = 'PL-104'
`, (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    console.log(`\n📋 ARROZ AL HORNO (PL-104) - ${rows.length} ingredientes:`);
    console.log('─'.repeat(80));
    
    let pesoTotal = 0;
    let costeTotal = 0;
    const alergenos = new Set();
    
    rows.forEach((r, i) => {
      const coste = parseFloat(r.coste_calculado) || 0;
      costeTotal += coste;
      
      // Calcular peso
      const cantidad = parseFloat(r.cantidad) || 0;
      const unidad = (r.unidad || '').toLowerCase();
      if (unidad === 'kg') pesoTotal += cantidad;
      else if (unidad === 'g') pesoTotal += cantidad / 1000;
      
      // Detectar alérgenos simples
      const nombre = (r.ingrediente_nombre || '').toLowerCase();
      if (nombre.includes('huevo')) alergenos.add('Huevo');
      if (nombre.includes('leche') || nombre.includes('queso')) alergenos.add('Lácteos');
      if (nombre.includes('gluten') || nombre.includes('harina')) alergenos.add('Gluten');
      
      console.log(`${(i+1).toString().padStart(2)}. ${r.ingrediente_nombre || '❌ SIN NOMBRE'}`);
      console.log(`    Cantidad: ${r.cantidad} ${r.unidad} | Coste: ${coste.toFixed(4)}€`);
    });
    
    console.log('─'.repeat(80));
    console.log(`\n💰 COSTE TOTAL: ${costeTotal.toFixed(4)}€`);
    console.log(`⚖️  PESO NETO: ${pesoTotal.toFixed(3)} kg`);
    
    if (rows[0] && rows[0].precio_venta) {
      const precioVenta = parseFloat(rows[0].precio_venta);
      const margen = ((precioVenta - costeTotal) / precioVenta * 100);
      console.log(`💵 PRECIO VENTA: ${precioVenta.toFixed(2)}€`);
      console.log(`📊 MARGEN: ${margen.toFixed(1)}%`);
    }
    
    if (alergenos.size > 0) {
      console.log(`\n⚠️  ALÉRGENOS: ${Array.from(alergenos).join(', ')}`);
    }
  }
  
  setTimeout(() => db.close(), 500);
});
