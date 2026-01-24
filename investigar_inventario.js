const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/hibo-cocina.db');

console.log('\n📊 INVESTIGACIÓN DE REGISTROS DE INVENTARIO\n');

// Query 1: Total de registros
db.get('SELECT COUNT(*) as total FROM inventario', (err, row) => {
  if (err) console.error('Error:', err);
  else console.log(`✅ Total de registros en inventario: ${row.total}`);
});

// Query 2: Registros con ingrediente válido
db.get(`
  SELECT COUNT(*) as con_ingrediente 
  FROM inventario i
  WHERE i.ingrediente_id IS NOT NULL 
    AND i.ingrediente_id > 0
    AND EXISTS (SELECT 1 FROM ingredientes ing WHERE ing.id = i.ingrediente_id)
`, (err, row) => {
  if (err) console.error('Error:', err);
  else console.log(`✅ Registros con ingrediente válido: ${row.con_ingrediente}`);
});

// Query 3: Registros SIN ingrediente válido (huérfanos)
db.get(`
  SELECT COUNT(*) as sin_ingrediente 
  FROM inventario i
  WHERE i.ingrediente_id IS NULL 
    OR i.ingrediente_id = 0
    OR NOT EXISTS (SELECT 1 FROM ingredientes ing WHERE ing.id = i.ingrediente_id)
`, (err, row) => {
  if (err) console.error('Error:', err);
  else console.log(`❌ Registros SIN ingrediente válido (huérfanos): ${row.sin_ingrediente}`);
});

// Query 4: Mostrar ejemplos de registros huérfanos
db.all(`
  SELECT i.id, i.ingrediente_id, i.cantidad, i.fecha_registro
  FROM inventario i
  WHERE i.ingrediente_id IS NULL 
    OR i.ingrediente_id = 0
    OR NOT EXISTS (SELECT 1 FROM ingredientes ing WHERE ing.id = i.ingrediente_id)
  LIMIT 10
`, (err, rows) => {
  if (err) console.error('Error:', err);
  else {
    console.log('\n📌 Ejemplos de registros huérfanos (primeros 10):');
    rows.forEach(r => {
      console.log(`   ID: ${r.id}, ingrediente_id: ${r.ingrediente_id}, cantidad: ${r.cantidad}, fecha: ${r.fecha_registro}`);
    });
  }
});

// Query 5: Agrupar por fecha para ver distribución
db.all(`
  SELECT fecha_registro, COUNT(*) as cantidad
  FROM inventario
  GROUP BY fecha_registro
  ORDER BY fecha_registro DESC
  LIMIT 5
`, (err, rows) => {
  if (err) console.error('Error:', err);
  else {
    console.log('\n📅 Distribución por fecha (últimas 5):');
    rows.forEach(r => {
      console.log(`   ${r.fecha_registro}: ${r.cantidad} registros`);
    });
  }
});

setTimeout(() => {
  db.close();
  process.exit(0);
}, 2000);
