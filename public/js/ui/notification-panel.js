/**
 * Panel de Notificaciones - Componente UI para mostrar notificaciones
 */

class NotificationPanel {
  constructor(notificationManager) {
    this.nm = notificationManager;
    this.isOpen = false;
    this.panelEl = null;
    this.badgeEl = null;
    this.init();
  }

  /**
   * Inicializar panel
   */
  init() {
    // Crear estructura HTML
    this.createPanelHTML();

    // Escuchar eventos del NotificationManager
    this.nm.on('notification:added', (notif) => this.onNotificationAdded(notif));
    this.nm.on('notification:read', (notif) => this.updateNotificationUI(notif));
    this.nm.on('all:read', () => this.updateBadge());
    this.nm.on('cleared', () => this.refreshList());

    // Listeners del botón
    this.setupButtonListeners();

    // Inicializar lista
    this.refreshList();
  }

  /**
   * Crear estructura HTML del panel
   */
  createPanelHTML() {
    // Crear botón del panel
    const btnContainer = document.createElement('div');
    btnContainer.id = 'notification-btn-container';
    btnContainer.innerHTML = `
      <button id="notification-btn" class="notification-btn" title="Notificaciones">
        🔔
        <span id="notification-badge" class="notification-badge">0</span>
      </button>
    `;

    // Crear panel
    const panelHTML = `
      <div id="notification-panel" class="notification-panel hidden">
        <div class="notification-panel-header">
          <h3>Notificaciones</h3>
          <div class="notification-panel-controls">
            <button id="clear-all-btn" class="btn-small" title="Limpiar todo">🗑️</button>
            <button id="mark-all-read-btn" class="btn-small" title="Marcar como leído">✓</button>
            <button id="close-panel-btn" class="btn-small" title="Cerrar">×</button>
          </div>
        </div>
        <div class="notification-panel-content">
          <div id="notification-list" class="notification-list">
            <p class="empty-state">No hay notificaciones</p>
          </div>
        </div>
      </div>
    `;

    const panelContainer = document.createElement('div');
    panelContainer.innerHTML = panelHTML;

    // Insertar en DOM
    document.body.appendChild(btnContainer);
    document.body.appendChild(panelContainer);

    this.panelEl = document.getElementById('notification-panel');
    this.badgeEl = document.getElementById('notification-badge');

    // Agregar estilos
    this.injectStyles();
  }

