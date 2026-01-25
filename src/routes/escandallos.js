/**
 * Rutas para ESCANDALLOS
 */
const express = require('express');
const router = express.Router();
const escandallosController = require('../controllers/escandallosController');
const { validate } = require('../middleware/validator');
const { escandallosSchemas } = require('../middleware/validationSchemas');

router.get('/', escandallosController.obtenerTodos);
router.get('/:id', escandallosController.obtenerPorId);
router.post('/', validate(escandallosSchemas.crear), escandallosController.crear);
router.put('/:id', validate(escandallosSchemas.actualizar), escandallosController.actualizar);
router.delete('/:id', escandallosController.eliminar);

module.exports = router;
