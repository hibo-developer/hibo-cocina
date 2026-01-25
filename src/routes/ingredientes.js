/**
 * Rutas para INGREDIENTES
 */
const express = require('express');
const router = express.Router();
const ingredientesController = require('../controllers/ingredientesController');
const { validate } = require('../middleware/validator');
const { ingredientesSchemas } = require('../middleware/validationSchemas');

router.get('/', ingredientesController.obtenerTodos);
router.get('/:id', ingredientesController.obtenerPorId);
router.post('/', validate(ingredientesSchemas.crear), ingredientesController.crear);
router.put('/:id', validate(ingredientesSchemas.actualizar), ingredientesController.actualizar);
router.delete('/:id', ingredientesController.eliminar);

module.exports = router;
