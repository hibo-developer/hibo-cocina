/**
 * Cliente WebSocket para comunicación en tiempo real
 * Maneja suscripciones y eventos del servidor
 */

class WebSocketClient {
  constructor(token, options = {}) {
    this.token = token;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    this.listeners = new Map();

    this.options = {
      url: options.url || `http://${window.location.hostname}:${window.location.port}`,
      transports: options.transports || ['websocket', 'polling'],
      reconnection: options.reconnection !== false,
      ...options
    };

    this.init();
  }

  /**
   * Inicializar conexión
   */
  init() {
    if (typeof io === 'undefined') {
      console.error('Socket.io client no cargado');
      return;
    }

    try {
      this.socket = io(this.options.url, {
        auth: {
          token: this.token
        },
        reconnection: this.options.reconnection,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        transports: this.options.transports
      });

      this.setupEventListeners();
      console.log('✅ WebSocket inicializado');
    } catch (err) {
      console.error('Error inicializando WebSocket:', err);
    }
  }

  /**
   * Configurar listeners globales
   */
  setupEventListeners() {
    // Eventos de conexión
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ Conectado a WebSocket');
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Desconectado de WebSocket:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error);
      this.emit('error', { error });
    });

    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts++;
      console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    });

    // Eventos de datos
    this.socket.on('platos:update', (data) => this.emit('platos:update', data));
    this.socket.on('ingredientes:update', (data) => this.emit('ingredientes:update', data));
    this.socket.on('inventario:update', (data) => this.emit('inventario:update', data));
    this.socket.on('pedidos:update', (data) => this.emit('pedidos:update', data));
    this.socket.on('pedidos:personal-update', (data) => this.emit('pedidos:personal-update', data));

    // Eventos de notificaciones
    this.socket.on('notification:new', (data) => this.emit('notification:new', data));
    this.socket.on('notification:read', (data) => this.emit('notification:read', data));

    // Eventos de caché
    this.socket.on('cache:invalidate', (data) => this.emit('cache:invalidate', data));

    // Eventos de alertas
    this.socket.on('alert:low-stock', (data) => this.emit('alert:low-stock', data));
  }

  /**
   * Suscribirse a un evento
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Emitir evento localmente
   */
  emit(event, data = null) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error en listener para '${event}':`, err);
        }
      });
    }
  }

  /**
   * Suscribirse a actualizaciones de platos
   */
  subscribePlatos() {
    if (this.isConnected) {
      this.socket.emit('subscribe:platos');
      console.log('Suscrito a actualizaciones de platos');
    }
  }

  /**
   * Desuscribirse de platos
   */
  unsubscribePlatos() {
    if (this.isConnected) {
      this.socket.emit('unsubscribe:platos');
    }
  }

  /**
   * Suscribirse a actualizaciones de ingredientes
   */
  subscribeIngredientes() {
    if (this.isConnected) {
      this.socket.emit('subscribe:ingredientes');
      console.log('Suscrito a actualizaciones de ingredientes');
    }
  }

  /**
   * Desuscribirse de ingredientes
   */
  unsubscribeIngredientes() {
    if (this.isConnected) {
      this.socket.emit('unsubscribe:ingredientes');
    }
  }

  /**
   * Suscribirse a actualizaciones de inventario
   */
  subscribeInventario() {
    if (this.isConnected) {
      this.socket.emit('subscribe:inventario');
      console.log('Suscrito a actualizaciones de inventario');
    }
  }

  /**
   * Desuscribirse de inventario
   */
  unsubscribeInventario() {
    if (this.isConnected) {
      this.socket.emit('unsubscribe:inventario');
    }
  }

  /**
   * Suscribirse a actualizaciones de pedidos
   */
  subscribePedidos() {
    if (this.isConnected) {
      this.socket.emit('subscribe:pedidos');
      console.log('Suscrito a actualizaciones de pedidos');
    }
  }

  /**
   * Desuscribirse de pedidos
   */
  unsubscribePedidos() {
    if (this.isConnected) {
      this.socket.emit('unsubscribe:pedidos');
    }
  }

  /**
   * Solicitar notificaciones pendientes
   */
  requestNotifications(callback) {
    if (this.isConnected) {
      this.socket.emit('request:notifications', callback);
    }
  }

  /**
   * Marcar notificación como leída
   */
  markNotificationAsRead(notificationId) {
    if (this.isConnected) {
      this.socket.emit('mark:notification:read', notificationId);
    }
  }

  /**
   * Solicitar sincronización de datos
   */
  requestSync(module, timestamp, callback) {
    if (this.isConnected) {
      this.socket.emit('sync:request', { module, timestamp }, callback);
    }
  }

  /**
   * Obtener estado de conexión
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Desconectar
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  /**
   * Reconectar
   */
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.WebSocketClient = WebSocketClient;
}
