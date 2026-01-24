const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('\n🔍 ANÁLISIS DE ESCANDALLOS\n');
console.log('=' + '='.repeat(70));

db.serialize(() => {
  // Contar total de escandallos
  db.get(`SELECT COUNT(*) as total FROM escandallos`, [], (err, row) => {
    if (err) {
      console.error('❌ Error:', err);
      return;
    }
    console.log(`\n📊 Total de escandallos en BD: ${row.total}`);
  });

  // Contar escandallos con información completa (con JOIN)
  const queryCompletos = `
    SELECT COUNT(*) as completos
    FROM escandallos e
    LEFT JOIN platos p ON e.plato_id = p.id
    LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
    WHERE p.nombre IS NOT NULL AND i.nombre IS NOT NULL
  `;

  db.get(queryCompletos, [], (err, row) => {
    if (err) {
      console.error('❌ Error:', err);
      return;
    }
    console.log(`✅ Escandallos con nombre de plato e ingrediente: ${row.completos}`);
  });

  // Contar escandallos sin nombre de plato
  const querySinPlato = `
    SELECT COUNT(*) as sin_plato
    FROM escandallos e
    LEFT JOIN platos p ON e.plato_id = p.id
    WHERE p.nombre IS NULL
  `;

  db.get(querySinPlato, [], (err, row) => {
    if (err) {
      console.error('❌ Error:', err);
      return;
    }
    console.log(`❌ Escandallos sin nombre de plato: ${row.sin_plato}`);
  });

  // Contar escandallos sin nombre de ingrediente
  const querySinIngrediente = `
    SELECT COUNT(*) as sin_ingrediente
    FROM escandallos e
    LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
    WHERE i.nombre IS NULL
  `;

  db.get(querySinIngrediente, [], (err, row) => {
    if (err) {
      console.error('❌ Error:', err);
      return;
    }
    console.log(`❌ Escandallos sin nombre de ingrediente: ${row.sin_ingrediente}`);
  });

  // Ejemplos de escandallos completos
  const queryEjemplos = `
    SELECT 
      e.id,
      p.codigo as plato_codigo,
      p.nombre as plato_nombre,
      i.codigo as ingrediente_codigo,
      i.nombre as ingrediente_nombre,
      e.cantidad,
      e.unidad
    FROM escandallos e
    LEFT JOIN platos p ON e.plato_id = p.id
    LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
    WHERE p.nombre IS NOT NULL AND i.nombre IS NOT NULL
    LIMIT 5
  `;

  db.all(queryEjemplos, [], (err, rows) => {
    if (err) {
      console.error('❌ Error:', err);
      return;
    }

    console.log('\n📋 Ejemplos de escandallos con información completa:\n');
    if (rows.length === 0) {
      console.log('   ⚠️  No hay escandallos con información completa');
    } else {
      rows.forEach(esc => {
        console.log(`   ✅ #${esc.id}: ${esc.plato_nombre} (${esc.plato_codigo})`);
        console.log(`      → ${esc.cantidad} ${esc.unidad} de ${esc.ingrediente_nombre} (${esc.ingrediente_codigo})`);
        console.log('');
      });
    }
  });

  // Ejemplos de escandallos incompletos
  const queryIncompletos = `
    SELECT 
      e.id,
      e.plato_id,
      p.nombre as plato_nombre,
      e.ingrediente_id,
      i.nombre as ingrediente_nombre
    FROM escandallos e
    LEFT JOIN platos p ON e.plato_id = p.id
    LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
    WHERE p.nombre IS NULL OR i.nombre IS NULL
    LIMIT 5
  `;

  db.all(queryIncompletos, [], (err, rows) => {
    if (err) {
      console.error('❌ Error:', err);
      db.close();
      return;
    }

    console.log('\n⚠️  Ejemplos de escandallos incompletos (OCULTOS en la interfaz):\n');
    if (rows.length === 0) {
      console.log('   ✅ Todos los escandallos tienen información completa');
    } else {
      rows.forEach(esc => {
        const platoInfo = esc.plato_nombre || `❌ Plato #${esc.plato_id} sin nombre`;
        const ingredienteInfo = esc.ingrediente_nombre || `❌ Ingrediente #${esc.ingrediente_id} sin nombre`;
        console.log(`   #${esc.id}: ${platoInfo} → ${ingredienteInfo}`);
      });
    }

    console.log('\n' + '='.repeat(71));
    console.log('\n💡 RESULTADO:');
    console.log('   Solo los escandallos con nombres completos se mostrarán en la interfaz.');
    console.log('   Esto garantiza una experiencia más clara y profesional.\n');
    
    db.close();
  });
});
