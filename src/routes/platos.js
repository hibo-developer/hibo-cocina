/**
 * Rutas para PLATOS
 */
const express = require('express');
const router = express.Router();
const platosController = require('../controllers/platosController');
const { validate } = require('../middleware/validator');
const { platosSchemas } = require('../middleware/validationSchemas');

router.get('/estadisticas', platosController.obtenerEstadisticas);
router.get('/', platosController.obtenerTodos);
router.get('/:id', platosController.obtenerPorId);
router.post('/', validate(platosSchemas.crear), platosController.crear);
router.put('/:id', validate(platosSchemas.actualizar), platosController.actualizar);
router.delete('/:id', platosController.eliminar);

module.exports = router;
