/**
 * Ejemplos de integración de Modales Dinámicos en HIBO COCINA
 * Agregar estos botones a las secciones correspondientes
 */

// ============================================================================
// 1. SECCIÓN PRODUCCIÓN - MODALES DINÁMICOS
// ============================================================================

// Agregar a la sección de Producción estos botones de acción:
const botonesProduccion = `
<div class="production-actions">
  <button class="btn btn-primary" onclick="abrirModalDinamico('produccion')">
    📦 Registrar Producción (Trazabilidad)
  </button>
  <button class="btn btn-secondary" onclick="abrirModalDinamico('partida_cocina')">
    🔪 Nueva Partida Cocina
  </button>
  <button class="btn btn-secondary" onclick="abrirModalDinamico('sanidad')">
    🧪 Control Sanidad (APPCC)
  </button>
</div>
`;

// ============================================================================
// 2. SECCIÓN PLATOS - MODALES DINÁMICOS
// ============================================================================

const botonesPlatos = `
<div class="platos-actions">
  <button class="btn btn-primary" onclick="abrirModalDinamico('plato')">
    🍽️ Nuevo Plato
  </button>
  <button class="btn btn-secondary" onclick="abrirModalDinamico('escandallo')">
    📖 Nueva Receta (Escandallo)
  </button>
  <button class="btn btn-secondary" onclick="abrirModalDinamico('articulo')">
    📦 Nuevo Artículo
  </button>
</div>
`;

// ============================================================================
// 3. SECCIÓN PEDIDOS - MODALES DINÁMICOS
// ============================================================================

const botonesPedidos = `
<div class="pedidos-actions">
  <button class="btn btn-primary" onclick="abrirModalDinamico('pedido')">
    📋 Nuevo Pedido
  </button>
  <button class="btn btn-secondary" onclick="abrirModalDinamico('evento')">
    🎉 Nuevo Evento
  </button>
</div>
`;

// ============================================================================
// 4. EJEMPLOS DE EJECUCIÓN: CÓMO LLAMAR A LOS MODALES
// ============================================================================

/**
 * Ejemplo 1: Abrir modal de producción
 */
async function registrarNuevaProduccion() {
  await abrirModalDinamico('produccion');
  // El modal se abre, usuario llena datos
  // Al guardar, se envía a /api/trazabilidad
}

/**
 * Ejemplo 2: Abrir modal de escandallo directamente de un plato
 */
async function crearRecetaParaPlato(codigoPlato) {
  // Podríamos pre-llenar el código del plato
  const modal = new ModalDinamico('escandallo');
  const htmlModal = await modal.render();
  
  // Pre-llenar campo
  htmlModal.querySelector('[name="codigo_plato"]').value = codigoPlato;
  
  document.body.appendChild(htmlModal);
}

/**
 * Ejemplo 3: Abrir modal de control sanidad desde un lote
 */
async function registrarControlSanidad(loteProduccion) {
  const modal = new ModalDinamico('sanidad');
  const htmlModal = await modal.render();
  
  // Pre-llenar lote
  const inputLote = htmlModal.querySelector('[name="lote_produccion"]');
  if (inputLote) {
    inputLote.value = loteProduccion;
    inputLote.dispatchEvent(new Event('change'));  // Trigger auto-fill
  }
  
  document.body.appendChild(htmlModal);
}

// ============================================================================
// 5. INTEGRACIÓN CON TABLA DINÁMICA
// ============================================================================

/**
 * Mostrar botón "Registrar Control Sanidad" en tabla de Trazabilidad
 */
