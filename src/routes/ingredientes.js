/**
 * Rutas para INGREDIENTES
 */
const express = require('express');
const router = express.Router();
const ingredientesController = require('../controllers/ingredientesController');

router.get('/', ingredientesController.obtenerTodos);
router.get('/:id', ingredientesController.obtenerPorId);
router.post('/', ingredientesController.crear);
router.put('/:id', ingredientesController.actualizar);
router.delete('/:id', ingredientesController.eliminar);

module.exports = router;
