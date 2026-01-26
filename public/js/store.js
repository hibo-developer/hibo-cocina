/**
 * Enhanced State Management Store
 * ==============================
 * 
 * Sistema de gestión de estado mejorado con:
 * - Reactive state
 * - Subscribers/observers
 * - Middleware support
 * - Time-travel debugging
 * - Persistence
 */

/**
 * @typedef {Object} StoreConfig
 * @property {Object} state - Estado inicial
 * @property {Object} mutations - Funciones que modifican estado
 * @property {Object} actions - Acciones asincrónicas
 * @property {Object} getters - Selectores derivados
 */

class Store {
  /**
   * Crea un nuevo store con Vuex-like API
   * @param {StoreConfig} config
   */
  constructor(config = {}) {
    this.state = config.state || {};
    this.mutations = config.mutations || {};
    this.actions = config.actions || {};
    this.getters = config.getters || {};
    this.middleware = [];
    this.subscribers = new Map();
    this.history = [{ ...this.state }];
    this.historyIndex = 0;
    
    this.setupGetters();
    this.loadPersistedState();
  }
  
  /**
   * Setup computed getters
   */
  setupGetters() {
    Object.keys(this.getters).forEach(key => {
      Object.defineProperty(this, key, {
        get: () => {
          return this.getters[key](this.state);
        },
        configurable: true
      });
    });
  }
  
  /**
   * Commit a mutation
   * @param {string} mutationName
   * @param {any} payload
   */
  commit(mutationName, payload) {
    if (!this.mutations[mutationName]) {
      console.error(`Mutation "${mutationName}" no existe`);
      return;
    }
    
    // Antes del cambio
    const oldState = JSON.parse(JSON.stringify(this.state));
    
    // Ejecutar middleware pre
    for (const mw of this.middleware) {
      if (mw.onBeforeMutation) {
        mw.onBeforeMutation(mutationName, payload, this.state);
      }
    }
    
    // Ejecutar mutation
    this.mutations[mutationName](this.state, payload);
    
    // Agregar al historial
    this.addHistory();
    
    // Ejecutar middleware post
    for (const mw of this.middleware) {
      if (mw.onAfterMutation) {
        mw.onAfterMutation(mutationName, payload, oldState, this.state);
      }
    }
    
    // Notificar subscribers
    this.notifySubscribers(mutationName, payload);
    
    // Persistir estado
    this.persistState();
  }
  
  /**
   * Dispatch an action
   * @param {string} actionName
   * @param {any} payload
   * @returns {Promise}
   */
  async dispatch(actionName, payload) {
    if (!this.actions[actionName]) {
      console.error(`Action "${actionName}" no existe`);
      return;
    }
    
    const context = {
      state: this.state,
      commit: this.commit.bind(this),
      dispatch: this.dispatch.bind(this),
      getters: this.getters
    };
    
    try {
      return await this.actions[actionName](context, payload);
    } catch (error) {
      console.error(`Error en action "${actionName}":`, error);
      throw error;
    }
  }
  
  /**
   * Subscribe a cambios
   * @param {string} path - Ruta del estado (ej: "user.name")
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  subscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, []);
    }
    
    this.subscribers.get(path).push(callback);
    
    // Retornar función para unsubscribe
    return () => {
      const callbacks = this.subscribers.get(path);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * Notificar a todos los subscribers
   */
  notifySubscribers(mutationName, payload) {
    // Notificar path específicos
    for (const [path, callbacks] of this.subscribers.entries()) {
      const value = this.getValueByPath(path);
      callbacks.forEach(cb => cb(value, payload, mutationName));
    }
  }
  
  /**
   * Obtener valor por ruta
   * @param {string} path - Ej: "user.profile.name"
   */
  getValueByPath(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }
  
  /**
   * Agregar middleware
   * @param {Object} middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
  }
  
  /**
   * Agregar al historial (time-travel)
   */
  addHistory() {
    // Remover futuros si estamos en el pasado
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Agregar estado actual
    this.history.push(JSON.parse(JSON.stringify(this.state)));
    this.historyIndex++;
    
    // Limitar tamaño del historial
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }
  
  /**
   * Volver al estado anterior
   */
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.state = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.notifySubscribers('undo', null);
      this.persistState();
    }
  }
  
  /**
   * Ir al estado siguiente
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.state = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.notifySubscribers('redo', null);
      this.persistState();
    }
  }
  
  /**
   * Persistir estado en localStorage
   */
  persistState() {
    try {
      localStorage.setItem('appState', JSON.stringify(this.state));
    } catch (error) {
      console.warn('No se pudo persistir estado:', error);
    }
  }
  
  /**
   * Cargar estado persistido
   */
  loadPersistedState() {
    try {
      const persisted = localStorage.getItem('appState');
      if (persisted) {
        this.state = { ...this.state, ...JSON.parse(persisted) };
      }
    } catch (error) {
      console.warn('No se pudo cargar estado persistido:', error);
    }
  }
  
  /**
   * Resetear al estado inicial
   */
  reset() {
    this.state = JSON.parse(JSON.stringify(this.history[0]));
    this.historyIndex = 0;
    this.notifySubscribers('reset', null);
    this.persistState();
  }
  
  /**
   * Obtener estado actual
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }
  
  /**
   * Reemplazar estado completo
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.addHistory();
    this.notifySubscribers('setState', newState);
    this.persistState();
  }
  
  /**
   * DevTools integration
   */
  enableDevTools() {
    window.__STORE__ = this;
    window.__STORE_SNAPSHOT__ = () => JSON.stringify(this.getState(), null, 2);
    console.log('🔧 Store DevTools habilitado. Usa window.__STORE__');
  }
}

// Ejemplo de uso:
/*
const store = new Store({
  state: {
    user: null,
    platos: [],
    loading: false
  },
  
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setPlatos(state, platos) {
      state.platos = platos;
    },
    setLoading(state, loading) {
      state.loading = loading;
    }
  },
  
  actions: {
    async loginUser(context, credentials) {
      context.commit('setLoading', true);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials)
        });
        const { data } = await response.json();
        context.commit('setUser', data.user);
      } finally {
        context.commit('setLoading', false);
      }
    },
    
    async loadPlatos(context) {
      context.commit('setLoading', true);
      try {
        const response = await fetch('/api/platos');
        const { data } = await response.json();
        context.commit('setPlatos', data);
      } finally {
        context.commit('setLoading', false);
      }
    }
  },
  
  getters: {
    isLoggedIn(state) {
      return !!state.user;
    },
    totalPlatos(state) {
      return state.platos.length;
    }
  }
});

// Middleware de logging
store.use({
  onBeforeMutation(name, payload) {
    console.log(`📤 ${name}`, payload);
  },
  onAfterMutation(name, payload, oldState, newState) {
    console.log(`📥 ${name}`, newState);
  }
});

// Subscribers
store.subscribe('user', (newUser) => {
  console.log('Usuario cambió:', newUser);
});

store.subscribe('platos', (platos) => {
  console.log('Platos cambió:', platos.length);
});

// Usar
store.dispatch('loginUser', { email, password });
store.dispatch('loadPlatos');
console.log(store.isLoggedIn); // getter
*/

// Exponer globalmente
window.Store = Store;

// También soportar módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Store };
}
