const db = require('./src/db/database');

console.log('🔍 Verificando escandallos sin nombre...\n');

// 1. Escandallos con ingrediente_id NULL o 0
db.all(`
  SELECT COUNT(*) as total 
  FROM escandallos 
  WHERE ingrediente_id IS NULL OR ingrediente_id = 0
`, (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    console.log(`📊 Escandallos sin ingrediente_id: ${rows[0].total}`);
  }
});

// 2. Escandallos con ingrediente_id que no existe en ingredientes
db.all(`
  SELECT COUNT(*) as total
  FROM escandallos e
  LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
  WHERE e.ingrediente_id IS NOT NULL 
    AND e.ingrediente_id > 0 
    AND i.id IS NULL
`, (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    console.log(`📊 Escandallos con ingrediente_id inválido: ${rows[0].total}`);
  }
});

// 3. Ejemplo de escandallo del ARROZ AL HORNO específicamente
db.all(`
  SELECT 
    e.id,
    e.plato_id,
    e.ingrediente_id,
    e.cantidad,
    e.unidad,
    i.nombre as ingrediente_nombre,
    p.nombre as plato_nombre
  FROM escandallos e
  LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
  LEFT JOIN platos p ON e.plato_id = p.id
  WHERE p.codigo = 'PL-104'
  LIMIT 20
`, (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    console.log(`\n📋 Escandallos de ARROZ AL HORNO (${rows.length}):`);
    rows.forEach(r => {
      console.log(`  ID: ${r.id} | Ingrediente ID: ${r.ingrediente_id} | Nombre: ${r.ingrediente_nombre || '❌ SIN NOMBRE'} | Cantidad: ${r.cantidad} ${r.unidad}`);
    });
  }
  
  // Cerrar conexión después de todas las consultas
  setTimeout(() => db.close(), 500);
});
