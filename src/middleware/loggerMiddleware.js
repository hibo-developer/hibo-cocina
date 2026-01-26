/**
 * Middleware para loguear requests HTTP
 */

const log = require('../utils/logger');

/**
 * Middleware para loguear todas las requests
 */
function loggerMiddleware(req, res, next) {
  const startTime = Date.now();

  // Interceptar el método send para loguear respuestas
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Determinar si es error o success
    const isError = res.statusCode >= 400;
    
    log.request(req.method, req.path, res.statusCode, duration, {
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId: req.user?.id || null,
      isError
    });

    originalSend.call(this, data);
  };

  next();
}

module.exports = {
  loggerMiddleware
};
