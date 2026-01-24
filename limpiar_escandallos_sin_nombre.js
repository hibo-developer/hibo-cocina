const db = require('./src/db/database');

const runQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const allQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

async function limpiarEscandallos() {
  console.log('\n🧹 Limpiando escandallos sin nombres descriptivos...\n');
  console.log('='.repeat(60));

  try {
    // 1. Encontrar platos que solo tienen el código como nombre (ej: "PL-65" = "PL-65")
    const platosProblematicos = await allQuery(`
      SELECT id, codigo, nombre 
      FROM platos 
      WHERE codigo = nombre
      ORDER BY codigo
    `, []);

    console.log(`\n📊 Encontrados: ${platosProblematicos.length} platos sin nombre descriptivo`);
    
    if (platosProblematicos.length > 0) {
      console.log('\nPrimeros 10 ejemplos:');
      platosProblematicos.slice(0, 10).forEach(p => {
        console.log(`  - ${p.codigo}`);
      });
    }

    // 2. Contar escandallos que serán afectados
    const idsProblematicos = platosProblematicos.map(p => p.id).join(',');
    
    if (idsProblematicos) {
      const escandallosAfectados = await allQuery(`
        SELECT COUNT(*) as total 
        FROM escandallos 
        WHERE plato_id IN (${idsProblematicos})
      `, []);

      console.log(`\n⚠️  Escandallos que serán eliminados: ${escandallosAfectados[0].total}`);

      // 3. Preguntar confirmación
      console.log('\n' + '='.repeat(60));
      console.log('¿Continuar con la limpieza?');
      console.log('Se eliminarán:');
      console.log(`  - ${platosProblematicos.length} platos sin nombre descriptivo`);
      console.log(`  - ${escandallosAfectados[0].total} escandallos asociados`);
      console.log('='.repeat(60));

      // Eliminar automáticamente (puedes cambiar esto si prefieres confirmación manual)
      const confirmar = true;

      if (confirmar) {
        // Eliminar escandallos primero (foreign key)
        const resultEscandallos = await runQuery(`
          DELETE FROM escandallos 
          WHERE plato_id IN (${idsProblematicos})
        `);

        console.log(`\n✅ Eliminados: ${resultEscandallos.changes} escandallos`);

        // Eliminar platos
        const resultPlatos = await runQuery(`
          DELETE FROM platos 
          WHERE codigo = nombre AND id IN (${idsProblematicos})
        `);

        console.log(`✅ Eliminados: ${resultPlatos.changes} platos`);

        // Mostrar estadísticas finales
        const statsFinales = await allQuery(`
          SELECT 
            (SELECT COUNT(*) FROM platos) as total_platos,
            (SELECT COUNT(*) FROM platos WHERE codigo != nombre) as platos_con_nombre,
            (SELECT COUNT(*) FROM escandallos) as total_escandallos,
            (SELECT COUNT(DISTINCT plato_id) FROM escandallos) as platos_con_receta
        `, []);

        console.log('\n' + '='.repeat(60));
        console.log('📊 ESTADÍSTICAS FINALES:');
        console.log('='.repeat(60));
        console.log(`  Total platos: ${statsFinales[0].total_platos}`);
        console.log(`  Con nombre descriptivo: ${statsFinales[0].platos_con_nombre}`);
        console.log(`  Total escandallos: ${statsFinales[0].total_escandallos}`);
        console.log(`  Platos con receta: ${statsFinales[0].platos_con_receta}`);
        console.log('='.repeat(60));

        console.log('\n✅ Limpieza completada exitosamente\n');
      } else {
        console.log('\n❌ Limpieza cancelada\n');
      }
    } else {
      console.log('\n✅ No hay escandallos para limpiar\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    db.close(() => {
      console.log('🔒 Conexión cerrada');
      process.exit(0);
    });
  }
}

limpiarEscandallos();
