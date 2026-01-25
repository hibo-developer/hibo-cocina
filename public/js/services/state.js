/**
 * ============================================================================
 * STATE.JS - Gestor centralizado del estado de la aplicación
 * ============================================================================
 * 
 * Patrón: Almacén centralizado (Store Pattern)
 * Uso: StateManager.set('platos', datos);
 *      const platos = StateManager.get('platos');
 * 
 */

class StateManager {
  constructor() {
    this.state = {
      // Datos
      platos: [],
      pedidos: [],
      ingredientes: [],
      escandallos: [],
      inventario: [],

      // Caché
      cache: {
        platosCacheado: false,
        pedidosCacheado: false
      },

      // Paginación
      pagination: {
        platos: { page: 1, pageSize: 12, selected: [] },
        pedidos: { page: 1, pageSize: 12, selected: [] },
        ingredientes: { page: 1, pageSize: 12, selected: [] }
      },

      // Estado UI
      ui: {
        currentSection: 'dashboard',
        modalOpen: false,
        loading: false
      },

      // Filtros
      filters: {
        platos: { search: '', grupo: '' },
        pedidos: { search: '', estado: '' }
      }
    };

    // Listeners para cambios de estado
    this.listeners = {};
  }

  /**
   * Obtener valor del estado
   */
  get(path) {
    const keys = path.split('.');
    let value = this.state;
    
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Establecer valor del estado
   */
  set(path, value) {
    const keys = path.split('.');
    let obj = this.state;

    // Navegar hasta el objeto padre
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!obj[key] || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      obj = obj[key];
    }

    // Establecer el valor
    const lastKey = keys[keys.length - 1];
    obj[lastKey] = value;

    // Notificar listeners
    this.notify(path, value);
  }

  /**
   * Suscribirse a cambios de estado
   */
  subscribe(path, callback) {
    if (!this.listeners[path]) {
      this.listeners[path] = [];
    }
    this.listeners[path].push(callback);

    // Retornar función de desuscripción
    return () => {
      this.listeners[path] = this.listeners[path].filter(cb => cb !== callback);
    };
  }

  /**
   * Notificar listeners
   */
  notify(path, value) {
    if (this.listeners[path]) {
      this.listeners[path].forEach(callback => callback(value));
    }
  }

  /**
   * Obtener estado completo
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Resetear estado
   */
  reset() {
    this.state = {};
  }
}

// Instancia global del gestor de estado
const stateManager = new StateManager();

// Exponer globalmente
window.stateManager = stateManager;

console.log('✅ StateManager cargado y expuesto globalmente');
