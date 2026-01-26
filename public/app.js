// HIBO COCINA - APP.JS
// Application controller

const API_BASE = '/api';

/**
 * Extrae datos de una respuesta API
 * Soporta tanto formato { success, data, ... } como arrays/objetos directos
 */
function extractAPIData(response) {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  return response;
}

// Función helper para formatear números con coma decimal (formato español)
function formatDecimal(num, decimales = 3) {
  if (num === null || num === undefined || num === '') return '';
  return Number(num).toFixed(decimales).replace('.', ',');
}

// Estado global
let estadoApp = {
  platosCacheado: false,
  pedidosCacheado: false,
  platosData: [],
  pedidosData: [],
  escandallosData: [],
  ingredientesData: [],
  inventarioData: [],
  controlesAPPCC: [],
  paginacion: {
    platos: { pagina: 1, porPagina: 12, seleccionados: [] },
    ingredientes: { pagina: 1, porPagina: 12, seleccionados: [] },
    escandallos: { pagina: 1, porPagina: 12, seleccionados: [] },
    inventario: { pagina: 1, porPagina: 12, seleccionados: [] },
    pedidos: { pagina: 1, porPagina: 12, seleccionados: [] },
    partidas: { pagina: 1, porPagina: 12, seleccionados: [] },
    controlesAPPCC: { pagina: 1, porPagina: 12, seleccionados: [] }
  }
};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
  // Solo inicializar eventos básicos
  // Los módulos y datos se cargarán después desde inicializarApp()
  inicializarEventosBasicos();
});

function inicializarApp() {
  // Esta función se llama desde module-loader.js después de cargar los módulos
  console.log('🚀 Inicializando aplicación...');
  inicializarEventos();
  cargarDashboard();
  mostrarSeccion('dashboard');
}

function inicializarEventosBasicos() {
  // Modal principal
  const closeBtn = document.querySelector('.close');
  if (closeBtn) {
    closeBtn.addEventListener('click', cerrarModal);
  }
  
  window.addEventListener('click', (e) => {
    const modal = document.querySelector('#modal');
    if (e.target === modal) cerrarModal();
  });
}

function inicializarEventos() {
  // Navegación
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cambiarSeccion(btn.dataset.section);
    });
  });

  // Busqueda y filtros
  const searchPlatos = document.getElementById('searchPlatos');
  if (searchPlatos) searchPlatos.addEventListener('input', filtrarPlatos);
  
  const filterGrupo = document.getElementById('filterGrupo');
  if (filterGrupo) filterGrupo.addEventListener('change', filtrarPlatos);
  
  const searchPedidos = document.getElementById('searchPedidos');
  if (searchPedidos) searchPedidos.addEventListener('input', filtrarPedidos);
  
  const filterEstado = document.getElementById('filterEstado');
  if (filterEstado) filterEstado.addEventListener('change', filtrarPedidos);

  // Búsqueda de escandallos
  const searchEscandallos = document.getElementById('searchEscandallos');
  if (searchEscandallos) searchEscandallos.addEventListener('input', filtrarEscandallos);

  // Búsqueda y filtros de ingredientes
  const searchIngredientes = document.getElementById('searchIngredientes');
  if (searchIngredientes) searchIngredientes.addEventListener('input', filtrarIngredientes);
  
  const filterFamilia = document.getElementById('filterFamilia');
  if (filterFamilia) filterFamilia.addEventListener('change', filtrarIngredientes);
  
  const filterConservacion = document.getElementById('filterConservacion');
  if (filterConservacion) filterConservacion.addEventListener('change', filtrarIngredientes);

  // Búsqueda y filtros de inventario
  const searchInventario = document.getElementById('searchInventario');
  if (searchInventario) searchInventario.addEventListener('input', filtrarInventario);
  
  const filterGrupoConservacion = document.getElementById('filterGrupoConservacion');
  if (filterGrupoConservacion) filterGrupoConservacion.addEventListener('change', filtrarInventario);
  
  const filterStockBajo = document.getElementById('filterStockBajo');
  if (filterStockBajo) filterStockBajo.addEventListener('change', filtrarInventario);

  // Botones de nuevo
  document.getElementById('btnNuevoPlato')?.addEventListener('click', () => {
    abrirModalPlato();
  });
  document.getElementById('btnNuevoPedido')?.addEventListener('click', () => {
    abrirModalPedido();
  });

  // Configurar form del modal
  document.getElementById('modalForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Obtener la función callback si existe
    if (window.modalCallback) {
      await window.modalCallback(formData);
      window.modalCallback = null;
    }
  });
}

// ==================== NAVEGACIÓN ====================
function mostrarSeccion(seccion) {
  // Ocultar todas las secciones
  document.querySelectorAll('.section').forEach(s => {
    s.style.display = 'none';
  });

  // Mostrar sección seleccionada
  const seccionElement = document.getElementById(seccion);
  if (seccionElement) {
    seccionElement.style.display = 'block';
  }

  // Actualizar botones de navegación
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.section === seccion) {
      btn.classList.add('active');
    }
  });
}

function cambiarSeccion(seccion) {
  mostrarSeccion(seccion);

  // Cargar datos según sección
  switch(seccion) {
    case 'dashboard':
      cargarDashboard();
      break;
    case 'platos':
      cargarPlatos();
      break;
    case 'ingredientes':
      cargarIngredientes();
      break;
    case 'escandallos':
      cargarEscandallos();
      break;
    case 'inventario':
      cargarInventario();
      break;
    case 'pedidos':
      cargarPedidos();
      break;
    case 'produccion':
      cargarProduccion();
      break;
    case 'sanidad':
      cargarSanidad();
      break;
  }
}

// ==================== DASHBOARD ====================
async function cargarDashboard() {
  try {
    // Cargar datos en paralelo
    const [statsPlatos, statsPedidos] = await Promise.all([
      fetch(`${API_BASE}/platos/estadisticas`).then(r => r.json()).then(d => d.data || d || {}).catch(() => ({})),
      fetch(`${API_BASE}/pedidos/estadisticas`).then(r => r.json()).then(d => d.data || d || {}).catch(() => ({}))
    ]);

    // Actualizar métricas con verificación de elementos
    const totalPlatosEl = document.getElementById('totalPlatos');
    if (totalPlatosEl) {
      // statsPlatos es ahora directamente el objeto {total, activos, ...}
      totalPlatosEl.textContent = statsPlatos.total || 0;
    }

    const totalPendientesEl = document.getElementById('totalPedidosPendientes');
    if (totalPendientesEl) {
      totalPendientesEl.textContent = statsPedidos.pendientes || 0;
    }

    const totalProduccionEl = document.getElementById('totalPedidosProduccion');
    if (totalProduccionEl) {
      totalProduccionEl.textContent = statsPedidos.cancelados || 0;
    }

    const total = statsPedidos.total_vendido || 0;
    const valorTotalEl = document.getElementById('valorTotalPedidos');
    if (valorTotalEl) {
      valorTotalEl.textContent = formatDecimal(total) + '€';
    }

    // Mostrar información de estadísticas
    const infoHtml = `
      <div class="stat-item">
        <strong>Platos totales:</strong> ${statsPlatos.total || 0}
      </div>
      <div class="stat-item">
        <strong>Precio promedio:</strong> ${formatDecimal(statsPlatos.precio_venta_promedio || 0)}€
      </div>
      <div class="stat-item">
        <strong>Pedidos completados:</strong> ${statsPedidos.completados || 0}
      </div>
    `;
    
    const topGruposEl = document.getElementById('topGrupos');
    if (topGruposEl) {
      topGruposEl.innerHTML = infoHtml || '<p>Sin datos</p>';
    }

  } catch (error) {
    console.error('Error cargando dashboard:', error);
  }
}

// ==================== PLATOS ====================
async function cargarPlatos() {
  try {
    const response = await fetch(`${API_BASE}/platos`);
    const result = await response.json();
    estadoApp.platosData = extractAPIData(result) || [];

    mostrarPlatos(estadoApp.platosData);
  } catch (error) {
    console.error('Error cargando platos:', error);
    mostrarError('Error al cargar platos');
  }
}

function mostrarPlatos(platos) {
  const tbody = document.getElementById('platosTableBody');
  const paginacionDiv = document.getElementById('platos-paginacion');
  tbody.innerHTML = '';

  if (!platos.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No hay platos</td></tr>';
    if (paginacionDiv) paginacionDiv.innerHTML = '';
    return;
  }

  const platosPaginados = paginar(platos, 'platos');
  const idsVisibles = platosPaginados.map(p => p.id);
  const seleccionados = estadoApp.paginacion.platos.seleccionados;

  // Checkbox "seleccionar todos"
  const todosSeleccionados = idsVisibles.every(id => seleccionados.includes(id));

  platosPaginados.forEach(plato => {
    const stock = plato.stock_activo ? '✓' : '✗';
    const checked = seleccionados.includes(plato.id) ? 'checked' : '';
    const row = `
      <tr>
        <td><input type="checkbox" id="check-platos-${plato.id}" ${checked} onchange="toggleSeleccion('platos', ${plato.id})"></td>
        <td><strong>${plato.codigo}</strong></td>
        <td>${plato.nombre}</td>
        <td>${plato.grupo_menu || '-'}</td>
        <td>${plato.unidad}</td>
        <td>${formatDecimal(plato.coste || 0)}€</td>
        <td>${plato.peso_raciones || 0} g</td>
        <td><span class="${plato.stock_activo ? 'status-completado' : 'status-pendiente'}">${stock}</span></td>
        <td>
          <button class="btn-icon" onclick="editarPlato(${plato.id})" title="Editar">✏️</button>
          <button class="btn-icon" onclick="verDetallePlato(${plato.id})" title="Ver detalle">👁️</button>
          <button class="btn-icon" onclick="eliminarPlato(${plato.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });

  if (paginacionDiv) {
    paginacionDiv.innerHTML = renderizarPaginacion(platos.length, 'platos', 'filtrarPlatos');
  }

  actualizarBotonEliminarMasivo('platos');
}

function filtrarPlatos() {
  const search = normalizarTexto(document.getElementById('searchPlatos').value);
  const grupo = document.getElementById('filterGrupo').value;

  const filtrados = estadoApp.platosData.filter(plato => {
    const matchSearch = !search || normalizarTexto(plato.nombre).includes(search) || normalizarTexto(plato.codigo).includes(search);
    const matchGrupo = !grupo || plato.grupo_menu === grupo;
    return matchSearch && matchGrupo;
  });

  mostrarPlatos(filtrados);
}

async function abrirModalPlato(platoId = null) {
  const modal = document.querySelector('#modal');
  const modalTitle = document.querySelector('#modalTitle');
  const modalFields = document.querySelector('#modalFields');
  
  if (!modal || !modalTitle || !modalFields) {
    console.error('❌ Elementos del modal no encontrados');
    return;
  }
  
  console.log(`📝 Abriendo modal de ${platoId ? 'edición' : 'creación'} para plato ID: ${platoId || 'nuevo'}`);
  
  modalTitle.textContent = platoId ? 'Editar Plato' : 'Nuevo Plato';

  const fields = `
    <div>
      <label>Tipo:</label>
      <select id="tipo_entidad" required>
        <option value="plato">🍽️ Plato (para venta)</option>
        <option value="elaborado">🍳 Elaborado (con cocción)</option>
        <option value="preelaborado">🔧 Pre-elaborado (sin cocción)</option>
      </select>
    </div>
    <div>
      <label>Código:</label>
      <input type="text" id="codigo" required>
    </div>
    <div>
      <label>Nombre:</label>
      <input type="text" id="nombre" required>
    </div>
    <div>
      <label>Grupo Menú:</label>
      <select id="grupo_menu">
        <option value="">Seleccione...</option>
        <option value="Entrante caliente">Entrante caliente</option>
        <option value="Postre">Postre</option>
        <option value="Desayuno">Desayuno</option>
        <option value="Carne">Carne</option>
        <option value="Entrante fría">Entrante fría</option>
      </select>
    </div>
    <div>
      <label>Unidad:</label>
      <select id="unidad">
        <option value="Ud">Ud</option>
        <option value="Kg">Kg</option>
        <option value="Lt">Lt</option>
      </select>
    </div>
    <div>
      <label>Coste (€):</label>
      <input type="number" id="coste" step="0.001" value="0">
    </div>
    <div>
      <label>Peso Raciones (g):</label>
      <input type="number" id="peso_raciones" step="0.001" value="0">
    </div>
    <div>
      <label>Cocina:</label>
      <select id="cocina">
        <option value="">Seleccione...</option>
        <option value="Caliente">Caliente</option>
        <option value="Cuarto frio">Cuarto frio</option>
        <option value="Pastelería">Pastelería</option>
        <option value="Panadería">Panadería</option>
        <option value="Salsas">Salsas</option>
        <option value="Guarniciones">Guarniciones</option>
      </select>
    </div>
    <div>
      <label>Preparación:</label>
      <select id="preparacion">
        <option value="">Seleccione...</option>
        <option value="Caliente">Caliente</option>
        <option value="Fria">Fria</option>
        <option value="Tibia">Tibia</option>
        <option value="Ambiente">Ambiente</option>
      </select>
    </div>
    <div>
      <label>
        <input type="checkbox" id="stock_activo">
        Stock Activo
      </label>
    </div>
  `;

  modalFields.innerHTML = fields;

  if (platoId) {
    let plato = estadoApp.platosData.find(p => p.id === platoId);
    
    // Si no está en caché, cargarlo desde la API
    if (!plato) {
      try {
        console.log(`🔄 Cargando plato desde API (ID: ${platoId})...`);
        const response = await fetch(`${API_BASE}/platos/${platoId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        plato = result.data || result;
        console.log('✅ Plato cargado desde API:', plato);
      } catch (error) {
        console.error('❌ Error al cargar plato:', error);
        mostrarError('Error al cargar los datos del plato: ' + error.message);
        return;
      }
    } else {
      console.log('✅ Plato cargado desde caché:', plato);
    }
    
    if (plato) {
      document.getElementById('tipo_entidad').value = plato.tipo_entidad || 'plato';
      document.getElementById('codigo').value = plato.codigo || '';
      document.getElementById('nombre').value = plato.nombre || '';
      document.getElementById('grupo_menu').value = plato.grupo_menu || '';
      document.getElementById('unidad').value = plato.unidad || 'Ud';
      document.getElementById('coste').value = plato.coste ? Number(plato.coste).toFixed(3) : '0.000';
      document.getElementById('peso_raciones').value = plato.peso_raciones ? Number(plato.peso_raciones).toFixed(3) : '0.000';
      document.getElementById('cocina').value = plato.cocina || '';
      document.getElementById('preparacion').value = plato.preparacion || '';
      document.getElementById('stock_activo').checked = plato.stock_activo;
      console.log('✅ Campos del modal completados');
    }
  }

  const modalForm = document.getElementById('modalForm');
  if (modalForm) {
    modalForm.onsubmit = () => guardarPlato(platoId);
  }
  
  // Mostrar el modal
  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
  console.log(`✅ Modal abierto correctamente para ${platoId ? 'editar' : 'crear'} plato`);
}

