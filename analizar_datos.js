const db = require('./src/db/database');

// Verificar detalles de escandallos
db.serialize(() => {
  // Total de escandallos
  db.get("SELECT COUNT(*) as total FROM escandallos", (err, row) => {
    console.log('Total escandallos en BD:', row?.total);
  });
  
  // Escandallos distintos por plato
  db.get("SELECT COUNT(DISTINCT plato_id) as total_platos FROM escandallos", (err, row) => {
    console.log('Platos distintos con escandallos:', row?.total_platos);
  });
  
  // Escandallos por plato (primeros 5)
  db.all(`
    SELECT plato_id, COUNT(*) as cantidad
    FROM escandallos
    GROUP BY plato_id
    ORDER BY cantidad DESC
    LIMIT 5
  `, (err, rows) => {
    console.log('\nEscandallos por plato (top 5):');
    rows?.forEach(r => console.log(`  Plato ID ${r.plato_id}: ${r.cantidad} ingredientes`));
  });
  
  // Verificar si hay duplicados exactos
  db.get(`
    SELECT COUNT(*) as duplicados
    FROM (
      SELECT plato_id, ingrediente_id, cantidad, unidad, COUNT(*) as cnt
      FROM escandallos
      GROUP BY plato_id, ingrediente_id, cantidad, unidad
      HAVING cnt > 1
    )
  `, (err, row) => {
    console.log('\nFilas duplicadas:', row?.duplicados);
  });
  
  // Total inventario
  db.get("SELECT COUNT(*) as total FROM inventario", (err, row) => {
    console.log('\nTotal registros inventario:', row?.total);
  });
  
  // Verificar columnas de inventario
  db.all("PRAGMA table_info(inventario)", (err, columns) => {
    console.log('\nColumnas tabla inventario:');
    columns?.forEach(c => console.log(`  - ${c.name} (${c.type})`));
    setTimeout(() => process.exit(0), 100);
  });
});
