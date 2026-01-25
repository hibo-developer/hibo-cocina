/**
 * Sistema de Logging Estructurado con Winston
 * Proporciona logging consistente en toda la aplicación
 */

const winston = require('winston');
const path = require('path');

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_DIR = path.join(__dirname, '../../logs');

// Crear directorio de logs si no existe
const fs = require('fs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Configuración de formatos
 */
const formats = {
  simple: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  json: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  detailed: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
      }
      return log;
    })
  )
};

/**
 * Transportes para diferentes niveles
 */
const transports = [
  // Console - Todos los niveles en desarrollo
  new winston.transports.Console({
    level: LOG_LEVEL,
    format: winston.format.combine(
      winston.format.colorize(),
      formats.simple
    )
  }),

  // Archivo - Todos los logs
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'combined.log'),
    level: LOG_LEVEL,
    format: formats.json,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),

  // Archivo - Solo errores
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'errors.log'),
    level: 'error',
    format: formats.detailed,
    maxsize: 5242880,
    maxFiles: 5
  }),

  // Archivo - Solo warnings
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'warnings.log'),
    level: 'warn',
    format: formats.detailed,
    maxsize: 5242880,
    maxFiles: 5
  })
];

// En producción, no loguear en console
if (process.env.NODE_ENV === 'production') {
  transports.shift();
}

/**
 * Crear instancia de logger
 */
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: formats.json,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'exceptions.log'),
      format: formats.detailed
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'rejections.log'),
      format: formats.detailed
    })
  ]
});

/**
 * Métodos de logging convenientes
 */
const log = {
  /**
   * Log de información general
   */
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },

  /**
   * Log de error
   */
  error: (message, error = null, meta = {}) => {
    const errorMeta = {
      ...meta,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      })
    };
    logger.error(message, errorMeta);
  },

  /**
   * Log de warning
   */
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },

  /**
   * Log de debug
   */
  debug: (message, meta = {}) => {
    logger.debug(message, meta);
  },

  /**
   * Log de request HTTP
   */
  request: (method, path, statusCode, duration, meta = {}) => {
    logger.info(`${method} ${path}`, {
      type: 'http_request',
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      ...meta
    });
  },

  /**
   * Log de operación de base de datos
   */
  database: (operation, table, duration, meta = {}) => {
    logger.info(`DB: ${operation} on ${table}`, {
      type: 'database_operation',
      operation,
      table,
      duration: `${duration}ms`,
      ...meta
    });
  },

  /**
   * Log de autenticación
   */
  auth: (action, username, success, meta = {}) => {
    const level = success ? 'info' : 'warn';
    logger[level](`Auth: ${action} - ${username}`, {
      type: 'authentication',
      action,
      username,
      success,
      ...meta
    });
  }
};

/**
 * Función getLogger para testing
 */
function getLogger() {
  return log;
}

module.exports = log;
module.exports.getLogger = getLogger;