async function guardarPlato(platoId) {
  event.preventDefault();

  const datos = {
    tipo_entidad: document.getElementById('tipo_entidad').value,
    codigo: document.getElementById('codigo').value,
    nombre: document.getElementById('nombre').value,
    grupo_menu: document.getElementById('grupo_menu').value,
    unidad: document.getElementById('unidad').value,
    coste: parseFloat(document.getElementById('coste').value) || 0,
    peso_raciones: parseFloat(document.getElementById('peso_raciones').value) || 0,
    cocina: document.getElementById('cocina').value,
    preparacion: document.getElementById('preparacion').value,
    stock_activo: document.getElementById('stock_activo').checked
  };

  try {
    const url = platoId ? `${API_BASE}/platos/${platoId}` : `${API_BASE}/platos`;
    const metodo = platoId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    if (response.ok) {
      cerrarModal();
      cargarPlatos();
      cargarDashboard();
      mostrarExito('Plato guardado correctamente');
    } else {
      mostrarError('Error al guardar plato');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al guardar plato');
  }
}

async function eliminarPlato(platoId) {
  confirmarAccion('¿Está seguro de que desea eliminar este plato?', async () => {
    try {
    const response = await fetch(`${API_BASE}/platos/${platoId}`, { method: 'DELETE' });
    if (response.ok) {
      cargarPlatos();
      cargarDashboard();
      mostrarExito('Plato eliminado correctamente');
    } else {
      mostrarError('Error al eliminar plato');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al eliminar plato');
  }
  });
}

function editarPlato(platoId) {
  abrirModalPlato(platoId);
}

// ==================== PEDIDOS ====================
async function cargarPedidos() {
  try {
    const response = await fetch(`${API_BASE}/pedidos`);
    const result = await response.json();
    estadoApp.pedidosData = extractAPIData(result) || [];

    mostrarPedidos(estadoApp.pedidosData);
  } catch (error) {
    console.error('Error cargando pedidos:', error);
    mostrarError('Error al cargar pedidos');
  }
}

function mostrarPedidos(pedidos) {
  const tbody = document.getElementById('pedidosTableBody');
  const paginacionDiv = document.getElementById('pedidos-paginacion');
  tbody.innerHTML = '';

  if (!pedidos.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No hay pedidos</td></tr>';
    if (paginacionDiv) paginacionDiv.innerHTML = '';
    return;
  }

  const pedidosPaginados = paginar(pedidos, 'pedidos');
  const idsVisibles = pedidosPaginados.map(p => p.id);
  const seleccionados = estadoApp.paginacion.pedidos.seleccionados;

  pedidosPaginados.forEach(pedido => {
    const fecha = new Date(pedido.fecha_pedido).toLocaleDateString('es-ES');
    const entrega = pedido.fecha_entrega ? new Date(pedido.fecha_entrega).toLocaleDateString('es-ES') : '-';
    const statusClass = `status-${pedido.estado}`;
    const checked = seleccionados.includes(pedido.id) ? 'checked' : '';

    const row = `
      <tr>
        <td><input type="checkbox" id="check-pedidos-${pedido.id}" ${checked} onchange="toggleSeleccion('pedidos', ${pedido.id})"></td>
        <td>#${pedido.id}</td>
        <td>${pedido.numero}</td>
        <td>${pedido.cliente_codigo || '-'}</td>
        <td>${fecha}</td>
        <td>${entrega}</td>
        <td><span class="${statusClass}">${pedido.estado}</span></td>
        <td>${formatDecimal(pedido.total || 0)}€</td>
        <td>
          <button class="btn-icon" onclick="editarPedido(${pedido.id})" title="Editar">✏️</button>
          <button class="btn-icon" onclick="verPedido(${pedido.id})" title="Ver detalle">👁️</button>
          <button class="btn-icon" onclick="eliminarPedido(${pedido.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });

  if (paginacionDiv) {
    paginacionDiv.innerHTML = renderizarPaginacion(pedidos.length, 'pedidos', 'cargarPedidos');
  }

  actualizarBotonEliminarMasivo('pedidos');
}

function filtrarPedidos() {
  const search = normalizarTexto(document.getElementById('searchPedidos').value);
  const estado = document.getElementById('filterEstado').value;

  const filtrados = estadoApp.pedidosData.filter(pedido => {
    const matchSearch = !search || normalizarTexto(pedido.cliente_codigo).includes(search) || normalizarTexto(pedido.numero).includes(search);
    const matchEstado = !estado || pedido.estado === estado;
    return matchSearch && matchEstado;
  });

  mostrarPedidos(filtrados);
}

async function abrirModalPedido() {
  const modal = document.querySelector('#modal');
  const modalTitle = document.querySelector('#modalTitle');
  const modalFields = document.querySelector('#modalFields');
  const modalForm = document.querySelector('#modalForm');
  
  if (!modal || !modalTitle || !modalFields || !modalForm) {
    console.error('❌ Elementos del modal no encontrados');
    return;
  }
  
  modalTitle.textContent = 'Nuevo Pedido';

  const fields = `
    <div>
      <label>Número de Pedido:</label>
      <input type="text" id="numero" required>
    </div>
    <div>
      <label>Cliente:</label>
      <input type="text" id="cliente_codigo">
    </div>
    <div>
      <label>Fecha de Entrega:</label>
      <input type="date" id="fecha_entrega">
    </div>
    <div>
      <label>Estado:</label>
      <select id="estado">
        <option value="pendiente">Pendiente</option>
        <option value="produccion">En Producción</option>
        <option value="completado">Completado</option>
        <option value="cancelado">Cancelado</option>
      </select>
    </div>
    <div>
      <label>Total (€):</label>
      <input type="number" id="total" step="0.01" value="0">
    </div>
  `;

  modalFields.innerHTML = fields;
  modalForm.onsubmit = guardarPedido;
  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
}

async function guardarPedido(event) {
  event.preventDefault();

  const datos = {
    numero: document.getElementById('numero').value,
    cliente_codigo: document.getElementById('cliente_codigo').value,
    fecha_entrega: document.getElementById('fecha_entrega').value,
    estado: document.getElementById('estado').value,
    total: parseFloat(document.getElementById('total').value) || 0
  };

  try {
    const response = await fetch(`${API_BASE}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    if (response.ok) {
      cerrarModal();
      cargarPedidos();
      mostrarExito('Pedido creado correctamente');
    } else {
      mostrarError('Error al crear pedido');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al crear pedido');
  }
}

async function verPedido(pedidoId) {
  try {
    const response = await fetch(`${API_BASE}/pedidos/${pedidoId}`);
    const result = await response.json();
    const pedido = result.data;

    const contenido = `
Número: ${pedido.numero}
Cliente: ${pedido.cliente_codigo}
Estado: ${pedido.estado}
Total: ${formatDecimal(pedido.total)}€
Líneas: ${pedido.lineas?.length || 0}`;
    
    mostrarInfo(`📦 Pedido #${pedido.id}`, contenido);
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al cargar detalles del pedido');
  }
}

async function eliminarPedido(pedidoId) {
  confirmarAccion('¿Está seguro de que desea eliminar este pedido?', async () => {
    try {
      const response = await fetch(`${API_BASE}/pedidos/${pedidoId}`, { method: 'DELETE' });
      if (response.ok) {
        cargarPedidos();
        cargarDashboard();
        mostrarExito('Pedido eliminado correctamente');
      } else {
        mostrarError('Error al eliminar pedido');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarError('Error al eliminar pedido');
    }
  });
}

// ==================== ESTADÍSTICAS ====================
async function cargarEstadisticas() {
  try {
    const [statsPlatos, statsPedidos] = await Promise.all([
      fetch(`${API_BASE}/platos/estadisticas`).then(r => r.json()).then(d => extractAPIData(d) || {}).catch(() => ({})),
      fetch(`${API_BASE}/pedidos/estadisticas`).then(r => r.json()).then(d => extractAPIData(d) || {}).catch(() => ({}))
    ]);

    // Estadísticas de platos (ahora es un objeto con total, promedio, etc.)
    const statsPlatos_html = `
      <div class="stat-item" style="padding: 8px 0; border-bottom: 1px solid #eee;">
        <strong>Total platos:</strong> ${statsPlatos.total || 0}
      </div>
      <div class="stat-item" style="padding: 8px 0; border-bottom: 1px solid #eee;">
        <strong>Platos activos:</strong> ${statsPlatos.activos || 0}
      </div>
      <div class="stat-item" style="padding: 8px 0; border-bottom: 1px solid #eee;">
        <strong>Precio promedio:</strong> ${formatDecimal(statsPlatos.precio_venta_promedio || 0)}€
      </div>
    `;
    const statsPlatos_el = document.getElementById('statsPlatos');
    if (statsPlatos_el) statsPlatos_el.innerHTML = statsPlatos_html || '<p>Sin datos</p>';

    // Estadísticas de pedidos (ahora es un objeto con total, completados, etc.)
    const statsPedidos_html = `
      <div class="stat-item" style="padding: 8px 0; border-bottom: 1px solid #eee;">
        <strong>Total pedidos:</strong> ${statsPedidos.total || 0}
      </div>
      <div class="stat-item" style="padding: 8px 0; border-bottom: 1px solid #eee;">
        <strong>Completados:</strong> ${statsPedidos.completados || 0}
      </div>
      <div class="stat-item" style="padding: 8px 0; border-bottom: 1px solid #eee;">
        <strong>Pendientes:</strong> ${statsPedidos.pendientes || 0}
      </div>
    `;
    const statsPedidos_el = document.getElementById('statsPedidos');
    if (statsPedidos_el) statsPedidos_el.innerHTML = statsPedidos_html || '<p>Sin datos</p>';

    // Costos promedio
    const costosHtml = `
      <div class="stat-item" style="padding: 8px 0;">
        <strong>Coste promedio:</strong> ${formatDecimal(statsPlatos.coste_promedio || 0)}€
      </div>
    `;
    const costos_el = document.getElementById('statsCostos');
    if (costos_el) costos_el.innerHTML = costosHtml || '<p>Sin datos</p>';

  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
}

// ==================== MÓDULO SANIDAD (ALÉRGENOS) ====================

async function cargarSanidad() {
  try {
    console.log('🔵 Iniciando carga de Sanidad...');
    
    // ⏳ ESPERAR A QUE EL MÓDULO ESTÉ CARGADO EN EL DOM
    await esperarElemento('sanidadTableBody', 5000);
    console.log('✅ Módulo de Sanidad detectado en DOM');
    
    // Cargar alérgenos oficiales
    let alergenos = [];
    try {
      console.log('📡 Cargando alérgenos oficiales...');
      const resp = await fetch(`${API_BASE}/alergenos-oficiales`);
      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      alergenos = await resp.json();
      console.log('✅ Alérgenos oficiales:', alergenos.length);
    } catch (error) {
      console.error('❌ Error cargando alérgenos oficiales:', error);
      mostrarMensaje('Error al cargar alérgenos oficiales', 'error');
    }
    
    // Cargar alérgenos personalizados
    let personalizados = [];
    try {
      console.log('📡 Cargando alérgenos personalizados...');
      await cargarAlergenosPersonalizados();
      personalizados = alergenosPersonalizadosCache || [];
      console.log('✅ Alérgenos personalizados:', personalizados.length);
    } catch (error) {
      console.error('❌ Error cargando alérgenos personalizados:', error);
      mostrarMensaje('Error al cargar alérgenos personalizados', 'error');
    }
    
    // Cargar controles APPCC
    let controles = [];
    try {
      console.log('📡 Cargando controles APPCC...');
      const resp = await fetch(`${API_BASE}/control-sanidad`);
      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      controles = await resp.json();
      console.log('✅ Controles APPCC:', controles.length);
    } catch (error) {
      console.error('❌ Error cargando controles APPCC:', error);
      mostrarMensaje('Error al cargar controles APPCC', 'error');
    }
    
    // Agrupar controles por plato
    const controlesPorPlato = {};
    controles.forEach(c => {
      if (!controlesPorPlato[c.plato_codigo]) {
        controlesPorPlato[c.plato_codigo] = [];
      }
      controlesPorPlato[c.plato_codigo].push(c);
    });
    
    const html = `
      <div class="card">
        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 5px 0;">⚕️ Gestión Integral de Sanidad</h2>
          <p style="margin: 0; color: #666;">Sistema completo de gestión sanitaria: Alérgenos + Control APPCC</p>
        </div>
        
        <!-- TABS DE NAVEGACIÓN -->
        <div style="border-bottom: 2px solid #e0e0e0; margin-bottom: 25px;">
          <button class="tab-btn active" onclick="mostrarTabSanidad('alergenos-oficiales')" style="padding: 12px 24px; border: none; background: none; cursor: pointer; border-bottom: 3px solid #4a90e2; font-weight: 600;">
            🇪🇺 Alérgenos Oficiales
          </button>
          <button class="tab-btn" onclick="mostrarTabSanidad('alergenos-personalizados')" style="padding: 12px 24px; border: none; background: none; cursor: pointer; border-bottom: 3px solid transparent;">
            🏷️ Alérgenos Personalizados
          </button>
          <button class="tab-btn" onclick="mostrarTabSanidad('control-appcc')" style="padding: 12px 24px; border: none; background: none; cursor: pointer; border-bottom: 3px solid transparent;">
            📋 Control APPCC
          </button>
        </div>
        
        <!-- TAB 1: ALÉRGENOS OFICIALES -->
        <div id="tab-alergenos-oficiales" class="tab-content" style="display: block;">
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: var(--dark-gray);">14 Alérgenos Oficiales de la Unión Europea</h3>
            <p style="color: #666; font-size: 0.95em;">Alérgenos de declaración obligatoria según el Reglamento (UE) 1169/2011</p>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th width="50">#</th>
                  <th width="70">Icono</th>
                  <th width="180">Nombre</th>
                  <th>Descripción</th>
                  <th>Palabras Clave (Detección)</th>
                  <th width="90">Estado</th>
                  <th width="100">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${alergenos.map((a, i) => `
                  <tr>
                    <td style="text-align: center;">${i + 1}</td>
                    <td style="text-align: center; font-size: 1.5em;">${a.icono || '❔'}</td>
                    <td><strong>${a.nombre}</strong></td>
                    <td style="font-size: 0.9em; color: #666;">${a.descripcion || '-'}</td>
                    <td style="font-size: 0.85em; color: #555;">
                      ${a.palabras_clave ? a.palabras_clave.split(',').slice(0, 5).join(', ') + '...' : '<span style="color: #999;">Sin configurar</span>'}
                    </td>
                    <td style="text-align: center;">
                      <span class="badge ${a.activo ? 'badge-success' : 'badge-secondary'}">
                        ${a.activo ? '✓ Activo' : '✗ Inactivo'}
                      </span>
                    </td>
                    <td style="text-align: center;">
                      <button class="btn btn-secondary btn-sm" onclick="editarAlergenoOficial(${a.id})" title="Editar">
                        ✏️
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- TAB 2: ALÉRGENOS PERSONALIZADOS -->
        <div id="tab-alergenos-personalizados" class="tab-content" style="display: none;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h3 style="margin: 0 0 5px 0; color: var(--dark-gray);">Alérgenos Personalizados</h3>
              <p style="margin: 0; color: #666; font-size: 0.95em;">Para restricciones específicas de clientes (ajo, cebolla, picante, etc.)</p>
            </div>
            <button class="btn btn-primary" onclick="mostrarModalNuevoAlergenoPersonalizado()">
              ➕ Nuevo Alérgeno
            </button>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th width="70">Icono</th>
                  <th width="200">Nombre</th>
                  <th>Descripción</th>
                  <th>Palabras Clave (Detección)</th>
                  <th width="90">Estado</th>
                  <th width="140">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${personalizados.length === 0 ? 
                  '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No hay alérgenos personalizados. Créalos para adaptarte a necesidades específicas de clientes.</td></tr>' :
                  personalizados.map(a => `
                    <tr>
                      <td style="text-align: center; font-size: 1.5em;">${a.icono || '❔'}</td>
                      <td><strong>${a.nombre}</strong></td>
                      <td style="font-size: 0.9em; color: #666;">${a.descripcion || '-'}</td>
                      <td style="font-size: 0.85em; color: #555;">
                        ${a.palabras_clave ? a.palabras_clave.split(',').slice(0, 5).join(', ') : '<span style="color: #999;">Sin configurar</span>'}
                      </td>
                      <td style="text-align: center;">
                        <span class="badge ${a.activo ? 'badge-success' : 'badge-secondary'}">
                          ${a.activo ? '✓ Activo' : '✗ Inactivo'}
                        </span>
                      </td>
                      <td style="text-align: center;">
                        <button class="btn btn-secondary btn-sm" onclick="editarAlergenoPersonalizado(${a.id})" title="Editar">
                          ✏️
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarAlergenoPersonalizado(${a.id})" title="Eliminar">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- TAB 3: CONTROL APPCC -->
        <div id="tab-control-appcc" class="tab-content" style="display: none;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h3 style="margin: 0 0 5px 0; color: var(--dark-gray);">Control de Puntos Críticos (APPCC)</h3>
              <p style="margin: 0; color: #666; font-size: 0.95em;">Análisis de Peligros y Puntos Críticos de Control - ${controles.length} registros</p>
            </div>
            <button class="btn btn-primary" onclick="mostrarModalNuevoControlAPPCC()">
              ➕ Nuevo Control
            </button>
          </div>
          
          <div class="toolbar">
            <div class="search-group">
              <input type="text" id="searchControlAPPCC" placeholder="🔍 Buscar por plato, ingrediente..." onkeyup="filtrarControlesAPPCC()">
            </div>
            <button class="btn btn-secondary" onclick="limpiarFiltrosControlAPPCC()">🔄 Limpiar</button>
            <button class="btn btn-secondary" onclick="seleccionarTodosLosRegistros('controlesAPPCC')">☑️ Seleccionar Todos</button>
            <button class="btn btn-danger" id="btn-eliminar-controlesAPPCC" onclick="eliminarSeleccionados('controlesAPPCC', 'control-sanidad')" disabled>
              🗑️ Eliminar (0)
            </button>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 25px;">
            <div class="card" style="text-align: center; padding: 20px;">
              <div style="font-size: 0.85em; color: #666; margin-bottom: 8px;">Total Controles</div>
              <div style="font-size: 2.5em; font-weight: 700; color: var(--primary-color);">${controles.length}</div>
            </div>
            <div class="card" style="text-align: center; padding: 20px;">
              <div style="font-size: 0.85em; color: #666; margin-bottom: 8px;">Platos Monitoreados</div>
              <div style="font-size: 2.5em; font-weight: 700; color: var(--secondary-color);">${Object.keys(controlesPorPlato).length}</div>
            </div>
            <div class="card" style="text-align: center; padding: 20px;">
              <div style="font-size: 0.85em; color: #666; margin-bottom: 8px;">Con Punto Crítico</div>
              <div style="font-size: 2.5em; font-weight: 700; color: #e74c3c;">${controles.filter(c => c.punto_critico).length}</div>
            </div>
            <div class="card" style="text-align: center; padding: 20px;">
              <div style="font-size: 0.85em; color: #666; margin-bottom: 8px;">Con Corrector</div>
              <div style="font-size: 2.5em; font-weight: 700; color: #27ae60;">${controles.filter(c => c.corrector).length}</div>
            </div>
          </div>
          
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th width="40">
                    <input type="checkbox" id="selectAllControlesAPPCC" onchange="toggleSeleccionTodos('controlesAPPCC')">
                  </th>
                  <th>Plato</th>
                  <th>Ingrediente</th>
                  <th>Fecha Producción</th>
                  <th>Punto Crítico</th>
                  <th>Punto Corrector</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="controlesAPPCCTableBody">
              </tbody>
            </table>
          </div>
          <div id="control-appcc-paginacion" class="paginacion"></div>
        </div>
        
        <!-- INFORMACIÓN IMPORTANTE -->
        <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <strong style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
            💡 Información Importante del Sistema de Sanidad
          </strong>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li><strong>Alérgenos Oficiales:</strong> Los 14 alérgenos de la UE se detectan automáticamente al crear ingredientes/platos según las palabras clave configuradas</li>
            <li><strong>Alérgenos Personalizados:</strong> Permite adaptarse a restricciones específicas de clientes (ajo, cebolla, picante, etc.)</li>
            <li><strong>Control APPCC:</strong> Sistema de Análisis de Peligros y Puntos Críticos de Control para seguridad alimentaria</li>
            <li><strong>Detección Automática:</strong> Configura palabras clave en varios idiomas para mejorar la detección</li>
            <li><strong>Trazabilidad:</strong> Todos los controles APPCC se registran para auditorías y certificaciones</li>
          </ul>
        </div>
      </div>
    `;
    
    document.getElementById('sanidad').innerHTML = html;
    
    // Guardar controles en estado global para paginación
    estadoApp.controlesAPPCC = controles;
    console.log('📊 Controles guardados en estadoApp:', controles.length);
    
    console.log('🔄 Llamando a mostrarControlesAPPCC...');
    mostrarControlesAPPCC(controles);
    console.log('✅ mostrarControlesAPPCC ejecutado');
    
  } catch (error) {
    console.error('Error cargando sanidad:', error);
    document.getElementById('sanidad').innerHTML = `
      <div class="card">
        <h2>⚕️ Gestión de Sanidad</h2>
        <p class="error">Error al cargar el módulo: ${error.message}</p>
      </div>
    `;
  }
}

// Función para cambiar entre tabs
function mostrarTabSanidad(tabId) {
  // Ocultar todos los tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
  });
  
  // Remover clase active de todos los botones
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.style.borderBottom = '3px solid transparent';
    btn.style.fontWeight = 'normal';
  });
  
  // Mostrar tab seleccionado
  const selectedTab = document.getElementById(`tab-${tabId}`);
  if (selectedTab) {
    selectedTab.style.display = 'block';
  }
  
  // Activar botón seleccionado
  event.target.style.borderBottom = '3px solid #4a90e2';
  event.target.style.fontWeight = '600';
}

async function editarAlergenoOficial(id) {
  try {
    const response = await fetch(`${API_BASE}/alergenos-oficiales/${id}`);
    if (!response.ok) throw new Error('Error al cargar alérgeno');
    const alergeno = await response.json();
    
    const campos = `
      <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
        <div>
          <label>Nombre (No editable)</label>
          <input type="text" value="${alergeno.nombre}" disabled style="background-color: #f5f5f5;">
        </div>
        <div>
          <label>Código (No editable)</label>
          <input type="text" value="${alergeno.codigo}" disabled style="background-color: #f5f5f5;">
        </div>
        <div>
          <label>Descripción</label>
          <textarea name="descripcion" rows="3">${alergeno.descripcion || ''}</textarea>
        </div>
        <div>
          <label>Icono (emoji)</label>
          <input type="text" name="icono" value="${alergeno.icono || ''}" maxlength="4">
        </div>
        <div>
          <label>Palabras Clave (para detección automática) *</label>
          <textarea name="palabras_clave" rows="4" required placeholder="Separadas por comas. Ej: gluten,trigo,wheat,cereal">${alergeno.palabras_clave || ''}</textarea>
          <small style="color: #666; font-size: 0.85em; display: block; margin-top: 5px;">
            Estas palabras se usarán para detectar automáticamente este alérgeno cuando se creen ingredientes o platos.
            Incluye el nombre en varios idiomas y sinónimos comunes.
          </small>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" name="activo" id="activo-oficial-${id}" ${alergeno.activo ? 'checked' : ''}>
          <label for="activo-oficial-${id}" style="margin: 0; text-transform: none;">Activo</label>
        </div>
      </div>
    `;
    
    abrirModal(`Editar Alérgeno Oficial: ${alergeno.nombre}`, campos, async (formData) => {
      try {
        const datos = Object.fromEntries(formData);
        datos.activo = formData.has('activo') ? 1 : 0;
        
        const resp = await fetch(`${API_BASE}/alergenos-oficiales/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        
        if (!resp.ok) throw new Error('Error al actualizar');
        
        mostrarExito('Alérgeno oficial actualizado');
        cerrarModal();
        await cargarSanidad();
      } catch (error) {
        mostrarError('Error al actualizar: ' + error.message);
      }
    });
  } catch (error) {
    mostrarError('Error al cargar formulario: ' + error.message);
  }
}

// ==================== UTILIDADES ====================

function abrirModal(titulo, fields, callback) {
  // Esperar a que el DOM esté listo si es necesario
  let attempts = 0;
  const maxAttempts = 20; // 1 segundo máximo
  
  const tryOpen = () => {
    const modalTitle = document.querySelector('#modalTitle');
    const modalFields = document.querySelector('#modalFields');
    const modal = document.querySelector('#modal');
    
    if (!modalTitle || !modalFields || !modal) {
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryOpen, 50);
      } else {
        console.error('❌ No se pudo abrir el modal después de 1 segundo');
      }
      return;
    }
    
    modalTitle.textContent = titulo;
    modalFields.innerHTML = fields;
    modal.style.display = 'flex';
    window.modalCallback = callback;
    
    // Prevenir scroll del body
    document.body.classList.add('modal-open');
  };
  
  tryOpen();
}

function cerrarModal() {
  const modal = document.querySelector('#modal');
  const modalForm = document.querySelector('#modalForm');
  
  if (modal) {
    modal.style.display = 'none';
  }
  
  if (modalForm) {
    modalForm.reset();
  }
  
  window.modalCallback = null;
  
  // Restaurar scroll del body
  document.body.classList.remove('modal-open');
}

function mostrarModal(contenidoHtml) {
  const modal = document.getElementById('modal');
  const modalContent = modal.querySelector('.modal-content');
  
  if (modalContent) {
    // Envolver el contenido en un contenedor con scroll
    modalContent.innerHTML = `
      <span class="close" onclick="cerrarModal()">&times;</span>
      <div style="overflow-y: auto; overflow-x: hidden; flex: 1; min-height: 0;">
        ${contenidoHtml}
      </div>
      <div class="modal-buttons">
        <button type="button" class="btn btn-secondary" onclick="cerrarModal()">Cerrar</button>
      </div>
    `;
  }
  
  modal.style.display = 'flex';
  
  // Prevenir scroll del body
  document.body.classList.add('modal-open');
}

function mostrarExito(mensaje) {
  console.log('✓', mensaje);
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed; top: 20px; right: 20px; background: #27ae60; color: white;
    padding: 15px 20px; border-radius: 4px; z-index: 2000; animation: fadeIn 0.3s;
  `;
  notif.textContent = '✓ ' + mensaje;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

function mostrarError(mensaje) {
  console.error('✗', mensaje);
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed; top: 20px; right: 20px; background: #e74c3c; color: white;
    padding: 15px 20px; border-radius: 4px; z-index: 2000; animation: fadeIn 0.3s;
  `;
  notif.textContent = '✗ ' + mensaje;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

function mostrarInfo(titulo, contenido) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.7); display: flex; align-items: center;
    justify-content: center; z-index: 2000; animation: fadeIn 0.3s;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white; padding: 30px; border-radius: 12px; max-width: 500px;
    width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s;
  `;
  
  modal.innerHTML = `
    <h3 style="margin: 0 0 20px 0; color: #1c1270; font-size: 1.5em;">${titulo}</h3>
    <div style="color: #666; line-height: 1.6; white-space: pre-line;">${contenido}</div>
    <button onclick="this.closest('[style*=fixed]').remove()" 
            style="margin-top: 20px; padding: 10px 24px; background: #3498db; color: white;
                   border: none; border-radius: 6px; cursor: pointer; font-size: 1em;">
      Cerrar
    </button>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function confirmarAccion(mensaje, callback) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.7); display: flex; align-items: center;
    justify-content: center; z-index: 2000; animation: fadeIn 0.3s;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white; padding: 30px; border-radius: 12px; max-width: 450px;
    width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s;
  `;
  
  modal.innerHTML = `
    <h3 style="margin: 0 0 20px 0; color: #e74c3c; font-size: 1.4em;">⚠️ Confirmar acción</h3>
    <p style="color: #666; line-height: 1.6; margin-bottom: 24px;">${mensaje}</p>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button id="btn-cancelar" 
              style="padding: 10px 24px; background: #95a5a6; color: white;
                     border: none; border-radius: 6px; cursor: pointer; font-size: 1em;">
        Cancelar
      </button>
      <button id="btn-confirmar"
              style="padding: 10px 24px; background: #e74c3c; color: white;
                     border: none; border-radius: 6px; cursor: pointer; font-size: 1em;">
        Eliminar
      </button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  modal.querySelector('#btn-cancelar').addEventListener('click', () => overlay.remove());
  modal.querySelector('#btn-confirmar').addEventListener('click', () => {
    overlay.remove();
    callback();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// ==================== PRODUCCIÓN Y TRAZABILIDAD ====================

async function cargarProduccion() {
  try {
    console.log('🔼 Iniciando carga de Producción...');
    
    // ⏳ ESPERAR A QUE EL MÓDULO ESTÉ CARGADO EN EL DOM
    // El módulo podría no estar cargado si el usuario hace click muy rápido
    await esperarElemento('partidasTableBody', 5000);
    console.log('✅ Módulo de Producción detectado en DOM');
    
    // Cargar partidas primero
    await cargarPartidas();
    
    // Inicializar tabs
    const tabButtons = document.querySelectorAll('#produccion .tab-button');
    console.log(`✅ Encontrados ${tabButtons.length} botones de tab`);
    
    if (tabButtons.length > 0) {
      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.textContent.toLowerCase().includes('partidas') ? 'partidas' :
                      btn.textContent.toLowerCase().includes('trazabilidad') ? 'trazabilidad' : 'resumen';
          cambiarTab(tab);
        });
      });
      
      // Activar el primer tab por defecto
      cambiarTab('partidas');
      console.log('✅ Tabs inicializados correctamente');
    } else {
      console.warn('⚠️ No se encontraron botones de tab');
    }

    // Botones - validar existencia
    const btnNuevaTrazabilidad = document.getElementById('btnNuevaTrazabilidad');
    const btnNuevaPartida = document.getElementById('btnNuevaPartida');
    if (btnNuevaTrazabilidad) btnNuevaTrazabilidad.addEventListener('click', abrirModalTrazabilidad);
    if (btnNuevaPartida) btnNuevaPartida.addEventListener('click', abrirModalPartida);

    // Filtros - validar existencia
    const searchTrazabilidad = document.getElementById('searchTrazabilidad');
    const filterFechaTraz = document.getElementById('filterFechaTraz');
    if (searchTrazabilidad) searchTrazabilidad.addEventListener('input', filtrarTrazabilidad);
    if (filterFechaTraz) filterFechaTraz.addEventListener('change', filtrarTrazabilidad);

    // Cargar datos de trazabilidad
    console.log('🔼 Cargando trazabilidad y resumen...');
    await cargarTrazabilidad();
    await cargarResumenProduccion();
    
    console.log('✅ Producción cargada exitosamente');
  } catch (error) {
    console.error('❌ Error cargando producción:', error);
    mostrarError('Error al cargar producción: ' + error.message);
  }
}

// ⏳ Función auxiliar para esperar a que un elemento exista en el DOM
async function esperarElemento(elementId, timeoutMs = 5000) {
  const startTime = Date.now();
  
  while (!document.getElementById(elementId)) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Timeout esperando elemento #${elementId} (${timeoutMs}ms)`);
    }
    // Esperar 100ms antes de revisar nuevamente
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

function cambiarTab(tab) {
  // Ocultar todos los tabs
  document.querySelectorAll('.tab-content').forEach(t => {
    t.style.display = 'none';
    t.classList.remove('active');
  });
  document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));

  // Mostrar tab seleccionado
  const tabElement = document.getElementById(`tab-${tab}`);
  if (tabElement) {
    tabElement.style.display = 'block';
    tabElement.classList.add('active');
  }
  
  // Marcar botón como activo
  document.querySelectorAll('.tab-button').forEach(btn => {
    const tabName = btn.textContent.toLowerCase().includes('partidas') ? 'partidas' :
                    btn.textContent.toLowerCase().includes('trazabilidad') ? 'trazabilidad' : 'resumen';
    if (tabName === tab) {
      btn.classList.add('active');
    }
  });
}

async function cargarTrazabilidad() {
  try {
    const response = await fetch(`${API_BASE}/trazabilidad`);
    const data = await response.json();

    const container = document.getElementById('trazabilidadTableBody');
    if (!container) {
      console.warn('Elemento trazabilidadTableBody no encontrado');
      return;
    }
    
    container.innerHTML = '';

    if (data.length === 0) {
      container.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No hay registros de trazabilidad</td></tr>';
      return;
    }

    data.forEach(traz => {
      const row = `
        <tr>
          <td>${traz.id}</td>
          <td>${traz.partida_cocina || '-'}</td>
          <td>${new Date(traz.fecha_produccion || Date.now()).toLocaleString('es-ES')}</td>
          <td>${traz.responsable || '-'}</td>
          <td><span class="status-badge status-${traz.estado || 'activo'}">${(traz.estado || 'activo').toUpperCase()}</span></td>
          <td>
            <button class="btn-icon" onclick="editarTrazabilidad(${traz.id})" title="Editar">✏️</button>
            <button class="btn-icon" onclick="verDetalleTrazabilidad(${traz.id})" title="Ver detalle">👁️</button>
            <button class="btn-icon" onclick="eliminarTrazabilidad(${traz.id})" title="Eliminar">🗑️</button>
          </td>
        </tr>
      `;
      container.innerHTML += row;
    });
  } catch (error) {
    console.error('Error cargando trazabilidad:', error);
  }
}

async function cargarPartidas() {
  try {
    console.log('🔼 Cargando partidas de cocina...');
    const response = await fetch(`${API_BASE}/partidas-cocina`);
    const data = await response.json();
    console.log(`✅ Partidas recibidas: ${data.length} registros`);

    const tbody = document.getElementById('partidasTableBody');
    const paginacionDiv = document.getElementById('partidas-paginacion');
    
    // VALIDACIÓN CRÍTICA: verificar que tbody existe
    if (!tbody) {
      console.error('❌ ERROR CRÍTICO: Elemento "partidasTableBody" no encontrado en el DOM');
      console.log('Elementos disponibles en el DOM:');
      console.log('  - Body:', document.body ? '✓' : '✗');
      console.log('  - sections-container:', document.getElementById('sections-container') ? '✓' : '✗');
      console.log('  - produccion:', document.getElementById('produccion') ? '✓' : '✗');
      return;
    }
    
    tbody.innerHTML = '';

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No hay partidas registradas</td></tr>';
      if (paginacionDiv) paginacionDiv.innerHTML = '';
      console.log('⚠️ Sin partidas para mostrar');
      return;
    }

    const partidasPaginadas = paginar(data, 'partidas');
    const idsVisibles = partidasPaginadas.map(p => p.id);
    const seleccionados = estadoApp.paginacion.partidas.seleccionados;

    partidasPaginadas.forEach(partida => {
      const checked = seleccionados.includes(partida.id) ? 'checked' : '';
      const row = tbody.insertRow();
      row.innerHTML = `
        <td><input type="checkbox" id="check-partidas-${partida.id}" ${checked} onchange="toggleSeleccion('partidas', ${partida.id})"></td>
        <td>${partida.id}</td>
        <td><strong>${partida.nombre}</strong></td>
        <td>${partida.responsable || '-'}</td>
        <td>${partida.descripcion || '-'}</td>
        <td><span class="status-badge status-${partida.activo ? 'activo' : 'pausado'}">${partida.activo ? 'ACTIVA' : 'INACTIVA'}</span></td>
        <td>
          <button class="btn-icon" onclick="editarPartida(${partida.id})" title="Editar">✏️</button>
          <button class="btn-icon" onclick="verDetallePartida(${partida.id})" title="Ver detalle">👁️</button>
          <button class="btn-icon" onclick="eliminarPartida(${partida.id})" title="Eliminar">🗑️</button>
        </td>
      `;
    });

    if (paginacionDiv) {
      paginacionDiv.innerHTML = renderizarPaginacion(data.length, 'partidas', 'cargarPartidas');
    }

    actualizarBotonEliminarMasivo('partidas');
  } catch (error) {
    console.error('Error cargando partidas:', error);
    mostrarError('Error al cargar partidas');
  }
}

async function cargarResumenProduccion() {
  try {
    const [traz, partidas] = await Promise.all([
      fetch(`${API_BASE}/trazabilidad`).then(r => r.json()),
      fetch(`${API_BASE}/partidas-cocina`).then(r => r.json())
    ]);

    // Verificar elementos antes de actualizar
    const totalTrazEl = document.getElementById('totalTrazabilidad');
    if (totalTrazEl) {
      totalTrazEl.textContent = traz.length || 0;
    }

    const totalPartidasEl = document.getElementById('totalPartidas');
    if (totalPartidasEl) {
      totalPartidasEl.textContent = partidas.filter(p => p.activo).length || 0;
    }

  } catch (error) {
    console.error('Error cargando resumen:', error);
  }
}

function filtrarTrazabilidad() {
  const searchText = document.getElementById('searchTrazabilidad')?.value.toLowerCase() || '';
  const fecha = document.getElementById('filterFechaTraz')?.value || '';

  const cards = document.querySelectorAll('.production-card');
  cards.forEach(card => {
    const texto = card.textContent.toLowerCase();
    const coincideTexto = texto.includes(searchText);
    const coincideFecha = !fecha || card.textContent.includes(new Date(fecha).toLocaleDateString('es-ES'));
    card.style.display = (coincideTexto && coincideFecha) ? 'block' : 'none';
  });
}

function abrirModalTrazabilidad() {
  const fields = `
    <div class="form-group">
      <label>Código Plato *</label>
      <input type="text" name="codigo_plato" required>
    </div>
    <div class="form-group">
      <label>Lote Producción</label>
      <input type="text" name="lote_produccion">
    </div>
    <div class="form-group">
      <label>Fecha Producción</label>
      <input type="datetime-local" name="fecha_produccion">
    </div>
    <div class="form-group">
      <label>Partida Cocina</label>
      <input type="text" name="partida_cocina">
    </div>
    <div class="form-group">
      <label>Cantidad Producida</label>
      <input type="number" name="cantidad_producida" step="0.1">
    </div>
    <div class="form-group">
      <label>Responsable</label>
      <input type="text" name="responsable">
    </div>
    <div class="form-group">
      <label>Observaciones</label>
      <textarea name="observaciones" rows="3"></textarea>
    </div>
  `;

  abrirModal('Registrar Trazabilidad', fields, guardarTrazabilidad);
}

async function guardarTrazabilidad(formData) {
  try {
    const response = await fetch(`${API_BASE}/trazabilidad`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData))
    });

    if (!response.ok) throw new Error('Error al guardar');

    mostrarExito('Trazabilidad registrada correctamente');
    cerrarModal();
    await cargarProduccion();
  } catch (error) {
    mostrarError('Error al guardar trazabilidad: ' + error.message);
  }
}

async function editarTrazabilidad(id) {
  try {
    const response = await fetch(`${API_BASE}/trazabilidad/${id}`);
    if (!response.ok) throw new Error('Error al cargar trazabilidad');
    const result = await response.json();
    const traz = result.data || result;
    
    // Cargar platos para el select
    const platosResp = await fetch(`${API_BASE}/platos`);
    let platos = platosResp.ok ? await platosResp.json() : [];
    // Asegurar que platos sea un array
    if (!Array.isArray(platos)) platos = [];
    
    const fields = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 22px;">
        <div>
          <label>Fecha Evento *</label>
          <input type="date" name="fecha_evento" value="${traz.fecha_evento ? traz.fecha_evento.split('T')[0] : ''}" required>
        </div>
        <div>
          <label>Cliente *</label>
          <input type="text" name="cliente" value="${traz.cliente || ''}" required>
        </div>
        <div>
          <label>Nº Personas</label>
          <input type="number" name="num_personas" value="${traz.num_personas || ''}" min="1">
        </div>
        <div>
          <label>Plato *</label>
          <select name="plato_id" required>
            ${platos.map(p => `<option value="${p.id}" ${p.id === traz.plato_id ? 'selected' : ''}>${p.nombre}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Cantidad</label>
          <input type="number" name="cantidad" value="${traz.cantidad || ''}" step="0.01" min="0">
        </div>
        <div>
          <label>Unidad</label>
          <select name="unidad">
            <option value="">-- Seleccionar --</option>
            <option value="Ud" ${traz.unidad === 'Ud' ? 'selected' : ''}>Ud</option>
            <option value="Kg" ${traz.unidad === 'Kg' ? 'selected' : ''}>Kg</option>
            <option value="Lt" ${traz.unidad === 'Lt' ? 'selected' : ''}>Lt</option>
          </select>
        </div>
        <div>
          <label>Lote</label>
          <input type="text" name="lote" id="traz_lote" value="${traz.lote || ''}" placeholder="Ej: 20260124-001">
          <small style="display: block; margin-top: 5px; color: #666; font-size: 0.85em;">Auto-generado si se deja vacío</small>
        </div>
        <div>
          <label>Fecha Producción</label>
          <input type="date" name="fecha_produccion" value="${traz.fecha_produccion ? traz.fecha_produccion.split('T')[0] : ''}">
        </div>
        <div>
          <label>Operario</label>
          <input type="text" name="operario" value="${traz.operario || ''}">
        </div>
        <div>
          <label>Temp. Inicial (°C)</label>
          <input type="number" name="temp_inicial" value="${traz.temp_inicial || ''}" step="0.1">
        </div>
        <div>
          <label>Temp. Final (°C)</label>
          <input type="number" name="temp_final" value="${traz.temp_final || ''}" step="0.1">
        </div>
      </div>
      
      <div style="grid-column: 1 / -1;">
        <label>Observaciones</label>
        <textarea name="observaciones" rows="3">${traz.observaciones || ''}</textarea>
      </div>
    `;
    
    abrirModal('Editar Trazabilidad', fields, async (formData) => {
      const datos = Object.fromEntries(formData);
      
      // Generar lote si está vacío
      if (!datos.lote || datos.lote.trim() === '') {
        const hoy = new Date();
        const fecha = hoy.toISOString().split('T')[0].replace(/-/g, '');
        const secuencia = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        datos.lote = `${fecha}-${secuencia}`;
      }
      
      try {
        const resp = await fetch(`${API_BASE}/trazabilidad/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        
        if (!resp.ok) throw new Error('Error al actualizar');
        mostrarExito('Trazabilidad actualizada');
        cerrarModal();
        await cargarTrazabilidad();
      } catch (error) {
        mostrarError('Error al guardar: ' + error.message);
      }
    });
    
    // Generar lote automáticamente si está vacío
    setTimeout(() => {
      const loteField = document.getElementById('traz_lote');
      if (loteField && !loteField.value) {
        const hoy = new Date();
        const fecha = hoy.toISOString().split('T')[0].replace(/-/g, '');
        const secuencia = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        loteField.value = `${fecha}-${secuencia}`;
      }
    }, 100);
  } catch (error) {
    mostrarError('Error al cargar formulario: ' + error.message);
  }
}

async function eliminarTrazabilidad(id) {
  confirmarAccion('¿Eliminar este registro de trazabilidad?', async () => {
    try {
      const response = await fetch(`${API_BASE}/trazabilidad/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      mostrarExito('Registro eliminado');
      await cargarTrazabilidad();
    } catch (error) {
      mostrarError('Error al eliminar: ' + error.message);
    }
  });
}

function abrirModalPartida() {
  const fields = `
    <div class="form-group">
      <label>Nombre *</label>
      <input type="text" name="nombre" required>
    </div>
    <div class="form-group">
      <label>Responsable</label>
      <input type="text" name="responsable">
    </div>
    <div class="form-group">
      <label>Descripción</label>
      <textarea name="descripcion" rows="3"></textarea>
    </div>
  `;

  abrirModal('Nueva Partida de Cocina', fields, guardarPartida);
}

async function guardarPartida(formData) {
  try {
    const response = await fetch(`${API_BASE}/partidas-cocina`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData))
    });

    if (!response.ok) throw new Error('Error al guardar');

    mostrarExito('Partida creada correctamente');
    cerrarModal();
    await cargarPartidas();
  } catch (error) {
    mostrarError('Error al guardar partida: ' + error.message);
  }
}

async function editarPartida(id) {
  try {
    const response = await fetch(`${API_BASE}/partidas-cocina/${id}`);
    if (!response.ok) throw new Error('Error al cargar partida');
    const result = await response.json();
    const partida = result.data || result;
    
    const fields = `
      <div>
        <label>ID</label>
        <input type="text" name="id" value="${partida.id}" readonly style="background-color: #f5f5f5;">
      </div>
      <div>
        <label>Nombre *</label>
        <input type="text" name="nombre" value="${partida.nombre}" required>
      </div>
      <div>
        <label>Tipo de Partida</label>
        <select name="tipo">
          <option value="">-- Seleccionar --</option>
          <option value="Caliente" ${partida.tipo === 'Caliente' ? 'selected' : ''}>Caliente</option>
          <option value="Frío" ${partida.tipo === 'Frío' ? 'selected' : ''}>Frío</option>
          <option value="Pastelería" ${partida.tipo === 'Pastelería' ? 'selected' : ''}>Pastelería</option>
          <option value="Panadería" ${partida.tipo === 'Panadería' ? 'selected' : ''}>Panadería</option>
          <option value="Salsas" ${partida.tipo === 'Salsas' ? 'selected' : ''}>Salsas</option>
          <option value="Guarniciones" ${partida.tipo === 'Guarniciones' ? 'selected' : ''}>Guarniciones</option>
        </select>
      </div>
      <div>
        <label>Descripción</label>
        <textarea name="descripcion" rows="3">${partida.descripcion || ''}</textarea>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" name="activo" id="activo-${id}" ${partida.activo ? 'checked' : ''}>
        <label for="activo-${id}" style="margin: 0; text-transform: none;">Activo</label>
      </div>
    `;
    
    abrirModal('Editar Partida de Cocina', fields, async (formData) => {
      const datos = {
        nombre: formData.get('nombre'),
        descripcion: formData.get('descripcion'),
        activo: formData.has('activo') ? 1 : 0
      };
      
      try {
        const resp = await fetch(`${API_BASE}/partidas-cocina/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        
        if (!resp.ok) throw new Error('Error al actualizar');
        mostrarExito('Partida actualizada');
        cerrarModal();
        await cargarPartidas();
      } catch (error) {
        mostrarError('Error al guardar: ' + error.message);
      }
    });
  } catch (error) {
    mostrarError('Error al cargar formulario: ' + error.message);
  }
}

async function eliminarPartida(id) {
  confirmarAccion('¿Eliminar esta partida?', async () => {
    try {
      const response = await fetch(`${API_BASE}/partidas-cocina/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      mostrarExito('Partida eliminada');
      await cargarPartidas();
    } catch (error) {
      mostrarError('Error al eliminar: ' + error.message);
    }
  });
}
// ==================== INGREDIENTES ====================
async function cargarIngredientes() {
  try {
    const response = await fetch(`${API_BASE}/ingredientes`);
    if (!response.ok) throw new Error('Error al cargar ingredientes');
    
    const json = await response.json();
    // Extraer datos del formato { success, data, error, statusCode }
    const ingredientes = extractAPIData(json) || [];
    estadoApp.ingredientesData = ingredientes; // Guardar en cache
    
    // Poblar filtros dinámicamente
    poblarFiltrosIngredientes(ingredientes);
    
    mostrarIngredientes(ingredientes);
  } catch (error) {
    console.error('Error al cargar ingredientes:', error);
    mostrarError('Error al cargar ingredientes: ' + error.message);
  }
}

function poblarFiltrosIngredientes(ingredientes) {
  // Obtener valores únicos de familia
  const familias = [...new Set(ingredientes
    .filter(i => i.familia)
    .map(i => i.familia)
  )].sort();
  
  // Actualizar select de familia
  const filterFamilia = document.getElementById('filterFamilia');
  if (filterFamilia && familias.length > 0) {
    const valorActual = filterFamilia.value;
    filterFamilia.innerHTML = '<option value="">Todas las familias</option>' +
      familias.map(f => `<option value="${f}" ${f === valorActual ? 'selected' : ''}>${f}</option>`).join('');
  }
}

function mostrarIngredientes(ingredientes) {
  const tbody = document.getElementById('ingredientesTableBody');
  const paginacionDiv = document.getElementById('ingredientes-paginacion');
  
  if (!tbody) return;
  
  if (ingredientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay ingredientes registrados</td></tr>';
    if (paginacionDiv) paginacionDiv.innerHTML = '';
    return;
  }

  const ingredientesPaginados = paginar(ingredientes, 'ingredientes');
  const seleccionados = estadoApp.paginacion.ingredientes.seleccionados;

  tbody.innerHTML = ingredientesPaginados.map(ing => {
    const checked = seleccionados.includes(ing.id) ? 'checked' : '';
    return `
      <tr>
        <td><input type="checkbox" id="check-ingredientes-${ing.id}" ${checked} onchange="toggleSeleccion('ingredientes', ${ing.id})"></td>
        <td>${ing.codigo || ''}</td>
        <td>${ing.nombre || ''}</td>
        <td>${ing.familia || '-'}</td>
        <td>${ing.grupo_conservacion || '-'}</td>
        <td>${ing.proveedor || '-'}</td>
        <td>
          <button class="btn-icon" onclick="editarIngrediente(${ing.id})" title="Editar">✏️</button>
          <button class="btn-icon" onclick="verDetalleIngrediente(${ing.id})" title="Ver detalle">👁️</button>
          <button class="btn-icon" onclick="eliminarIngrediente(${ing.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');

  if (paginacionDiv) {
    paginacionDiv.innerHTML = renderizarPaginacion(ingredientes.length, 'ingredientes', 'cargarIngredientes');
  }

  actualizarBotonEliminarMasivo('ingredientes');
}

function filtrarIngredientes() {
  const searchInput = document.getElementById('searchIngredientes');
  const filterFamilia = document.getElementById('filterFamilia');
  const filterConservacion = document.getElementById('filterConservacion');
  
  if (!searchInput || !filterFamilia || !filterConservacion) return;
  
  const search = normalizarTexto(searchInput.value);
  const familia = filterFamilia.value;
  const conservacion = filterConservacion.value;

  const filtrados = estadoApp.ingredientesData.filter(ing => {
    const matchSearch = !search || 
      (ing.nombre && normalizarTexto(ing.nombre).includes(search)) || 
      (ing.codigo && normalizarTexto(ing.codigo).includes(search)) ||
      (ing.proveedor && normalizarTexto(ing.proveedor).includes(search));
    
    const matchFamilia = !familia || ing.familia === familia;
    const matchConservacion = !conservacion || ing.grupo_conservacion === conservacion;
    
    return matchSearch && matchFamilia && matchConservacion;
  });

  // Resetear a la primera página al filtrar
  estadoApp.paginacion.ingredientes.pagina = 1;
  mostrarIngredientes(filtrados);
}

// Función para detectar alérgenos basándose en palabras clave en el nombre
// ==================== UTILIDADES DE BÚSQUEDA ====================
function normalizarTexto(texto) {
  // Remover tildes/acentos y convertir a minúsculas
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function detectarAlergenos(nombre) {
  const nombreNormalizado = normalizarTexto(nombre);
  const alergenos = {};
  
  // Palabras clave para cada alérgeno (14 oficiales + SEGURAS EN COCINA PROFESIONAL)
  // Ya están en minúsculas y sin tildes
  const palabrasClave = {
    gluten: [
      'harina', 'trigo', 'pan', 'pasta', 'cebada', 'centeno', 'avena', 'semola', 'integral',
      'galleta', 'biscocho', 'empanada', 'fideos', 'espelta', 'kamut', 'biscote', 'pan rallado'
    ],
    cereales: [
      'cereal', 'grano', 'avena', 'cebada', 'trigo', 'centeno', 'maiz', 'arroz', 'mijo'
    ],
    crustaceos: [
      'gamba', 'langostino', 'cangrejo', 'buey de mar', 'crustaceo',
      'cigala', 'centolla', 'necora', 'bogavante', 'camaron', 'camarones'
    ],
    moluscos: [
      'mejillon', 'almeja', 'ostra', 'molusco', 'calamar', 'pulpo',
      'berberecho', 'vieira', 'sepia', 'caracol', 'erizo de mar'
    ],
    pescado: [
      'pescado', 'bacalao', 'merluza', 'salmon', 'atun', 'anchoa', 'boquerón', 'arenque', 'trucha',
      'rodaballo', 'dorada', 'lubina', 'lenguado', 'corvina', 'pez espada', 'jurel', 'sardina', 'caballa',
      'panga', 'pez gato', 'tilapia', 'abadejo', 'rape'
    ],
    cacahuetes: [
      'cacahuete', 'cacahuetes', 'mani', 'mantequilla de cacahuete', 'crema de cacahuete'
    ],
    frutos_secos: [
      'almendra', 'nuez', 'avellana', 'pistacho', 'piñon', 'fruto seco',
      'macadamia', 'anacardo', 'castaña', 'nogal', 'pecana', 'brasil', 'bellota'
    ],
    soja: [
      'soja', 'soya', 'edamame', 'tofu', 'tempeh', 'miso', 'salsa de soja', 'lecitina de soja'
    ],
    lacteos: [
      'leche', 'queso', 'mantequilla', 'nata', 'crema', 'yogur', 'bechamel', 'lacteo', 'suero',
      'mozzarella', 'cheddar', 'parmesano', 'ricota', 'mascarpone', 'requesón', 'kefir', 
      'crema agria', 'leche condensada', 'leche evaporada', 'dulce de leche'
    ],
    ovoproductos: [
      'huevo', 'yema', 'clara', 'mayonesa', 'ovoproducto', 'hueva'
    ],
    apio: [
      'apio', 'apio fresco', 'apio nabo'
    ],
    mostaza: [
      'mostaza', 'grano de mostaza', 'mostaza en polvo', 'mostaza dijon'
    ],
    sesamo: [
      'sesamo', 'ajonjoli', 'tahini', 'semilla de sesamo', 'pasta de sesamo', 'hummus'
    ],
    sulfitos: [
      'vino', 'vinagre', 'sulfito', 'bisulfito', 'dioxide de azufre',
      'vino blanco', 'vino tinto', 'champagne', 'espumoso', 'cava',
      'pasas', 'datiles secos', 'albaricoque seco', 'orejones', 'ciruelas pasas'
    ],
    altramuces: [
      'altramuz', 'altramuces', 'harina de altramuz'
    ],
    mariscos: [
      'gambas', 'langostino', 'mejillon', 'almeja', 'calamar', 'pulpo', 'marisco',
      'erizo', 'gamba reina', 'langostino rey', 'bogavante', 'cangrejo'
    ]
  };
  
  // Detectar cada alérgeno
  Object.keys(palabrasClave).forEach(alergeno => {
    alergenos[alergeno] = palabrasClave[alergeno].some(palabra => 
      nombreNormalizado.includes(palabra)
    );
  });
  
  return alergenos;
}

async function detectarAlergenosAutomatico(nombre, modalInstance) {
  if (!nombre || !modalInstance) return;
  
  const alergenosDetectados = detectarAlergenos(nombre);
  const form = document.querySelector(`form[id*="Nuevo"]`) || document.querySelector('form');
  
  if (!form) return;
  
  // Marcar automáticamente los checkboxes de alérgenos oficiales detectados
  Object.keys(alergenosDetectados).forEach(alergeno => {
    const checkbox = form.querySelector(`input[name="alergenos_${alergeno}"]`);
    if (checkbox && alergenosDetectados[alergeno]) {
      checkbox.checked = true;
      // Agregar efecto visual suave
      checkbox.style.transition = 'all 0.3s ease';
      if (checkbox.parentElement) {
        checkbox.parentElement.style.backgroundColor = '#fff3cd';
        setTimeout(() => {
          checkbox.parentElement.style.backgroundColor = '';
        }, 1500);
      }
      console.log(`✅ Alérgeno oficial ${alergeno} detectado automáticamente en "${nombre}"`);
    }
  });
  
  // Detectar alérgenos personalizados
  try {
    const response = await fetch('/api/alergenos-personalizados');
    if (response.ok) {
      const datos = await response.json();
      const personalizados = datos.data || datos;
      const activos = personalizados.filter(a => a.activo === 1);
      
      const nombreNormalizado = normalizarTexto(nombre);
      
      activos.forEach(alergeno => {
        // Buscar palabras clave del alérgeno personalizado
        const palabrasClave = alergeno.palabras_clave ? alergeno.palabras_clave.split(',').map(p => p.trim().toLowerCase()) : [alergeno.nombre.toLowerCase()];
        
        const detectado = palabrasClave.some(palabra => {
          const palabraNormalizada = normalizarTexto(palabra);
          return nombreNormalizado.includes(palabraNormalizada);
        });
        
        if (detectado) {
          // Convertir nombre a formato de ID
          const nombreId = alergeno.nombre.toLowerCase()
            .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
            .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
          
          const checkbox = form.querySelector(`input[name="alergenos_${nombreId}"]`);
          if (checkbox) {
            checkbox.checked = true;
            if (checkbox.parentElement) {
              checkbox.parentElement.style.backgroundColor = '#e8f5e9';
              setTimeout(() => {
                checkbox.parentElement.style.backgroundColor = '';
              }, 1500);
            }
            console.log(`✅ Alérgeno personalizado "${alergeno.nombre}" detectado automáticamente en "${nombre}"`);
          }
        }
      });
    }
  } catch (error) {
    console.error('Error al detectar alérgenos personalizados:', error);
  }
}

async function buscarDuplicadosIngrediente(nombre, modalInstance) {
  if (!nombre || nombre.trim().length < 2) {
    const advertencia = document.getElementById('duplicado-warning');
    if (advertencia) advertencia.remove();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/ingredientes`);
    const ingredientes = await response.ok ? await response.json() : [];
    
    if (!Array.isArray(ingredientes)) return;
    
    const nombreNormalizado = normalizarTexto(nombre);
    
    // Buscar coincidencias exactas o muy similares (sin tildes)
    const duplicados = ingredientes.filter(ing => 
      ing.nombre && normalizarTexto(ing.nombre).includes(nombreNormalizado)
    );
    
    const form = document.querySelector('form');
    if (!form) return;
    
    const advertenciaAnterior = document.getElementById('duplicado-warning');
    if (advertenciaAnterior) advertenciaAnterior.remove();
    
    if (duplicados.length > 0) {
      const advertencia = document.createElement('div');
      advertencia.id = 'duplicado-warning';
      advertencia.style.cssText = `
        background-color: #fff3cd;
        border: 2px solid #ffc107;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 15px;
        color: #856404;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
      `;
      
      const duplicadosTexto = duplicados.slice(0, 3).map(d => `"${d.nombre}"`).join(', ');
      const masTexto = duplicados.length > 3 ? ` +${duplicados.length - 3} más` : '';
      
      advertencia.innerHTML = `
        <span style="font-size: 1.2em;">⚠️</span>
        <span><strong>¡Ingrediente similar encontrado!</strong> Ya existen: ${duplicadosTexto}${masTexto}</span>
      `;
      
      form.insertBefore(advertencia, form.firstChild);
      console.log(`⚠️ Posibles duplicados encontrados: ${duplicados.map(d => d.nombre).join(', ')}`);
    }
  } catch (error) {
    console.error('Error al buscar duplicados:', error);
  }
}

async function buscarDuplicadosPlato(nombre, modalInstance) {
  if (!nombre || nombre.trim().length < 2) {
    const advertencia = document.getElementById('duplicado-warning-plato');
    if (advertencia) advertencia.remove();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/platos`);
    const platos = await response.ok ? await response.json() : [];
    
    if (!Array.isArray(platos)) return;
    
    const nombreNormalizado = normalizarTexto(nombre);
    const duplicados = platos.filter(p => 
      p.nombre && normalizarTexto(p.nombre).includes(nombreNormalizado)
    );
    
    const form = document.querySelector('form');
    if (!form) return;
    
    const advertenciaAnterior = document.getElementById('duplicado-warning-plato');
    if (advertenciaAnterior) advertenciaAnterior.remove();
    
    if (duplicados.length > 0) {
      const advertencia = document.createElement('div');
      advertencia.id = 'duplicado-warning-plato';
      advertencia.style.cssText = `
        background-color: #fff3cd;
        border: 2px solid #ffc107;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 15px;
        color: #856404;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
      `;
      
      const duplicadosTexto = duplicados.slice(0, 3).map(d => `"${d.nombre}"`).join(', ');
      const masTexto = duplicados.length > 3 ? ` +${duplicados.length - 3} más` : '';
      
      advertencia.innerHTML = `
        <span style="font-size: 1.2em;">⚠️</span>
        <span><strong>¡Plato similar encontrado!</strong> Ya existen: ${duplicadosTexto}${masTexto}</span>
      `;
      
      form.insertBefore(advertencia, form.firstChild);
      console.log(`⚠️ Platos similares encontrados: ${duplicados.map(d => d.nombre).join(', ')}`);
    }
  } catch (error) {
    console.error('Error al buscar duplicados de platos:', error);
  }
}

async function buscarDuplicadosInventario(ingredienteId, modalInstance) {
  if (!ingredienteId) {
    const advertencia = document.getElementById('duplicado-warning-inv');
    if (advertencia) advertencia.remove();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/inventario`);
    const inventarios = await response.ok ? await response.json() : [];
    
    if (!Array.isArray(inventarios)) return;
    
    // Buscar por ingrediente_id
    const duplicados = inventarios.filter(inv => 
      inv.ingrediente_id && inv.ingrediente_id == ingredienteId
    );
    
    const form = document.querySelector('form');
    if (!form) return;
    
    const advertenciaAnterior = document.getElementById('duplicado-warning-inv');
    if (advertenciaAnterior) advertenciaAnterior.remove();
    
    if (duplicados.length > 0) {
      const advertencia = document.createElement('div');
      advertencia.id = 'duplicado-warning-inv';
      advertencia.style.cssText = `
        background-color: #fff3cd;
        border: 2px solid #ffc107;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 15px;
        color: #856404;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
      `;
      
      const ubicaciones = duplicados.slice(0, 2).map(d => `${d.ubicacion || 'Sin ubicación'}`).join(', ');
      const masTexto = duplicados.length > 2 ? ` +${duplicados.length - 2} más` : '';
      
      advertencia.innerHTML = `
        <span style="font-size: 1.2em;">📦</span>
        <span><strong>¡Ingrediente ya en inventario!</strong> Ubicaciones: ${ubicaciones}${masTexto}</span>
      `;
      
      form.insertBefore(advertencia, form.firstChild);
      console.log(`📦 Este ingrediente ya existe en ${duplicados.length} ubicación(es)`);
    }
  } catch (error) {
    console.error('Error al buscar duplicados de inventario:', error);
  }
}

async function editarIngrediente(id) {
  try {
    console.log(`📝 Abriendo modal de edición para ingrediente ID: ${id}`);
    
    const response = await fetch(`${API_BASE}/ingredientes/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const result = await response.json();
    const ing = result.data || result;
    
    console.log('✅ Datos cargados:', ing);
    
    if (!ing || !ing.id) {
      throw new Error('No se pudieron cargar los datos del ingrediente');
    }
    
    // Obtener valores únicos para autocompletar
    const todosIngredientes = await fetch(`${API_BASE}/ingredientes`).then(r => r.json()).then(d => extractAPIData(d) || []);
    const familias = [...new Set(todosIngredientes.filter(i => i.familia).map(i => i.familia))].sort();
    const partidas = [...new Set(todosIngredientes.filter(i => i.partidas_almacen).map(i => i.partidas_almacen))].sort();
    const gruposConservacion = ['Congelado', 'Fresco', 'Neutro', 'Refrigerado', 'Seco'];
    const unidadesEconomato = ['Ud', 'Kg', 'Lt', 'Gramo', 'Litro', 'Caja'];
    const unidadesEscandallo = ['Ud', 'Kg', 'Lt', 'Gramo', 'Litro'];
    
    // Cargar sección de alérgenos personalizados primero
    const seccionAlergenosPersonalizados = await agregarSeccionAlergenosPersonalizados(id, 'ingrediente');
    
    const fields = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 22px;">
        <div>
          <label>Código</label>
          <input type="text" name="codigo" value="${ing.codigo}" required readonly style="background-color: #f5f5f5;">
        </div>
        <div>
          <label>Nombre *</label>
          <input type="text" name="nombre" value="${ing.nombre}" required>
        </div>
        <div>
          <label>Familia</label>
          <input type="text" name="familia" value="${ing.familia || ''}" list="familias-list" autocomplete="off">
          <datalist id="familias-list">
            ${familias.map(f => `<option value="${f}">`).join('')}
          </datalist>
        </div>
        <div>
          <label>Partida Almacén</label>
          <input type="text" name="partidas_almacen" value="${ing.partidas_almacen || ''}" list="partidas-list" autocomplete="off">
          <datalist id="partidas-list">
            ${partidas.map(p => `<option value="${p}">`).join('')}
          </datalist>
        </div>
        <div>
          <label>Grupo Conservación</label>
          <input type="text" name="grupo_conservacion" value="${ing.grupo_conservacion || ''}" list="grupos-conservacion-list" autocomplete="off">
          <datalist id="grupos-conservacion-list">
            ${gruposConservacion.map(g => `<option value="${g}">`).join('')}
          </datalist>
        </div>
        <div>
          <label>Unidad Economato</label>
          <input type="text" name="unidad_economato" value="${ing.unidad_economato || ''}" list="unidades-economato-list" autocomplete="off">
          <datalist id="unidades-economato-list">
            ${unidadesEconomato.map(u => `<option value="${u}">`).join('')}
          </datalist>
        </div>
        <div>
          <label>Unidad Escandallo</label>
          <input type="text" name="unidad_escandallo" value="${ing.unidad_escandallo || ''}" list="unidades-escandallo-list" autocomplete="off">
          <datalist id="unidades-escandallo-list">
            ${unidadesEscandallo.map(u => `<option value="${u}">`).join('')}
          </datalist>
        </div>
        <div>
          <label>Coste Unidad (€)</label>
          <input type="number" name="coste_unidad" value="${ing.coste_unidad ? Number(ing.coste_unidad).toFixed(3) : ''}" step="0.001" min="0">
        </div>
        <div>
          <label>Coste Kilo (€/kg)</label>
          <input type="number" name="coste_kilo" value="${ing.coste_kilo ? Number(ing.coste_kilo).toFixed(3) : ''}" step="0.001" min="0">
        </div>
        <div>
          <label>Peso Neto Envase (kg)</label>
          <input type="number" name="peso_neto_envase" value="${ing.peso_neto_envase ? Number(ing.peso_neto_envase).toFixed(3) : ''}" step="0.001" min="0">
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" name="activo" id="activo-ing-${id}" ${ing.activo ? 'checked' : ''}>
          <label for="activo-ing-${id}" style="margin: 0; text-transform: none;">Activo</label>
        </div>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <h3 style="margin: 0 0 20px 0; color: var(--dark-gray); font-size: 1.1em;">⚠️ Alérgenos (14 Oficiales)</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="gluten" ${ing.gluten ? 'checked' : ''}> Gluten
          </label>
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="crustaceos" ${ing.crustaceos ? 'checked' : ''}> Crustáceos
          </label>
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="moluscos" ${ing.moluscos ? 'checked' : ''}> Moluscos
          </label>
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="pescado" ${ing.pescado ? 'checked' : ''}> Pescado
          </label>
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="cacahuetes" ${ing.cacahuetes ? 'checked' : ''}> Cacahuetes
          </label>
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="frutos_secos" ${ing.frutos_secos ? 'checked' : ''}> Frutos secos
          </label>
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="soja" ${ing.soja ? 'checked' : ''}> Soja
          </label>
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="lacteos" ${ing.lacteos ? 'checked' : ''}> Lácteos
          </label>
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="ovoproductos" ${ing.ovoproductos ? 'checked' : ''}> Huevo
          </label>
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="apio" ${ing.apio ? 'checked' : ''}> Apio
          </label>
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="mostaza" ${ing.mostaza ? 'checked' : ''}> Mostaza
          </label>
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="sesamo" ${ing.sesamo ? 'checked' : ''}> Sésamo
          </label>
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="sulfitos" ${ing.sulfitos ? 'checked' : ''}> Sulfitos
          </label>
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="altramuces" ${ing.altramuces ? 'checked' : ''}> Altramuces
          </label>
        </div>
      </div>
      ${seccionAlergenosPersonalizados}
    `;
    
    abrirModal('Editar Ingrediente', fields, async (formData) => {
      const datos = Object.fromEntries(formData);
      
      // Convertir checkboxes de alérgenos (solo los que existen en la BD)
      const alergenos = ['gluten', 'crustaceos', 'moluscos', 'pescado', 'cacahuetes', 'frutos_secos', 'soja', 'lacteos', 'ovoproductos', 'apio', 'mostaza', 'sesamo', 'sulfitos', 'altramuces'];
      alergenos.forEach(alergeno => {
        datos[alergeno] = formData.has(alergeno) ? 1 : 0;
      });
      datos.activo = formData.has('activo') ? 1 : 0;
      
      try {
        const resp = await fetch(`${API_BASE}/ingredientes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        
        if (!resp.ok) throw new Error('Error al actualizar');
        
        // Guardar alérgenos personalizados
        await guardarAlergenosPersonalizados(id, formData, 'ingrediente');
        
        mostrarExito('Ingrediente actualizado');
        cerrarModal();
        await cargarIngredientes();
      } catch (error) {
        mostrarError('Error al guardar: ' + error.message);
      }
    });
    
    // Agregar listener para autodetección de alérgenos
    setTimeout(() => {
      const nombreInput = document.querySelector('input[name="nombre"]');
      if (nombreInput) {
        nombreInput.addEventListener('blur', () => {
          const alergenosDetectados = detectarAlergenos(nombreInput.value);
          
          // Sugerir alérgenos solo si no están ya marcados
          Object.keys(alergenosDetectados).forEach(alergeno => {
            const checkbox = document.querySelector(`input[name="${alergeno}"]`);
            if (checkbox && !checkbox.checked && alergenosDetectados[alergeno]) {
              // Marcar con una animación suave
              checkbox.style.transition = 'all 0.3s ease';
              checkbox.checked = true;
              checkbox.parentElement.style.backgroundColor = '#fff3cd';
              setTimeout(() => {
                checkbox.parentElement.style.backgroundColor = '';
              }, 1500);
            }
          });
        });
      }
    }, 100);
  } catch (error) {
    mostrarError('Error al cargar formulario: ' + error.message);
  }
}

async function eliminarIngrediente(id) {
  confirmarAccion('¿Eliminar este ingrediente?', async () => {
    try {
      const response = await fetch(`${API_BASE}/ingredientes/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      mostrarExito('Ingrediente eliminado');
      await cargarIngredientes();
    } catch (error) {
      mostrarError('Error al eliminar: ' + error.message);
    }
  });
}

// ==================== ESCANDALLOS ====================
async function cargarEscandallos() {
  try {
    const response = await fetch(`${API_BASE}/escandallos`);
    if (!response.ok) throw new Error('Error al cargar escandallos');
    
    const escandallosTodos = extractAPIData(await response.json()) || [];
    
    // Filtrar solo escandallos con nombres amigables y entendibles
    const escandallos = (escandallosTodos || []).filter(esc => {
      // Solo mostrar si tiene nombre de plato Y nombre de ingrediente
      return esc.plato_nombre && esc.ingrediente_nombre;
    });
    
    estadoApp.escandallosData = escandallos;
    
    // Log para debug
    if (escandallos.length > 0) {
      console.log('🔍 Total de escandallos cargados:', escandallos.length);
      console.log('🔍 Ejemplo de escandallo:', escandallos[0]);
    }
    
    // Usar la función mostrarEscandallos para renderizar con agrupación
    mostrarEscandallos(escandallos);

    actualizarBotonEliminarMasivo('escandallos');
  } catch (error) {
    console.error('Error al cargar escandallos:', error);
    mostrarError('Error al cargar escandallos: ' + error.message);
  }
}

function filtrarEscandallos() {
  const searchTerm = normalizarTexto(document.getElementById('searchEscandallos')?.value || '');
  
  if (!estadoApp.escandallosData) {
    return;
  }
  
  const filtrados = estadoApp.escandallosData.filter(esc => {
    const platoNombre = normalizarTexto(esc.plato_nombre || '');
    const platoCodigo = normalizarTexto(esc.plato_codigo || '');
    const ingredienteNombre = normalizarTexto(esc.ingrediente_nombre || '');
    
    return platoNombre.includes(searchTerm) || 
           platoCodigo.includes(searchTerm) ||
           ingredienteNombre.includes(searchTerm);
  });
  
  // Reiniciar paginación al filtrar
  if (estadoApp.paginacion && estadoApp.paginacion.escandallos) {
    estadoApp.paginacion.escandallos.pagina = 1;
  }
  
  mostrarEscandallos(filtrados);
}

function mostrarEscandallos(escandallos) {
  const tbody = document.getElementById('escandallosTableBody');
  const paginacionDiv = document.getElementById('escandallos-paginacion');
  
  if (!tbody) return;
  
  if (escandallos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay escandallos con información completa que coincidan</td></tr>';
    if (paginacionDiv) paginacionDiv.innerHTML = '';
    return;
  }

  // PRIMERO: Agrupar escandallos por plato_id para evitar repetición
  const escandalloPorPlato = {};
  escandallos.forEach(esc => {
    if (!escandalloPorPlato[esc.plato_id]) {
      escandalloPorPlato[esc.plato_id] = {
        id: esc.id,
        plato_id: esc.plato_id,
        plato_nombre: esc.plato_nombre || esc.plato_codigo || `Plato #${esc.plato_id}`,
        cantidad_total: 0,
        unidad: esc.unidad || '-',
        coste_total: 0,
        ingredientes: []
      };
    }
    escandalloPorPlato[esc.plato_id].cantidad_total += parseFloat(esc.cantidad) || 0;
    // Usar coste_calculado si existe, sino usar coste
    const coste = parseFloat(esc.coste_calculado) || parseFloat(esc.coste) || 0;
    escandalloPorPlato[esc.plato_id].coste_total += coste;
    escandalloPorPlato[esc.plato_id].ingredientes.push(esc.ingrediente_nombre || `Ingrediente #${esc.ingrediente_id}`);
  });

  // LUEGO: Paginar los platos agrupados (no los escandallos individuales)
  const platosAgrupados = Object.values(escandalloPorPlato);
  const platosAgrupadosPaginados = paginar(platosAgrupados, 'escandallos');
  const seleccionados = estadoApp.paginacion.escandallos.seleccionados;

  tbody.innerHTML = Object.values(platosAgrupadosPaginados).map((resumen, idx) => {
    const checked = seleccionados.includes(resumen.id) ? 'checked' : '';
    const ingredientesText = resumen.ingredientes.slice(0, 2).join(', ') + (resumen.ingredientes.length > 2 ? ` +${resumen.ingredientes.length - 2}` : '');
    
    return `
      <tr>
        <td>
          <input type="checkbox" id="check-escandallos-${resumen.id}" ${checked} onchange="toggleSeleccion('escandallos', ${resumen.id})">
        </td>
        <td>${resumen.id}</td>
        <td title="${resumen.plato_nombre}"><strong>${resumen.plato_nombre}</strong></td>
        <td>${resumen.cantidad_total.toFixed(3)}</td>
        <td>${resumen.unidad}</td>
        <td>${formatDecimal(resumen.coste_total)}€</td>
        <td>
          <button class="btn-icon" onclick="editarEscandallo(${resumen.id})" title="Editar">✏️</button>
          <button class="btn-icon" onclick="verDetalleEscandallo(${resumen.id})" title="Ver detalle - ${ingredientesText}">👁️</button>
          <button class="btn-icon" onclick="eliminarEscandallo(${resumen.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');

  if (paginacionDiv) {
    paginacionDiv.innerHTML = renderizarPaginacion(platosAgrupados.length, 'escandallos', 'cargarEscandallos');
  }

  actualizarBotonEliminarMasivo('escandallos');
}

async function editarEscandallo(id) {
  try {
    console.log(`📝 Abriendo modal de edición para escandallo ID: ${id}`);
    
    // Cargar el escandallo actual
    const response = await fetch(`${API_BASE}/escandallos/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: Error al cargar escandallo`);
    const result = await response.json();
    const escandallo = result.data || result;
    
    console.log('✅ Escandallo cargado:', escandallo);
    
    if (!escandallo || !escandallo.id) {
      throw new Error('No se pudieron cargar los datos del escandallo');
    }
    
    // Cargar datos del plato
    const platoResponse = await fetch(`${API_BASE}/platos/${escandallo.plato_id}`);
    if (!platoResponse.ok) {
      console.error('⚠️ No se pudo cargar información del plato');
    }
    const platoResult = platoResponse.ok ? await platoResponse.json() : {};
    const plato = platoResult.data || platoResult;
    
    // Cargar SOLO los escandallos del plato usando el endpoint correcto con codigo de plato
    const escandallosResponse = await fetch(`${API_BASE}/escandallos/plato/${plato.codigo}`);
    if (!escandallosResponse.ok) {
      console.error('⚠️ No se pudieron cargar los escandallos del plato');
    }
    const escandallosResult = escandallosResponse.ok ? await escandallosResponse.json() : { data: [] };
    const escandallos = extractAPIData(escandallosResult) || [];
    
    console.log(`✅ Escandallos del plato ${plato.codigo} (${plato.nombre}):`, escandallos.length, 'ingredientes');
    
    console.log('✅ Datos adicionales cargados:', { plato: plato.nombre || plato.codigo, escandallos: escandallos.length });
    
    // Abrir el modal dinámico con modo edición
    abrirModalDinamico('escandallo', {
      modo: 'editar',
      escandalloId: id,
      plato: plato,
      escandallos: escandallos,
      escandallo: escandallo
    });
  } catch (error) {
    console.error('❌ Error al editar escandallo:', error);
    mostrarError('Error al cargar escandallo: ' + error.message);
  }
}

async function eliminarEscandallo(id) {
  confirmarAccion('¿Eliminar este escandallo?', async () => {
    try {
      const response = await fetch(`${API_BASE}/escandallos/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      mostrarExito('Escandallo eliminado');
      await cargarEscandallos();
    } catch (error) {
      mostrarError('Error al eliminar: ' + error.message);
    }
  });
}

// ==================== INVENTARIO ====================
async function cargarInventario() {
  try {
    const response = await fetch(`${API_BASE}/inventario`);
    if (!response.ok) throw new Error('Error al cargar inventario');
    
    const inventario = extractAPIData(await response.json()) || [];
    estadoApp.inventarioData = inventario; // Guardar en cache
    
    // Poblar filtros dinámicamente
    poblarFiltrosInventario(inventario);
    
    mostrarInventario(inventario);
  } catch (error) {
    console.error('Error al cargar inventario:', error);
    mostrarError('Error al cargar inventario: ' + error.message);
  }
}

function poblarFiltrosInventario(inventario) {
  // Obtener valores únicos de grupo de conservación
  const grupos = [...new Set(inventario
    .filter(i => i.grupo_conservacion)
    .map(i => i.grupo_conservacion)
  )].sort();
  
  // Actualizar select de grupo de conservación solo si hay datos
  const filterGrupo = document.getElementById('filterGrupoConservacion');
  if (filterGrupo && grupos.length > 0) {
    const valorActual = filterGrupo.value;
    const opciones = grupos.map(g => 
      `<option value="${g}" ${g === valorActual ? 'selected' : ''}>${g}</option>`
    ).join('');
    
    // Solo actualizar si hay grupos diferentes a los por defecto
    if (opciones) {
      filterGrupo.innerHTML = '<option value="">Todos los grupos</option>' + opciones;
    }
  }
}

function mostrarInventario(inventario) {
  const tbody = document.getElementById('inventarioTableBody');
  const paginacionDiv = document.getElementById('inventario-paginacion');
  
  if (!tbody) return;
  
  if (inventario.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">No hay registros de inventario</td></tr>';
    if (paginacionDiv) paginacionDiv.innerHTML = '';
    return;
  }

  const inventarioPaginado = paginar(inventario, 'inventario');
  const seleccionados = estadoApp.paginacion.inventario.seleccionados;

  tbody.innerHTML = inventarioPaginado.map(inv => {
    const stockActual = inv.cantidad || 0;
    const articulo = inv.nombre || inv.ingrediente_nombre || inv.articulo || `ID: ${inv.articulo_id || inv.ingrediente_id}`;
    const codigo = inv.codigo || inv.ingrediente_codigo || inv.codigo_interno || '-';
    const checked = seleccionados.includes(inv.id) ? 'checked' : '';
    
    const costeKilo = inv.coste_kilo || 0;
    const valorStock = stockActual * costeKilo;
    
    // Determinar estado del stock
    const stockMinimo = inv.stock_minimo || 0;
    let estadoStock = '';
    if (stockActual <= stockMinimo && stockMinimo > 0) {
      estadoStock = '<span class="stock-bajo">⚠️ Bajo</span>';
    } else {
      estadoStock = '<span class="stock-normal">✅ Normal</span>';
    }
    
    return `
      <tr>
        <td><input type="checkbox" id="check-inventario-${inv.id}" ${checked} onchange="toggleSeleccion('inventario', ${inv.id})"></td>
        <td>${codigo}</td>
        <td title="${articulo}">${articulo}</td>
        <td>${inv.grupo_conservacion || '-'}</td>
        <td>${inv.familia || '-'}</td>
        <td><strong>${formatDecimal(stockActual)}</strong></td>
        <td>${formatDecimal(costeKilo)}€/kg</td>
        <td>${formatDecimal(valorStock)}€</td>
        <td>${estadoStock}</td>
        <td>
          <button class="btn-icon" onclick="editarInventario(${inv.id})" title="Editar">✏️</button>
          <button class="btn-icon" onclick="verDetalleInventario(${inv.id})" title="Ver detalle">👁️</button>
          <button class="btn-icon" onclick="eliminarInventario(${inv.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');

  if (paginacionDiv) {
    paginacionDiv.innerHTML = renderizarPaginacion(inventario.length, 'inventario', 'cargarInventario');
  }

  actualizarBotonEliminarMasivo('inventario');
}

function filtrarInventario() {
  const searchInput = document.getElementById('searchInventario');
  const filterGrupoConservacion = document.getElementById('filterGrupoConservacion');
  const filterStockBajo = document.getElementById('filterStockBajo');
  
  if (!searchInput || !filterGrupoConservacion || !filterStockBajo) return;
  
  const search = normalizarTexto(searchInput.value);
  const grupoConservacion = filterGrupoConservacion.value;
  const stockBajo = filterStockBajo.value;

  const filtrados = estadoApp.inventarioData.filter(inv => {
    const articulo = inv.nombre || inv.ingrediente_nombre || inv.articulo || '';
    const codigo = inv.codigo || inv.ingrediente_codigo || inv.codigo_interno || '';
    
    const matchSearch = !search || 
      normalizarTexto(articulo).includes(search) || 
      normalizarTexto(codigo).includes(search);
    
    const matchGrupo = !grupoConservacion || inv.grupo_conservacion === grupoConservacion;
    
    let matchStock = true;
    if (stockBajo === 'bajo') {
      const stockMinimo = inv.stock_minimo || 0;
      matchStock = (inv.cantidad || 0) <= stockMinimo && stockMinimo > 0;
    } else if (stockBajo === 'normal') {
      const stockMinimo = inv.stock_minimo || 0;
      matchStock = (inv.cantidad || 0) > stockMinimo || stockMinimo === 0;
    }
    
    return matchSearch && matchGrupo && matchStock;
  });

  // Resetear a la primera página al filtrar
  estadoApp.paginacion.inventario.pagina = 1;
  mostrarInventario(filtrados);
}

async function editarInventario(id) {
  try {
    console.log(`📝 Abriendo modal de edición para inventario ID: ${id}`);
    
    const response = await fetch(`${API_BASE}/inventario/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const result = await response.json();
    const inv = result.data || result;
    
    console.log('✅ Datos cargados:', inv);
    
    if (!inv || !inv.id) {
      throw new Error('No se pudieron cargar los datos del inventario');
    }
    
    // Cargar ingredientes
    const ingsResp = await fetch(`${API_BASE}/ingredientes`);
    let ingredientes = ingsResp.ok ? await ingsResp.json() : [];
    // Asegurar que sea un array
    if (!Array.isArray(ingredientes)) ingredientes = [];
    
    // Opciones de ubicación basadas en el Excel
    const ubicaciones = ['Economato', 'Bodega', 'Carnicería', 'Pescaderías', 'Verduras', 'Frutas', 
                         'Cuarto frio', 'Panaderia', 'Pastelería', 'Caliente', 'Guarniciones', 
                         'Salsas', 'Aperitivos', 'Desayuno', 'OFFICE', 'Precocinado', 
                         'Verduras Cong', 'Frutas Cong', 'Desechable', 'Envases'];
    
    // Opciones de unidades basadas en el Excel
    const unidades = ['Ud', 'Kg', 'Lt'];
    
    const fields = `
      <div>
        <label>Ingrediente *</label>
        <select name="ingrediente_id" id="edit_ingrediente_id" required onchange="autoFillEditInventario(this.value)">
          ${ingredientes.map(i => `<option value="${i.id}" ${i.id === inv.ingrediente_id ? 'selected' : ''}>${i.codigo} - ${i.nombre}</option>`).join('')}
        </select>
      </div>
      
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 22px;">
        <div>
          <label>Cantidad *</label>
          <input type="number" name="cantidad" value="${inv.cantidad ? Number(inv.cantidad).toFixed(3) : ''}" step="0.001" min="0" required>
        </div>
        <div>
          <label>Unidad Economato</label>
          <input type="text" name="unidad_economato" id="edit_unidad_economato" value="${inv.unidad || ''}" list="unidades-economato-inv-list" autocomplete="off">
          <datalist id="unidades-economato-inv-list">
            ${unidades.map(u => `<option value="${u}">`).join('')}
          </datalist>
        </div>
      </div>
      
      <div>
        <label>Unidad Escandallo</label>
        <input type="text" name="unidad_escandallo" id="edit_unidad_escandallo" list="unidades-escandallo-inv-list" autocomplete="off">
        <datalist id="unidades-escandallo-inv-list">
          ${unidades.map(u => `<option value="${u}">`).join('')}
        </datalist>
      </div>
      
      <div>
        <label>Lote</label>
        <input type="text" name="lote" id="edit_lote" value="${inv.lote || ''}" placeholder="Ej: 20260124-001">
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 22px;">
        <div>
          <label>Fecha Registro *</label>
          <input type="date" name="fecha_registro" value="${inv.fecha_registro ? inv.fecha_registro.split('T')[0] : new Date().toISOString().split('T')[0]}" required>
        </div>
        <div>
          <label>Fecha Caducidad</label>
          <input type="date" name="fecha_caducidad" value="${inv.fecha_caducidad ? inv.fecha_caducidad.split('T')[0] : ''}">
        </div>
      </div>
      
      <div>
        <label>Ubicación (Partida/Almacén)</label>
        <input type="text" name="ubicacion" id="edit_ubicacion" value="${inv.ubicacion || ''}" list="ubicaciones-inv-list" autocomplete="off">
        <datalist id="ubicaciones-inv-list">
          ${ubicaciones.map(loc => `<option value="${loc}">`).join('')}
        </datalist>
      </div>
    `;
    
    abrirModal('Editar Inventario', fields, async (formData) => {
      const datos = Object.fromEntries(formData);
      
      try {
        const resp = await fetch(`${API_BASE}/inventario/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        
        if (!resp.ok) throw new Error('Error al actualizar');
        mostrarExito('Inventario actualizado');
        cerrarModal();
        await cargarInventario();
      } catch (error) {
        mostrarError('Error al guardar: ' + error.message);
      }
    });
  } catch (error) {
    mostrarError('Error al cargar formulario: ' + error.message);
  }
}

async function verDetalleInventario(id) {
  try {
    const response = await fetch(`${API_BASE}/inventario/${id}`);
    if (!response.ok) throw new Error('Error al cargar inventario');
    const inv = await response.json();
    
    const html = `
        <h2 id="modalTitle" style="margin: 0; color: white; font-size: 1.7em; background: linear-gradient(135deg, #1a3a52 0%, #2c5f8d 100%); padding: 25px 30px; font-weight: 600; border-radius: 1px 1px 0 0;">
          📦 Detalle de Inventario
        </h2>
        <div style="padding: 35px 30px;">
          <div style="background: linear-gradient(135deg, #2c5f8d 0%, #3d7ea6 100%); padding: 25px; border-radius: 1px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(44, 95, 141, 0.3);">
            <h3 style="margin: 0 0 15px 0; color: white; font-size: 1.2em;">🥘 Ingrediente</h3>
            <div style="color: white; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 1px;">
              <div style="margin-bottom: 10px;"><strong>Código:</strong> ${inv.ingrediente_codigo || '-'}</div>
              <div style="font-size: 1.2em; font-weight: 600;">${inv.ingrediente_nombre || '-'}</div>
              ${inv.ingrediente_familia ? `<div style="margin-top: 10px; font-size: 0.9em; opacity: 0.9;">Familia: ${inv.ingrediente_familia}</div>` : ''}
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
            <div style="background: linear-gradient(135deg, #3d7ea6 0%, #5a92b8 100%); padding: 20px; border-radius: 1px; box-shadow: 0 4px 12px rgba(61, 126, 166, 0.3);">
              <h4 style="margin: 0 0 15px 0; color: white; font-size: 1em;">📊 Stock</h4>
              <div style="color: white;">
                <div style="font-size: 2em; font-weight: 700; margin-bottom: 5px;">${inv.cantidad !== null ? inv.cantidad : '-'}</div>
                <div style="font-size: 1.1em; opacity: 0.9;">${inv.unidad || 'unidades'}</div>
                ${inv.lote ? `<div style="margin-top: 10px; font-size: 0.9em;">Lote: <strong>${inv.lote}</strong></div>` : ''}
              </div>
            </div>
            <div style="background: linear-gradient(135deg, #4a6f8a 0%, #5a92b8 100%); padding: 20px; border-radius: 1px; box-shadow: 0 4px 12px rgba(74, 111, 138, 0.3);">
              <h4 style="margin: 0 0 15px 0; color: white; font-size: 1em;">📅 Fechas</h4>
              <div style="color: white;">
                <div style="margin-bottom: 10px;"><strong>Registro:</strong><br>${inv.fecha ? new Date(inv.fecha).toLocaleDateString('es-ES') : '-'}</div>
                ${inv.fecha_caducidad ? `<div><strong>Caducidad:</strong><br>${new Date(inv.fecha_caducidad).toLocaleDateString('es-ES')}</div>` : ''}
              </div>
            </div>
          </div>
          
          ${inv.ubicacion ? `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 1px; border-left: 4px solid #2c5f8d; margin-bottom: 25px;">
              <h4 style="margin: 0 0 10px 0; color: var(--dark-gray); font-size: 1em;">📍 Ubicación</h4>
              <p style="margin: 0; color: #555; font-size: 1.1em;">${inv.ubicacion}</p>
            </div>
          ` : ''}
        </div>
    `;
    
    mostrarModal(html);
  } catch (error) {
    mostrarError('Error al cargar detalle: ' + error.message);
  }
}

async function eliminarInventario(id) {
  if (confirm('¿Eliminar este registro de inventario?')) {
    try {
      const response = await fetch(`${API_BASE}/inventario/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      mostrarExito('Registro de inventario eliminado');
      await cargarInventario();
    } catch (error) {
      mostrarError('Error al eliminar: ' + error.message);
    }
  }
}

async function verDetalleIngrediente(id) {
  try {
    const response = await fetch(`${API_BASE}/ingredientes/${id}`);
    if (!response.ok) throw new Error('Error al cargar ingrediente');
    const ing = await response.json();
    
    const alergenos = [];
    if (ing.sesamo) alergenos.push('Sésamo');
    if (ing.pescado) alergenos.push('Pescado');
    if (ing.mariscos) alergenos.push('Mariscos');
    if (ing.apio) alergenos.push('Apio');
    if (ing.frutos_secos) alergenos.push('Frutos secos');
    if (ing.sulfitos) alergenos.push('Sulfitos');
    if (ing.lacteos) alergenos.push('Lácteos');
    if (ing.altramuces) alergenos.push('Altramuces');
    if (ing.gluten) alergenos.push('Gluten');
    if (ing.ovoproductos) alergenos.push('Huevo');
    
    const html = `
        <h2 id="modalTitle" style="margin: 0; color: white; font-size: 1.7em; background: linear-gradient(135deg, #1a3a52 0%, #2c5f8d 100%); padding: 25px 30px; font-weight: 600; border-radius: 1px 1px 0 0;">
          🥘 ${ing.nombre}
        </h2>
        <div style="padding: 35px 30px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
            <div style="background: linear-gradient(135deg, #2c5f8d 0%, #3d7ea6 100%); padding: 25px; border-radius: 1px; box-shadow: 0 4px 15px rgba(44, 95, 141, 0.3);">
              <h3 style="margin: 0 0 20px 0; color: white; font-size: 1.2em;">📊 Información General</h3>
              <div style="color: white; line-height: 2;">
                <div><strong>Código:</strong> ${ing.codigo}</div>
                <div><strong>Familia:</strong> ${ing.familia || '-'}</div>
                <div><strong>Estado:</strong> ${ing.activo ? '✅ Activo' : '❌ Inactivo'}</div>
              </div>
            </div>
            <div style="background: linear-gradient(135deg, #3d7ea6 0%, #5a92b8 100%); padding: 25px; border-radius: 1px; box-shadow: 0 4px 15px rgba(61, 126, 166, 0.3);">
              <h3 style="margin: 0 0 20px 0; color: white; font-size: 1.2em;">📏 Unidades</h3>
              <div style="color: white; line-height: 2;">
                <div><strong>Economato:</strong> ${ing.unidad_economato || '-'}</div>
                <div><strong>Escandallo:</strong> ${ing.unidad_escandallo || '-'}</div>
                <div><strong>Partida:</strong> ${ing.partidas_almacen || '-'}</div>
              </div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 1px; border-left: 4px solid #2c5f8d;">
              <h4 style="margin: 0 0 15px 0; color: var(--dark-gray); font-size: 1em;">📦 Formato Envases</h4>
              <div style="color: #555; line-height: 1.8;">
                <div><strong>Formato:</strong> ${ing.formato_envases || '-'}</div>
                <div><strong>Peso neto:</strong> ${ing.peso_neto_envase ? ing.peso_neto_envase + ' kg' : '-'}</div>
                <div><strong>Unidades por formato:</strong> ${ing.unidad_por_formatos || '-'}</div>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 1px; border-left: 4px solid #3d7ea6;">
              <h4 style="margin: 0 0 15px 0; color: var(--dark-gray); font-size: 1em;">💰 Costes</h4>
              <div style="color: #555; line-height: 1.8;">
                <div><strong>Por unidad:</strong> ${ing.coste_unidad ? formatDecimal(ing.coste_unidad) + '€' : '-'}</div>
                <div><strong>Por envase:</strong> ${ing.coste_envase ? formatDecimal(ing.coste_envase) + '€' : '-'}</div>
                <div><strong>Por kilo:</strong> ${ing.coste_kilo ? formatDecimal(ing.coste_kilo) + '€/kg' : '-'}</div>
              </div>
            </div>
          </div>
          
          ${alergenos.length > 0 ? `
            <div style="background: linear-gradient(135deg, #4a6f8a 0%, #5a92b8 100%); padding: 25px; border-radius: 1px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(74, 111, 138, 0.3);">
              <h3 style="margin: 0 0 15px 0; color: white; font-size: 1.2em;">⚠️ Alérgenos Declarados</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${alergenos.map(a => `<span style="background: rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 1px; font-size: 0.95em; font-weight: 600; border: 2px solid white;">${a}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
    `;
    
    mostrarModal(html);
  } catch (error) {
    mostrarError('Error al cargar detalle: ' + error.message);
  }
}

async function verDetalleEscandallo(id) {
  try {
    const response = await fetch(`${API_BASE}/escandallos/${id}`);
    if (!response.ok) throw new Error('Error al cargar escandallo');
    const result = await response.json();
    const esc = result.data || result;
    
    const html = `
        <h2 id="modalTitle" style="margin: 0; color: white; font-size: 1.7em; background: linear-gradient(135deg, #1a3a52 0%, #2c5f8d 100%); padding: 25px 30px; font-weight: 600; border-radius: 1px 1px 0 0;">
          📋 Detalle de Escandallo
        </h2>
        <div style="padding: 35px 30px;">
          <div style="background: linear-gradient(135deg, #2c5f8d 0%, #3d7ea6 100%); padding: 25px; border-radius: 1px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(44, 95, 141, 0.3);">
            <h3 style="margin: 0 0 15px 0; color: white; font-size: 1.2em;">🍽️ Plato</h3>
            <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 1px; color: white;">
              <div style="margin-bottom: 8px;"><strong>Código:</strong> ${esc.plato_codigo || '-'}</div>
              <div style="font-size: 1.2em; font-weight: 600;">${esc.plato_nombre || '-'}</div>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #3d7ea6 0%, #5a92b8 100%); padding: 25px; border-radius: 1px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(61, 126, 166, 0.3);">
            <h3 style="margin: 0 0 15px 0; color: white; font-size: 1.2em;">${esc.ingrediente_id ? '🥘 Ingrediente' : '🍲 Sub-plato'}</h3>
            <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 1px; color: white;">
              <div style="margin-bottom: 8px;"><strong>Código:</strong> ${esc.ingrediente_codigo || esc.sub_plato_codigo || '-'}</div>
              <div style="font-size: 1.2em; font-weight: 600; margin-bottom: 10px;">${esc.ingrediente_nombre || esc.sub_plato_nombre || '-'}</div>
              ${esc.ingrediente_familia ? `<div style="font-size: 0.95em; opacity: 0.9;">Familia: ${esc.ingrediente_familia}</div>` : ''}
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
            <div style="background: linear-gradient(135deg, #4a6f8a 0%, #5a92b8 100%); padding: 20px; border-radius: 1px; box-shadow: 0 4px 12px rgba(74, 111, 138, 0.3);">
              <h4 style="margin: 0 0 15px 0; color: white; font-size: 1em;">📊 Cantidad</h4>
              <div style="color: white;">
                <div style="font-size: 2.2em; font-weight: 700; margin-bottom: 5px;">${esc.cantidad ? formatDecimal(esc.cantidad) : '-'}</div>
                <div style="font-size: 1.1em; opacity: 0.9;">${esc.unidad || 'unidades'}</div>
              </div>
            </div>
            <div style="background: linear-gradient(135deg, #2c5f8d 0%, #3d7ea6 100%); padding: 20px; border-radius: 1px; box-shadow: 0 4px 12px rgba(44, 95, 141, 0.3);">
              <h4 style="margin: 0 0 15px 0; color: white; font-size: 1em;">💰 Coste</h4>
              <div style="color: white;">
                <div style="font-size: 2.2em; font-weight: 700; margin-bottom: 5px;">${esc.coste_ingrediente ? formatDecimal(esc.coste_ingrediente) + '€' : '-'}</div>
                ${esc.coste_kilo ? `<div style="font-size: 0.9em; opacity: 0.9; margin-top: 8px;">${formatDecimal(esc.coste_kilo)}€/kg</div>` : ''}
              </div>
            </div>
          </div>
        </div>
    `;
    
    mostrarModal(html);
  } catch (error) {
    mostrarError('Error al cargar detalle: ' + error.message);
  }
}

async function verDetallePlato(id) {
  try {
    const response = await fetch(`${API_BASE}/platos/${id}`);
    if (!response.ok) throw new Error('Error al cargar plato');
    const result = await response.json();
    const plato = result.data || result;
    
    // Cargar escandallo usando el código del plato
    const escResponse = await fetch(`${API_BASE}/escandallos/plato/${plato.codigo}`);
    const escandallos = escResponse.ok ? await escResponse.json() : [];
    
    // Calcular coste del escandallo sumando todos los ingredientes
    const costeEscandallo = escandallos.reduce((sum, e) => sum + (e.coste_calculado || e.coste || 0), 0);
    const tieneEscandallo = escandallos.length > 0;
    
    const alergenos = [];
    if (plato.sesamo) alergenos.push('Sésamo');
    if (plato.pescado) alergenos.push('Pescado');
    if (plato.mariscos) alergenos.push('Mariscos');
    if (plato.apio) alergenos.push('Apio');
    if (plato.frutos_secos) alergenos.push('Frutos secos');
    if (plato.sulfitos) alergenos.push('Sulfitos');
    if (plato.lacteos) alergenos.push('Lácteos');
    if (plato.altramuces) alergenos.push('Altramuces');
    if (plato.gluten) alergenos.push('Gluten');
    if (plato.ovoproductos) alergenos.push('Ovoproductos');
    
    const html = `
        <h2 id="modalTitle" style="margin: 0; color: white; font-size: 1.7em; background: linear-gradient(135deg, #1a3a52 0%, #2c5f8d 100%); padding: 25px 30px; font-weight: 600; border-radius: 1px 1px 0 0;">
          🍽️ ${plato.nombre || 'Sin nombre'}
        </h2>
        <div style="padding: 35px 30px;">
          <div style="background: linear-gradient(135deg, #2c5f8d 0%, #3d7ea6 100%); padding: 25px; border-radius: 1px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(44, 95, 141, 0.3);">
            <h3 style="margin: 0 0 15px 0; color: white; font-size: 1.2em;">ℹ️ Información General</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; color: white;">
              <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 1px;">
                <div style="opacity: 0.9; font-size: 0.9em; margin-bottom: 5px;">Código</div>
                <div style="font-weight: 600; font-size: 1.1em;">${plato.codigo || '-'}</div>
              </div>
              <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 1px;">
                <div style="opacity: 0.9; font-size: 0.9em; margin-bottom: 5px;">Familia</div>
                <div style="font-weight: 600; font-size: 1.1em;">${plato.familia || '-'}</div>
              </div>
              <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 1px;">
                <div style="opacity: 0.9; font-size: 0.9em; margin-bottom: 5px;">Escandallado</div>
                <div style="font-weight: 600; font-size: 1.1em;">${tieneEscandallo ? '✅ Sí' : '❌ No'}</div>
              </div>
              <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 1px;">
                <div style="opacity: 0.9; font-size: 0.9em; margin-bottom: 5px;">Plato Venta</div>
                <div style="font-weight: 600; font-size: 1.1em;">${plato.plato_venta ? '✅ Sí' : '❌ No'}</div>
              </div>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #3d7ea6 0%, #5a92b8 100%); padding: 25px; border-radius: 1px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(61, 126, 166, 0.3);">
            <h3 style="margin: 0 0 15px 0; color: white; font-size: 1.2em;">💰 Costes y Precios</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; color: white;">
              <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 1px; text-align: center;">
                <div style="opacity: 0.9; font-size: 0.9em; margin-bottom: 5px;">Coste Ración</div>
                <div style="font-weight: 700; font-size: 1.4em;">${plato.coste_racion ? formatDecimal(plato.coste_racion) + '€' : (plato.coste ? formatDecimal(plato.coste) + '€' : '-')}</div>
              </div>
              <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 1px; text-align: center;">
                <div style="opacity: 0.9; font-size: 0.9em; margin-bottom: 5px;">Coste Escandallo</div>
                <div style="font-weight: 700; font-size: 1.4em;">${costeEscandallo > 0 ? formatDecimal(costeEscandallo) + '€' : (plato.coste_escandallo ? formatDecimal(plato.coste_escandallo) + '€' : '-')}</div>
              </div>
              <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 1px; text-align: center;">
                <div style="opacity: 0.9; font-size: 0.9em; margin-bottom: 5px;">Precio Venta</div>
                <div style="font-weight: 700; font-size: 1.4em;">${plato.precio_venta ? formatDecimal(plato.precio_venta) + '€' : '-'}</div>
              </div>
              <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 1px; text-align: center;">
                <div style="opacity: 0.9; font-size: 0.9em; margin-bottom: 5px;">Precio Menú</div>
                <div style="font-weight: 700; font-size: 1.4em;">${plato.precio_menu ? formatDecimal(plato.precio_menu) + '€' : '-'}</div>
              </div>
              <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 1px; text-align: center;">
                <div style="opacity: 0.9; font-size: 0.9em; margin-bottom: 5px;">Margen</div>
                <div style="font-weight: 700; font-size: 1.4em;">${plato.margen ? formatDecimal(plato.margen) + '%' : '-'}</div>
              </div>
            </div>
          </div>
          
          ${alergenos.length > 0 ? `
            <div style="background: linear-gradient(135deg, #4a6f8a 0%, #5a92b8 100%); padding: 20px; border-radius: 1px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(74, 111, 138, 0.3);">
              <h3 style="margin: 0 0 15px 0; color: white; font-size: 1.1em;">⚠️ Alérgenos</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${alergenos.map(a => `<span style="background: rgba(255,255,255,0.25); color: white; padding: 8px 16px; border-radius: 1px; font-size: 0.95em; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">${a}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          
          ${escandallos.length > 0 ? `
            <div style="background: #f8f9fa; padding: 25px; border-radius: 1px; border-left: 5px solid #2c5f8d; margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px 0; color: var(--dark-gray); font-size: 1.1em;">📋 Escandallo (${escandallos.length} ingredientes)</h3>
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 1px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                  <thead>
                    <tr style="background: linear-gradient(135deg, #2c5f8d 0%, #3d7ea6 100%); color: white;">
                      <th style="padding: 12px 15px; text-align: left; font-weight: 600; width: 5%;"></th>
                      <th style="padding: 12px 15px; text-align: left; font-weight: 600;">Ingrediente</th>
                      <th style="padding: 12px 15px; text-align: right; font-weight: 600;">Cantidad</th>
                      <th style="padding: 12px 15px; text-align: right; font-weight: 600;">Coste</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${escandallos.map((e, i) => {
                      const tipoIcon = e.tipo_entidad === 'elaborado' ? '🍳' : 
                                      e.tipo_entidad === 'preelaborado' ? '🔧' : '🥬';
                      const tipoLabel = e.tipo_entidad === 'elaborado' ? 'Elaborado' : 
                                       e.tipo_entidad === 'preelaborado' ? 'Pre-elaborado' : 'Ingrediente';
                      return `
                      <tr style="border-bottom: 1px solid #e9ecef; ${i % 2 === 0 ? 'background: #f8f9fa;' : 'background: white;'}">
                        <td style="padding: 12px 8px; text-align: center; font-size: 1.2em;" title="${tipoLabel}">${tipoIcon}</td>
                        <td style="padding: 12px 15px; color: #333;">${e.ingrediente_nombre || e.sub_plato_nombre || '-'}</td>
                        <td style="padding: 12px 15px; text-align: right; color: #555; font-weight: 500;">${e.cantidad ? formatDecimal(e.cantidad) : '-'} ${e.unidad || ''}</td>
                        <td style="padding: 12px 15px; text-align: right; color: #2c5f8d; font-weight: 600;">${e.coste_calculado ? formatDecimal(e.coste_calculado) + '€' : (e.coste ? formatDecimal(e.coste) + '€' : '-')}</td>
                      </tr>
                    `}).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : '<p style="color: #888; font-style: italic; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px; margin-bottom: 25px;">📭 Este plato no tiene escandallo definido.</p>'}
        </div>
    `;
    
    mostrarModal(html);
  } catch (error) {
    mostrarError('Error al cargar detalle: ' + error.message);
  }
}

async function editarPedido(id) {
  try {
    const response = await fetch(`${API_BASE}/pedidos/${id}`);
    if (!response.ok) throw new Error('Error al cargar pedido');
    const result = await response.json();
    const pedido = result.data || result;
    
    const fields = `
      <div>
        <label>Cliente *</label>
        <input type="text" name="cliente" value="${pedido.cliente || ''}" required>
      </div>
      
      <div>
        <label>Fecha *</label>
        <input type="date" name="fecha" value="${pedido.fecha ? pedido.fecha.split('T')[0] : ''}" required>
      </div>
      
      <div>
        <label>Estado *</label>
        <select name="estado" required>
          <option value="pendiente" ${pedido.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="en_proceso" ${pedido.estado === 'en_proceso' ? 'selected' : ''}>En Proceso</option>
          <option value="preparacion" ${pedido.estado === 'preparacion' ? 'selected' : ''}>En Preparación</option>
          <option value="listo" ${pedido.estado === 'listo' ? 'selected' : ''}>Listo para Entrega</option>
          <option value="entregado" ${pedido.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
          <option value="completado" ${pedido.estado === 'completado' ? 'selected' : ''}>Completado</option>
          <option value="cancelado" ${pedido.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
      </div>
      
      <div>
        <label>Total (€)</label>
        <input type="number" name="total" value="${pedido.total || ''}" step="0.01" min="0">
      </div>
      
      <div>
        <label>Observaciones</label>
        <textarea name="observaciones" rows="3">${pedido.observaciones || ''}</textarea>
      </div>
    `;
    
    abrirModal('Editar Pedido', fields, async (formData) => {
      const datos = Object.fromEntries(formData);
      
      try {
        const resp = await fetch(`${API_BASE}/pedidos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        
        if (!resp.ok) throw new Error('Error al actualizar');
        mostrarExito('Pedido actualizado');
        cerrarModal();
        cargarDashboard();
        // Recargar la sección actual
        const seccionActual = document.querySelector('.section:not([style*="display: none"])')?.id;
        if (seccionActual) cambiarSeccion(seccionActual);
      } catch (error) {
        mostrarError('Error al guardar: ' + error.message);
      }
    });
  } catch (error) {
    mostrarError('Error al cargar formulario: ' + error.message);
  }
}

// ==================== PAGINACIÓN ====================
function paginar(datos, tabla) {
  if (!estadoApp.paginacion[tabla]) {
    console.warn(`Tabla ${tabla} no encontrada en paginación`);
    return datos; // Retornar todos los datos si hay problema
  }
  
  const config = estadoApp.paginacion[tabla];
  const totalPaginas = Math.ceil(datos.length / config.porPagina);
  
  // Validar que la página no exceda el total
  if (config.pagina > totalPaginas && totalPaginas > 0) {
    config.pagina = totalPaginas;
  }
  
  // Asegurar que la página sea al menos 1
  if (config.pagina < 1) {
    config.pagina = 1;
  }
  
  const inicio = (config.pagina - 1) * config.porPagina;
  const fin = inicio + config.porPagina;
  return datos.slice(inicio, fin);
}

function renderizarPaginacion(total, tabla, callbackRecargar) {
  const config = estadoApp.paginacion[tabla];
  const totalPaginas = Math.ceil(total / config.porPagina);
  
  return `
    <div class="pagination-controls">
      <div class="pagination-info">
        Mostrando ${Math.min((config.pagina - 1) * config.porPagina + 1, total)} - ${Math.min(config.pagina * config.porPagina, total)} de ${total} registros
      </div>
      <div class="pagination-buttons">
        <button class="btn-pag" onclick="cambiarPagina('${tabla}', 1, '${callbackRecargar}')" ${config.pagina === 1 ? 'disabled' : ''}>
          ⏮️ Primera
        </button>
        <button class="btn-pag" onclick="cambiarPagina('${tabla}', ${config.pagina - 1}, '${callbackRecargar}')" ${config.pagina === 1 ? 'disabled' : ''}>
          ◀️ Anterior
        </button>
        <span class="pagination-current">Página ${config.pagina} de ${totalPaginas}</span>
        <button class="btn-pag" onclick="cambiarPagina('${tabla}', ${config.pagina + 1}, '${callbackRecargar}')" ${config.pagina >= totalPaginas ? 'disabled' : ''}>
          Siguiente ▶️
        </button>
        <button class="btn-pag" onclick="cambiarPagina('${tabla}', ${totalPaginas}, '${callbackRecargar}')" ${config.pagina >= totalPaginas ? 'disabled' : ''}>
          Última ⏭️
        </button>
      </div>
    </div>
  `;
}

function cambiarPagina(tabla, nuevaPagina, recargar) {
  if (!estadoApp.paginacion[tabla]) {
    console.warn(`Tabla ${tabla} no encontrada en paginación`);
    return;
  }
  
  // Validar que la página sea válida
  if (nuevaPagina < 1) nuevaPagina = 1;
  
  estadoApp.paginacion[tabla].pagina = nuevaPagina;
  
  if (recargar && typeof window[recargar] === 'function') {
    window[recargar]();
  }
}

// ==================== SELECCIÓN Y ELIMINACIÓN MASIVA ====================
function toggleSeleccion(tabla, id) {
  const seleccionados = estadoApp.paginacion[tabla].seleccionados;
  const index = seleccionados.indexOf(id);
  if (index > -1) {
    seleccionados.splice(index, 1);
  } else {
    seleccionados.push(id);
  }
  actualizarBotonEliminarMasivo(tabla);
}

function toggleSeleccionTodos(tabla, ids) {
  const config = estadoApp.paginacion[tabla];
  if (!config) return;
  
  const seleccionados = config.seleccionados;
  const checkbox = window.event ? window.event.target : document.getElementById(`check-all-${tabla}`);
  
  if (!checkbox) {
    console.error(`No se encontró checkbox para tabla: ${tabla}`);
    return;
  }
  
  // Si no se pasan IDs, obtenerlos automáticamente
  if (!ids || ids.length === 0) {
    ids = [];
    const checkboxes = document.querySelectorAll(`input[id^="check-${tabla}-"]:not(#selectAll${tabla.charAt(0).toUpperCase() + tabla.slice(1)}):not(#check-all-${tabla})`);
    checkboxes.forEach(cb => {
      const match = cb.id.match(/check-.+-(\d+)/);
      if (match) {
        const id = parseInt(match[1]);
        if (!isNaN(id)) ids.push(id);
      }
    });
  }
  
  if (checkbox.checked) {
    // Agregar los IDs visibles a la selección
    ids.forEach(id => {
      if (!seleccionados.includes(id)) {
        seleccionados.push(id);
      }
    });
  } else {
    // Remover los IDs visibles de la selección
    ids.forEach(id => {
      const index = seleccionados.indexOf(id);
      if (index > -1) {
        seleccionados.splice(index, 1);
      }
    });
  }
  
  // Actualizar checkboxes individuales en la página actual
  ids.forEach(id => {
    const cb = document.getElementById(`check-${tabla}-${id}`);
    if (cb) cb.checked = checkbox.checked;
  });
  
  actualizarBotonEliminarMasivo(tabla);
}

// Nueva función para seleccionar TODOS los registros de la tabla (todas las páginas)
function seleccionarTodosLosRegistros(tabla) {
  const config = estadoApp.paginacion[tabla];
  if (!config) return;
  
  let todosLosIds = [];
  
  // Obtener todos los IDs según la tabla
  switch(tabla) {
    case 'platos':
      todosLosIds = estadoApp.platosData.map(p => p.id);
      break;
    case 'ingredientes':
      todosLosIds = estadoApp.ingredientesData.map(i => i.id);
      break;
    case 'escandallos':
      todosLosIds = estadoApp.escandallosData.map(e => e.id);
      break;
    case 'inventario':
      todosLosIds = estadoApp.inventarioData.map(i => i.id);
      break;
    case 'pedidos':
      todosLosIds = estadoApp.pedidosData.map(p => p.id);
      break;
    case 'controlesAPPCC':
      todosLosIds = estadoApp.controlesAPPCC.map(c => c.id);
      break;
  }
  
  confirmarAccion(`¿Seleccionar todos los ${todosLosIds.length} registros de la tabla?`, () => {
    config.seleccionados = [...todosLosIds];
    
    // Actualizar checkbox visual
    const checkboxAll = document.getElementById(`selectAll${tabla.charAt(0).toUpperCase() + tabla.slice(1)}`) || 
                        document.getElementById(`check-all-${tabla}`);
    if (checkboxAll) checkboxAll.checked = true;
    
    // Actualizar checkboxes visibles
    todosLosIds.forEach(id => {
      const cb = document.getElementById(`check-${tabla}-${id}`);
      if (cb) cb.checked = true;
    });
    
    actualizarBotonEliminarMasivo(tabla);
    mostrarExito(`Seleccionados ${todosLosIds.length} registros`);
  });
}

function actualizarBotonEliminarMasivo(tabla) {
  const seleccionados = estadoApp.paginacion[tabla].seleccionados;
  const btn = document.getElementById(`btn-eliminar-${tabla}`);
  if (btn) {
    btn.disabled = seleccionados.length === 0;
    btn.textContent = `🗑️ Eliminar (${seleccionados.length})`;
  }
}

async function eliminarSeleccionados(tabla, endpoint) {
  const seleccionados = estadoApp.paginacion[tabla].seleccionados;
  
  if (seleccionados.length === 0) {
    mostrarError('No hay elementos seleccionados');
    return;
  }
  
  return new Promise((resolve) => {
    confirmarAccion(`¿Eliminar ${seleccionados.length} registro(s) seleccionado(s)?`, async () => {
      await realizarEliminacionMasiva();
      resolve();
    });
  });
  
  async function realizarEliminacionMasiva() {
    let exitosos = 0;
    let errores = 0;
    
    for (const id of seleccionados) {
      try {
        const response = await fetch(`${API_BASE}/${endpoint}/${id}`, { method: 'DELETE' });
        if (response.ok) {
          exitosos++;
        } else {
          errores++;
        }
      } catch (error) {
        errores++;
      }
    }
    
    // Limpiar selección
    estadoApp.paginacion[tabla].seleccionados = [];
    
    // Desmarcar todos los checkboxes
    const checkAllBox = document.getElementById(`check-all-${tabla}`) || 
                        document.getElementById(`selectAll${tabla.charAt(0).toUpperCase() + tabla.slice(1)}`);
    if (checkAllBox) {
      checkAllBox.checked = false;
    }
    
    // Desmarcar checkboxes individuales
    document.querySelectorAll(`input[id^="check-${tabla}-"]`).forEach(cb => {
      cb.checked = false;
    });
    
    // Actualizar botón de eliminar
    actualizarBotonEliminarMasivo(tabla);
    
    if (exitosos > 0) {
      mostrarExito(`${exitosos} registro(s) eliminado(s)`);
    }
    if (errores > 0) {
      mostrarError(`${errores} error(es) al eliminar`);
    }
    
    // Recargar la tabla correspondiente
    switch(tabla) {
      case 'platos': cargarPlatos(); break;
      case 'ingredientes': cargarIngredientes(); break;
      case 'escandallos': cargarEscandallos(); break;
      case 'inventario': cargarInventario(); break;
      case 'pedidos': cargarPedidos(); break;
      case 'partidas': cargarPartidas(); break;
      case 'controlesAPPCC': cargarSanidad(); break;
    }
  }
}

async function verDetalleTrazabilidad(id) {
  try {
    const response = await fetch(`${API_BASE}/trazabilidad/${id}`);
    if (!response.ok) throw new Error('Error al cargar trazabilidad');
    const traz = await response.json();
    
    const html = `
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 id="modalTitle" style="margin: 0; color: white; font-size: 1.7em; background: linear-gradient(135deg, #1a3a52 0%, #2c5f8d 100%); padding: 25px 30px; font-weight: 600; border-radius: 1px 1px 0 0;">Detalle de Trazabilidad</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
          <div style="background: linear-gradient(135deg, #2c5f8d 0%, #3d7ea6 100%); padding: 20px; border-radius: 1px; color: white;">
            <h3 style="margin: 0 0 15px 0; font-size: 1.1em;">Información del Evento</h3>
            <p><strong>Fecha evento:</strong> ${traz.fecha_evento ? new Date(traz.fecha_evento).toLocaleDateString('es-ES') : '-'}</p>
            <p><strong>Cliente:</strong> ${traz.cliente || '-'}</p>
            <p><strong>Nº Personas:</strong> ${traz.num_personas || '-'}</p>
          </div>
          <div style="background: linear-gradient(135deg, #3d7ea6 0%, #5a92b8 100%); padding: 20px; border-radius: 1px; color: white;">
            <h3 style="margin: 0 0 15px 0; font-size: 1.1em;">Plato</h3>
            <p><strong>Código:</strong> ${traz.plato_codigo || '-'}</p>
            <p><strong>Nombre:</strong> ${traz.plato_nombre || '-'}</p>
            <p><strong>Cantidad:</strong> ${traz.cantidad || '-'}</p>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 1px; margin: 20px 0; border-left: 4px solid #2c5f8d;">
          <h3 style="margin: 0 0 15px 0; color: var(--dark-gray);">Producción</h3>
          <p><strong>Lote:</strong> ${traz.lote || '-'}</p>
          <p><strong>Fecha producción:</strong> ${traz.fecha_produccion ? new Date(traz.fecha_produccion).toLocaleDateString('es-ES') : '-'}</p>
          <p><strong>Operario:</strong> ${traz.operario || '-'}</p>
          <p><strong>Temperatura inicial:</strong> ${traz.temp_inicial ? traz.temp_inicial + ' °C' : '-'}</p>
          <p><strong>Temperatura final:</strong> ${traz.temp_final ? traz.temp_final + ' °C' : '-'}</p>
        </div>
        
        ${traz.observaciones ? `
          <div style="margin: 20px 0;">
            <h3 style="color: var(--dark-gray);">Observaciones</h3>
            <p style="background: #fff3cd; padding: 15px; border-radius: 1px;">${traz.observaciones}</p>
          </div>
        ` : ''}
      </div>
    `;
    
    mostrarModal(html);
  } catch (error) {
    mostrarError('Error al cargar detalle: ' + error.message);
  }
}

async function verDetallePartida(id) {
  try {
    const response = await fetch(`${API_BASE}/partidas-cocina/${id}`);
    if (!response.ok) throw new Error('Error al cargar partida');
    const partida = await response.json();
    
    const html = `
        <h2 id="modalTitle" style="margin: 0; color: white; font-size: 1.7em; background: linear-gradient(135deg, #1a3a52 0%, #2c5f8d 100%); padding: 25px 30px; border-bottom: none; font-weight: 600; letter-spacing: 0.3px; border-radius: 1px 1px 0 0;">
          Detalle de Partida de Cocina
        </h2>
        <div style="padding: 35px 30px;">
          <div style="background: linear-gradient(135deg, #2c5f8d 0%, #3d7ea6 100%); padding: 25px; border-radius: 1px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(44, 95, 141, 0.3);">
            <h3 style="margin: 0 0 20px 0; color: white; font-size: 1.3em; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.5em;">📋</span> ${partida.nombre}
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; color: white;">
              <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 1px;">
                <div style="font-size: 0.85em; opacity: 0.9; margin-bottom: 5px;">Código</div>
                <div style="font-size: 1.2em; font-weight: 600;">${partida.codigo}</div>
              </div>
              <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 1px;">
                <div style="font-size: 0.85em; opacity: 0.9; margin-bottom: 5px;">Estado</div>
                <div style="font-size: 1.2em; font-weight: 600;">${partida.activo ? '✅ Activo' : '❌ Inactivo'}</div>
              </div>
            </div>
          </div>
          
          ${partida.descripcion ? `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 1px; border-left: 4px solid #2c5f8d;">
              <h4 style="margin: 0 0 10px 0; color: var(--dark-gray); font-size: 1em;">📝 Descripción</h4>
              <p style="margin: 0; color: #555; line-height: 1.6;">${partida.descripcion}</p>
            </div>
          ` : ''}
        </div>
    `;
    
    mostrarModal(html);
  } catch (error) {
    mostrarError('Error al cargar detalle: ' + error.message);
  }
}

// Función para autocompletar campos al editar inventario
async function autoFillEditInventario(ingredienteId) {
  if (!ingredienteId) return;
  
  try {
    const response = await fetch(`${API_BASE}/ingredientes/${ingredienteId}`);
    if (!response.ok) return;
    const ingrediente = await response.json();
    
    // Autocompletar ubicación si existe
    const ubicacionField = document.getElementById('edit_ubicacion');
    if (ubicacionField && ingrediente.partidas_almacen) {
      ubicacionField.value = ingrediente.partidas_almacen;
    }
    
    // Autocompletar unidad economato si existe
    const unidadEconomatoField = document.getElementById('edit_unidad_economato');
    if (unidadEconomatoField && ingrediente.unidad_economato) {
      unidadEconomatoField.value = ingrediente.unidad_economato;
    }
    
    // Autocompletar unidad escandallo si existe
    const unidadEscandalloField = document.getElementById('edit_unidad_escandallo');
    if (unidadEscandalloField && ingrediente.unidad_escandallo) {
      unidadEscandalloField.value = ingrediente.unidad_escandallo;
    }
    
    // Generar lote si está vacío
    const loteField = document.getElementById('edit_lote');
    if (loteField && !loteField.value) {
      const hoy = new Date();
      const fecha = hoy.toISOString().split('T')[0].replace(/-/g, '');
      const secuencia = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      loteField.value = `${fecha}-${secuencia}`;
    }
  } catch (error) {
    console.error('Error al autocompletar:', error);
  }
}

// Exportar funciones globales
window.inicializarApp = inicializarApp;
window.cambiarSeccion = cambiarSeccion;
window.autoFillEditInventario = autoFillEditInventario;

// ==================== ALÉRGENOS PERSONALIZADOS ====================

// Gestión de alérgenos personalizados
let alergenosPersonalizadosCache = [];

async function cargarAlergenosPersonalizados() {
  try {
    const response = await fetch(`${API_BASE}/alergenos-personalizados`);
    if (!response.ok) throw new Error('Error al cargar alérgenos personalizados');
    alergenosPersonalizadosCache = await response.json();
    return alergenosPersonalizadosCache;
  } catch (error) {
    console.error('Error al cargar alérgenos personalizados:', error);
    return [];
  }
}

async function mostrarGestionAlergenosPersonalizados() {
  await cargarAlergenosPersonalizados();
  
  const campos = `
    <div style="margin-bottom: 20px;">
      <button type="button" class="btn btn-primary" onclick="mostrarModalNuevoAlergenoPersonalizado()" style="margin-bottom: 15px;">
        ➕ NUEVO ALÉRGENO PERSONALIZADO
      </button>
    </div>
    
    <div style="max-height: 400px; overflow-y: auto;">
      <table class="table" style="width: 100%;">
        <thead>
          <tr>
            <th>Icono</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="alergenosPersonalizadosTableBody">
          ${alergenosPersonalizadosCache.length === 0 ? 
            '<tr><td colspan="4" class="text-center">No hay alérgenos personalizados. Créalos para clientes con necesidades específicas.</td></tr>' :
            alergenosPersonalizadosCache.map(a => `
              <tr>
                <td style="font-size: 1.5em;">${a.icono || '❔'}</td>
                <td><strong>${a.nombre}</strong></td>
                <td>${a.descripcion || '-'}</td>
                <td>
                  <button class="btn-icon" onclick="editarAlergenoPersonalizado(${a.id})" title="Editar">✏️</button>
                  <button class="btn-icon" onclick="eliminarAlergenoPersonalizado(${a.id})" title="Eliminar">🗑️</button>
                </td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background-color: #f0f8ff; border-left: 4px solid #4a90e2; border-radius: 4px;">
      <strong>ℹ️ Información:</strong><br>
      Los 14 alérgenos oficiales de la UE están incluidos por defecto.<br>
      Aquí puedes agregar alérgenos adicionales para clientes con restricciones específicas (ej: ajo, cebolla, picante, etc.)
    </div>
  `;
  
  abrirModal('Gestión de Alérgenos Personalizados', campos, null, true);
}

async function mostrarModalNuevoAlergenoPersonalizado() {
  const campos = `
    <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
      <div>
        <label>Nombre del Alérgeno *</label>
        <input type="text" name="nombre" required placeholder="Ej: Ajo, Cebolla, Picante">
      </div>
      <div>
        <label>Descripción</label>
        <textarea name="descripcion" rows="3" placeholder="Descripción opcional del alérgeno"></textarea>
      </div>
      <div>
        <label>Icono (emoji opcional)</label>
        <input type="text" name="icono" placeholder="🧄 🧅 🌶️" maxlength="4">
      </div>
      <div>
        <label>Palabras Clave (para detección automática)</label>
        <input type="text" name="palabras_clave" placeholder="Ej: ajo, garlic, all">
        <small style="color: #666; font-size: 0.85em; display: block; margin-top: 5px;">Separadas por comas. Se usarán para detectar automáticamente este alérgeno.</small>
      </div>
    </div>
  `;
  
  abrirModal('Nuevo Alérgeno Personalizado', campos, async (formData) => {
    try {
      const datos = Object.fromEntries(formData);
      const response = await fetch(`${API_BASE}/alergenos-personalizados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      
      if (!response.ok) throw new Error('Error al crear alérgeno');
      
      mostrarExito('Alérgeno personalizado creado');
      cerrarModal();
      await mostrarGestionAlergenosPersonalizados();
    } catch (error) {
      mostrarError('Error al crear alérgeno: ' + error.message);
    }
  });
}

async function editarAlergenoPersonalizado(id) {
  try {
    const response = await fetch(`${API_BASE}/alergenos-personalizados/${id}`);
    if (!response.ok) throw new Error('Error al cargar alérgeno');
    const alergeno = await response.json();
    
    const campos = `
      <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
        <div>
          <label>Nombre del Alérgeno *</label>
          <input type="text" name="nombre" value="${alergeno.nombre}" required>
        </div>
        <div>
          <label>Descripción</label>
          <textarea name="descripcion" rows="3">${alergeno.descripcion || ''}</textarea>
        </div>
        <div>
          <label>Icono (emoji opcional)</label>
          <input type="text" name="icono" value="${alergeno.icono || ''}" maxlength="4">
        </div>
        <div>
          <label>Palabras Clave (para detección automática)</label>
          <input type="text" name="palabras_clave" value="${alergeno.palabras_clave || ''}" placeholder="Ej: ajo, garlic, all">
          <small style="color: #666; font-size: 0.85em; display: block; margin-top: 5px;">Separadas por comas. Se usarán para detectar automáticamente este alérgeno.</small>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" name="activo" id="activo-alergeno-${id}" ${alergeno.activo ? 'checked' : ''}>
          <label for="activo-alergeno-${id}" style="margin: 0; text-transform: none;">Activo</label>
        </div>
      </div>
    `;
    
    abrirModal('Editar Alérgeno Personalizado', campos, async (formData) => {
      try {
        const datos = Object.fromEntries(formData);
        datos.activo = formData.has('activo') ? 1 : 0;
        
        const resp = await fetch(`${API_BASE}/alergenos-personalizados/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        
        if (!resp.ok) throw new Error('Error al actualizar');
        
        mostrarExito('Alérgeno actualizado');
        cerrarModal();
        await mostrarGestionAlergenosPersonalizados();
      } catch (error) {
        mostrarError('Error al actualizar: ' + error.message);
      }
    });
  } catch (error) {
    mostrarError('Error al cargar formulario: ' + error.message);
  }
}

async function eliminarAlergenoPersonalizado(id) {
  confirmarAccion('¿Desactivar este alérgeno personalizado?', async () => {
    try {
      const response = await fetch(`${API_BASE}/alergenos-personalizados/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Error al eliminar');
      
      mostrarExito('Alérgeno desactivado');
      await mostrarGestionAlergenosPersonalizados();
    } catch (error) {
      mostrarError('Error al eliminar: ' + error.message);
    }
  });
}

// Agregar sección de alérgenos personalizados en formularios de ingredientes/platos
async function agregarSeccionAlergenosPersonalizados(entidadId, tipoEntidad = 'ingrediente') {
  const alergenos = await cargarAlergenosPersonalizados();
  
  if (alergenos.length === 0) {
    return `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <h3 style="margin: 0 0 10px 0; color: var(--dark-gray); font-size: 1.1em;">
          Alérgenos Personalizados
          <button type="button" class="btn btn-secondary" onclick="mostrarGestionAlergenosPersonalizados()" style="font-size: 0.85em; padding: 4px 10px; margin-left: 10px;">
            ⚙️ Gestionar
          </button>
        </h3>
        <p style="color: #666; font-style: italic;">
          No hay alérgenos personalizados. Haz clic en "Gestionar" para crear algunos.
        </p>
      </div>
    `;
  }
  
  // Obtener alérgenos ya asignados
  const endpoint = tipoEntidad === 'ingrediente' ? 
    `${API_BASE}/ingredientes/${entidadId}/alergenos-personalizados` :
    `${API_BASE}/platos/${entidadId}/alergenos-personalizados`;
  
  let asignados = [];
  try {
    const response = await fetch(endpoint);
    if (response.ok) {
      asignados = await response.json();
    }
  } catch (error) {
    console.error('Error al cargar alérgenos asignados:', error);
  }
  
  const asignadosIds = asignados.map(a => a.id);
  
  return `
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <h3 style="margin: 0 0 15px 0; color: var(--dark-gray); font-size: 1.1em;">
        Alérgenos Personalizados
        <button type="button" class="btn btn-secondary" onclick="mostrarGestionAlergenosPersonalizados()" style="font-size: 0.85em; padding: 4px 10px; margin-left: 10px;">
          ⚙️ Gestionar
        </button>
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
        ${alergenos.map(a => `
          <label style="display: flex; align-items: center; gap: 8px; text-transform: none; font-weight: 500;">
            <input type="checkbox" name="alergeno_personalizado_${a.id}" ${asignadosIds.includes(a.id) ? 'checked' : ''}>
            ${a.icono || '❔'} ${a.nombre}
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

// Guardar alérgenos personalizados al guardar ingrediente/plato
async function guardarAlergenosPersonalizados(entidadId, formData, tipoEntidad = 'ingrediente') {
  const alergenosIds = [];
  
  // Extraer IDs de alérgenos personalizados marcados
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('alergeno_personalizado_') && value === 'on') {
      const id = parseInt(key.replace('alergeno_personalizado_', ''));
      alergenosIds.push(id);
    }
  }
  
  // Actualizar en el servidor
  const endpoint = tipoEntidad === 'ingrediente' ?
    `${API_BASE}/ingredientes/${entidadId}/alergenos-personalizados` :
    `${API_BASE}/platos/${entidadId}/alergenos-personalizados`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alergenos_ids: alergenosIds })
    });
    
    if (!response.ok) {
      console.error('Error al guardar alérgenos personalizados');
    }
  } catch (error) {
    console.error('Error al guardar alérgenos personalizados:', error);
  }
}

// Exportar funciones de alérgenos personalizados
window.mostrarGestionAlergenosPersonalizados = mostrarGestionAlergenosPersonalizados;
window.mostrarModalNuevoAlergenoPersonalizado = mostrarModalNuevoAlergenoPersonalizado;
window.editarAlergenoPersonalizado = editarAlergenoPersonalizado;
window.eliminarAlergenoPersonalizado = eliminarAlergenoPersonalizado;
window.agregarSeccionAlergenosPersonalizados = agregarSeccionAlergenosPersonalizados;
window.guardarAlergenosPersonalizados = guardarAlergenosPersonalizados;

// Exportar funciones de alérgenos oficiales
window.editarAlergenoOficial = editarAlergenoOficial;
window.mostrarTabSanidad = mostrarTabSanidad;

// ==================== CONTROL APPCC ====================

function mostrarControlesAPPCC(controles) {
  const tbody = document.getElementById('controlesAPPCCTableBody');
  const paginacionDiv = document.getElementById('control-appcc-paginacion');
  
  if (!tbody) {
    console.error('❌ Tbody de controles APPCC no encontrado');
    return;
  }
  
  tbody.innerHTML = '';

  if (!controles.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No hay controles APPCC</td></tr>';
    if (paginacionDiv) paginacionDiv.innerHTML = '';
    return;
  }

  const controlesPaginados = paginar(controles, 'controlesAPPCC');
  const idsVisibles = controlesPaginados.map(c => c.id);
  const seleccionados = estadoApp.paginacion.controlesAPPCC.seleccionados;

  controlesPaginados.forEach(c => {
    const checked = seleccionados.includes(c.id) ? 'checked' : '';
    const row = `
      <tr>
        <td><input type="checkbox" id="check-controlesAPPCC-${c.id}" ${checked} onchange="toggleSeleccion('controlesAPPCC', ${c.id})"></td>
        <td><strong>${c.plato_codigo}</strong></td>
        <td>${c.ingrediente_codigo || '-'}</td>
        <td>${c.fecha_produccion || '-'}</td>
        <td>${c.punto_critico || '-'}</td>
        <td>${c.corrector || '-'}</td>
        <td>
          <button class="btn-icon" onclick="editarControlAPPCC(${c.id})" title="Editar">✏️</button>
          <button class="btn-icon" onclick="eliminarControlAPPCC(${c.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });

  if (paginacionDiv) {
    paginacionDiv.innerHTML = renderizarPaginacion(controles.length, 'controlesAPPCC', 'filtrarControlesAPPCC');
  }

  actualizarBotonEliminarMasivo('controlesAPPCC');
}

function filtrarControlesAPPCC() {
  const search = normalizarTexto(document.getElementById('searchControlAPPCC').value);

  const filtrados = estadoApp.controlesAPPCC.filter(control => {
    const matchSearch = !search || 
      normalizarTexto(control.plato_codigo).includes(search) || 
      normalizarTexto(control.ingrediente_codigo || '').includes(search) ||
      normalizarTexto(control.fecha_produccion || '').includes(search) ||
      normalizarTexto(control.punto_critico || '').includes(search);
    return matchSearch;
  });

  mostrarControlesAPPCC(filtrados);
}

function limpiarFiltrosControlAPPCC() {
  document.getElementById('searchControlAPPCC').value = '';
  mostrarControlesAPPCC(estadoApp.controlesAPPCC);
}

async function mostrarModalNuevoControlAPPCC() {
  // Cargar platos e ingredientes para autocompletar
  let platosCodigos = [];
  let ingredientesCodigos = [];
  
  try {
    const [platosRes, ingredientesRes] = await Promise.all([
      fetch(`${API_BASE}/platos`).then(r => r.json()),
      fetch(`${API_BASE}/ingredientes`).then(r => r.json())
    ]);
    
    platosCodigos = [...new Set((platosRes.data || []).map(p => p.codigo).filter(Boolean))];
    ingredientesCodigos = [...new Set((ingredientesRes.data || []).map(i => i.codigo).filter(Boolean))];
  } catch (error) {
    console.error('Error cargando datos para autocompletar:', error);
  }
  
  const campos = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <label>Plato / Código *</label>
        <input type="text" name="plato_codigo" list="platos-appcc-list" autocomplete="off" required placeholder="Código del plato">
        <datalist id="platos-appcc-list">
          ${platosCodigos.map(c => `<option value="${c}">`).join('')}
        </datalist>
      </div>
      <div>
        <label>Ingrediente</label>
        <input type="text" name="ingrediente_codigo" list="ingredientes-appcc-list" autocomplete="off" placeholder="Ingrediente relacionado">
        <datalist id="ingredientes-appcc-list">
          ${ingredientesCodigos.map(c => `<option value="${c}">`).join('')}
        </datalist>
      </div>
      <div style="grid-column: 1 / -1;">
        <label>Procedimiento / Proceso *</label>
        <textarea name="fecha_produccion" rows="3" required placeholder="Ej: HERVIR LA LECHE 900 ML + VAINILLA"></textarea>
      </div>
      <div>
        <label>Punto Crítico</label>
        <input type="text" name="punto_critico" placeholder="Ej: Temperatura 70ºC, Tiempo 10 min">
      </div>
      <div>
        <label>Punto Corrector</label>
        <input type="text" name="corrector" placeholder="Acción si falla el control">
      </div>
      <div style="grid-column: 1 / -1;">
        <label>Responsable</label>
        <input type="text" name="responsable" placeholder="Persona responsable del control">
      </div>
      <div style="grid-column: 1 / -1;">
        <label>Observaciones</label>
        <textarea name="observaciones" rows="2" placeholder="Notas adicionales"></textarea>
      </div>
    </div>
  `;
  
  abrirModal('Nuevo Control APPCC', campos, async (formData) => {
    try {
      const datos = Object.fromEntries(formData);
      const response = await fetch(`${API_BASE}/control-sanidad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      
      if (!response.ok) throw new Error('Error al crear control');
      
      mostrarExito('Control APPCC creado');
      cerrarModal();
      await cargarSanidad();
    } catch (error) {
      mostrarError('Error al crear control: ' + error.message);
    }
  });
}

async function editarControlAPPCC(id) {
  try {
    const response = await fetch(`${API_BASE}/control-sanidad/${id}`);
    if (!response.ok) throw new Error('Error al cargar control');
    const control = await response.json();
    
    // Cargar platos e ingredientes para autocompletar
    let platosCodigos = [];
    let ingredientesCodigos = [];
    
    try {
      const [platosRes, ingredientesRes] = await Promise.all([
        fetch(`${API_BASE}/platos`).then(r => r.json()),
        fetch(`${API_BASE}/ingredientes`).then(r => r.json())
      ]);
      
      platosCodigos = [...new Set((platosRes.data || []).map(p => p.codigo).filter(Boolean))];
      ingredientesCodigos = [...new Set((ingredientesRes.data || []).map(i => i.codigo).filter(Boolean))];
    } catch (error) {
      console.error('Error cargando datos para autocompletar:', error);
    }
    
    const campos = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <label>Plato / Código *</label>
          <input type="text" name="plato_codigo" value="${control.plato_codigo}" list="platos-appcc-edit-list" autocomplete="off" required>
          <datalist id="platos-appcc-edit-list">
            ${platosCodigos.map(c => `<option value="${c}">`).join('')}
          </datalist>
        </div>
        <div>
          <label>Ingrediente</label>
          <input type="text" name="ingrediente_codigo" value="${control.ingrediente_codigo || ''}" list="ingredientes-appcc-edit-list" autocomplete="off">
          <datalist id="ingredientes-appcc-edit-list">
            ${ingredientesCodigos.map(c => `<option value="${c}">`).join('')}
          </datalist>
        </div>
        <div style="grid-column: 1 / -1;">
          <label>Procedimiento / Proceso *</label>
          <textarea name="fecha_produccion" rows="3" required>${control.fecha_produccion || ''}</textarea>
        </div>
        <div>
          <label>Punto Crítico</label>
          <input type="text" name="punto_critico" value="${control.punto_critico || ''}">
        </div>
        <div>
          <label>Punto Corrector</label>
          <input type="text" name="corrector" value="${control.corrector || ''}">
        </div>
        <div style="grid-column: 1 / -1;">
          <label>Responsable</label>
          <input type="text" name="responsable" value="${control.responsable || ''}">
        </div>
        <div style="grid-column: 1 / -1;">
          <label>Observaciones</label>
          <textarea name="observaciones" rows="2">${control.observaciones || ''}</textarea>
        </div>
      </div>
    `;
    
    abrirModal('Editar Control APPCC', campos, async (formData) => {
      try {
        const datos = Object.fromEntries(formData);
        
        const resp = await fetch(`${API_BASE}/control-sanidad/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        
        if (!resp.ok) throw new Error('Error al actualizar');
        
        mostrarExito('Control APPCC actualizado');
        cerrarModal();
        await cargarSanidad();
      } catch (error) {
        mostrarError('Error al actualizar: ' + error.message);
      }
    });
  } catch (error) {
    mostrarError('Error al cargar formulario: ' + error.message);
  }
}

async function eliminarControlAPPCC(id) {
  confirmarAccion('¿Eliminar este control APPCC?', async () => {
    try {
      const response = await fetch(`${API_BASE}/control-sanidad/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Error al eliminar');
      
      mostrarExito('Control APPCC eliminado');
      await cargarSanidad();
    } catch (error) {
      mostrarError('Error al eliminar: ' + error.message);
    }
  });
}

// Exportar funciones de control APPCC
window.mostrarModalNuevoControlAPPCC = mostrarModalNuevoControlAPPCC;
window.editarControlAPPCC = editarControlAPPCC;
window.eliminarControlAPPCC = eliminarControlAPPCC;
window.mostrarControlesAPPCC = mostrarControlesAPPCC;
window.filtrarControlesAPPCC = filtrarControlesAPPCC;
window.limpiarFiltrosControlAPPCC = limpiarFiltrosControlAPPCC;

// ==================== ESCANDALLO MÚLTIPLE ====================

/**
 * Función para guardar múltiples ingredientes de un escandallo en una sola operación
 * Llamada desde el modal dinámico cuando se usa tipo 'escandallo'
 */
async function guardarEscandalloMultiple(formData, opciones = {}) {
  try {
    const plato_id = formData.get('plato_id');
    const notas_generales = formData.get('notas_generales');
    const esEdicion = opciones.modo === 'editar';
    
    // Debug: ver todos los campos del formulario
    console.log('🔍 Campos del formulario:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    if (!plato_id) {
      throw new Error('Debe seleccionar un plato');
    }
    
    // Recopilar todos los ingredientes del array dinámico
    // Buscar TODOS los índices presentes (no solo consecutivos)
    const ingredientes = [];
    const indices = new Set();
    
    // Extraer todos los índices del FormData
    for (let [key, value] of formData.entries()) {
      const match = key.match(/^ingredientes\[(\d+)\]/);
      if (match) {
        indices.add(parseInt(match[1]));
      }
    }
    
    console.log(`📋 Índices encontrados: [${Array.from(indices).sort((a,b) => a-b).join(', ')}]`);
    
    // Recopilar ingredientes de cada índice
    for (const index of indices) {
      const ingrediente_id = formData.get(`ingredientes[${index}][ingrediente_id]`);
      const cantidad = formData.get(`ingredientes[${index}][cantidad]`);
      const unidad = formData.get(`ingredientes[${index}][unidad]`);
      const planning = formData.get(`ingredientes[${index}][planning]`);
      
      // Validar que tenga los datos mínimos (ingrediente y cantidad válidos)
      if (ingrediente_id && cantidad && parseFloat(cantidad) > 0) {
        ingredientes.push({
          plato_id: parseInt(plato_id),
          ingrediente_id: parseInt(ingrediente_id),
          cantidad: parseFloat(cantidad),
          unidad: unidad || 'Kg',
          planning: planning || null
        });
      } else {
        console.log(`  ⚠️ Índice ${index} ignorado: ingrediente_id=${ingrediente_id}, cantidad=${cantidad}`);
      }
    }
    
    console.log(`📋 Ingredientes recopilados: ${ingredientes.length}`, ingredientes);
    
    if (ingredientes.length === 0) {
      throw new Error('Debe agregar al menos un ingrediente');
    }
    
    console.log('📋 Guardando escandallo múltiple:', { plato_id, ingredientes, notas_generales, esEdicion });
    
    // Si es edición, primero eliminar todos los escandallos existentes de este plato
    if (esEdicion) {
      console.log('🗑️ Eliminando escandallos anteriores del plato...');
      try {
        // Obtener todos los escandallos del plato
        const platoCodigo = opciones.plato?.codigo;
        if (platoCodigo) {
          const getResponse = await fetch(`${API_BASE}/escandallos/plato/${platoCodigo}`);
          if (getResponse.ok) {
            const escandallosAnteriores = await getResponse.json();
            console.log(`  📋 Encontrados ${escandallosAnteriores.length} escandallos anteriores`);
            
            // Eliminar cada uno
            for (const esc of escandallosAnteriores) {
              try {
                await fetch(`${API_BASE}/escandallos/${esc.id}`, { method: 'DELETE' });
              } catch (err) {
                console.warn(`  ⚠️ No se pudo eliminar escandallo ${esc.id}`);
              }
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Error al eliminar escandallos anteriores:', error);
      }
    }
    
    // Guardar cada ingrediente
    let guardados = 0;
    let errores = 0;
    
    for (const ingrediente of ingredientes) {
      try {
        const response = await fetch(`${API_BASE}/escandallos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ingrediente)
        });
        
        if (response.ok) {
          guardados++;
        } else {
          errores++;
          console.error('Error al guardar ingrediente:', ingrediente);
        }
      } catch (error) {
        errores++;
        console.error('Error al guardar ingrediente:', error);
      }
    }
    
    // Mostrar resultado
    if (guardados > 0) {
      const mensaje = esEdicion 
        ? `✅ Escandallo actualizado: ${guardados} ingrediente(s)${errores > 0 ? `, ${errores} error(es)` : ''}`
        : `✅ Escandallo creado: ${guardados} ingrediente(s)${errores > 0 ? `, ${errores} error(es)` : ''}`;
      mostrarExito(mensaje);
      await cargarEscandallos();
      return true;
    } else {
      throw new Error('No se pudo guardar ningún ingrediente');
    }
    
  } catch (error) {
    console.error('Error al guardar escandallo múltiple:', error);
    mostrarError(`❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Cargar escandallo existente cuando se selecciona un plato
 * O cuando se edita un escandallo existente
 * @param {number} platoId - ID del plato
 * @param {object} opciones - { modo: 'editar', escandalloId: X, escandallos: [...] }
 */
async function cargarEscandalloExistente(platoId, opciones = {}) {
  try {
    console.log(`🔍 Cargando escandallo para plato ID: ${platoId}`, opciones);
    
    // Limpiar info anterior
    const infoAnterior = document.getElementById('info-plato-seleccionado');
    if (infoAnterior) infoAnterior.remove();
    
    // Obtener el código del plato
    const platoResponse = await fetch(`${API_BASE}/platos/${platoId}`);
    if (!platoResponse.ok) {
      console.error('❌ No se pudo cargar el plato');
      return [];
    }
    
    const platoResult = await platoResponse.json();
    const plato = platoResult.data || platoResult;
    
    console.log(`✅ Plato cargado: ${plato.nombre} (código: ${plato.codigo})`);
    
    // Obtener escandallos del plato
    let escandallos = [];
    if (opciones.escandallos && Array.isArray(opciones.escandallos)) {
      // Usar escandallos proporcionados (desde editarEscandallo)
      // FILTRAR solo los del plato actual por seguridad
      escandallos = opciones.escandallos.filter(e => e.plato_id == platoId);
      console.log(`✅ Usando escandallos proporcionados (${opciones.escandallos.length} total, ${escandallos.length} del plato)`);
    } else {
      // Cargar desde API (desde seleccionar plato)
      const escResponse = await fetch(`${API_BASE}/escandallos/plato/${plato.codigo}`);
      if (escResponse.ok) {
        const escResult = await escResponse.json();
        escandallos = extractAPIData(escResult) || [];
        console.log(`✅ Escandallos cargados desde API: ${escandallos.length}`);
      } else {
        console.warn(`⚠️ No se pudieron cargar escandallos del plato ${plato.codigo}`);
      }
    }
    
    console.log(`📊 Total escandallos a procesar: ${escandallos.length}`, escandallos.slice(0, 3));
    
    // Calcular métricas
    const costeTotal = escandallos.reduce((sum, e) => sum + (parseFloat(e.coste_calculado) || parseFloat(e.coste) || 0), 0);
    const pesoNeto = calcularPesoNeto(escandallos);
    const precioVenta = parseFloat(plato.precio_venta) || 0;
    const margen = precioVenta > 0 && costeTotal > 0 ? ((precioVenta - costeTotal) / precioVenta * 100) : 0;
    
    // Detectar alérgenos
    const alergenos = await detectarAlergenosEscandallo(escandallos);
    
    // Marcar checkboxes de alérgenos automáticamente (esperar a que carguen los personalizados)
    setTimeout(async () => {
      await marcarAlergenosAutomaticamente(alergenos);
    }, 500);
    
    // Crear sección informativa
    const platoSelect = document.querySelector('select[name="plato_id"]');
    if (!platoSelect) return escandallos;
    
    const formGroup = platoSelect.closest('.form-group');
    if (!formGroup) return escandallos;
    
    const infoDiv = document.createElement('div');
    infoDiv.id = 'info-plato-seleccionado';
    infoDiv.style.cssText = 'margin-top: 15px;';
    
    if (escandallos && escandallos.length > 0) {
      const ingredientesLinks = escandallos.slice(0, 3).map(e => 
        `<strong>${e.ingrediente_nombre || 'Ingrediente'}</strong>`
      ).join(', ');
      
      const masIngredientes = escandallos.length > 3 ? ` y ${escandallos.length - 3} más` : '';
      
      infoDiv.innerHTML = `
        <div class="info-section" style="padding: 15px; margin-bottom: 0;">
          <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 6px; color: white;">
            <div style="font-size: 0.95em; margin-bottom: 8px;">
              ℹ️ <strong>Este escandallo incluye ${escandallos.length} ingrediente(s)</strong>
            </div>
            <div style="font-size: 0.85em; opacity: 0.9; margin-bottom: 10px;">
              ${ingredientesLinks}${masIngredientes}
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.3);">
              ${costeTotal > 0 ? `
                <div style="text-align: center;">
                  <div style="font-size: 0.75em; opacity: 0.9;">💰 Coste</div>
                  <div style="font-weight: 700; font-size: 1.1em;">${formatDecimal(costeTotal)}€</div>
                </div>
              ` : ''}
              ${pesoNeto > 0 ? `
                <div style="text-align: center;">
                  <div style="font-size: 0.75em; opacity: 0.9;">⚖️ Peso Neto</div>
                  <div style="font-weight: 700; font-size: 1.1em;">${formatDecimal(pesoNeto)} kg</div>
                  <div style="background: #d4edda; color: #155724; padding: 2px 8px; border-radius: 3px; font-size: 0.65em; display: inline-block; margin-top: 4px; font-weight: 600;">Automático</div>
                </div>
              ` : ''}
              ${margen > 0 ? `
                <div style="text-align: center;">
                  <div style="font-size: 0.75em; opacity: 0.9;">📊 Margen</div>
                  <div style="font-weight: 700; font-size: 1.1em; color: ${margen > 60 ? '#4caf50' : margen > 40 ? '#ffc107' : '#ff5252'};">${formatDecimal(margen)}%</div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        ${alergenos.length > 0 ? `
          <div class="warning-section" style="margin-top: 15px;">
            <h4>⚠️ Alérgenos detectados automáticamente:</h4>
            <div class="warning-section-content">
              ${alergenos.map(a => `<span class="warning-badge">${a}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      `;
    } else {
      infoDiv.innerHTML = `
        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; border-radius: 4px; color: #1976d2; font-size: 0.9em;">
          <strong>✨ Nuevo escandallo</strong> - Este plato aún no tiene ingredientes definidos
        </div>
      `;
    }
    
    formGroup.after(infoDiv);
    
    // Cargar ingredientes existentes en el nuevo formulario elegante
    const esperarYCargar = async () => {
      const filasContainer = document.getElementById('filas-edicion-container');
      const btnAgregar = document.getElementById('btn-agregar-ingrediente-escandallo');
      
      if (!filasContainer || !btnAgregar) {
        console.log('⏳ Esperando a que se renderice el formulario...');
        setTimeout(esperarYCargar, 200);
        return;
      }
      
      console.log(`✅ Formulario renderizado. Escandallos a cargar:`, escandallos);
      
      if (escandallos.length === 0) {
        console.log('ℹ️ No hay ingredientes previos');
        return;
      }
      
      // Cargar ingredientes secuencialmente
      for (let idx = 0; idx < escandallos.length; idx++) {
        const esc = escandallos[idx];
        console.log(`📝 Procesando ingrediente ${idx + 1}/${escandallos.length}:`, esc);
        
        // Agregar fila
        btnAgregar.click();
        
        // Esperar a que se cree la fila
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const filas = filasContainer.querySelectorAll('.fila-edicion');
        const fila = filas[idx];
        
        if (!fila) {
          console.error(`❌ No se creó la fila ${idx + 1}`);
          continue;
        }
        
        // Buscar elementos
        const select = fila.querySelector('select[name*="ingrediente_id"]');
        const inputCant = fila.querySelector('input[name*="cantidad"]');
        const selectUni = fila.querySelector('select[name*="unidad"]');
        
        if (!select || !inputCant || !selectUni) {
          console.error(`❌ No se encontraron los elementos de la fila ${idx + 1}`);
          continue;
        }
        
        // Esperar a que se carguen las opciones del select
        let intentos = 0;
        while (select.options.length <= 1 && intentos < 30) {
          await new Promise(resolve => setTimeout(resolve, 100));
          intentos++;
        }
        
        if (select.options.length <= 1) {
          console.error(`❌ No se cargaron las opciones del select en la fila ${idx + 1}`);
          continue;
        }
        
        console.log(`  ✅ Opciones cargadas: ${select.options.length} ingredientes disponibles`);
        console.log(`  🔎 Buscando ingrediente_id: ${esc.ingrediente_id} (tipo: ${typeof esc.ingrediente_id})`);
        
        // Convertir a string para comparación
        const idBuscado = String(esc.ingrediente_id);
        
        // Seleccionar ingrediente
        let opcionEncontrada = false;
        for (let i = 0; i < select.options.length; i++) {
          if (String(select.options[i].value) === idBuscado) {
            select.selectedIndex = i;
            opcionEncontrada = true;
            console.log(`  ✅ Ingrediente seleccionado: ${select.options[i].text} (ID: ${esc.ingrediente_id})`);
            break;
          }
        }
        
        if (!opcionEncontrada) {
          console.error(`❌ ID ${esc.ingrediente_id} no encontrado en select. Nombre: ${esc.ingrediente_nombre}`);
          console.warn(`   ⚠️ Posible causa: ingrediente eliminado o tipo_entidad excluido del select`);
          
          // Buscar si existe en la BD
          try {
            const checkResp = await fetch(`/api/ingredientes/${esc.ingrediente_id}`);
            if (checkResp.ok) {
              const checkData = await checkResp.json();
              const ing = checkData.data || checkData;
              console.warn(`   📌 El ingrediente SÍ existe en BD: ${ing.nombre} (tipo: ${ing.tipo_entidad})`);
              console.warn(`   💡 Puede que el select no cargue ingredientes tipo "${ing.tipo_entidad}"`);
            } else {
              console.error(`   ❌ El ingrediente NO existe en la base de datos`);
            }
          } catch (err) {
            console.error(`   Error verificando ingrediente:`, err);
          }
          
          continue;
        }
        
        // Llenar cantidad
        inputCant.value = esc.cantidad;
        console.log(`  ✅ Cantidad: ${esc.cantidad}`);
        
        // Llenar unidad
        if (esc.unidad) {
          const unidadNormalizada = esc.unidad.charAt(0).toUpperCase() + esc.unidad.slice(1).toLowerCase();
          selectUni.value = unidadNormalizada;
          console.log(`  ✅ Unidad: ${unidadNormalizada}`);
        }
        
        // Disparar eventos para calcular costes
        select.dispatchEvent(new Event('change', { bubbles: true }));
        inputCant.dispatchEvent(new Event('input', { bubbles: true }));
        selectUni.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Pequeña pausa entre ingredientes
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log('✅ Todos los ingredientes cargados');
      
      // Marcar alérgenos después de todo
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('🔍 Marcando alérgenos...');
      if (alergenos && alergenos.length > 0) {
        await marcarAlergenosAutomaticamente(alergenos);
      }
    };
    
    esperarYCargar();
    
    return escandallos;
  } catch (error) {
    console.error('Error al cargar escandallo existente:', error);
    return [];
  }
}

// Marcar checkboxes de alérgenos automáticamente
async function marcarAlergenosAutomaticamente(alergenos) {
  const mapeoCheckboxes = {
    'Gluten': 'gluten',
    'Cereales': 'cereales',
    'Lácteos': 'lacteos',
    'Huevo': 'huevo',
    'Pescado': 'pescado',
    'Mariscos': 'mariscos',
    'Marisco': 'mariscos',
    'Crustáceos': 'crustaceos',
    'Moluscos': 'moluscos',
    'Frutos secos': 'frutos_secos',
    'Cacahuetes': 'cacahuetes',
    'Soja': 'soja',
    'Sésamo': 'sesamo',
    'Apio': 'apio',
    'Mostaza': 'mostaza',
    'Sulfitos': 'sulfitos',
    'Altramuces': 'altramuces',
    'Ajo': 'ajo'
  };

  // Cargar alérgenos personalizados para agregar al mapeo dinámicamente
  const alergenosPersonalizados = await cargarAlergenosPersonalizados();
  alergenosPersonalizados.forEach(ap => {
    if (ap.nombre) {
      // Convertir nombre a formato de ID: "Chile Picante" → "chile_picante"
      const idCheckbox = ap.nombre.toLowerCase().replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u')
        .replace(/ñ/g, 'n').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      mapeoCheckboxes[ap.nombre] = idCheckbox;
    }
  });

  alergenos.forEach(alergeno => {
    const checkboxName = mapeoCheckboxes[alergeno];
    if (checkboxName) {
      const checkbox = document.getElementById(`alergeno_${checkboxName}`);
      if (checkbox) {
        checkbox.checked = true;
        // Actualizar estilo del label
        const label = checkbox.closest('label');
        if (label) {
          label.style.borderColor = '#2c5f8d';
          label.style.background = '#e3f2fd';
        }
      }
    }
  });
}

// Calcular peso neto automáticamente desde ingredientes
function calcularPesoNeto(escandallos) {
  if (!escandallos || escandallos.length === 0) return 0;
  
  let pesoTotal = 0;
  
  escandallos.forEach(esc => {
    const cantidad = parseFloat(esc.cantidad) || 0;
    const unidad = (esc.unidad || '').toLowerCase();
    
    // Convertir todo a kg
    if (unidad === 'kg' || unidad === 'kilo' || unidad === 'kilos') {
      pesoTotal += cantidad;
    } else if (unidad === 'g' || unidad === 'gr' || unidad === 'gramo' || unidad === 'gramos') {
      pesoTotal += cantidad / 1000;
    } else if (unidad === 'l' || unidad === 'lt' || unidad === 'litro' || unidad === 'litros') {
      pesoTotal += cantidad; // Asumimos 1L ≈ 1kg para líquidos
    } else if (unidad === 'ml' || unidad === 'mililitro' || unidad === 'mililitros') {
      pesoTotal += cantidad / 1000;
    }
    // Unidades (Ud) no se cuentan en peso
  });
  
  return pesoTotal;
}

// Detectar alérgenos desde ingredientes
async function detectarAlergenosEscandallo(escandallos) {
  if (!escandallos || escandallos.length === 0) return [];
  
  const alergenosSet = new Set();
  
  // Obtener alérgenos de cada ingrediente desde la base de datos
  for (const esc of escandallos) {
    if (!esc.ingrediente_id) continue;
    
    try {
      const response = await fetch(`${API_BASE}/ingredientes/${esc.ingrediente_id}`);
      if (response.ok) {
        const result = await response.json();
        const ingrediente = result.data || result;
        
        // Si el ingrediente tiene alérgenos registrados, agregarlos
        if (ingrediente.alergenos && Array.isArray(ingrediente.alergenos)) {
          ingrediente.alergenos.forEach(alergeno => {
            if (alergeno && alergeno.trim()) {
              alergenosSet.add(alergeno.trim());
            }
          });
        }
        
        // Cargar alérgenos personalizados del ingrediente
        const alergenosPersonalizadosResponse = await fetch(`${API_BASE}/ingredientes/${esc.ingrediente_id}/alergenos-personalizados`);
        if (alergenosPersonalizadosResponse.ok) {
          const alergenosPersonalizados = await alergenosPersonalizadosResponse.json();
          if (Array.isArray(alergenosPersonalizados)) {
            alergenosPersonalizados.forEach(ap => {
              if (ap.nombre) {
                alergenosSet.add(ap.nombre);
              }
            });
          }
        }
      }
    } catch (error) {
      console.warn(`No se pudieron cargar alérgenos del ingrediente ${esc.ingrediente_id}:`, error);
    }
  }
  
  // Cargar alérgenos personalizados y agregarlos al mapeo para detección por palabras clave
  const alergenosPersonalizados = await cargarAlergenosPersonalizados();
  const mapeoAlergenos = {
    'Gluten': ['trigo', 'harina', 'pan', 'pasta', 'centeno', 'cebada', 'avena', 'espelta', 'kamut'],
    'Cereales': ['cereal', 'arroz', 'maíz', 'quinoa'],
    'Lácteos': ['leche', 'lactosa', 'queso', 'yogur', 'mantequilla', 'nata', 'crema', 'requesón', 'suero'],
    'Huevo': ['huevo', 'yema', 'clara', 'ovoproducto', 'albúmina', 'lisozima'],
    'Pescado': ['pescado', 'merluza', 'salmón', 'atún', 'bacalao', 'anchoa', 'boquerón'],
    'Mariscos': ['marisco', 'gamba', 'langostino', 'mejillón', 'almeja', 'calamar', 'sepia', 'pulpo'],
    'Crustáceos': ['cangrejo', 'langosta', 'bogavante', 'camarón', 'cigala', 'nécora'],
    'Moluscos': ['caracol', 'babosa', 'calamar', 'sepia', 'pulpo', 'mejillón', 'almeja', 'ostra'],
    'Frutos secos': ['nuez', 'almendra', 'avellana', 'pistacho', 'anacardo', 'nuez de macadamia', 'pacana'],
    'Cacahuetes': ['cacahuete', 'maní', 'cacahuate'],
    'Soja': ['soja', 'tofu', 'edamame', 'tamari', 'miso', 'salsa de soja'],
    'Sésamo': ['sésamo', 'ajonjolí', 'tahini', 'tahina'],
    'Apio': ['apio', 'apio-nabo'],
    'Mostaza': ['mostaza'],
    'Sulfitos': ['vino', 'vinagre', 'sulfito', 'azufre'],
    'Altramuces': ['altramuz', 'lupino']
  };
  
  // Agregar alérgenos personalizados al mapeo usando su descripción como palabras clave
  alergenosPersonalizados.forEach(ap => {
    if (ap.nombre && ap.descripcion) {
      // Usar palabras de la descripción como keywords
      const palabrasClave = ap.descripcion.toLowerCase().split(/[\s,;.]+/).filter(p => p.length > 3);
      // Agregar el nombre en minúsculas
      palabrasClave.push(ap.nombre.toLowerCase());
      mapeoAlergenos[ap.nombre] = palabrasClave;
    }
  });
  
  // Si no hay suficientes alérgenos en BD, complementar con detección por palabras clave
  escandallos.forEach(esc => {
    const nombre = (esc.ingrediente_nombre || '').toLowerCase();
    
    Object.keys(mapeoAlergenos).forEach(alergeno => {
      const palabras = mapeoAlergenos[alergeno];
      if (palabras.some(palabra => nombre.includes(palabra))) {
        alergenosSet.add(alergeno);
      }
    });
  });
  
  console.log('🔍 Alérgenos detectados:', Array.from(alergenosSet));
  return Array.from(alergenosSet);
}

/**
 * ============================================================================
 * MOSTRAR PRODUCCIÓN
 * ============================================================================
 */
function mostrarProduccion(produccion = null) {
  try {
    if (!produccion) {
      produccion = estadoApp.produccion || [];
    }

    const seccion = document.getElementById('produccion-section');
    if (seccion) {
      console.log('📊 Mostrando producción:', produccion.length, 'órdenes');
      // Aquí iría la lógica de renderizado específica
      // Por ahora se actualiza desde el módulo frontend
    }
  } catch (error) {
    console.error('Error en mostrarProduccion:', error);
  }
}

/**
 * ============================================================================
 * MOSTRAR SANIDAD (APPCC)
 * ============================================================================
 */
function mostrarSanidad(sanidad = null) {
  try {
    if (!sanidad) {
      sanidad = estadoApp.sanidad || [];
    }

    const seccion = document.getElementById('sanidad-section');
    if (seccion) {
      console.log('📊 Mostrando sanidad:', sanidad.length ? 'datos cargados' : 'sin datos');
      // Aquí iría la lógica de renderizado específica
      // Por ahora se actualiza desde el módulo frontend
    }
  } catch (error) {
    console.error('Error en mostrarSanidad:', error);
  }
}

// Exportar funciones
window.guardarEscandalloMultiple = guardarEscandalloMultiple;
window.cargarEscandalloExistente = cargarEscandalloExistente;
window.seleccionarTodosLosRegistros = seleccionarTodosLosRegistros;
window.mostrarProduccion = mostrarProduccion;
window.mostrarSanidad = mostrarSanidad;
