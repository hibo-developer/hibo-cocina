const { initializeDatabase } = require('./src/utils/database');

(async () => {
  console.log('=== Verificando tablas de ofertas y eventos ===\n');
  
  try {
    const db = await initializeDatabase();
    
    db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name IN ('ofertas', 'eventos', 'evento_asistentes', 'oferta_aplicaciones')
    `, (err, tables) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      
      console.log('Tablas encontradas:', tables.map(t => t.name).join(', ') || 'ninguna');
      
      if (tables.length > 0) {
        let completed = 0;
        tables.forEach(table => {
          db.all(`PRAGMA table_info(${table.name})`, (err, cols) => {
            if (err) {
              console.error(`Error en ${table.name}:`, err);
            } else {
              console.log(`\n${table.name}:`);
              cols.forEach(col => {
                console.log(`  - ${col.name} (${col.type})`);
              });
            }
            completed++;
            if (completed === tables.length) {
              db.close();
              process.exit(0);
            }
          });
        });
      } else {
        console.log('\n⚠️  No se encontraron las tablas. Necesitan crearse.');
        db.close();
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
