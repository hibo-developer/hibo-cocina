// HIBO COCINA - APP.JS
// Application controller

const API_BASE = '/api';

// Estado global
let estadoApp = {
  platosCacheado: false,
  pedidosCacheado: false,
  platosData: [],
  pedidosData: [],
  paginacion: {
    platos: { pagina: 1, porPagina: 10, seleccionados: [] },
    ingredientes: { pagina: 1, porPagina: 10, seleccionados: [] },
    escandallos: { pagina: 1, porPagina: 10, seleccionados: [] },
    inventario: { pagina: 1, porPagina: 10, seleccionados: [] },
    pedidos: { pagina: 1, porPagina: 10, seleccionados: [] },
    partidas: { pagina: 1, porPagina: 10, seleccionados: [] }
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
    const modal = document.getElementById('modal');
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
  }
}

// ==================== DASHBOARD ====================
async function cargarDashboard() {
  try {
    // Cargar datos en paralelo
    const [statsPlatos, statsPedidos] = await Promise.all([
      fetch(`${API_BASE}/platos/estadisticas`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API_BASE}/pedidos/estadisticas`).then(r => r.json()).catch(() => ({ data: [] }))
    ]);

    // Actualizar métricas con verificación de elementos
    const totalPlatosEl = document.getElementById('totalPlatos');
    if (totalPlatosEl) {
      totalPlatosEl.textContent = (statsPlatos.data || []).reduce((s, g) => s + g.cantidad, 0) || 0;
    }

    const pedidosPendientes = (statsPedidos.data || []).find(p => p.estado === 'pendiente');
    const totalPendientesEl = document.getElementById('totalPedidosPendientes');
    if (totalPendientesEl) {
      totalPendientesEl.textContent = pedidosPendientes?.cantidad || 0;
    }

    const pedidosProduccion = (statsPedidos.data || []).find(p => p.estado === 'produccion');
    const totalProduccionEl = document.getElementById('totalPedidosProduccion');
    if (totalProduccionEl) {
      totalProduccionEl.textContent = pedidosProduccion?.cantidad || 0;
    }

    const total = (statsPedidos.data || []).reduce((s, p) => s + (p.total_acumulado || 0), 0);
    const valorTotalEl = document.getElementById('valorTotalPedidos');
    if (valorTotalEl) {
      valorTotalEl.textContent = '€' + total.toFixed(2);
    }

    // Grupos populares
    const topGrupos = (statsPlatos.data || []).slice(0, 5);
    const topGruposHtml = topGrupos.map(g => `
      <div class="stat-item">
        <strong>${g.grupo_menu}:</strong> ${g.cantidad} platos (Promedio: €${g.coste_promedio})
      </div>
    `).join('');
    
    const topGruposEl = document.getElementById('topGrupos');
    if (topGruposEl) {
      topGruposEl.innerHTML = topGruposHtml || '<p>Sin datos</p>';
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
    estadoApp.platosData = result.data || [];

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
        <td>€${(plato.coste || 0).toFixed(2)}</td>
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
  const search = document.getElementById('searchPlatos').value.toLowerCase();
  const grupo = document.getElementById('filterGrupo').value;

  const filtrados = estadoApp.platosData.filter(plato => {
    const matchSearch = !search || plato.nombre.toLowerCase().includes(search) || plato.codigo.toLowerCase().includes(search);
    const matchGrupo = !grupo || plato.grupo_menu === grupo;
    return matchSearch && matchGrupo;
  });

  mostrarPlatos(filtrados);
}

async function abrirModalPlato(platoId = null) {
  const modal = document.getElementById('modal');
  document.getElementById('modalTitle').textContent = platoId ? 'Editar Plato' : 'Nuevo Plato';

  const fields = `
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
      <input type="text" id="grupo_menu">
    </div>
    <div>
      <label>Unidad:</label>
      <input type="text" id="unidad" value="Ud">
    </div>
    <div>
      <label>Coste (€):</label>
      <input type="number" id="coste" step="0.01" value="0">
    </div>
    <div>
      <label>Peso Raciones (g):</label>
      <input type="number" id="peso_raciones" step="0.1" value="0">
    </div>
    <div>
      <label>Cocina:</label>
      <input type="text" id="cocina">
    </div>
    <div>
      <label>Preparación:</label>
      <input type="text" id="preparacion">
    </div>
    <div>
      <label>
        <input type="checkbox" id="stock_activo">
        Stock Activo
      </label>
    </div>
  `;

  document.getElementById('modalFields').innerHTML = fields;

  if (platoId) {
    const plato = estadoApp.platosData.find(p => p.id === platoId);
    if (plato) {
      document.getElementById('codigo').value = plato.codigo;
      document.getElementById('nombre').value = plato.nombre;
      document.getElementById('grupo_menu').value = plato.grupo_menu || '';
      document.getElementById('unidad').value = plato.unidad || 'Ud';
      document.getElementById('coste').value = plato.coste || 0;
      document.getElementById('peso_raciones').value = plato.peso_raciones || 0;
      document.getElementById('cocina').value = plato.cocina || '';
      document.getElementById('preparacion').value = plato.preparacion || '';
      document.getElementById('stock_activo').checked = plato.stock_activo;
    }
  }

  document.getElementById('modalForm').onsubmit = () => guardarPlato(platoId);
  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
}

async function guardarPlato(platoId) {
  event.preventDefault();

  const datos = {
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
    estadoApp.pedidosData = result.data || [];

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
        <td>€${(pedido.total || 0).toFixed(2)}</td>
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
  const search = document.getElementById('searchPedidos').value.toLowerCase();
  const estado = document.getElementById('filterEstado').value;

  const filtrados = estadoApp.pedidosData.filter(pedido => {
    const matchSearch = !search || pedido.cliente_codigo.toLowerCase().includes(search) || pedido.numero.toLowerCase().includes(search);
    const matchEstado = !estado || pedido.estado === estado;
    return matchSearch && matchEstado;
  });

  mostrarPedidos(filtrados);
}

async function abrirModalPedido() {
  const modal = document.getElementById('modal');
  document.getElementById('modalTitle').textContent = 'Nuevo Pedido';

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

  document.getElementById('modalFields').innerHTML = fields;
  document.getElementById('modalForm').onsubmit = guardarPedido;
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
Total: €${pedido.total}
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
      fetch(`${API_BASE}/platos/estadisticas`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API_BASE}/pedidos/estadisticas`).then(r => r.json()).catch(() => ({ data: [] }))
    ]);

    // Estadísticas de platos
    const statsPlatos_html = (statsPlatos.data || []).map(g => `
      <div class="stat-item" style="padding: 8px 0; border-bottom: 1px solid #eee;">
        <strong>${g.grupo_menu}:</strong> ${g.cantidad} platos | Promedio: €${g.coste_promedio}
      </div>
    `).join('');
    document.getElementById('statsPlatos').innerHTML = statsPlatos_html || '<p>Sin datos</p>';

    // Estadísticas de pedidos
    const statsPedidos_html = (statsPedidos.data || []).map(p => `
      <div class="stat-item" style="padding: 8px 0; border-bottom: 1px solid #eee;">
        <strong>${p.estado}:</strong> ${p.cantidad} pedidos | Promedio: €${p.promedio_total} | Total: €${p.total_acumulado}
      </div>
    `).join('');
    document.getElementById('statsPedidos').innerHTML = statsPedidos_html || '<p>Sin datos</p>';

    // Costos por grupo
    const costosHtml = (statsPlatos.data || []).map(g => `
      <div class="stat-item" style="padding: 8px 0;">
        ${g.grupo_menu}: €${g.coste_promedio}
      </div>
    `).join('');
    document.getElementById('statsCostos').innerHTML = costosHtml || '<p>Sin datos</p>';

  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
}

