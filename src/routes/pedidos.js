/**
 * Rutas para PEDIDOS
 */
const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { validate } = require('../middleware/validator');
const { pedidosSchemas } = require('../middleware/validationSchemas');

router.get('/estadisticas', pedidosController.obtenerEstadisticas);
router.get('/', pedidosController.obtenerTodos);
router.get('/:id', pedidosController.obtenerPorId);
router.post('/', validate(pedidosSchemas.crear), pedidosController.crear);
router.put('/:id', validate(pedidosSchemas.actualizar), pedidosController.actualizar);
router.delete('/:id', pedidosController.eliminar);

module.exports = router;
