/**
 * Middleware centralizado para manejo de errores
 * Proporciona respuestas JSON consistentes
 */

/**
 * Formato estándar de respuesta
 * @param {boolean} success - Indica si la operación fue exitosa
 * @param {any} data - Datos devueltos (si es exitosa)
 * @param {string} error - Mensaje de error (si falla)
 * @param {number} statusCode - Código HTTP
 * @returns {Object}
 */
function createResponse(success, data = null, error = null, statusCode = 200) {
  return {
    success,
    data,
    error,
    timestamp: new Date().toISOString(),
    statusCode
  };
}

/**
 * Middleware para capturar errores no controlados
 */
function errorHandler(err, req, res, next) {
  console.error('❌ Error no controlado:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

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
  res.status(404).json(
    createResponse(false, null, `Ruta ${req.method} ${req.path} no encontrada`, 404)
  );
}

module.exports = {
  createResponse,
  errorHandler,
  notFoundHandler
};
