/**
 * Middleware de Rate Limiting para HIBO COCINA
 * Implementa límites de tasa de solicitudes por IP
 */

const rateLimit = require('express-rate-limit');
const { createResponse } = require('./errorHandler');

/**
 * Límites generales (aplica a todas las rutas)
 * 100 solicitudes por 15 minutos por IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: 'Ha excedido el límite de solicitudes permitidas',
  standardHeaders: true, // Retorna rate limit info en `RateLimit-*` headers
  legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
  skip: (req, res) => {
    // No limitar rutas de health check y documentación
    return req.path === '/api/health' || req.path.startsWith('/api-docs');
  },
  handler: (req, res) => {
    res.status(429).json(createResponse(false, null, 'Demasiadas solicitudes. Intenta más tarde.', 429));
  }
});

/**
 * Límite de autenticación (más estricto para login)
 * 5 intentos por 15 minutos por IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos
  message: 'Demasiados intentos de inicio de sesión. Intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Limita por IP + usuario para mayor seguridad
    // Obtén email del body del login/register
    const email = req.body?.email || req.body?.username || 'unknown';
    return `${req.ip}:${email}`;
  },
  handler: (req, res) => {
    res.status(429).json(createResponse(false, null, 'Demasiados intentos de inicio de sesión. Intenta más tarde.', 429));
  },
  skip: (req, res) => {
    // No limitar GET requests en auth
    return req.method === 'GET';
  }
});

/**
 * Límite de creación de recursos (POSTs)
 * 30 solicitudes por 1 hora por IP
 */
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30,
  message: 'Ha excedido el límite de creación de recursos',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(createResponse(false, null, 'Límite de creación de recursos alcanzado', 429));
  }
});

/**
 * Límite de actualización de recursos (PUTs)
 * 50 solicitudes por 1 hora por IP
 */
const updateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50,
  message: 'Ha excedido el límite de actualizaciones',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(createResponse(false, null, 'Límite de actualizaciones alcanzado', 429));
  }
});

/**
 * Límite de eliminación de recursos (DELETEs)
 * 10 solicitudes por 1 hora por IP (muy restrictivo por seguridad)
 */
const deleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: 'Ha excedido el límite de eliminaciones',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(createResponse(false, null, 'Límite de eliminaciones alcanzado', 429));
  }
});

/**
 * Límite para descarga/exportación de datos (muy permisivo)
 * 200 solicitudes por hora
 */
const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(createResponse(false, null, 'Límite de descargas alcanzado', 429));
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  createLimiter,
  updateLimiter,
  deleteLimiter,
  downloadLimiter
};
