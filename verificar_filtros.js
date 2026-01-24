// Script para probar que los filtros de búsqueda funcionan correctamente

console.log('\n🔍 VERIFICACIÓN DE FILTROS DE BÚSQUEDA\n');
console.log('=' + '='.repeat(60));

// Verificar que los IDs existen en los módulos HTML
const fs = require('fs');
const path = require('path');

const filtrosRequeridos = {
  'ingredientes': {
    modulo: 'public/modules/ingredientes.html',
    ids: ['searchIngredientes', 'filterFamilia', 'filterConservacion']
  },
  'inventario': {
    modulo: 'public/modules/inventario.html',
    ids: ['searchInventario', 'filterGrupoConservacion', 'filterStockBajo']
  },
  'platos': {
    modulo: 'public/modules/platos.html',
    ids: ['searchPlatos', 'filterGrupo']
  },
  'pedidos': {
    modulo: 'public/modules/pedidos.html',
    ids: ['searchPedidos', 'filterEstado']
  },
  'escandallos': {
    modulo: 'public/modules/escandallos.html',
    ids: ['searchEscandallos']
  }
};

console.log('\n📋 Verificando IDs de filtros en HTML...\n');

Object.keys(filtrosRequeridos).forEach(modulo => {
  const config = filtrosRequeridos[modulo];
  const htmlPath = path.join(__dirname, config.modulo);
  
  try {
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const missingIds = config.ids.filter(id => !html.includes(`id="${id}"`));
    
    if (missingIds.length === 0) {
      console.log(`✅ ${modulo.toUpperCase()}: Todos los filtros presentes`);
      config.ids.forEach(id => console.log(`   ✓ ${id}`));
    } else {
      console.log(`❌ ${modulo.toUpperCase()}: Faltan filtros`);
      missingIds.forEach(id => console.log(`   ✗ ${id}`));
    }
  } catch (error) {
    console.log(`❌ ${modulo.toUpperCase()}: Error al leer archivo - ${error.message}`);
  }
  console.log('');
});

console.log('=' + '='.repeat(60));
console.log('\n📋 Verificando funciones de filtrado en app.js...\n');

const appJsPath = path.join(__dirname, 'public/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf-8');

const funcionesRequeridas = [
  { nombre: 'filtrarIngredientes', descripcion: 'Filtrado de ingredientes' },
  { nombre: 'filtrarInventario', descripcion: 'Filtrado de inventario' },
  { nombre: 'filtrarPlatos', descripcion: 'Filtrado de platos' },
  { nombre: 'filtrarPedidos', descripcion: 'Filtrado de pedidos' },
  { nombre: 'filtrarEscandallos', descripcion: 'Filtrado de escandallos' }
];

funcionesRequeridas.forEach(func => {
  const regex = new RegExp(`function ${func.nombre}\\s*\\(`);
  if (regex.test(appJs)) {
    console.log(`✅ ${func.nombre}() - ${func.descripcion}`);
  } else {
    console.log(`❌ ${func.nombre}() - FALTA`);
  }
});

console.log('\n' + '='.repeat(61));
console.log('\n📋 Verificando event listeners en app.js...\n');

const listenersRequeridos = [
  { id: 'searchIngredientes', evento: 'input', funcion: 'filtrarIngredientes' },
  { id: 'filterFamilia', evento: 'change', funcion: 'filtrarIngredientes' },
  { id: 'filterConservacion', evento: 'change', funcion: 'filtrarIngredientes' },
  { id: 'searchInventario', evento: 'input', funcion: 'filtrarInventario' },
  { id: 'filterGrupoConservacion', evento: 'change', funcion: 'filtrarInventario' },
  { id: 'filterStockBajo', evento: 'change', funcion: 'filtrarInventario' }
];

listenersRequeridos.forEach(listener => {
  const regex = new RegExp(`getElementById\\(['"]${listener.id}['"]\\)[\\s\\S]*?addEventListener\\(['"]${listener.evento}['"]`);
  if (regex.test(appJs)) {
    console.log(`✅ ${listener.id} → ${listener.evento} → ${listener.funcion}()`);
  } else {
    console.log(`❌ ${listener.id} → ${listener.evento} → FALTA`);
  }
});

console.log('\n' + '='.repeat(61));
console.log('\n📋 Verificando cache de datos...\n');

const cacheRequerido = [
  'ingredientesData',
  'inventarioData',
  'platosData',
  'pedidosData',
  'escandallosData'
];

cacheRequerido.forEach(cache => {
  if (appJs.includes(`estadoApp.${cache}`)) {
    console.log(`✅ estadoApp.${cache} - Presente`);
  } else {
    console.log(`❌ estadoApp.${cache} - FALTA`);
  }
});

console.log('\n' + '='.repeat(61));
console.log('\n✅ VERIFICACIÓN COMPLETADA\n');

console.log('📌 INSTRUCCIONES DE PRUEBA MANUAL:');
console.log('   1. Abrir http://localhost:3000 en el navegador');
console.log('   2. Ir a la pestaña "Ingredientes"');
console.log('   3. Escribir en el campo de búsqueda');
console.log('   4. Verificar que la tabla se filtre en tiempo real');
console.log('   5. Probar los filtros de "Familia" y "Grupo Conservación"');
console.log('   6. Repetir con la pestaña "Inventario"\n');

console.log('💡 Si los filtros no funcionan:');
console.log('   - Abrir la consola del navegador (F12)');
console.log('   - Verificar si hay errores JavaScript');
console.log('   - Comprobar que los event listeners se registraron\n');
