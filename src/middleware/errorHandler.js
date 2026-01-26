/**
 * Middleware centralizado para manejo de errores mejorado
 * Proporciona respuestas JSON consistentes con manejo granular de errores
 */

const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ConflictError,
  ServerError,
  AppError
} = require('./errors');

const { getLogger } = require('../utils/logger');
const log = getLogger();

/**
 * Formato estándar de respuesta
 * @param {boolean} success - Indica si la operación fue exitosa
 * @param {any} data - Datos devueltos (si es exitosa)
 * @param {string} error - Mensaje de error (si falla)
 * @param {number} statusCode - Código HTTP
 * @param {any} details - Detalles adicionales del error
 * @returns {Object}
 */
function createResponse(success, data = null, error = null, statusCode = 200, details = null) {
  const response = {
    success,
    data,
    error,
    timestamp: new Date().toISOString(),
    statusCode
  };

  if (details && !success) {
    response.details = details;
  }

  return response;
}

/**
 * Middleware para capturar y procesar errores no controlados
 * Gestiona distintos tipos de errores con respuestas específicas
 */
function errorHandler(err, req, res, next) {
  // Log del error con contexto completo
  const errorContext = {
    message: err.message,
    code: err.code || 'UNKNOWN_ERROR',
    path: req.path,
    method: req.method,
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  };

  // Agregar stack trace solo en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    errorContext.stack = err.stack;
  }

  // Log según el tipo de error
  if (err instanceof ValidationError) {
    log.warn('Validation error:', errorContext);
    return res.status(err.statusCode).json(
      createResponse(false, null, err.message, err.statusCode, err.details)
    );
  }

  if (err instanceof AuthenticationError) {
    log.warn('Authentication error:', errorContext);
    return res.status(err.statusCode).json(
      createResponse(false, null, err.message, err.statusCode)
    );
  }

  if (err instanceof AuthorizationError) {
    log.warn('Authorization error:', errorContext);
    return res.status(err.statusCode).json(
      createResponse(false, null, err.message, err.statusCode)
    );
  }

  if (err instanceof NotFoundError) {
    log.warn('Not found error:', errorContext);
    return res.status(err.statusCode).json(
      createResponse(false, null, err.message, err.statusCode)
    );
  }

  if (err instanceof DatabaseError) {
    log.error('Database error:', errorContext);
    const userMessage = process.env.NODE_ENV === 'production'
      ? 'Error al acceder a la base de datos'
      : err.message;
    return res.status(err.statusCode).json(
      createResponse(false, null, userMessage, err.statusCode)
    );
  }

  if (err instanceof ConflictError) {
    log.warn('Conflict error:', errorContext);
    return res.status(err.statusCode).json(
      createResponse(false, null, err.message, err.statusCode)
    );
  }

  if (err instanceof AppError) {
    log.warn('Application error:', errorContext);
    return res.status(err.statusCode).json(
      createResponse(false, null, err.message, err.statusCode)
    );
  }

  // Error desconocido/genérico
  log.error('Unhandled error:', errorContext);
  const statusCode = err.statusCode || 500;
  const errorMessage = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message;

  res.status(statusCode).json(
    createResponse(false, null, errorMessage, statusCode)
  );
}

/**
 * Middleware para capturar rutas no encontradas
 */
function notFoundHandler(req, res) {
  log.warn('Not found route:', {
    path: req.path,
    method: req.method,
    userId: req.user?.id || 'anonymous'
  });

  res.status(404).json(
    createResponse(false, null, `Ruta ${req.method} ${req.path} no encontrada`, 404)
  );
}

module.exports = {
  createResponse,
  errorHandler,
  notFoundHandler,
  // Exportar clases de error para uso en controllers
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ConflictError,
  ServerError,
  AppError
};