// ==================== UTILIDADES ====================

function abrirModal(titulo, fields, callback) {
  document.getElementById('modalTitle').textContent = titulo;
  document.getElementById('modalFields').innerHTML = fields;
  document.getElementById('modal').style.display = 'block';
  window.modalCallback = callback;
}

function cerrarModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modalForm').reset();
  window.modalCallback = null;
  
  // Restaurar scroll del body
  document.body.classList.remove('modal-open');
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
    // Cargar partidas primero
    await cargarPartidas();
    
    // Inicializar tabs
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.textContent.toLowerCase().includes('partidas') ? 'partidas' :
                    btn.textContent.toLowerCase().includes('trazabilidad') ? 'trazabilidad' : 'resumen';
        cambiarTab(tab);
      });
    });

    // Activar el primer tab por defecto
    cambiarTab('partidas');

    // Botones
    document.getElementById('btnNuevaTrazabilidad')?.addEventListener('click', abrirModalTrazabilidad);
    document.getElementById('btnNuevaPartida')?.addEventListener('click', abrirModalPartida);

    // Filtros
    document.getElementById('searchTrazabilidad')?.addEventListener('input', filtrarTrazabilidad);
    document.getElementById('filterFechaTraz')?.addEventListener('change', filtrarTrazabilidad);

    // Cargar datos de trazabilidad
    await cargarTrazabilidad();
    await cargarResumenProduccion();
  } catch (error) {
    console.error('Error cargando producción:', error);
    mostrarError('Error al cargar producción');
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
    const response = await fetch(`${API_BASE}/partidas-cocina`);
    const data = await response.json();

    const tbody = document.getElementById('partidasTableBody');
    const paginacionDiv = document.getElementById('partidas-paginacion');
    tbody.innerHTML = '';

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No hay partidas registradas</td></tr>';
      if (paginacionDiv) paginacionDiv.innerHTML = '';
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
  mostrarError('Función en desarrollo');
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
  mostrarError('Función en desarrollo');
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
    
    const ingredientes = await response.json();
    const tbody = document.getElementById('ingredientesTableBody');
    const paginacionDiv = document.getElementById('ingredientes-paginacion');
    
    if (ingredientes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay ingredientes registrados</td></tr>';
      if (paginacionDiv) paginacionDiv.innerHTML = '';
      return;
    }

    const ingredientesPaginados = paginar(ingredientes, 'ingredientes');
    const idsVisibles = ingredientesPaginados.map(i => i.id);
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
    `}).join('');

    if (paginacionDiv) {
      paginacionDiv.innerHTML = renderizarPaginacion(ingredientes.length, 'ingredientes', 'cargarIngredientes');
    }

    actualizarBotonEliminarMasivo('ingredientes');
  } catch (error) {
    console.error('Error al cargar ingredientes:', error);
    mostrarError('Error al cargar ingredientes: ' + error.message);
  }
}

async function editarIngrediente(id) {
  mostrarError('Función en desarrollo');
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
    
    const escandallos = await response.json();
    const tbody = document.getElementById('escandallosTableBody');
    const paginacionDiv = document.getElementById('escandallos-paginacion');
    
    if (escandallos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay escandallos registrados</td></tr>';
      if (paginacionDiv) paginacionDiv.innerHTML = '';
      return;
    }

    const escandallosPaginados = paginar(escandallos, 'escandallos');
    const idsVisibles = escandallosPaginados.map(e => e.id);
    const seleccionados = estadoApp.paginacion.escandallos.seleccionados;

    tbody.innerHTML = escandallosPaginados.map(esc => {
      const platoNombre = esc.plato_nombre || `Plato #${esc.plato_id}`;
      const ingredienteNombre = esc.ingrediente_nombre || `Ingrediente #${esc.ingrediente_id}`;
      const checked = seleccionados.includes(esc.id) ? 'checked' : '';
      
      return `
        <tr>
          <td><input type="checkbox" id="check-escandallos-${esc.id}" ${checked} onchange="toggleSeleccion('escandallos', ${esc.id})"></td>
          <td>${esc.id}</td>
          <td>${platoNombre}</td>
          <td>${ingredienteNombre}</td>
          <td>${esc.cantidad || 0}</td>
          <td>${esc.unidad || '-'}</td>
          <td>€${(esc.coste || 0).toFixed(2)}</td>
          <td>
            <button class="btn-icon" onclick="editarEscandallo(${esc.id})" title="Editar">✏️</button>
            <button class="btn-icon" onclick="verDetalleEscandallo(${esc.id})" title="Ver detalle">👁️</button>
            <button class="btn-icon" onclick="eliminarEscandallo(${esc.id})" title="Eliminar">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');

    if (paginacionDiv) {
      paginacionDiv.innerHTML = renderizarPaginacion(escandallos.length, 'escandallos', 'cargarEscandallos');
    }

    actualizarBotonEliminarMasivo('escandallos');
  } catch (error) {
    console.error('Error al cargar escandallos:', error);
    mostrarError('Error al cargar escandallos: ' + error.message);
  }
}

async function editarEscandallo(id) {
  mostrarError('Función en desarrollo');
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
    
    const inventario = await response.json();
    const tbody = document.getElementById('inventarioTableBody');
    const paginacionDiv = document.getElementById('inventario-paginacion');
    
    if (inventario.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center">No hay registros de inventario</td></tr>';
      if (paginacionDiv) paginacionDiv.innerHTML = '';
      return;
    }

    const inventarioPaginado = paginar(inventario, 'inventario');
    const idsVisibles = inventarioPaginado.map(i => i.id);
    const seleccionados = estadoApp.paginacion.inventario.seleccionados;

    tbody.innerHTML = inventarioPaginado.map(inv => {
      const stockActual = inv.cantidad || 0;
      const articulo = inv.nombre || inv.articulo || `ID: ${inv.articulo_id}`;
      const codigo = inv.codigo || inv.codigo_interno || '-';
      const checked = seleccionados.includes(inv.id) ? 'checked' : '';
      
      return `
        <tr>
          <td><input type="checkbox" id="check-inventario-${inv.id}" ${checked} onchange="toggleSeleccion('inventario', ${inv.id})"></td>
          <td>${codigo}</td>
          <td>${articulo}</td>
          <td>-</td>
          <td>-</td>
          <td><strong>${stockActual.toFixed(2)}</strong></td>
          <td>-</td>
          <td>-</td>
          <td><span class="stock-normal">📊 Registrado</span></td>
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
  } catch (error) {
    console.error('Error al cargar inventario:', error);
    mostrarError('Error al cargar inventario: ' + error.message);
  }
}

