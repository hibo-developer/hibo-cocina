const db = require('./src/db/database');

const ids = [1574, 2023, 1859, 1485, 1344, 1333, 2015, 1833, 1944, 1296, 1359, 2078, 1975];

console.log('🔍 Verificando ingredientes faltantes...\n');

ids.forEach(id => {
  db.get(`SELECT * FROM ingredientes WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error(`❌ Error al buscar ID ${id}:`, err);
    } else if (!row) {
      console.log(`❌ Ingrediente ID ${id}: NO EXISTE`);
    } else {
      console.log(`✅ Ingrediente ID ${id}: ${row.nombre}`);
    }
  });
});

setTimeout(() => db.close(), 1000);
