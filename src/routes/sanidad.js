/**
 * Rutas para SANIDAD (APPCC)
 */
const express = require('express');
const router = express.Router();
const sanidadController = require('../controllers/sanidadController');
const { validate } = require('../middleware/validator');
const { sanidadSchemas } = require('../middleware/validationSchemas');
const { createLimiter, updateLimiter, deleteLimiter } = require('../middleware/rateLimiter');

router.get('/', sanidadController.obtenerTodas);
router.get('/:id', sanidadController.obtenerPorId);
router.post('/', createLimiter, validate(sanidadSchemas.crear), sanidadController.crear);
router.put('/:id', updateLimiter, validate(sanidadSchemas.actualizar), sanidadController.actualizar);
router.delete('/:id', deleteLimiter, sanidadController.eliminar);

module.exports = router;
