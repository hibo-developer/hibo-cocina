const db = require('./src/db/database');

// Verificar cantidades en las tablas
db.serialize(() => {
  db.get("SELECT COUNT(*) as total FROM escandallos", (err, row) => {
    console.log('Escandallos:', err ? err.message : row.total);
  });
  
  db.get("SELECT COUNT(*) as total FROM inventario", (err, row) => {
    console.log('Inventario:', err ? err.message : row.total);
  });
  
  db.get("SELECT COUNT(*) as total FROM ingredientes", (err, row) => {
    console.log('Ingredientes:', err ? err.message : row.total);
  });
  
  db.get("SELECT COUNT(*) as total FROM articulos", (err, row) => {
    console.log('Articulos:', err ? err.message : row.total);
    setTimeout(() => process.exit(0), 100);
  });
});
