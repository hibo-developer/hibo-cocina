const express = require('express');
const router = express.Router();
const ingredientesController = require('../controllers/ingredientesController');
const alergenosPersonalizadosController = require('../controllers/alergenosPersonalizadosController');

router.get('/', ingredientesController.obtenerTodos);
router.get('/count', ingredientesController.contar);
router.get('/:id', ingredientesController.obtenerPorId);

router.post('/', ingredientesController.crear);

router.put('/:id', ingredientesController.actualizar);

router.delete('/:id', ingredientesController.eliminar);

// Rutas para alérgenos personalizados de ingredientes
router.get('/:id/alergenos-personalizados', alergenosPersonalizadosController.obtenerDeIngrediente);
router.put('/:id/alergenos-personalizados', alergenosPersonalizadosController.actualizarDeIngrediente);

module.exports = router;
