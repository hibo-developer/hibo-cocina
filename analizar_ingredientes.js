const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/hibo-cocina.db');

console.log('\n🔍 ANÁLISIS DE INGREDIENTES\n');

// Query 1: Rango de IDs de ingredientes
db.get('SELECT MIN(id) as min_id, MAX(id) as max_id, COUNT(*) as total FROM ingredientes', (err, row) => {
  if (err) console.error('Error:', err);
  else {
    console.log(`Ingredientes - MIN ID: ${row.min_id}, MAX ID: ${row.max_id}, Total: ${row.total}`);
  }
});

// Query 2: Rango de IDs en inventario
db.get('SELECT MIN(ingrediente_id) as min_id, MAX(ingrediente_id) as max_id FROM inventario WHERE ingrediente_id IS NOT NULL', (err, row) => {
  if (err) console.error('Error:', err);
  else {
    console.log(`Inventario - MIN ingrediente_id: ${row.min_id}, MAX ingrediente_id: ${row.max_id}`);
  }
});

// Query 3: Cuántos ingrediente_id NO existen
db.get(`
  SELECT COUNT(DISTINCT i.ingrediente_id) as ids_inexistentes
  FROM inventario i
  WHERE NOT EXISTS (SELECT 1 FROM ingredientes ing WHERE ing.id = i.ingrediente_id)
`, (err, row) => {
  if (err) console.error('Error:', err);
  else {
    console.log(`IDs de ingredientes que NO existen: ${row.ids_inexistentes}`);
  }
});

// Query 4: Mostrar algunos IDs que no existen
db.all(`
  SELECT DISTINCT i.ingrediente_id
  FROM inventario i
  WHERE NOT EXISTS (SELECT 1 FROM ingredientes ing WHERE ing.id = i.ingrediente_id)
  ORDER BY i.ingrediente_id
  LIMIT 15
`, (err, rows) => {
  if (err) console.error('Error:', err);
  else {
    console.log('\n❌ Algunos IDs de ingredientes que NO existen en BD:');
    console.log('   ', rows.map(r => r.ingrediente_id).join(', '));
  }
});

// Query 5: Cantidad de registros por cada ID inexistente (para ver magnitud)
db.all(`
  SELECT i.ingrediente_id, COUNT(*) as cantidad
  FROM inventario i
  WHERE NOT EXISTS (SELECT 1 FROM ingredientes ing WHERE ing.id = i.ingrediente_id)
  GROUP BY i.ingrediente_id
  ORDER BY cantidad DESC
  LIMIT 10
`, (err, rows) => {
  if (err) console.error('Error:', err);
  else {
    console.log('\n📊 Top 10 IDs inexistentes por cantidad de registros:');
    rows.forEach(r => {
      console.log(`   ID ${r.ingrediente_id}: ${r.cantidad} registros`);
    });
  }
});

setTimeout(() => {
  db.close();
  process.exit(0);
}, 2000);
