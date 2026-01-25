/**
 * Rutas para PARTIDAS DE COCINA
 */
const express = require('express');
const router = express.Router();
const partidasController = require('../controllers/partidasController');
const { validate } = require('../middleware/validator');
const { partidasSchemas } = require('../middleware/validationSchemas');

router.get('/', partidasController.obtenerTodas);
router.get('/:id', partidasController.obtenerPorId);
router.post('/', validate(partidasSchemas.crear), partidasController.crear);
router.put('/:id', validate(partidasSchemas.actualizar), partidasController.actualizar);
router.delete('/:id', partidasController.eliminar);

module.exports = router;
