const db = require('./database');

function migrarPartidascochina() {
  return new Promise((resolve, reject) => {
    // Verificar si la columna activo existe
    db.all("PRAGMA table_info(partidas_cocina)", [], (err, columns) => {
      if (err) {
        reject(err);
        return;
      }
      
      const tieneColumnaActivo = columns.some(col => col.name === 'activo');
      
      if (!tieneColumnaActivo) {
        console.log('Añadiendo columna "activo" a tabla partidas_cocina...');
        db.run(`ALTER TABLE partidas_cocina ADD COLUMN activo BOOLEAN DEFAULT 1`, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Columna "activo" agregada correctamente');
            resolve();
          }
        });
      } else {
        console.log('✅ Columna "activo" ya existe en partidas_cocina');
        resolve();
      }
    });
  });
}

async function runMigrations() {
  try {
    await migrarPartidascochina();
    console.log('✅ Todas las migraciones completadas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migraciones:', error);
    process.exit(1);
  }
}

runMigrations();
