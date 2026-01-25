/**
 * Tests para errorHandler middleware
 * Validar manejo de diferentes tipos de errores
 */

const { errorHandler, notFoundHandler } = require('../../src/middleware/errorHandler');
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ConflictError,
  ServerError
} = require('../../src/middleware/errors');

describe('Error Handler Middleware', () => {
  
  let res;
  let next;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('ValidationError', () => {
    
    it('debe responder con status 400', () => {
      const req = { path: '/api/test', method: 'POST', user: { id: 1 } };
      const error = new ValidationError('Datos inválidos', [
        { field: 'nombre', message: 'is required' }
      ]);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe incluir detalles de validación en la respuesta', () => {
      const req = { path: '/api/test', method: 'POST' };
      const details = [
        { field: 'email', message: 'invalid format' }
      ];
      const error = new ValidationError('Validación fallida', details);

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.details).toEqual(details);
    });
  });

  describe('AuthenticationError', () => {
    
    it('debe responder con status 401', () => {
      const req = { path: '/api/test', method: 'GET' };
      const error = new AuthenticationError('Token inválido');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debe tener código AUTHENTICATION_ERROR', () => {
      const req = { path: '/api/test', method: 'GET' };
      const error = new AuthenticationError('Token faltante');

      errorHandler(error, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('AuthorizationError', () => {
    
    it('debe responder con status 403', () => {
      const req = { path: '/api/test', method: 'POST', user: { id: 1, role: 'user' } };
      const error = new AuthorizationError('Permisos insuficientes');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debe tener código AUTHORIZATION_ERROR', () => {
      const req = { path: '/api/test', method: 'POST' };
      const error = new AuthorizationError('No tiene rol admin');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('NotFoundError', () => {
    
    it('debe responder con status 404', () => {
      const req = { path: '/api/platos/999', method: 'GET' };
      const error = new NotFoundError('Plato no encontrado');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe tener código NOT_FOUND_ERROR', () => {
      const req = { path: '/api/test', method: 'GET' };
      const error = new NotFoundError('Recurso no existe');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('DatabaseError', () => {
    
    it('debe responder con status 500', () => {
      const req = { path: '/api/test', method: 'POST' };
      const error = new DatabaseError('Error de BD');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('debe incluir mensaje genérico en producción', () => {
      process.env.NODE_ENV = 'production';
      const req = { path: '/api/test', method: 'POST' };
      const error = new DatabaseError('CRITICAL ERROR: password leak');

      errorHandler(error, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.error).not.toContain('password leak');
      
      process.env.NODE_ENV = 'development';
    });

    it('debe incluir mensaje específico en desarrollo', () => {
      process.env.NODE_ENV = 'development';
      const req = { path: '/api/test', method: 'POST' };
      const error = new DatabaseError('Table not found');

      errorHandler(error, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.error).toContain('Table not found');
    });
  });

  describe('ConflictError', () => {
    
    it('debe responder con status 409', () => {
      const req = { path: '/api/platos', method: 'POST' };
      const error = new ConflictError('Plato ya existe');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('debe tener código CONFLICT_ERROR', () => {
      const req = { path: '/api/test', method: 'POST' };
      const error = new ConflictError('Código duplicado');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('ServerError', () => {
    
    it('debe responder con status 500', () => {
      const req = { path: '/api/test', method: 'POST' };
      const error = new ServerError('Error desconocido');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Respuesta consistente', () => {
    
    it('siempre debe incluir timestamp', () => {
      const req = { path: '/api/test', method: 'POST' };
      const error = new ValidationError('Error');

      errorHandler(error, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('timestamp');
      expect(response.timestamp).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('siempre debe incluir statusCode', () => {
      const req = { path: '/api/test', method: 'POST' };
      const error = new NotFoundError('No encontrado');

      errorHandler(error, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('statusCode');
      expect(response.statusCode).toBe(404);
    });

    it('siempre debe tener success: false', () => {
      const req = { path: '/api/test', method: 'POST' };
      const error = new AuthenticationError('No auth');

      errorHandler(error, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
    });

    it('siempre debe tener data: null', () => {
      const req = { path: '/api/test', method: 'POST' };
      const error = new ServerError('Error');

      errorHandler(error, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.data).toBeNull();
    });
  });

  describe('notFoundHandler', () => {
    
    it('debe responder 404 para ruta no encontrada', () => {
      const req = { method: 'GET', path: '/api/ruta-inexistente' };

      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe incluir ruta en mensaje de error', () => {
      const req = { method: 'DELETE', path: '/api/platos/999' };

      notFoundHandler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.error).toContain('DELETE');
      expect(response.error).toContain('/api/platos/999');
    });
  });

  describe('Error desconocido', () => {
    
    it('debe manejar errores genéricos sin statusCode', () => {
      const req = { path: '/api/test', method: 'POST' };
      const error = new Error('Unexpected error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      const response = res.json.mock.calls[0][0];
      expect(response.statusCode).toBe(500);
    });

    it('debe exponer mensaje genérico en producción', () => {
      process.env.NODE_ENV = 'production';
      const req = { path: '/api/test', method: 'POST' };
      const error = new Error('SQL injection attempt detected');

      errorHandler(error, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.error).toContain('Error interno');
      expect(response.error).not.toContain('injection');
      
      process.env.NODE_ENV = 'development';
    });
  });
});
