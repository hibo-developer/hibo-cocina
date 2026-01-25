/**
 * Middleware de autenticación JWT
 * Verifica y valida tokens en las requests
 */

const { verifyToken } = require('../utils/auth');
const { createResponse } = require('./errorHandler');

/**
 * Middleware para verificar token JWT
 * Extrae el token del header Authorization: Bearer <token>
 */
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json(
        createResponse(false, null, 'Token no proporcionado', 401)
      );
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error de autenticación:', error.message);
    return res.status(403).json(
      createResponse(false, null, error.message, 403)
    );
  }
}

/**
 * Middleware para verificar rol de usuario
 * @param {string|string[]} requiredRoles - Rol(es) requerido(s)
 */
function authorizeRole(requiredRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(
          createResponse(false, null, 'Usuario no autenticado', 401)
        );
      }

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json(
          createResponse(false, null, 'Permisos insuficientes', 403)
        );
      }

      next();
    } catch (error) {
      return res.status(500).json(
        createResponse(false, null, error.message, 500)
      );
    }
  };
}

module.exports = {
  authenticateToken,
  authorizeRole
};
