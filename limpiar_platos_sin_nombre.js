const db = require('./src/db/database');

async function limpiarPlatosSinNombre() {
  return new Promise((resolve, reject) => {
    console.log('🧹 Limpiando platos sin nombres descriptivos...\n');

    // Primero, contar cuántos platos tienen solo el código como nombre
    db.all(`
      SELECT codigo, nombre 
      FROM platos 
      WHERE nombre = codigo 
      OR nombre LIKE 'PL-%' AND LENGTH(nombre) <= 10
      ORDER BY codigo
      LIMIT 20
    `, [], (err, platos) => {
      if (err) {
        reject(err);
        return;
      }

      console.log(`📋 Primeros 20 platos a eliminar:\n`);
      platos.forEach(p => {
        console.log(`  ${p.codigo} -> "${p.nombre}"`);
      });

      db.get(`
        SELECT COUNT(*) as total
        FROM platos 
        WHERE nombre = codigo 
        OR (nombre LIKE 'PL-%' AND LENGTH(nombre) <= 10)
      `, [], (err2, count) => {
        if (err2) {
          reject(err2);
          return;
        }

        console.log(`\n⚠️  Total de platos a eliminar: ${count.total}\n`);

        if (count.total === 0) {
          console.log('✅ No hay platos sin nombres descriptivos');
          resolve();
          return;
        }

        // Preguntar confirmación
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });

        readline.question(`¿Confirmar eliminación de ${count.total} platos? (si/no): `, (respuesta) => {
          readline.close();

          if (respuesta.toLowerCase() !== 'si' && respuesta.toLowerCase() !== 's') {
            console.log('❌ Operación cancelada');
            resolve();
            return;
          }

          // Eliminar escandallos primero
          db.run(`
            DELETE FROM escandallos 
            WHERE plato_id IN (
              SELECT id FROM platos 
              WHERE nombre = codigo 
              OR (nombre LIKE 'PL-%' AND LENGTH(nombre) <= 10)
            )
          `, [], function(err3) {
            if (err3) {
              reject(err3);
              return;
            }

            const escandallosEliminados = this.changes;
            console.log(`✅ Escandallos eliminados: ${escandallosEliminados}`);

            // Ahora eliminar los platos
            db.run(`
              DELETE FROM platos 
              WHERE nombre = codigo 
              OR (nombre LIKE 'PL-%' AND LENGTH(nombre) <= 10)
            `, [], function(err4) {
              if (err4) {
                reject(err4);
                return;
              }

              const platosEliminados = this.changes;
              console.log(`✅ Platos eliminados: ${platosEliminados}\n`);

              // Mostrar estadísticas finales
              db.get('SELECT COUNT(*) as total FROM platos', [], (err5, final) => {
                if (!err5) {
                  console.log(`📊 Platos restantes: ${final.total}`);
                }
                resolve();
              });
            });
          });
        });
      });
    });
  });
}

async function main() {
  try {
    await limpiarPlatosSinNombre();
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    db.close(() => {
      console.log('\n🔒 Conexión cerrada');
      process.exit(0);
    });
  }
}

main();
