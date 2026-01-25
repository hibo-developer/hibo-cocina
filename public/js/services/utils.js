/**
 * ============================================================================
 * UTILS.JS - Funciones utilitarias globales
 * ============================================================================
 */

/**
 * Formatear número con coma decimal (formato español)
 */
function formatDecimal(num, decimales = 3) {
  if (num === null || num === undefined || num === '') return '';
  return Number(num).toFixed(decimales).replace('.', ',');
}

/**
 * Formatear moneda
 */
function formatCurrency(amount) {
  return `${formatDecimal(amount, 2)}€`;
}

/**
 * Normalizar texto para búsqueda
 */
function normalizarTexto(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Paginar array
 */
function paginar(array, entidad, pagina = 1, porPagina = 12) {
  const inicio = (pagina - 1) * porPagina;
  const fin = inicio + porPagina;
  return array.slice(inicio, fin);
}

/**
 * Renderizar paginación
 */
function renderizarPaginacion(totalItems, entidad, callback = 'filtrar') {
  const pagination = stateManager.get(`pagination.${entidad}`);
  const pageSize = pagination?.pageSize || 12;
  const currentPage = pagination?.page || 1;
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return '';

  let html = '<div class="pagination-controls">';
  html += `<span class="pagination-info">Mostrando ${((currentPage - 1) * pageSize) + 1} a ${Math.min(currentPage * pageSize, totalItems)} de ${totalItems}</span>`;
  html += '<div class="pagination-buttons">';

  // Botón anterior
  html += `<button class="btn-pag" ${currentPage === 1 ? 'disabled' : ''} onclick="cambiarPagina('${entidad}', ${currentPage - 1}, '${callback}')">← Anterior</button>`;

  // Número de página actual
  html += `<span class="pagination-current">${currentPage} / ${totalPages}</span>`;

  // Botón siguiente
  html += `<button class="btn-pag" ${currentPage === totalPages ? 'disabled' : ''} onclick="cambiarPagina('${entidad}', ${currentPage + 1}, '${callback}')">Siguiente →</button>`;

  html += '</div></div>';
  return html;
}

/**
 * Cambiar página
 */
function cambiarPagina(entidad, pagina, callback) {
  stateManager.set(`pagination.${entidad}.page`, pagina);
  if (callback && typeof window[callback] === 'function') {
    window[callback]();
  }
}

/**
 * Mostrar notificación de error
 */
function mostrarError(mensaje) {
  console.error('❌', mensaje);
  alert(`Error: ${mensaje}`);
}

/**
 * Mostrar notificación de éxito
 */
function mostrarExito(mensaje) {
  console.log('✅', mensaje);
  alert(mensaje);
}

/**
 * Pedir confirmación antes de una acción
 */
function confirmarAccion(mensaje, callback) {
  if (confirm(mensaje)) {
    callback();
  }
}

/**
 * Esperar X milisegundos
 */
function esperar(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce - evitar múltiples llamadas en poco tiempo
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Clonar objeto profundamente
 */
function clonarObjeto(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Obtener parámetro URL
 */
function obtenerParametroURL(nombre) {
  const params = new URLSearchParams(window.location.search);
  return params.get(nombre);
}
