/**
 * Rutas para AUTENTICACIÓN
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validator');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const Joi = require('joi');

// Esquemas de validación para auth
const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'any.required': 'email es requerido',
      'string.email': 'email no válido'
    }),
    nombre: Joi.string().required().min(2).max(100).messages({
      'any.required': 'nombre es requerido',
      'string.min': 'nombre debe tener al menos 2 caracteres'
    }),
    password: Joi.string().required().min(6).max(100).messages({
      'any.required': 'password es requerido',
      'string.min': 'password debe tener al menos 6 caracteres'
    })
  }),
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'any.required': 'email es requerido',
      'string.email': 'email no válido'
    }),
    password: Joi.string().required().messages({
      'any.required': 'password es requerido'
    })
  })
};

// Rutas públicas
router.post('/register', authLimiter, validate(authSchemas.register), authController.register);
router.post('/login', authLimiter, validate(authSchemas.login), authController.login);

// Rutas protegidas
router.get('/me', authenticateToken, authController.getMe);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
