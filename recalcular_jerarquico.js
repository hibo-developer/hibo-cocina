const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');
const CalculadoraCostes = require('./src/services/CalculadoraCostes');

const calculadora = new CalculadoraCostes(db);

console.log('🔄 Recálculo jerárquico de costes\n');
console.log('=' + '='.repeat(79));

async function obtenerTodosPlatos() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, codigo, nombre 
            FROM platos 
            WHERE tipo_entidad = 'plato' 
            AND EXISTS (SELECT 1 FROM escandallos WHERE plato_id = platos.id)
            ORDER BY codigo`, 
      [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
  });
}

async function obtenerDependencias(platoId) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT DISTINCT i.codigo, i.tipo_entidad
            FROM escandallos e
            JOIN ingredientes i ON e.ingrediente_id = i.id
            WHERE e.plato_id = ?`,
      [platoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
  });
}

async function calcularPorNiveles() {
  const platos = await obtenerTodosPlatos();
  console.log(`📋 ${platos.length} platos con escandallos\n`);
  
  const procesados = new Set();
  const pendientes = new Map(platos.map(p => [p.id, p]));
  
  let nivel = 0;
  let cambios = true;
  
  while (cambios && pendientes.size > 0) {
    cambios = false;
    nivel++;
    
    console.log(`\n🔢 NIVEL ${nivel}:`);
    console.log('-'.repeat(80));
    
    const procesarEnEsteNivel = [];
    
    // Identificar qué platos pueden procesarse en este nivel
    for (const [id, plato] of pendientes) {
      const deps = await obtenerDependencias(id);
      
      // Verificar si todas las dependencias tipo "elaborado" ya están procesadas
      const elaboradosNoProcesados = deps.filter(d => 
        d.tipo_entidad === 'elaborado' && 
        d.codigo.startsWith('PL-') &&
        !procesados.has(d.codigo)
      );
      
      if (elaboradosNoProcesados.length === 0) {
        // Todos los elaborados que necesita ya están calculados
        procesarEnEsteNivel.push(plato);
      }
    }
    
    if (procesarEnEsteNivel.length === 0) {
      console.log('⚠️  No se pueden procesar más platos (posible dependencia circular)');
      break;
    }
    
    console.log(`✅ ${procesarEnEsteNivel.length} platos listos para calcular\n`);
    
    // Procesar los platos de este nivel
    for (const plato of procesarEnEsteNivel) {
      try {
        const resultado = await calculadora.actualizarCostePlato(plato.id);
        
        if (resultado.costeEscandallo > 0) {
          console.log(`✅ ${plato.codigo}: ${plato.nombre}`);
          console.log(`   Coste escandallo: ${resultado.costeEscandallo.toFixed(3)}€`);
          console.log(`   Coste ración: ${resultado.costeRacion.toFixed(3)}€`);
        } else {
          console.log(`⚠️  ${plato.codigo}: ${plato.nombre} → coste = 0€`);
        }
        
        procesados.add(plato.codigo);
        pendientes.delete(plato.id);
        cambios = true;
        
      } catch (error) {
        console.error(`❌ ${plato.codigo}: Error - ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN FINAL:');
  console.log(`   ✅ Procesados: ${procesados.size}`);
  console.log(`   ⚠️  Pendientes: ${pendientes.size}`);
  
  if (pendientes.size > 0) {
    console.log('\n⚠️  Platos no procesados (posibles dependencias circulares):');
    for (const plato of pendientes.values()) {
      const deps = await obtenerDependencias(plato.id);
      const elaborados = deps.filter(d => d.tipo_entidad === 'elaborado' && d.codigo.startsWith('PL-'));
      console.log(`   - ${plato.codigo}: ${plato.nombre}`);
      if (elaborados.length > 0) {
        console.log(`     Depende de: ${elaborados.map(e => e.codigo).join(', ')}`);
      }
    }
  }
}

calcularPorNiveles()
  .then(() => {
    console.log('\n✅ Proceso completado');
    db.close();
  })
  .catch(err => {
    console.error('\n❌ Error:', err);
    db.close();
    process.exit(1);
  });
