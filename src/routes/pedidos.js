const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');

router.get('/', pedidosController.obtenerTodos);
router.get('/estadisticas', pedidosController.estadisticas);
router.get('/:id', pedidosController.obtenerPorId);
router.post('/', pedidosController.crear);
router.put('/:id', pedidosController.actualizar);
router.delete('/:id', pedidosController.eliminar);

module.exports = router;
