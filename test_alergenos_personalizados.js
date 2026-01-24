const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('🧪 PRUEBA: API de Alérgenos Personalizados\n');
console.log('=' + '='.repeat(79) + '\n');

const AlergenoPersonalizado = require('./src/models/AlergenoPersonalizado');

async function probarAPI() {
  try {
    console.log('1️⃣ Creando alérgenos personalizados de ejemplo...');
    
    const ejemplos = [
      { nombre: 'Ajo', descripcion: 'Alérgeno para clientes sensibles al ajo', icono: '🧄' },
      { nombre: 'Cebolla', descripcion: 'Alérgeno para clientes sensibles a la cebolla', icono: '🧅' },
      { nombre: 'Picante', descripcion: 'Alimentos con alto contenido de capsaicina', icono: '🌶️' }
    ];

    const creados = [];
    for (const ej of ejemplos) {
      const alergeno = await AlergenoPersonalizado.crear(ej);
      creados.push(alergeno);
      console.log(`   ✅ Creado: ${ej.icono} ${ej.nombre} (ID: ${alergeno.id})`);
    }

    console.log('\n2️⃣ Listando todos los alérgenos personalizados...');
    const todos = await AlergenoPersonalizado.obtenerTodos();
    console.log(`   📋 Total: ${todos.length} alérgenos`);
    todos.forEach(a => {
      console.log(`      - ${a.icono || '❔'} ${a.nombre} (ID: ${a.id})`);
    });

    console.log('\n3️⃣ Asignando alérgeno "Ajo" a algunos ingredientes...');
    
    // Obtener algunos ingredientes de ejemplo
    const ingredientes = await new Promise((resolve, reject) => {
      db.all(`SELECT id, codigo, nombre FROM ingredientes WHERE tipo_entidad = 'ingrediente' LIMIT 5`, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const alergenoAjo = creados.find(a => a.nombre === 'Ajo');
    
    for (const ing of ingredientes.slice(0, 3)) {
      await AlergenoPersonalizado.asignarAIngrediente(ing.id, alergenoAjo.id);
      console.log(`   ✅ Asignado a: ${ing.codigo} - ${ing.nombre}`);
    }

    console.log('\n4️⃣ Verificando alérgenos asignados...');
    for (const ing of ingredientes.slice(0, 3)) {
      const alergenos = await AlergenoPersonalizado.obtenerDeIngrediente(ing.id);
      console.log(`   📝 ${ing.codigo}: ${alergenos.map(a => a.icono + ' ' + a.nombre).join(', ')}`);
    }

    console.log('\n5️⃣ Actualizando nombre de alérgeno "Picante"...');
    const alergenoPicante = creados.find(a => a.nombre === 'Picante');
    await AlergenoPersonalizado.actualizar(alergenoPicante.id, {
      nombre: 'Chile Picante',
      descripcion: 'Alimentos muy picantes con capsaicina',
      icono: '🌶️',
      activo: 1
    });
    console.log('   ✅ Actualizado');

    console.log('\n6️⃣ Desactivando alérgeno "Cebolla"...');
    const alergenoCebolla = creados.find(a => a.nombre === 'Cebolla');
    await AlergenoPersonalizado.eliminar(alergenoCebolla.id);
    console.log('   ✅ Desactivado (no aparecerá en listados)');

    console.log('\n7️⃣ Listando solo alérgenos activos...');
    const activos = await AlergenoPersonalizado.obtenerTodos();
    console.log(`   📋 Total activos: ${activos.length}`);
    activos.forEach(a => {
      console.log(`      - ${a.icono || '❔'} ${a.nombre}`);
    });

    console.log('\n✅ PRUEBA COMPLETADA CON ÉXITO');
    console.log('\n💡 ENDPOINTS DISPONIBLES:');
    console.log('   GET    /api/alergenos-personalizados');
    console.log('   POST   /api/alergenos-personalizados');
    console.log('   PUT    /api/alergenos-personalizados/:id');
    console.log('   DELETE /api/alergenos-personalizados/:id');
    console.log('   GET    /api/ingredientes/:id/alergenos-personalizados');
    console.log('   PUT    /api/ingredientes/:id/alergenos-personalizados');
    console.log('   GET    /api/platos/:id/alergenos-personalizados');
    console.log('   PUT    /api/platos/:id/alergenos-personalizados');
    
    console.log('\n' + '=' + '='.repeat(79));

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    db.close();
  }
}

probarAPI();