  /**
   * Inyectar estilos CSS
   */
  injectStyles() {
    if (document.getElementById('notification-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-panel-styles';
    style.textContent = `
      #notification-btn-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
      }

      .notification-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
        position: relative;
      }

      .notification-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
      }

      .notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #f44336;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
      }

      .notification-badge.hidden {
        display: none;
      }

      .notification-panel {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 400px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        max-height: 500px;
        animation: panelSlideUp 0.3s ease-out;
      }

      .notification-panel.hidden {
        display: none;
      }

      .notification-panel-header {
        padding: 16px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .notification-panel-header h3 {
        margin: 0;
        font-size: 18px;
        color: #333;
      }

      .notification-panel-controls {
        display: flex;
        gap: 8px;
      }

      .btn-small {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        color: #666;
        transition: color 0.2s;
      }

      .btn-small:hover {
        color: #333;
      }

      .notification-panel-content {
        overflow-y: auto;
        flex: 1;
      }

      .notification-list {
        padding: 8px;
      }

      .notification-item {
        background: #f5f5f5;
        border-left: 4px solid #667eea;
        padding: 12px;
        margin-bottom: 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .notification-item:hover {
        background: #eeeeee;
      }

      .notification-item.unread {
        background: #e3f2fd;
        border-left-color: #2196F3;
      }

      .notification-item-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 6px;
      }

      .notification-item-title {
        font-weight: 500;
        color: #333;
        flex: 1;
      }

      .notification-item-time {
        font-size: 12px;
        color: #999;
      }

      .notification-item-message {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
      }

      .notification-item-type {
        display: inline-block;
        background: #667eea;
        color: white;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 3px;
      }

      .empty-state {
        text-align: center;
        color: #999;
        padding: 40px 20px;
        font-size: 14px;
      }

      @keyframes panelSlideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @media (max-width: 600px) {
        .notification-panel {
          width: calc(100vw - 40px);
          bottom: auto;
          top: 50%;
          left: 20px;
          right: auto;
          transform: translateY(-50%);
        }

        #notification-btn-container {
          bottom: 20px;
          right: 20px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Configurar listeners de botones
   */
  setupButtonListeners() {
    document.getElementById('notification-btn').addEventListener('click', () => {
      this.toggle();
    });

    document.getElementById('close-panel-btn').addEventListener('click', () => {
      this.close();
    });

    document.getElementById('mark-all-read-btn').addEventListener('click', () => {
      this.nm.markAllAsRead();
    });

    document.getElementById('clear-all-btn').addEventListener('click', () => {
      if (confirm('¿Eliminar todas las notificaciones?')) {
        this.nm.clearAll();
      }
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#notification-btn-container') &&
          !e.target.closest('#notification-panel')) {
        this.close();
      }
    });
  }

  /**
   * Alternar visibilidad del panel
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Abrir panel
   */
  open() {
    this.isOpen = true;
    this.panelEl.classList.remove('hidden');
    this.refreshList();
  }

  /**
   * Cerrar panel
   */
  close() {
    this.isOpen = false;
    this.panelEl.classList.add('hidden');
  }

  /**
   * Cuando se agrega una notificación nueva
   */
  onNotificationAdded(notif) {
    this.updateBadge();
    if (this.isOpen) {
      this.refreshList();
    }
  }

  /**
   * Actualizar badge de contador
   */
  updateBadge() {
    const count = this.nm.unreadCount;
    this.badgeEl.textContent = count > 0 ? count : '';
    this.badgeEl.classList.toggle('hidden', count === 0);
  }

  /**
   * Actualizar UI de una notificación
   */
  updateNotificationUI(notif) {
    const el = document.getElementById(`panel-notif-${notif.id}`);
    if (el) {
      el.classList.remove('unread');
    }
    this.updateBadge();
  }

  /**
   * Refrescar lista de notificaciones
   */
  refreshList() {
    const list = document.getElementById('notification-list');
    const notifications = this.nm.getNotifications({ limit: 20 });

    if (notifications.length === 0) {
      list.innerHTML = '<p class="empty-state">No hay notificaciones</p>';
      return;
    }

    list.innerHTML = notifications.map(notif => this.createNotificationHTML(notif)).join('');

    // Agregar event listeners
    notifications.forEach(notif => {
      const el = document.getElementById(`panel-notif-${notif.id}`);
      if (el) {
        el.addEventListener('click', () => {
          if (!notif.read) {
            this.nm.markAsRead(notif.id);
          }
        });
      }
    });
  }

  /**
   * Crear HTML para una notificación
   */
  createNotificationHTML(notif) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      pedido: '📦',
      stock: '📉'
    };

    const typeLabel = {
      success: 'Éxito',
      error: 'Error',
      warning: 'Advertencia',
      info: 'Información',
      pedido: 'Pedido',
      stock: 'Stock'
    };

    return `
      <div id="panel-notif-${notif.id}" class="notification-item ${notif.read ? '' : 'unread'}">
        <div class="notification-item-header">
          <span class="notification-item-title">${notif.title}</span>
          <span class="notification-item-time">${this.formatTime(notif.timestamp)}</span>
        </div>
        <div class="notification-item-message">${notif.message}</div>
        <span class="notification-item-type">${typeLabel[notif.type] || notif.type}</span>
      </div>
    `;
  }

  /**
   * Formatear tiempo
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)}h`;

    return date.toLocaleDateString();
  }
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.NotificationPanel = NotificationPanel;
}
