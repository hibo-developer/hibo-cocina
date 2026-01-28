/**
 * Rutas para SANIDAD (APPCC)
 */
const express = require('express');
const router = express.Router();
const sanidadController = require('../controllers/sanidadController');
const { validate } = require('../middleware/validator');
const { sanidadSchemas } = require('../middleware/validationSchemas');
const { createLimiter, updateLimiter, deleteLimiter } = require('../middleware/rateLimiter');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const { createResponse } = require('../middleware/errorHandler');
const { getLogger } = require('../utils/logger');

// Rutas para controles APPCC (remapeo del endpoint raíz)
router.get('/', sanidadController.obtenerTodas);
router.get('/:id', sanidadController.obtenerPorId);
router.post('/', createLimiter, validate(sanidadSchemas.crear), sanidadController.crear);
router.put('/:id', updateLimiter, validate(sanidadSchemas.actualizar), sanidadController.actualizar);
router.delete('/:id', deleteLimiter, sanidadController.eliminar);

// Rutas alternativas para compatibilidad con el frontend
router.get('/controles', sanidadController.obtenerTodas);
router.post('/controles', createLimiter, validate(sanidadSchemas.crear), sanidadController.crear);

/**
 * @swagger
 * /api/sanidad/validar:
 *   post:
 *     summary: Validar datos de control APPCC
 *     description: Valida los datos de un control de sanidad sin crear/actualizar el registro
 *     tags:
 *       - Sanidad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.post('/validar', (req, res) => {
  try {
    const validacion = ServicioValidaciones.validarSanidad(req.body, true);
    res.json(createResponse(validacion.valido, validacion, 
      validacion.valido ? 'Datos válidos' : 'Errores de validación'));
  } catch (error) {
    const log = getLogger();
    log.error('Error validando control de sanidad:', error);
    res.status(500).json(createResponse(false, null, error.message));
  }
});

module.exports = router;
