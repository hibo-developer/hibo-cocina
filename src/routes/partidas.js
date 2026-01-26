/**
 * Rutas para PARTIDAS DE COCINA
 */
const express = require('express');
const router = express.Router();
const partidasController = require('../controllers/partidasController');
const { validate } = require('../middleware/validator');
const { partidasSchemas } = require('../middleware/validationSchemas');
const { createLimiter, updateLimiter, deleteLimiter } = require('../middleware/rateLimiter');

router.get('/', partidasController.obtenerTodas);
router.get('/:id', partidasController.obtenerPorId);
router.post('/', createLimiter, validate(partidasSchemas.crear), partidasController.crear);
router.put('/:id', updateLimiter, validate(partidasSchemas.actualizar), partidasController.actualizar);
router.delete('/:id', deleteLimiter, partidasController.eliminar);

module.exports = router;