function renderTrazabilidadConAcciones(datos) {
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Lote</th>
          <th>Plato</th>
          <th>Fecha</th>
          <th>Partida</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${datos.map(item => `
          <tr>
            <td>${item.lote_produccion}</td>
            <td>${item.codigo_plato}</td>
            <td>${new Date(item.fecha_produccion).toLocaleDateString('es-ES')}</td>
            <td>${item.partida_cocina}</td>
            <td><span class="status-badge status-${item.estado}">${item.estado}</span></td>
            <td>
              <button onclick="registrarControlSanidad('${item.lote_produccion}')" 
                      class="btn-small btn-sanidad">🧪 Control</button>
              <button onclick="editarTrazabilidad(${item.id})" 
                      class="btn-small btn-edit">✏️ Editar</button>
              <button onclick="eliminarTrazabilidad(${item.id})" 
                      class="btn-small btn-delete">🗑️ Eliminar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Mostrar botón "Crear Escandallo" en tabla de Platos
 */
function renderPlatosConAcciones(datos) {
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nombre</th>
          <th>Grupo</th>
          <th>Preparación</th>
          <th>Coste</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${datos.map(item => `
          <tr>
            <td>${item.codigo}</td>
            <td>${item.nombre}</td>
            <td>${item.grupo_menu}</td>
            <td>${item.preparacion}</td>
            <td>€${item.coste_racion.toFixed(2)}</td>
            <td>
              <button onclick="crearRecetaParaPlato('${item.codigo}')" 
                      class="btn-small btn-recipe">📖 Receta</button>
              <button onclick="editarPlato(${item.id})" 
                      class="btn-small btn-edit">✏️ Editar</button>
              <button onclick="eliminarPlato(${item.id})" 
                      class="btn-small btn-delete">🗑️ Eliminar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ============================================================================
// 6. FUNCIONES DE SOPORTE PARA MODALES DINÁMICOS
// ============================================================================

/**
 * Obtener lista de Platos para auto-relleno
 */
async function cargarPlatosParaSelect() {
  try {
    const response = await fetch(`${API_BASE}/platos`);
    const platos = await response.json();
    return platos;
  } catch (error) {
    console.error('Error cargando platos:', error);
    return [];
  }
}

/**
 * Obtener lista de Artículos para auto-relleno
 */
async function cargarArticulosParaSelect() {
  try {
    const response = await fetch(`${API_BASE}/articulos`);
    const articulos = await response.json();
    return articulos;
  } catch (error) {
    console.error('Error cargando artículos:', error);
    return [];
  }
}

/**
 * Obtener lista de Partidas Cocina para auto-relleno
 */
async function cargarPartidascocinaParaSelect() {
  try {
    const response = await fetch(`${API_BASE}/partidas-cocina`);
    const partidas = await response.json();
    return partidas;
  } catch (error) {
    console.error('Error cargando partidas:', error);
    return [];
  }
}

/**
 * Obtener Escandallo de un plato
 */
async function cargarEscandalloParaPlato(codigoPlato) {
  try {
    const response = await fetch(`${API_BASE}/escandallo?codigo_plato=${codigoPlato}`);
    const escandallo = await response.json();
    return escandallo;
  } catch (error) {
    console.error('Error cargando escandallo:', error);
    return [];
  }
}

/**
 * Validar que un código sea único
 */
async function validarCodigoUnico(tabla, codigo) {
  try {
    const response = await fetch(`${API_BASE}/${tabla}/${codigo}`);
    return response.status === 404;  // No existe = es único
  } catch (error) {
    return true;  // Asumir único si hay error
  }
}

/**
 * Mostrar notificación de éxito
 */
function mostrarExito(mensaje) {
  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.textContent = '✓ ' + mensaje;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

/**
 * Mostrar notificación de error
 */
function mostrarError(mensaje) {
  const toast = document.createElement('div');
  toast.className = 'toast toast-error';
  toast.textContent = '✗ ' + mensaje;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

// ============================================================================
// 7. ESTILOS PARA BOTONES DE ACCIONES
// ============================================================================

const estilosAcciones = `
<style>
  .production-actions,
  .platos-actions,
  .pedidos-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .btn-small {
    padding: 6px 12px;
    font-size: 0.85em;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    margin-right: 5px;
  }

  .btn-sanidad {
    background: #9c27b0;
    color: white;
  }

  .btn-sanidad:hover {
    background: #7b1fa2;
  }

  .btn-recipe {
    background: #2196f3;
    color: white;
  }

  .btn-recipe:hover {
    background: #1976d2;
  }

  .btn-edit {
    background: #ff9800;
    color: white;
  }

  .btn-edit:hover {
    background: #f57c00;
  }

  .btn-delete {
    background: #f44336;
    color: white;
  }

  .btn-delete:hover {
    background: #da190b;
  }

  /* Toast notifications */
  .toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 6px;
    font-weight: 600;
    z-index: 2000;
    animation: slideInRight 0.3s ease-out;
  }

  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .toast-success {
    background: #4caf50;
    color: white;
  }

  .toast-error {
    background: #f44336;
    color: white;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  .data-table th,
  .data-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  .data-table th {
    background: #f5f5f5;
    font-weight: 600;
    color: var(--primary-color);
  }

  .data-table tr:hover {
    background: #f9f9f9;
  }
</style>
`;

// ============================================================================
// 8. EXPORTAR FUNCIONES PARA USO GLOBAL
// ============================================================================

window.registrarNuevaProduccion = registrarNuevaProduccion;
window.crearRecetaParaPlato = crearRecetaParaPlato;
window.registrarControlSanidad = registrarControlSanidad;
window.cargarPlatosParaSelect = cargarPlatosParaSelect;
window.cargarArticulosParaSelect = cargarArticulosParaSelect;
window.cargarPartidascocinaParaSelect = cargarPartidascocinaParaSelect;
window.cargarEscandalloParaPlato = cargarEscandalloParaPlato;
window.validarCodigoUnico = validarCodigoUnico;
window.mostrarExito = mostrarExito;
window.mostrarError = mostrarError;
window.renderTrazabilidadConAcciones = renderTrazabilidadConAcciones;
window.renderPlatosConAcciones = renderPlatosConAcciones;
