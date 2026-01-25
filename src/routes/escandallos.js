/**
 * Rutas para ESCANDALLOS
 */
const express = require('express');
const router = express.Router();
const escandallosController = require('../controllers/escandallosController');

router.get('/', escandallosController.obtenerTodos);
router.get('/:id', escandallosController.obtenerPorId);
router.post('/', escandallosController.crear);
router.put('/:id', escandallosController.actualizar);
router.delete('/:id', escandallosController.eliminar);

module.exports = router;
