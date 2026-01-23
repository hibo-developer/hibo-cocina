const express = require('express');
const router = express.Router();
const platosController = require('../controllers/platosController');

router.get('/', platosController.obtenerTodos);
router.get('/estadisticas', platosController.estadisticas);
router.get('/:codigo', platosController.obtenerPorCodigo);
router.post('/', platosController.crear);
router.put('/:id', platosController.actualizar);
router.delete('/:id', platosController.eliminar);

module.exports = router;
