/**
 * Rutas para SANIDAD (APPCC)
 */
const express = require('express');
const router = express.Router();
const sanidadController = require('../controllers/sanidadController');

router.get('/', sanidadController.obtenerTodas);
router.get('/:id', sanidadController.obtenerPorId);
router.post('/', sanidadController.crear);
router.put('/:id', sanidadController.actualizar);
router.delete('/:id', sanidadController.eliminar);

module.exports = router;
