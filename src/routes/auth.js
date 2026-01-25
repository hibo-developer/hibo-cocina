/**
 * Rutas para AUTENTICACIÓN
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validator');
const { authenticateToken } = require('../middleware/authMiddleware');
const Joi = require('joi');

// Esquemas de validación para auth
const authSchemas = {
  register: Joi.object({
    username: Joi.string().required().alphanum().min(3).max(30).messages({
      'any.required': 'username es requerido',
      'string.alphanum': 'username solo puede contener letras y números',
      'string.min': 'username debe tener al menos 3 caracteres'
    }),
    password: Joi.string().required().min(6).max(100).messages({
      'any.required': 'password es requerido',
      'string.min': 'password debe tener al menos 6 caracteres'
    })
  }),
  login: Joi.object({
    username: Joi.string().required().messages({
      'any.required': 'username es requerido'
    }),
    password: Joi.string().required().messages({
      'any.required': 'password es requerido'
    })
  })
};

// Rutas públicas
router.post('/register', validate(authSchemas.register), authController.register);
router.post('/login', validate(authSchemas.login), authController.login);

// Rutas protegidas
router.get('/me', authenticateToken, authController.getMe);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