async function editarInventario(id) {
  mostrarError('Función en desarrollo');
}

async function verDetalleInventario(id) {
  mostrarError('Función en desarrollo');
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
  mostrarError('Función en desarrollo');
}

async function verDetalleEscandallo(id) {
  mostrarError('Función en desarrollo');
}

async function verDetallePlato(id) {
  mostrarError('Función en desarrollo');
}

async function editarPedido(id) {
  mostrarError('Función en desarrollo');
}

// ==================== PAGINACIÓN ====================
function paginar(datos, tabla) {
  const config = estadoApp.paginacion[tabla];
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
        <button class="btn-pag" onclick="cambiarPagina('${tabla}', 1, ${callbackRecargar})" ${config.pagina === 1 ? 'disabled' : ''}>
          ⏮️ Primera
        </button>
        <button class="btn-pag" onclick="cambiarPagina('${tabla}', ${config.pagina - 1}, ${callbackRecargar})" ${config.pagina === 1 ? 'disabled' : ''}>
          ◀️ Anterior
        </button>
        <span class="pagination-current">Página ${config.pagina} de ${totalPaginas}</span>
        <button class="btn-pag" onclick="cambiarPagina('${tabla}', ${config.pagina + 1}, ${callbackRecargar})" ${config.pagina >= totalPaginas ? 'disabled' : ''}>
          Siguiente ▶️
        </button>
        <button class="btn-pag" onclick="cambiarPagina('${tabla}', ${totalPaginas}, ${callbackRecargar})" ${config.pagina >= totalPaginas ? 'disabled' : ''}>
          Última ⏭️
        </button>
      </div>
    </div>
  `;
}

function cambiarPagina(tabla, nuevaPagina, recargar) {
  estadoApp.paginacion[tabla].pagina = nuevaPagina;
  if (recargar) eval(recargar + '()');
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
  const seleccionados = estadoApp.paginacion[tabla].seleccionados;
  const checkbox = event.target;
  
  if (checkbox.checked) {
    ids.forEach(id => {
      if (!seleccionados.includes(id)) {
        seleccionados.push(id);
      }
    });
  } else {
    ids.forEach(id => {
      const index = seleccionados.indexOf(id);
      if (index > -1) {
        seleccionados.splice(index, 1);
      }
    });
  }
  
  // Actualizar checkboxes individuales
  ids.forEach(id => {
    const cb = document.getElementById(`check-${tabla}-${id}`);
    if (cb) cb.checked = checkbox.checked;
  });
  
  actualizarBotonEliminarMasivo(tabla);
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
  
  estadoApp.paginacion[tabla].seleccionados = [];
  
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
  }
  }
}

async function verDetalleTrazabilidad(id) {
  mostrarError('Función en desarrollo');
}

async function verDetallePartida(id) {
  mostrarError('Función en desarrollo');
}

// Exportar funciones globales
window.inicializarApp = inicializarApp;
window.cambiarSeccion = cambiarSeccion;
