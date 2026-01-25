/**
 * ============================================================================
 * APP-MIGRATED.JS - Versiones refactorizadas de funciones de app.js
 * ============================================================================
 * 
 * Este archivo contiene las versiones NUEVAS de las funciones de app.js
 * usando la arquitectura modular.
 * 
 * CÓMO USAR:
 * 1. Incluir este archivo DESPUÉS de app.js
 * 2. Las funciones aquí sobrescriben las de app.js
 * 3. Probar que todo funciona
 * 4. Eventualmente integrar en app.js o eliminar app.js
 * 
 */

// ============================================================================
// FUNCIONES DE CARGA REFACTORIZADAS
// ============================================================================

/**
 * Cargar platos - VERSIÓN REFACTORIZADA
 */
async function cargarPlatos() {
  try {
    console.log('📥 [REFACTORED] Cargando platos...');
    await platosModule.cargar();
    mostrarPlatos();
  } catch (error) {
    console.error('Error cargando platos:', error);
    mostrarNotificacion('Error al cargar platos', 'error');
  }
}

/**
 * Cargar pedidos - VERSIÓN REFACTORIZADA
 */
async function cargarPedidos() {
  try {
    console.log('📥 [REFACTORED] Cargando pedidos...');
    await pedidosModule.cargar();
    const pedidos = getState('pedidos') || [];
    mostrarPedidos(pedidos);
  } catch (error) {
    console.error('Error cargando pedidos:', error);
    mostrarNotificacion('Error al cargar pedidos', 'error');
  }
}

/**
 * Cargar ingredientes - VERSIÓN REFACTORIZADA
 */
async function cargarIngredientes() {
  try {
    console.log('📥 [REFACTORED] Cargando ingredientes...');
    await ingredientesModule.cargar();
    mostrarIngredientes();
  } catch (error) {
    console.error('Error cargando ingredientes:', error);
    mostrarNotificacion('Error al cargar ingredientes', 'error');
  }
}

/**
 * Cargar escandallos - VERSIÓN REFACTORIZADA
 */
async function cargarEscandallos() {
  try {
    console.log('📥 [REFACTORED] Cargando escandallos...');
    await escandallosModule.cargar();
    mostrarEscandallos();
  } catch (error) {
    console.error('Error cargando escandallos:', error);
    mostrarNotificacion('Error al cargar escandallos', 'error');
  }
}

/**
 * Cargar inventario - VERSIÓN REFACTORIZADA
 */
async function cargarInventario() {
  try {
    console.log('📥 [REFACTORED] Cargando inventario...');
    await inventarioModule.cargar();
    const inventario = getState('inventario') || [];
    mostrarInventario(inventario);
  } catch (error) {
    console.error('Error cargando inventario:', error);
    mostrarNotificacion('Error al cargar inventario', 'error');
  }
}

/**
 * Cargar producción - VERSIÓN REFACTORIZADA
 */
async function cargarProduccion() {
  try {
    console.log('📥 [REFACTORED] Cargando producción...');
    await produccionModule.cargar();
    const produccion = getState('produccion') || [];
    mostrarProduccion(produccion);
  } catch (error) {
    console.error('Error cargando producción:', error);
    mostrarNotificacion('Error al cargar producción', 'error');
  }
}

/**
 * Cargar sanidad - VERSIÓN REFACTORIZADA
 */
async function cargarSanidad() {
  try {
    console.log('📥 [REFACTORED] Cargando sanidad...');
    await sanidadModule.cargar();
    const sanidad = getState('sanidad') || [];
    mostrarSanidad(sanidad);
  } catch (error) {
    console.error('Error cargando sanidad:', error);
    mostrarNotificacion('Error al cargar sanidad', 'error');
  }
}

// ============================================================================
// FUNCIONES DE RENDERIZADO REFACTORIZADAS
// ============================================================================

/**
 * Mostrar platos - VERSIÓN REFACTORIZADA
 */
function mostrarPlatos(platosFiltrados = null) {
  const platos = platosFiltrados || getState('platos') || [];
  const tbody = document.getElementById('platosTableBody');
  
  if (!tbody) {
    console.warn('⚠️ Elemento platosTableBody no encontrado');
    return;
  }

  tbody.innerHTML = '';

  if (!platos.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No hay platos</td></tr>';
    return;
  }

  // Usar paginación si existe
  const estadoApp = window.estadoApp || { paginacion: { platos: { pagina: 1, porPagina: 12 } } };
  const platosPaginados = paginar(platos, 'platos');

  platosPaginados.forEach(plato => {
    const fila = crearFilaPlato(plato);
    tbody.appendChild(fila);
  });

}

