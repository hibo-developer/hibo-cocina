#!/usr/bin/env node

/**
 * ============================================================================
 * TEST DE INTEGRACIÓN - Verificar que todos los módulos cargan correctamente
 * ============================================================================
 * 
 * INSTRUCCIONES:
 * 1. Ejecutar en consola del navegador (F12) en http://localhost:3000
 * 2. Copiar y pegar cada sección
 * 3. Verificar que no hay errores
 * 
 */

// ============================================================================
// 1. VERIFICAR SERVICIOS
// ============================================================================

console.log('=== 1. VERIFICANDO SERVICIOS ===');

console.log('✅ apiService:', typeof window.apiService !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');
console.log('✅ stateManager:', typeof window.stateManager !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');
console.log('✅ modalManager:', typeof window.modalManager !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');
console.log('✅ notificationManager:', typeof window.notificationManager !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');

// ============================================================================
// 2. VERIFICAR MÓDULOS
// ============================================================================

console.log('\n=== 2. VERIFICANDO MÓDULOS ===');

console.log('✅ platosModule:', typeof window.platosModule !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');
console.log('✅ ingredientesModule:', typeof window.ingredientesModule !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');
console.log('✅ escandallosModule:', typeof window.escandallosModule !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');
console.log('✅ pedidosModule:', typeof window.pedidosModule !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');
console.log('✅ inventarioModule:', typeof window.inventarioModule !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');
console.log('✅ sanidadModule:', typeof window.sanidadModule !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');
console.log('✅ produccionModule:', typeof window.produccionModule !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');
console.log('✅ navigationModule:', typeof window.navigationModule !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');

// ============================================================================
// 3. VERIFICAR COMPATIBILITY LAYER
// ============================================================================

console.log('\n=== 3. VERIFICANDO COMPATIBILITY LAYER ===');

console.log('✅ compatibilityLayer:', typeof window.compatibilityLayer !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');
console.log('✅ getState:', typeof window.getState !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');
console.log('✅ setState:', typeof window.setState !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');
console.log('✅ mostrarNotificacion:', typeof window.mostrarNotificacion !== 'undefined' ? 'CARGADO' : '❌ NO CARGADO');

// ============================================================================
// 4. TEST DE FUNCIONALIDAD BÁSICA
// ============================================================================

console.log('\n=== 4. TEST DE FUNCIONALIDAD ===');

// 4.1 Test StateManager
console.log('\n4.1 - Probando StateManager:');
try {
  stateManager.set('test', { mensaje: 'funciona' });
  const valor = getState('test');
  console.log('✅ setState/getState funcionan:', valor);
} catch (error) {
  console.error('❌ Error en StateManager:', error.message);
}

// 4.2 Test ApiService
console.log('\n4.2 - Probando ApiService (GET /api/health):');
try {
  apiService.get('/health').then(data => {
    console.log('✅ ApiService GET funciona:', data);
  }).catch(error => {
    console.error('❌ Error en ApiService:', error.message);
  });
} catch (error) {
  console.error('❌ Error al llamar ApiService:', error.message);
}

// 4.3 Test Notificaciones
console.log('\n4.3 - Probando NotificationManager:');
try {
  mostrarNotificacion('✅ Test de notificación', 'success');
  console.log('✅ Notificación mostrada');
} catch (error) {
  console.error('❌ Error en NotificationManager:', error.message);
}

// ============================================================================
// 5. CARGAR DATOS INICIALES
// ============================================================================

console.log('\n=== 5. CARGANDO DATOS INICIALES ===');

async function cargarTodo() {
  try {
    console.log('📥 Cargando platos...');
    await platosModule.cargar();
    console.log('✅ Platos cargados:', getState('platos')?.length || 0);

    console.log('📥 Cargando ingredientes...');
    await ingredientesModule.cargar();
    console.log('✅ Ingredientes cargados:', getState('ingredientes')?.length || 0);

    console.log('📥 Cargando escandallos...');
    await escandallosModule.cargar();
    console.log('✅ Escandallos cargados:', getState('escandallos')?.length || 0);

    console.log('📥 Cargando pedidos...');
    await pedidosModule.cargar();
    console.log('✅ Pedidos cargados:', getState('pedidos')?.length || 0);

    console.log('📥 Cargando inventario...');
    await inventarioModule.cargar();
    console.log('✅ Inventario cargado:', getState('inventario')?.length || 0);

    console.log('📥 Cargando sanidad...');
    await sanidadModule.cargar();
    console.log('✅ Sanidad cargada');

    console.log('📥 Cargando producción...');
    await produccionModule.cargar();
    console.log('✅ Producción cargada:', getState('produccion')?.length || 0);

    console.log('\n✅ ¡TODOS LOS MÓDULOS CARGADOS EXITOSAMENTE!');
    mostrarNotificacion('✅ Sistema integrado correctamente', 'success');

  } catch (error) {
    console.error('❌ Error durante carga:', error);
    mostrarNotificacion('❌ Error al cargar datos', 'error');
  }
}

// Ejecutar en la consola con: cargarTodo()

// ============================================================================
// 6. PRUEBAS ESPECÍFICAS DE MÓDULOS
// ============================================================================

console.log('\n=== 6. FUNCIONES DE PRUEBA DISPONIBLES ===');

// Función para probar módulo de platos
async function testPlatos() {
  console.log('\n--- TEST PLATOS MODULE ---');
  try {
    const platos = getState('platos') || [];
    console.log(`Total platos: ${platos.length}`);
    if (platos.length > 0) {
      const platosPorGrupo = {};
      platos.forEach(p => {
        platosPorGrupo[p.grupo] = (platosPorGrupo[p.grupo] || 0) + 1;
      });
      console.log('Platos por grupo:', platosPorGrupo);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Función para probar módulo de escandallos
async function testEscandallos() {
  console.log('\n--- TEST ESCANDALLOS MODULE ---');
  try {
    const reporte = escandallosModule.generarReporte();
    console.log('Reporte de costos:', reporte.slice(0, 3)); // Primeros 3 platos
  } catch (error) {
    console.error('Error:', error);
  }
}

// Función para probar módulo de pedidos
async function testPedidos() {
  console.log('\n--- TEST PEDIDOS MODULE ---');
  try {
    const pedidos = getState('pedidos') || [];
    console.log(`Total pedidos: ${pedidos.length}`);
    const porEstado = {};
    pedidos.forEach(p => {
      porEstado[p.estado] = (porEstado[p.estado] || 0) + 1;
    });
    console.log('Pedidos por estado:', porEstado);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Función para probar módulo de inventario
async function testInventario() {
  console.log('\n--- TEST INVENTARIO MODULE ---');
  try {
    const inventario = getState('inventario') || [];
    console.log(`Total items: ${inventario.length}`);
    const alertas = inventarioModule.obtenerAlertasStock();
    console.log(`Items con stock bajo: ${alertas.length}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// 7. COMANDOS ÚTILES
// ============================================================================

console.log('\n=== 7. COMANDOS ÚTILES PARA CONSOLA ===');
console.log(`
Usa estos comandos en la consola para probar:

// Cargar todos los datos
cargarTodo()

// Tests específicos
testPlatos()
testEscandallos()
testPedidos()
testInventario()

// Ver estado
getState('platos')
getState('ingredientes')
getState('escandallos')
getState('pedidos')
getState('inventario')

// Usar módulos
await platosModule.cargar()
platosModule.filtrar({ nombre: 'arroz' })
escandallosModule.calcularCosto(1)

// Notificaciones
mostrarNotificacion('Mensaje de test', 'success')
mostrarNotificacion('Error de test', 'error')
mostrarNotificacion('Advertencia', 'warning')
mostrarNotificacion('Información', 'info')

// Suscribirse a cambios
subscribeToState('platos', (datos) => console.log('Platos actualizado:', datos))

// Ver estado de compatibilidad
window.compatibilityLayer.info
`);

console.log('\n✅ Test de integración cargado. Ejecuta: cargarTodo()');
