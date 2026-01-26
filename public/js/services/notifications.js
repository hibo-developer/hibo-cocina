/**
 * Sistema de Notificaciones en Tiempo Real
 * Integra WebSocket, almacenamiento local y persistencia
 */

class NotificationManager {
  constructor(wsClient) {
    this.wsClient = wsClient;
    this.notifications = [];
    this.unreadCount = 0;
    this.listeners = new Map();
    this.storageKey = 'hibo_notifications';
    this.maxStoredNotifications = 50;

    this.init();
  }

  /**
   * Inicializar el gestor
   */
  init() {
    // Cargar notificaciones guardadas
    this.loadFromStorage();

    // Escuchar eventos de WebSocket
    if (this.wsClient) {
      this.wsClient.on('notification:new', (notification) => this.addNotification(notification));
      this.wsClient.on('notification:read', (data) => this.markAsRead(data.notificationId));
    }

    console.log('✅ NotificationManager inicializado');
  }

  /**
   * Agregar notificación nueva
   */
  addNotification(notification) {
    const notif = {
      id: notification.id || `notif-${Date.now()}-${Math.random()}`,
      type: notification.type || 'info',
      title: notification.title || 'Notificación',
      message: notification.message || '',
      timestamp: new Date(notification.timestamp || Date.now()),
      read: notification.read || false,
      data: notification.data || null
    };

    // Agregar al inicio
    this.notifications.unshift(notif);

    // Mantener límite
    if (this.notifications.length > this.maxStoredNotifications) {
      this.notifications = this.notifications.slice(0, this.maxStoredNotifications);
    }

    // Actualizar contador
    if (!notif.read) {
      this.unreadCount++;
    }

    // Guardar
    this.saveToStorage();

    // Emitir evento
    this.emit('notification:added', notif);

    // Mostrar notificación
    this.showNotification(notif);

    return notif;
  }

  /**
   * Marcar notificación como leída
   */
  markAsRead(notificationId) {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (notif && !notif.read) {
      notif.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.saveToStorage();
      this.emit('notification:read', notif);
    }
  }

  /**
   * Marcar todas como leídas
   */
  markAllAsRead() {
    this.notifications.forEach(notif => {
      notif.read = true;
    });
    this.unreadCount = 0;
    this.saveToStorage();
    this.emit('all:read');
  }

  /**
   * Obtener notificaciones
   */
  getNotifications(filter = {}) {
    let filtered = this.notifications;

    if (filter.read !== undefined) {
      filtered = filtered.filter(n => n.read === filter.read);
    }

    if (filter.type) {
      filtered = filtered.filter(n => n.type === filter.type);
    }

    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Obtener notificaciones no leídas
   */
  getUnreadNotifications() {
    return this.getNotifications({ read: false });
  }

  /**
   * Limpiar notificaciones leídas
   */
  clearRead() {
    const before = this.notifications.length;
    this.notifications = this.notifications.filter(n => !n.read);
    this.saveToStorage();
    this.emit('cleared', { removed: before - this.notifications.length });
  }

  /**
   * Limpiar todas
   */
  clearAll() {
    this.notifications = [];
    this.unreadCount = 0;
    localStorage.removeItem(this.storageKey);
    this.emit('cleared:all');
  }

  /**
   * Mostrar notificación visual
   */
  showNotification(notification) {
    // Crear elemento
    const container = this.getOrCreateContainer();
    const notifEl = document.createElement('div');
    notifEl.className = `notification notification-${notification.type}`;
    notifEl.id = `notif-${notification.id}`;

    // Iconos por tipo
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      pedido: '📦',
      stock: '📉'
    };

    notifEl.innerHTML = `
      <div class="notification-content">
        <div class="notification-header">
          <span class="notification-icon">${icons[notification.type] || '📢'}</span>
          <span class="notification-title">${notification.title}</span>
          <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="notification-body">${notification.message}</div>
        <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
      </div>
    `;

    container.appendChild(notifEl);

    // Auto-remover después de 5 segundos (excepto errores)
    const duration = notification.type === 'error' ? 10000 : 5000;
    setTimeout(() => {
      if (notifEl.parentElement) {
        notifEl.remove();
      }
    }, duration);
  }

  /**
   * Obtener o crear contenedor de notificaciones
   */
  getOrCreateContainer() {
    let container = document.getElementById('notifications-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notifications-container';
      container.className = 'notifications-container';
      document.body.appendChild(container);

      // Agregar estilos si no existen
      if (!document.getElementById('notifications-styles')) {
        const style = document.createElement('style');
        style.id = 'notifications-styles';
        style.textContent = `
          .notifications-container {
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            z-index: 10000;
          }

          .notification {
            background: white;
            border-left: 4px solid #4CAF50;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            margin-bottom: 10px;
            padding: 15px;
            animation: slideIn 0.3s ease-out;
          }

          .notification-success { border-left-color: #4CAF50; }
          .notification-error { border-left-color: #f44336; }
          .notification-warning { border-left-color: #ff9800; }
          .notification-info { border-left-color: #2196F3; }
          .notification-pedido { border-left-color: #9C27B0; }
          .notification-stock { border-left-color: #ff5722; }

          .notification-content {
            font-family: Roboto, sans-serif;
          }

          .notification-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }

          .notification-icon {
            font-size: 18px;
          }

          .notification-title {
            font-weight: 500;
            flex: 1;
            color: #333;
          }

          .notification-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
            padding: 0;
            width: 24px;
            height: 24px;
          }

          .notification-close:hover {
            color: #666;
          }

          .notification-body {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
          }

          .notification-time {
            font-size: 12px;
            color: #999;
          }

          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @media (max-width: 600px) {
            .notifications-container {
              left: 10px;
              right: 10px;
              max-width: none;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
    return container;
  }

  /**
   * Formatear tiempo
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;

    return date.toLocaleString();
  }

  /**
   * Guardar en localStorage
   */
  saveToStorage() {
    try {
      const data = this.notifications.map(n => ({
        ...n,
        timestamp: n.timestamp.toISOString()
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (err) {
      console.error('Error guardando notificaciones:', err);
    }
  }

  /**
   * Cargar desde localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.notifications = parsed.map(n => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.unreadCount = this.notifications.filter(n => !n.read).length;
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    }
  }

  /**
   * Registrar listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Emitir evento
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
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.NotificationManager = NotificationManager;
}
