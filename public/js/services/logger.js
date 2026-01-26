/**
 * Utilidades de Logging para Frontend
 * Controla logs basado en modo desarrollo/producción
 */

const DEBUG_MODE = localStorage.getItem('DEBUG') === 'true' || new URL(location).searchParams.get('debug') === 'true';

/**
 * Logger fronten para debug condicional
 */
const logger = {
  /**
   * Log de información
   */
  info: (message, data = null) => {
    if (DEBUG_MODE) {
      if (data) {
        console.log(`ℹ️ ${message}`, data);
      } else {
        console.log(`ℹ️ ${message}`);
      }
    }
  },

  /**
   * Log de éxito
   */
  success: (message, data = null) => {
    if (DEBUG_MODE) {
      if (data) {
        console.log(`✅ ${message}`, data);
      } else {
        console.log(`✅ ${message}`);
      }
    }
  },

  /**
   * Log de advertencia
   */
  warn: (message, data = null) => {
    console.warn(`⚠️ ${message}`, data || '');
  },

  /**
   * Log de error
   */
  error: (message, data = null) => {
    console.error(`❌ ${message}`, data || '');
  },

  /**
   * Log de acción
   */
  action: (message, data = null) => {
    if (DEBUG_MODE) {
      if (data) {
        console.log(`🔵 ${message}`, data);
      } else {
        console.log(`🔵 ${message}`);
      }
    }
  },

  /**
   * Log de datos
   */
  data: (message, data) => {
    if (DEBUG_MODE) {
      console.table(data || message);
    }
  },

  /**
   * Habilitar/Deshabilitar debug
   */
  setDebug: (enabled) => {
    localStorage.setItem('DEBUG', enabled.toString());
    location.reload();
  }
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = logger;
}
