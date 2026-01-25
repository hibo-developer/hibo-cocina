/**
 * Middleware de autenticación JWT mejorado
 * Verifica y valida tokens en las requests con manejo granular de errores
 */

const { verifyToken } = require('../utils/auth');
const { AuthenticationError, AuthorizationError } = require('./errors');
const { getLogger } = require('../utils/logger');
const log = getLogger();

/**
 * Middleware para verificar token JWT
 * Extrae el token del header Authorization: Bearer <token>
 */
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      log.warn('Missing authentication token:', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return next(new AuthenticationError('Token no proporcionado'));
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    
    log.debug('Token verified:', {
      userId: decoded.id,
      role: decoded.role,
      path: req.path
    });

    next();
  } catch (error) {
    log.warn('Authentication error:', {
      message: error.message,
      path: req.path,
      ip: req.ip
    });

    // Token inválido, expirado o mal formado
    const authError = new AuthenticationError(
      error.message === 'jwt expired' 
        ? 'Token expirado. Por favor, inicie sesión nuevamente.' 
        : 'Token inválido o mal formado'
    );
    next(authError);
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
        log.warn('No authenticated user for authorization check:', {
          path: req.path
        });
        return next(new AuthenticationError('Usuario no autenticado'));
      }

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(req.user.role)) {
        log.warn('Authorization failed:', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: roles,
          path: req.path
        });
        return next(new AuthorizationError(
          `Rol requerido: ${roles.join(' o ')}. Rol actual: ${req.user.role}`
        ));
      }

      log.debug('Authorization granted:', {
        userId: req.user.id,
        role: req.user.role,
        path: req.path
      });

      next();
    } catch (error) {
      log.error('Authorization check error:', {
        message: error.message,
        path: req.path
      });
      next(new AuthorizationError('Error al verificar permisos'));
    }
  };
}

module.exports = {
  authenticateToken,
  authorizeRole
};

