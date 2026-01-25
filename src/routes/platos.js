/**
 * Rutas para PLATOS
 */
const express = require('express');
const router = express.Router();
const platosController = require('../controllers/platosController');

router.get('/', platosController.obtenerTodos);
router.get('/:id', platosController.obtenerPorId);
router.post('/', platosController.crear);
router.put('/:id', platosController.actualizar);
router.delete('/:id', platosController.eliminar);

module.exports = router;
