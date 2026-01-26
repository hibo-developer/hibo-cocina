/**
 * Tests para validator middleware
 * Validar esquemas Joi y manejo de errores
 */

const { validate } = require('../../src/middleware/validator');
const { ValidationError } = require('../../src/middleware/errors');
const Joi = require('joi');

describe('Validator Middleware', () => {
  
  describe('Validación exitosa', () => {
    
    it('debe pasar datos válidos sin error', (done) => {
      const schema = Joi.object({
        nombre: Joi.string().required().min(3),
        edad: Joi.number().min(0)
      });

      const middleware = validate(schema);
      
      const req = {
        body: {
          nombre: 'Juan',
          edad: 25
        }
      };

      const res = {};
      const next = (err) => {
        expect(err).toBeUndefined();
        expect(req.body.nombre).toBe('Juan');
        expect(req.body.edad).toBe(25);
        done();
      };

      middleware(req, res, next);
    });

    it('debe convertir tipos correctamente', (done) => {
      const schema = Joi.object({
        precio: Joi.number().required()
      });

      const middleware = validate(schema);
      
      const req = {
        body: {
          precio: '19.99'
        }
      };

      const res = {};
      const next = (err) => {
        expect(err).toBeUndefined();
        expect(req.body.precio).toBe(19.99);
        expect(typeof req.body.precio).toBe('number');
        done();
      };

      middleware(req, res, next);
    });

    it('debe remover campos desconocidos', (done) => {
      const schema = Joi.object({
        nombre: Joi.string().required()
      });

      const middleware = validate(schema);
      
      const req = {
        body: {
          nombre: 'Test',
          campoDesconocido: 'valor'
        }
      };

      const res = {};
      const next = (err) => {
        expect(err).toBeUndefined();
        expect(req.body).not.toHaveProperty('campoDesconocido');
        done();
      };

      middleware(req, res, next);
    });
  });

  describe('Validación fallida', () => {
    
    it('debe lanzar ValidationError con campo requerido ausente', (done) => {
      const schema = Joi.object({
        nombre: Joi.string().required(),
        email: Joi.string().email().required()
      });

      const middleware = validate(schema);
      
      const req = {
        body: {
          nombre: 'Test'
        },
        path: '/api/test',
        method: 'POST'
      };

      const res = {};
      const next = (err) => {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.statusCode).toBe(400);
        expect(err.details).toBeDefined();
        expect(err.details.length).toBeGreaterThan(0);
        done();
      };

      middleware(req, res, next);
    });

    it('debe incluir detalles de validación en el error', (done) => {
      const schema = Joi.object({
        edad: Joi.number().min(18).required()
      });

      const middleware = validate(schema);
      
      const req = {
        body: {
          edad: 15
        }
      };

      const res = {};
      const next = (err) => {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.details[0].field).toBe('edad');
        expect(err.details[0].message).toContain('must be greater than or equal to');
        done();
      };

      middleware(req, res, next);
    });

    it('debe reportar múltiples errores de validación', (done) => {
      const schema = Joi.object({
        nombre: Joi.string().required().min(3),
        email: Joi.string().email().required(),
        edad: Joi.number().min(0).required()
      });

      const middleware = validate(schema);
      
      const req = {
        body: {
          nombre: 'AB', // Muy corto
          email: 'invalid' // No es email
          // Falta edad
        }
      };

      const res = {};
      const next = (err) => {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.details.length).toBeGreaterThanOrEqual(3);
        done();
      };

      middleware(req, res, next);
    });

    it('debe incluir tipo de error en los detalles', (done) => {
      const schema = Joi.object({
        numero: Joi.number().required()
      });

      const middleware = validate(schema);
      
      const req = {
        body: {
          numero: 'texto'
        }
      };

      const res = {};
      const next = (err) => {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.details[0].type).toBeDefined();
        expect(err.details[0].type).toMatch(/number/);
        done();
      };

      middleware(req, res, next);
    });
  });

  describe('Casos especiales', () => {
    
    it('debe validar arrays', (done) => {
      const schema = Joi.object({
        tags: Joi.array().items(Joi.string()).required()
      });

      const middleware = validate(schema);
      
      const req = {
        body: {
          tags: ['tag1', 'tag2']
        }
      };

      const res = {};
      const next = (err) => {
        expect(err).toBeUndefined();
        expect(req.body.tags).toEqual(['tag1', 'tag2']);
        done();
      };

      middleware(req, res, next);
    });

    it('debe validar objetos anidados', (done) => {
      const schema = Joi.object({
        usuario: Joi.object({
          nombre: Joi.string().required(),
          edad: Joi.number().required()
        }).required()
      });

      const middleware = validate(schema);
      
      const req = {
        body: {
          usuario: {
            nombre: 'Juan',
            edad: 25
          }
        }
      };

      const res = {};
      const next = (err) => {
        expect(err).toBeUndefined();
        expect(req.body.usuario.nombre).toBe('Juan');
        done();
      };

      middleware(req, res, next);
    });

    it('debe manejar body vacío', (done) => {
      const schema = Joi.object({
        opcional: Joi.string().optional()
      });

      const middleware = validate(schema);
      
      const req = {
        body: {}
      };

      const res = {};
      const next = (err) => {
        expect(err).toBeUndefined();
        done();
      };

      middleware(req, res, next);
    });
  });
});
