/**
 * Rutas para SANIDAD (APPCC)
 */
const express = require('express');
const router = express.Router();
const sanidadController = require('../controllers/sanidadController');
const { validate } = require('../middleware/validator');
const { sanidadSchemas } = require('../middleware/validationSchemas');

router.get('/', sanidadController.obtenerTodas);
router.get('/:id', sanidadController.obtenerPorId);
router.post('/', validate(sanidadSchemas.crear), sanidadController.crear);
router.put('/:id', validate(sanidadSchemas.actualizar), sanidadController.actualizar);
router.delete('/:id', sanidadController.eliminar);

module.exports = router;
