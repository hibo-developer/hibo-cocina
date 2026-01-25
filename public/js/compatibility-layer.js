/**
 * ============================================================================
 * COMPATIBILITY LAYER - Puente entre app.js y app-refactored.js
 * ============================================================================
 * 
 * Este archivo permite usar la nueva arquitectura modular sin reescribir
 * todo el app.js inmediatamente. Funciona como un adaptador.
 * 
 * PROPÓSITO:
 * - Mantener compatibilidad con código antiguo
 * - Permitir migración gradual
 * - Exponer servicios nuevos globalmente
 * - Redirigir llamadas al código refactorizado
 * 
 */

// ============================================================================
// 1. GARANTIZAR QUE LOS SERVICIOS ESTÁN DISPONIBLES GLOBALMENTE
// ============================================================================

// Si ApiService no está disponible, usar la versión refactorizada
if (typeof ApiService === 'undefined') {
  window.apiService = window.apiService || null;
}

// Si StateManager no está disponible, usar la versión refactorizada
if (typeof StateManager === 'undefined') {
  window.stateManager = window.stateManager || null;
}

// ============================================================================
// 2. CREAR FUNCIONES DE COMPATIBILIDAD PARA TRANSICIÓN GRADUAL
// ============================================================================

/**
 * Versión mejorada de fetch que usa el ApiService nuevo
 * Funciona como drop-in replacement para llamadas API antiguas
 */
const compatibilityFetch = async (endpoint, options = {}) => {
  if (!apiService) {
    console.warn('⚠️ ApiService no inicializado. Usando fetch nativo.');
    return fetch(endpoint, options);
  }

  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : undefined;

  try {
    if (method === 'GET') {
      return apiService.get(endpoint);
    } else if (method === 'POST') {
      return apiService.post(endpoint, body);
    } else if (method === 'PUT') {
      return apiService.put(endpoint, body);
    } else if (method === 'DELETE') {
      return apiService.delete(endpoint);
    }
  } catch (error) {
    console.error('Error en compatibilityFetch:', error);
    throw error;
  }
};

// ============================================================================
// 3. CREAR ADAPTADORES PARA FUNCIONES DE ESTADO
// ============================================================================

/**
 * Obtener estado de forma compatible con el código antiguo
 */
const getState = (key) => {
  if (stateManager) {
    return stateManager.get(key);
  }
  console.warn(`⚠️ stateManager no disponible para ${key}`);
  return null;
};

/**
 * Actualizar estado de forma compatible con el código antiguo
 */
const setState = (key, value) => {
  if (stateManager) {
    stateManager.set(key, value);
    return;
  }
  console.warn(`⚠️ stateManager no disponible para actualizar ${key}`);
};

/**
 * Suscribirse a cambios de estado
 */
const subscribeToState = (key, callback) => {
  if (stateManager) {
    return stateManager.subscribe(key, callback);
  }
  console.warn(`⚠️ stateManager no disponible para suscribirse a ${key}`);
};

// ============================================================================
// 4. CREAR ADAPTADORES PARA FUNCIONES COMUNES
// ============================================================================

/**
 * Mostrar notificación (compatible con code antiguo)
 */
const mostrarNotificacion = (mensaje, tipo = 'info') => {
  if (window.notificationManager) {
    window.notificationManager[tipo](mensaje);
  } else {
    // Fallback a alert si no hay notificationManager
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
  }
};

/**
 * Abrir modal (compatible con código antiguo)
 */
const abrirModalCompatible = (titulo, contenido, botones = {}) => {
  if (window.modalManager) {
    const modalId = `modal-${Date.now()}`;
    window.modalManager.open(modalId, titulo, contenido, botones);
    return modalId;
  } else {
    console.warn('⚠️ modalManager no disponible');
  }
};

/**
 * Cerrar modal (compatible con código antiguo)
 */
const cerrarModalCompatible = (modalId) => {
  if (window.modalManager) {
    window.modalManager.close(modalId);
  }
};

// ============================================================================
// 5. EXPORTAR GLOBALMENTE PARA ACCESO DESDE HTML Y app.js
// ============================================================================

// Exponer funciones globalmente
window.getState = getState;
window.setState = setState;
window.subscribeToState = subscribeToState;
window.mostrarNotificacion = mostrarNotificacion;
window.abrirModalCompatible = abrirModalCompatible;
window.cerrarModalCompatible = cerrarModalCompatible;
window.compatibilityFetch = compatibilityFetch;

// Exportar funciones de visualización del app-migrated.js si están disponibles
if (typeof mostrarProduccion !== 'undefined') {
  window.mostrarProduccion = mostrarProduccion;
}
if (typeof mostrarSanidad !== 'undefined') {
  window.mostrarSanidad = mostrarSanidad;
}

window.compatibilityLayer = {
  // Servicios
  apiService: () => window.apiService,
  stateManager: () => window.stateManager,

  // Funciones de estado
  getState,
  setState,
  subscribeToState,

  // Funciones de notificación
  mostrarNotificacion,

  // Funciones de modal
  abrirModalCompatible,
  cerrarModalCompatible,

  // Función de fetch compatible
  compatibilityFetch,

  // Info de integración
  info: {
    version: '1.0.0',
    createdAt: '2026-01-25',
    purpose: 'Compatibilidad entre app.js y app-refactored.js',
    status: 'active'
  }
};

// ============================================================================
// 6. MONITOREAR INICIALIZACIÓN
// ============================================================================

console.log('✅ Compatibility Layer cargado');

// Esperar a que los servicios se inicialicen
let initCheckCount = 0;
const checkServicesInit = setInterval(() => {
  initCheckCount++;

  if (window.apiService && window.stateManager) {
    console.log('✅ Servicios inicializados - Compatibility Layer operativo');
    console.log('   - ApiService:', typeof window.apiService);
    console.log('   - StateManager:', typeof window.stateManager);
    console.log('   - ModalManager:', typeof window.modalManager);
    console.log('   - NotificationManager:', typeof window.notificationManager);
    clearInterval(checkServicesInit);
  }

  if (initCheckCount > 100) {
    console.warn('⚠️ Servicios no se inicializaron en tiempo esperado (10 segundos)');
    console.warn('   Estado actual:');
    console.warn('   - ApiService:', typeof window.apiService);
    console.warn('   - StateManager:', typeof window.stateManager);
    clearInterval(checkServicesInit);
  }
}, 100);

/**
 * ============================================================================
 * INSTRUCCIONES DE USO DESDE app.js
 * ============================================================================
 * 
 * REEMPLAZAR:
 *   fetch('/api/platos')
 * 
 * CON:
 *   compatibilityFetch('/api/platos')
 *   o
 *   window.apiService.get('/api/platos')
 * 
 * REEMPLAZAR:
 *   let platos = globales.platos;
 * 
 * CON:
 *   let platos = getState('platos');
 * 
 * REEMPLAZAR:
 *   globales.platos = data;
 * 
 * CON:
 *   setState('platos', data);
 * 
 * REEMPLAZAR:
 *   alert('mensaje')
 * 
 * CON:
 *   mostrarNotificacion('mensaje', 'success')
 * 
 * ============================================================================
 */
