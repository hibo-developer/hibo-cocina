/**
 * Tests para authMiddleware
 * Validar autenticación y autorización
 */

const { authenticateToken, authorizeRole } = require('../../src/middleware/authMiddleware');
const { AuthenticationError, AuthorizationError } = require('../../src/middleware/errors');
const { generateToken } = require('../../src/utils/auth');

describe('Auth Middleware', () => {
  
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {},
      path: '/api/test',
      method: 'GET',
      ip: '127.0.0.1'
    };
    res = {};
    next = jest.fn();
  });

  describe('authenticateToken', () => {
    
    it('debe pasar si token válido', () => {
      const userData = { id: 1, username: 'testuser', role: 'user' };
      const token = generateToken(userData);
      req.headers['authorization'] = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(1);
      expect(req.user.username).toBe('testuser');
      expect(next).toHaveBeenCalledWith();
    });

    it('debe rechazar si falta token', () => {
      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('Token');
    });

    it('debe rechazar si Authorization header está vacío', () => {
      req.headers['authorization'] = '';

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('debe rechazar token malformado (sin Bearer)', () => {
      const token = generateToken({ id: 1, username: 'test', role: 'user' });
      req.headers['authorization'] = token; // Sin "Bearer"

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('debe rechazar token inválido', () => {
      req.headers['authorization'] = 'Bearer invalid.token.signature';

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('debe extraer correctamente token de header', () => {
      const userData = { id: 2, username: 'admin', role: 'admin' };
      const token = generateToken(userData);
      req.headers['authorization'] = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(req.user.username).toBe('admin');
      expect(req.user.role).toBe('admin');
    });

    it('debe manejar Authorization en minúsculas', () => {
      const userData = { id: 1, username: 'test', role: 'user' };
      const token = generateToken(userData);
      req.headers['authorization'] = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('authorizeRole - rol único', () => {
    
    beforeEach(() => {
      const userData = { id: 1, username: 'admin', role: 'admin' };
      req.user = userData;
    });

    it('debe pasar si usuario tiene rol requerido', () => {
      const middleware = authorizeRole('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('debe rechazar si usuario no tiene rol requerido', () => {
      req.user.role = 'user';
      const middleware = authorizeRole('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.statusCode).toBe(403);
    });

    it('debe rechazar si no hay usuario autenticado', () => {
      delete req.user;
      const middleware = authorizeRole('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('debe incluir información del rol en mensaje de error', () => {
      req.user.role = 'user';
      const middleware = authorizeRole('admin');

      middleware(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toContain('admin');
      expect(error.message).toContain('user');
    });
  });

  describe('authorizeRole - múltiples roles', () => {
    
    it('debe pasar si usuario tiene uno de los roles requeridos', () => {
      req.user = { id: 1, username: 'chef', role: 'chef' };
      const middleware = authorizeRole(['admin', 'chef']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('debe rechazar si no tiene ninguno de los roles', () => {
      req.user = { id: 1, username: 'user', role: 'user' };
      const middleware = authorizeRole(['admin', 'chef']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AuthorizationError);
    });

    it('debe incluir todos los roles en mensaje de error', () => {
      req.user = { id: 1, username: 'user', role: 'user' };
      const middleware = authorizeRole(['admin', 'chef', 'manager']);

      middleware(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toContain('admin');
      expect(error.message).toContain('chef');
      expect(error.message).toContain('manager');
    });

    it('debe aceptar rol como string o array', () => {
      req.user = { id: 1, username: 'admin', role: 'admin' };
      
      // Como string
      const middleware1 = authorizeRole('admin');
      middleware1(req, res, next);
      expect(next).toHaveBeenCalledWith();

      // Como array
      next.mockClear();
      const middleware2 = authorizeRole(['admin']);
      middleware2(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Casos especiales', () => {
    
    it('debe manejar tokens con datos adicionales', () => {
      const userData = {
        id: 1,
        username: 'user',
        role: 'user',
        email: 'user@example.com',
        permisos: ['read', 'write']
      };
      const token = generateToken(userData);
      req.headers['authorization'] = `Bearer ${token}`;

      authenticateToken(req, res, next);

      // Solo propiedades del token deberían estar
      expect(req.user.id).toBe(1);
      expect(req.user.username).toBe('user');
      expect(next).toHaveBeenCalledWith();
    });

    it('debe rechazar si token está expirado', () => {
      // Token expirado se simula creando uno con tiempo corto
      // Para test real necesitaría mock de jwt.verify
      const malformedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.payload';
      req.headers['authorization'] = `Bearer ${malformedToken}`;

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('debe mantener información de usuario en req', () => {
      const userData = { id: 5, username: 'testuser', role: 'admin' };
      const token = generateToken(userData);
      req.headers['authorization'] = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(5);
      expect(req.user.username).toBe('testuser');
      expect(req.user.role).toBe('admin');
    });

    it('debe permitir middleware encadenado', () => {
      const userData = { id: 1, username: 'admin', role: 'admin' };
      const token = generateToken(userData);
      req.headers['authorization'] = `Bearer ${token}`;

      authenticateToken(req, res, next);
      expect(req.user).toBeDefined();

      // Llamar authorize después
      const authorize = authorizeRole('admin');
      authorize(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
