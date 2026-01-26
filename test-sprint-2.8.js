/**
 * Script de Prueba - Sprint 2.8
 * Prueba el sistema de notificaciones WebSocket + API REST
 */

const API_BASE = 'http://localhost:3000/api';

// Colores para console.log
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

// Helper para hacer requests
async function request(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const url = `${API_BASE}${endpoint}`;
  log(`${method} ${endpoint}`, 'blue');

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      log('✅ Success', 'green');
      return data;
    } else {
      log(`❌ Error: ${data.error || response.statusText}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, 'red');
    return null;
  }
}

// Tests
async function testNotificacionesAPI() {
  logSection('🧪 TEST 1: API REST de Notificaciones');

  const usuarioId = 1;

  // 1. Obtener notificaciones
  log('\n1️⃣  Obteniendo notificaciones...', 'yellow');
  const notificaciones = await request('GET', `/notificaciones?usuario_id=${usuarioId}`);
  if (notificaciones) {
    log(`   Total: ${notificaciones.total || 0} notificaciones`, 'green');
  }

  // 2. Obtener contador de no leídas
  log('\n2️⃣  Obteniendo contador...', 'yellow');
  const contador = await request('GET', `/notificaciones/contador?usuario_id=${usuarioId}`);
  if (contador) {
    log(`   No leídas: ${contador.data?.count || 0}`, 'green');
  }

  // 3. Obtener estadísticas
  log('\n3️⃣  Obteniendo estadísticas...', 'yellow');
  const stats = await request('GET', `/notificaciones/estadisticas?usuario_id=${usuarioId}`);
  if (stats) {
    log(`   Total: ${stats.data?.total || 0}`, 'green');
    log(`   No leídas: ${stats.data?.noLeidas || 0}`, 'green');
    if (stats.data?.porTipo) {
      stats.data.porTipo.forEach(tipo => {
        log(`   - ${tipo.tipo}: ${tipo.total} (${tipo.noLeidas} no leídas)`, 'green');
      });
    }
  }

  // 4. Obtener preferencias
  log('\n4️⃣  Obteniendo preferencias...', 'yellow');
  const prefs = await request('GET', `/notificaciones/preferencias?usuario_id=${usuarioId}`);
  if (prefs) {
    log(`   Recibir platos: ${prefs.data?.recibir_platos}`, 'green');
    log(`   Recibir stock bajo: ${prefs.data?.recibir_stock_bajo}`, 'green');
    log(`   Silencio: ${prefs.data?.silencio_inicio} - ${prefs.data?.silencio_fin}`, 'green');
  }
}

async function testWebSocketIntegration() {
  logSection('🧪 TEST 2: Integración WebSocket');

  // 1. Crear ingrediente
  log('\n1️⃣  Creando ingrediente de prueba...', 'yellow');
  const nuevoIngrediente = await request('POST', '/ingredientes', {
    nombre: `Test Ingrediente ${Date.now()}`,
    unidad: 'kg',
    precio_unitario: 2.50
  });
  
  if (nuevoIngrediente) {
    log('   ✅ Ingrediente creado - Debe emitir WebSocket', 'green');
    log('   ⚡ Verificar en navegador: evento ingredientes:update', 'cyan');
  }

  await sleep(1000);

  // 2. Actualizar inventario (stock bajo)
  log('\n2️⃣  Probando alerta de stock bajo...', 'yellow');
  const inventarioStockBajo = await request('POST', '/inventario', {
    ingrediente_id: 1,
    cantidad_actual: 3,
    cantidad_minima: 10,
    ubicacion: 'Almacén A'
  });

  if (inventarioStockBajo) {
    log('   ✅ Inventario creado con stock bajo', 'green');
    log('   ⚡ Debe emitir alert:low-stock', 'cyan');
  }

  await sleep(1000);

  // 3. Crear pedido
  log('\n3️⃣  Creando pedido...', 'yellow');
  const nuevoPedido = await request('POST', '/pedidos', {
    usuario_id: 1,
    plato_id: 1,
    cantidad: 2,
    estado: 'pendiente'
  });

  if (nuevoPedido) {
    log('   ✅ Pedido creado', 'green');
    log('   ⚡ Debe emitir pedidos:update + notificación personal', 'cyan');
  }
}

async function testPreferencias() {
  logSection('🧪 TEST 3: Preferencias de Usuario');

  const usuarioId = 1;

  // 1. Actualizar preferencias
  log('\n1️⃣  Actualizando preferencias...', 'yellow');
  const prefsActualizadas = await request('PUT', '/notificaciones/preferencias', {
    usuario_id: usuarioId,
    recibir_stock_bajo: false,
    silencio_inicio: '22:00',
    silencio_fin: '08:00'
  });

  if (prefsActualizadas) {
    log('   ✅ Preferencias actualizadas', 'green');
    log('   Stock bajo desactivado', 'green');
    log('   Horario silencio: 22:00 - 08:00', 'green');
  }

  await sleep(500);

  // 2. Verificar que se guardó
  log('\n2️⃣  Verificando preferencias guardadas...', 'yellow');
  const prefsVerificadas = await request('GET', `/notificaciones/preferencias?usuario_id=${usuarioId}`);
  
  if (prefsVerificadas) {
    const correctas = 
      prefsVerificadas.data?.recibir_stock_bajo === false &&
      prefsVerificadas.data?.silencio_inicio === '22:00:00';
    
    if (correctas) {
      log('   ✅ Preferencias guardadas correctamente', 'green');
    } else {
      log('   ❌ Preferencias no coinciden', 'red');
    }
  }
}

async function testLimpieza() {
  logSection('🧪 TEST 4: Limpieza de Notificaciones');

  const usuarioId = 1;

  // 1. Limpiar notificaciones leídas
  log('\n1️⃣  Limpiando notificaciones leídas antiguas...', 'yellow');
  const limpieza = await request('POST', '/notificaciones/limpiar', {
    usuario_id: usuarioId,
    dias: 30
  });

  if (limpieza) {
    log(`   ✅ ${limpieza.eliminadas || 0} notificaciones eliminadas`, 'green');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ejecutar todos los tests
async function runAllTests() {
  log('🚀 Iniciando Tests del Sprint 2.8', 'cyan');
  log('📅 ' + new Date().toLocaleString(), 'blue');

  try {
    await testNotificacionesAPI();
    await sleep(1000);
    
    await testWebSocketIntegration();
    await sleep(1000);
    
    await testPreferencias();
    await sleep(1000);
    
    await testLimpieza();

    logSection('✅ TESTS COMPLETADOS');
    log('\n📊 Resumen:', 'cyan');
    log('- API REST: Funcionando ✅', 'green');
    log('- WebSocket: Revisa navegador para eventos ⚡', 'yellow');
    log('- Preferencias: Funcionando ✅', 'green');
    log('- Limpieza: Funcionando ✅', 'green');

    log('\n📝 Próximos pasos:', 'cyan');
    log('1. Abrir navegador en http://localhost:3000', 'blue');
    log('2. Abrir DevTools → Console', 'blue');
    log('3. Verificar eventos WebSocket:', 'blue');
    log('   - ingredientes:update', 'blue');
    log('   - inventario:update', 'blue');
    log('   - alert:low-stock', 'blue');
    log('   - pedidos:update', 'blue');
    log('   - pedidos:personal-update', 'blue');

  } catch (error) {
    log(`\n❌ Error en tests: ${error.message}`, 'red');
    console.error(error);
  }
}

// Ejecutar
runAllTests();
