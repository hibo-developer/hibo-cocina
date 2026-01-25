/**
 * Rutas para PARTIDAS DE COCINA
 */
const express = require('express');
const router = express.Router();
const partidasController = require('../controllers/partidasController');

router.get('/', partidasController.obtenerTodas);
router.get('/:id', partidasController.obtenerPorId);
router.post('/', partidasController.crear);
router.put('/:id', partidasController.actualizar);
router.delete('/:id', partidasController.eliminar);

module.exports = router;