/**
 * Mostrar producción - VERSIÓN REFACTORIZADA
 */
function mostrarProduccion(produccion = null) {
  const datos = produccion || getState('produccion') || [];
  const tbody = document.getElementById('partidasTableBody'); // Usar partidasTableBody en lugar de produccionTableBody
  
  if (!tbody) {
    console.warn('⚠️ Elemento partidasTableBody no encontrado');
    return;
  }

  tbody.innerHTML = '';

  if (!datos.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No hay órdenes de producción</td></tr>';
    return;
  }

  datos.slice(0, 20).forEach(orden => {
    const row = `
      <tr>
        <td><input type="checkbox" data-id="${orden.id}"></td>
        <td><strong>${orden.id || '-'}</strong></td>
        <td>${orden.nombre || orden.plato_nombre || '-'}</td>
        <td>${orden.responsable || '-'}</td>
        <td>${orden.descripcion || '-'}</td>
        <td>${orden.estado || 'Activo'}</td>
        <td>
          <button class="btn-icon" onclick="editarPartida(${orden.id})" title="Editar">✏️</button>
          <button class="btn-icon" onclick="eliminarPartida(${orden.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

/**
 * Mostrar sanidad - VERSIÓN REFACTORIZADA
 */
function mostrarSanidad(sanidad = null) {
  const datos = sanidad || getState('sanidad') || [];
  const tbody = document.getElementById('sanidadTableBody');
  
  if (!tbody) {
    console.warn('⚠️ Elemento sanidadTableBody no encontrado');
    return;
  }

  tbody.innerHTML = '';

  if (!datos.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No hay datos de sanidad</td></tr>';
    return;
  }

  datos.slice(0, 20).forEach(control => {
    const row = `
      <tr>
        <td><strong>${control.id || '-'}</strong></td>
        <td>${control.plato_codigo || '-'}</td>
        <td>${control.ingrediente_codigo || '-'}</td>
        <td>${control.punto_critico || '-'}</td>
        <td>${control.fecha_control || '-'}</td>
        <td>${control.resultado || '-'}</td>
        <td>
          <button class="btn-icon" onclick="editarControlSanidad(${control.id})" title="Editar">✏️</button>
          <button class="btn-icon" onclick="eliminarControlSanidad(${control.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

/**
 * Crear fila de plato (helper)
 */
function crearFilaPlato(plato) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="checkbox" data-id="${plato.id}" onchange="toggleSeleccion('platos', ${plato.id})"></td>
    <td>${plato.codigo || '-'}</td>
    <td>${plato.nombre}</td>
    <td>${plato.grupo || '-'}</td>
    <td>${plato.unidad || '-'}</td>
    <td>${formatDecimal(plato.coste, 2)}€</td>
    <td>${formatDecimal(plato.peso, 0)}g</td>
    <td>${plato.stock || 0}</td>
    <td class="actions">
      <button class="btn btn-small" onclick="editarPlato(${plato.id})">✏️</button>
      <button class="btn btn-small btn-danger" onclick="eliminarPlato(${plato.id})">🗑️</button>
    </td>
  `;
  return tr;
}

/**
 * Mostrar pedidos - VERSIÓN REFACTORIZADA
 */
function mostrarPedidos(pedidosFiltrados = null) {
  const pedidos = pedidosFiltrados || getState('pedidos') || [];
  const tbody = document.getElementById('pedidosTableBody');
  
  if (!tbody) {
    console.warn('⚠️ Elemento pedidosTableBody no encontrado');
    return;
  }

  tbody.innerHTML = '';

  if (!pedidos.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No hay pedidos</td></tr>';
    return;
  }

  pedidos.forEach(pedido => {
    const fila = crearFilaPedido(pedido);
    tbody.appendChild(fila);
  });
}

/**
 * Crear fila de pedido (helper)
 */
function crearFilaPedido(pedido) {
  const tr = document.createElement('tr');
  const estadoClass = {
    'pendiente': 'badge-warning',
    'preparacion': 'badge-info',
    'listo': 'badge-success',
    'entregado': 'badge-secondary'
  }[pedido.estado] || '';

  tr.innerHTML = `
    <td><input type="checkbox" data-id="${pedido.id}" onchange="toggleSeleccion('pedidos', ${pedido.id})"></td>
    <td>#${pedido.id}</td>
    <td>${pedido.cliente || 'Cliente'}</td>
    <td>${pedido.plato || '-'}</td>
    <td>${pedido.cantidad || 0}</td>
    <td><span class="badge ${estadoClass}">${pedido.estado}</span></td>
    <td>${formatDecimal(pedido.total, 2)}€</td>
    <td class="actions">
      <button class="btn btn-small" onclick="editarPedido(${pedido.id})">✏️</button>
      <button class="btn btn-small btn-danger" onclick="eliminarPedido(${pedido.id})">🗑️</button>
    </td>
  `;
  return tr;
}

// ============================================================================
// FUNCIONES DE FILTRADO REFACTORIZADAS
// ============================================================================

/**
 * Filtrar platos - VERSIÓN REFACTORIZADA
 */
function filtrarPlatos() {
  const searchInput = document.getElementById('searchPlatos');
  const grupoSelect = document.getElementById('filterGrupo');

  const filtros = {
    nombre: searchInput ? searchInput.value : '',
    grupo: grupoSelect ? grupoSelect.value : ''
  };

  console.log('🔍 [REFACTORED] Filtrando platos:', filtros);

  const platosFiltrados = platosModule.filtrar(filtros);
  mostrarPlatos(platosFiltrados);
}

/**
 * Filtrar pedidos - VERSIÓN REFACTORIZADA
 */
function filtrarPedidos() {
  const searchInput = document.getElementById('searchPedidos');
  const estadoSelect = document.getElementById('filterEstado');

  const textoBusqueda = searchInput ? searchInput.value.toLowerCase() : '';
  const estadoFiltro = estadoSelect ? estadoSelect.value : '';

  console.log('🔍 [REFACTORED] Filtrando pedidos');

  let pedidos = getState('pedidos') || [];

  if (textoBusqueda) {
    pedidos = pedidos.filter(p =>
      (p.cliente && p.cliente.toLowerCase().includes(textoBusqueda)) ||
      (p.plato && p.plato.toLowerCase().includes(textoBusqueda)) ||
      (p.id && p.id.toString().includes(textoBusqueda))
    );
  }

  if (estadoFiltro) {
    pedidos = pedidos.filter(p => p.estado === estadoFiltro);
  }

  mostrarPedidos(pedidos);
}

/**
 * Filtrar ingredientes - VERSIÓN REFACTORIZADA
 */
function filtrarIngredientes() {
  const searchInput = document.getElementById('searchIngredientes');
  const familiaSelect = document.getElementById('filterFamilia');
  const conservacionSelect = document.getElementById('filterConservacion');

  const filtros = {};

  if (searchInput && searchInput.value) {
    filtros.nombre = searchInput.value;
  }

  if (familiaSelect && familiaSelect.value) {
    filtros.tipo = familiaSelect.value;
  }

  if (conservacionSelect && conservacionSelect.value) {
    filtros.conservacion = conservacionSelect.value;
  }

  console.log('🔍 [REFACTORED] Filtrando ingredientes:', filtros);

  const ingredientesFiltrados = ingredientesModule.filtrar(filtros);
  mostrarIngredientes(ingredientesFiltrados);
}

// ============================================================================
// ESTADO REFACTORIZADO
// ============================================================================

/**
 * Suscripciones reactivas para actualización automática
 */
function configurarSuscripcionesReactivas() {
  // Cuando cambien platos, actualizar tabla
  subscribeToState('platos', (platos) => {
    console.log('🔄 Platos actualizados automáticamente');
    mostrarPlatos(platos);
  });

  // Cuando cambien pedidos, actualizar tabla
  subscribeToState('pedidos', (pedidos) => {
    console.log('🔄 Pedidos actualizados automáticamente');
    mostrarPedidos(pedidos);
  });

  // Cuando cambien ingredientes, actualizar tabla
  subscribeToState('ingredientes', (ingredientes) => {
    console.log('🔄 Ingredientes actualizados automáticamente');
    mostrarIngredientes(ingredientes);
  });
}

// Configurar suscripciones al cargar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', configurarSuscripcionesReactivas);
} else {
  configurarSuscripcionesReactivas();
}

// ============================================================================
// LOG DE MIGRACIÓN
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════╗
║          ✅ APP-MIGRATED.JS CARGADO                           ║
╚════════════════════════════════════════════════════════════════╝

Funciones refactorizadas cargadas:
  ✅ cargarPlatos()
  ✅ cargarPedidos()
  ✅ cargarIngredientes()
  ✅ cargarEscandallos()
  ✅ cargarInventario()
  ✅ cargarProduccion()
  ✅ cargarSanidad()
  ✅ filtrarPlatos()
  ✅ filtrarPedidos()
  ✅ filtrarIngredientes()
  ✅ mostrarPlatos()
  ✅ mostrarPedidos()
  ✅ mostrarProduccion()
  ✅ mostrarSanidad()

Las funciones originales de app.js han sido sobrescritas.
Usa la consola para verificar que todo funciona correctamente.
`);
