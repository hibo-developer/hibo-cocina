const db = require('./src/db/database');
const CalculadoraCostes = require('./src/services/CalculadoraCostes');

const calculadora = new CalculadoraCostes(db);

/**
 * Recalcular todos los costes de los platos
 */
async function recalcularTodosCostes() {
  return new Promise((resolve, reject) => {
    console.log('\n💰 Recalculando costes de platos...\n');

    db.all('SELECT id, codigo, nombre FROM platos', [], async (err, platos) => {
      if (err) {
        reject(err);
        return;
      }

      let actualizados = 0;
      let errores = 0;

      for (const plato of platos) {
        try {
          // Calcular coste usando el servicio
          const resultado = await calculadora.actualizarCostePlato(plato.id);
          
          console.log(`✅ ${plato.codigo} - ${plato.nombre}`);
          console.log(`   Coste: €${(resultado.costeEscandallo || 0).toFixed(4)} | Ración: €${(resultado.costeRacion || 0).toFixed(4)}`);
          actualizados++;

          if (actualizados % 50 === 0 && actualizados > 0) {
            console.log(`\n📊 Progreso: ${actualizados}/${platos.length} platos actualizados\n`);
          }
        } catch (error) {
          errores++;
          if (errores < 10) {
            console.error(`❌ Error en ${plato.codigo}:`, error.message);
          }
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('📊 RESUMEN:');
      console.log('='.repeat(60));
      console.log(`  ✅ Platos actualizados: ${actualizados}`);
      console.log(`  ❌ Errores: ${errores}`);
      console.log('='.repeat(60));

      resolve({ actualizados, errores });
    });
  });
}

/**
 * Mostrar estadísticas finales
 */
async function mostrarEstadisticas() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN coste_escandallo > 0 THEN 1 END) as con_coste,
        AVG(coste_escandallo) as promedio_coste,
        MIN(coste_escandallo) as min_coste,
        MAX(coste_escandallo) as max_coste
      FROM platos
    `, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      const stats = rows[0];
      console.log('\n📈 ESTADÍSTICAS DE COSTES:\n');
      console.log(`  Total platos: ${stats.total}`);
      console.log(`  Con coste calculado: ${stats.con_coste} (${(stats.con_coste / stats.total * 100).toFixed(1)}%)`);
      console.log(`  Coste promedio: €${(stats.promedio_coste || 0).toFixed(4)}`);
      console.log(`  Rango: €${(stats.min_coste || 0).toFixed(4)} - €${(stats.max_coste || 0).toFixed(4)}`);
      console.log('');

      resolve(stats);
    });
  });
}

/**
 * Proceso principal
 */
async function main() {
  try {
    console.log('🚀 RECALCULANDO COSTES DE PLATOS\n');
    console.log('='.repeat(60));

    await recalcularTodosCostes();
    await mostrarEstadisticas();

    console.log('✅ PROCESO COMPLETADO\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  } finally {
    db.close(() => {
      console.log('🔒 Conexión cerrada');
      process.exit(0);
    });
  }
}

// Ejecutar
main();
