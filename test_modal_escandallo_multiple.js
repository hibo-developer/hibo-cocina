// Script de prueba para el modal de escandallo múltiple - VERSION NODE.JS
// Para ejecutar: node test_modal_escandallo_multiple.js
// O copiar y pegar en la consola del navegador (F12)

// Detectar si estamos en Node.js o navegador
const isNode = typeof window === 'undefined';

if (isNode) {
  console.log('🧪 PRUEBA DE MODAL ESCANDALLO MÚLTIPLE (Node.js - Solo APIs)\n');
} else {
  console.log('🧪 PRUEBA DE MODAL ESCANDALLO MÚLTIPLE (Navegador - Completa)\n');
}

async function probarModalEscandalloMultiple() {
  try {
    // 1. Verificar que existe la configuración del modal (solo navegador)
    if (!isNode) {
      console.log('✓ Verificando configuración del modal...');
      if (!window.MODAL_CONFIGS || !window.MODAL_CONFIGS.escandallo) {
        throw new Error('❌ No se encontró MODAL_CONFIGS.escandallo');
      }
      console.log('  ✅ Configuración encontrada');
      console.log('  - Título:', window.MODAL_CONFIGS.escandallo.titulo);
      console.log('  - Campos:', window.MODAL_CONFIGS.escandallo.campos.length);
      
      // 2. Verificar que existe la función de guardado
      console.log('\n✓ Verificando funciones de guardado...');
      if (typeof window.guardarEscandalloMultiple !== 'function') {
        throw new Error('❌ No se encontró window.guardarEscandalloMultiple');
      }
      console.log('  ✅ guardarEscandalloMultiple encontrada');
      
      if (typeof window.cargarEscandalloExistente !== 'function') {
        throw new Error('❌ No se encontró window.cargarEscandalloExistente');
      }
      console.log('  ✅ cargarEscandalloExistente encontrada');
      
      // 3. Verificar que existe abrirModalDinamico
      console.log('\n✓ Verificando función de apertura...');
      if (typeof window.abrirModalDinamico !== 'function') {
        throw new Error('❌ No se encontró window.abrirModalDinamico');
      }
      console.log('  ✅ abrirModalDinamico encontrada');
    } else {
      console.log('⏭️  Saltando verificación de funciones del navegador (Node.js)');
    }
    
    // 4. Verificar que hay platos en la base de datos
    console.log('\n✓ Verificando datos en base de datos...');
    const apiBase = isNode ? 'http://localhost:3000' : '';
    
    const platosResp = await fetch(`${apiBase}/api/platos`);
    if (!platosResp.ok) {
      throw new Error('❌ Error al cargar platos');
    }
    const platosData = await platosResp.json();
    const platos = platosData.data || platosData;
    console.log(`  ✅ ${platos.length} platos disponibles`);
    if (platos.length > 0) {
      console.log(`  - Ejemplo: ${platos[0].nombre} (ID: ${platos[0].id})`);
    }
    
    // 5. Verificar que hay ingredientes
    const ingsResp = await fetch(`${apiBase}/api/ingredientes`);
    if (!ingsResp.ok) {
      throw new Error('❌ Error al cargar ingredientes');
    }
    const ingsData = await ingsResp.json();
    const ingredientes = ingsData.data || ingsData;
    console.log(`  ✅ ${ingredientes.length} ingredientes disponibles`);
    if (ingredientes.length > 0) {
      console.log(`  - Ejemplo: ${ingredientes[0].nombre} (ID: ${ingredientes[0].id})`);
    }
    
    // 6. Verificar configuración del campo array_dinamico (solo navegador)
    if (!isNode) {
      console.log('\n✓ Verificando configuración del array dinámico...');
      const campoIngredientes = window.MODAL_CONFIGS.escandallo.campos.find(c => c.tipo === 'array_dinamico');
      if (!campoIngredientes) {
        throw new Error('❌ No se encontró campo tipo array_dinamico');
      }
      console.log('  ✅ Campo array_dinamico encontrado');
      console.log('  - Nombre:', campoIngredientes.nombre);
      console.log('  - Template keys:', Object.keys(campoIngredientes.item_template || {}));
      
      // 7. Simular apertura del modal
      console.log('\n✓ Preparado para abrir modal...');
      console.log('  ℹ️  Para abrir el modal, ejecuta en la consola:');
      console.log('     abrirModalDinamico("escandallo")');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ TODAS LAS PRUEBAS PASARON');
    console.log('='.repeat(50));
    
    if (isNode) {
      console.log('\n📝 SIGUIENTE PASO:');
      console.log('1. Abre http://localhost:3000 en tu navegador');
      console.log('2. Abre la consola (F12)');
      console.log('3. Copia y pega este script completo');
      console.log('4. Ejecuta: abrirModalDinamico("escandallo")');
    } else {
      console.log('\n📝 INSTRUCCIONES:');
      console.log('1. Ejecuta: abrirModalDinamico("escandallo")');
      console.log('2. Selecciona un plato');
      console.log('3. Haz clic en "➕ Agregar ingrediente" varias veces');
      console.log('4. Rellena cada fila con ingrediente, cantidad y unidad');
      console.log('5. Haz clic en "Guardar Receta Completa"');
      console.log('\n💡 TIPS:');
      console.log('- Usa el botón 🗑️ para eliminar filas');
      console.log('- El campo de notas es opcional');
      console.log('- Puedes mezclar ingredientes, pre-elaborados y elaborados');
    }
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ERROR EN PRUEBA:', error.message);
    if (!isNode) {
      console.error('Stack:', error.stack);
    }
    return false;
  }
}

// Ejecutar prueba
if (isNode) {
  // En Node.js, necesitamos fetch
  const fetch = require('node-fetch');
  global.fetch = fetch;
}

probarModalEscandalloMultiple();
