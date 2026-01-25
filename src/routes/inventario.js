/**
 * Rutas para INVENTARIO
 */
const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { validate } = require('../middleware/validator');
const { inventarioSchemas } = require('../middleware/validationSchemas');

router.get('/', inventarioController.obtenerTodos);
router.get('/:id', inventarioController.obtenerPorId);
router.post('/', validate(inventarioSchemas.crear), inventarioController.crear);
router.put('/:id', validate(inventarioSchemas.actualizar), inventarioController.actualizar);
router.delete('/:id', inventarioController.eliminar);

module.exports = router;
