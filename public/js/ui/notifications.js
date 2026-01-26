/**
 * ============================================================================
 * NOTIFICATIONS.JS - Sistema de notificaciones simple
 * ============================================================================
 * 
 * Uso:
 * notify.success('Guardado correctamente');
 * notify.error('Ocurrió un error');
 * notify.info('Información importante');
 * notify.warning('Cuidado!');
 * 
 */

class SimpleNotificationManager {
  constructor() {
    this.container = this.crearContenedor();
  }

  /**
   * Crear contenedor de notificaciones
   */
  crearContenedor() {
    let container = document.getElementById('notifications-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notifications-container';
      container.style.cssText = `
        position: fixed;
        top: 150px;
        right: 20px;
        z-index: 1100;
        width: 350px;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Mostrar notificación
   */
  show(mensaje, tipo = 'info', duracion = 3000) {
    const notif = document.createElement('div');
    notif.className = `notification notification-${tipo}`;
    notif.style.cssText = `
      background: ${this.getColor(tipo)};
      color: white;
      padding: 15px 20px;
      margin-bottom: 10px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInRight 0.3s ease;
    `;
    notif.textContent = mensaje;

    this.container.appendChild(notif);

    if (duracion > 0) {
      setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notif.remove(), 300);
      }, duracion);
    }

    return notif;
  }

  /**
   * Notificación de éxito
   */
  success(mensaje) {
    console.log('✅', mensaje);
    return this.show(mensaje, 'success');
  }

  /**
   * Notificación de error
   */
  error(mensaje) {
    console.error('❌', mensaje);
    return this.show(mensaje, 'error', 5000);
  }

  /**
   * Notificación de información
   */
  info(mensaje) {
    console.log('ℹ️', mensaje);
    return this.show(mensaje, 'info');
  }

  /**
   * Notificación de advertencia
   */
  warning(mensaje) {
    console.warn('⚠️', mensaje);
    return this.show(mensaje, 'warning', 5000);
  }

  /**
   * Obtener color según tipo
   */
  getColor(tipo) {
    const colors = {
      success: '#27ae60',
      error: '#e74c3c',
      info: '#3498db',
      warning: '#f39c12'
    };
    return colors[tipo] || colors.info;
  }
}

// Instancia global
const notify = new SimpleNotificationManager();

// Agregar estilos CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
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

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(styleSheet);

// Instancia simple para notificaciones rápidas
const simpleNotificationManager = new SimpleNotificationManager();

// Exponer globalmente
window.simpleNotificationManager = simpleNotificationManager;

console.log('✅ SimpleNotificationManager cargado y expuesto globalmente');
