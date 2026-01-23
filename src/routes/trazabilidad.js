const express = require('express');
const router = express.Router();
const trazabilidadController = require('../controllers/trazabilidadController');

// Rutas para trazabilidad
router.get('/', trazabilidadController.obtenerTodas);
router.get('/count', trazabilidadController.contar);
router.get('/id/:id', trazabilidadController.obtenerPorId);
router.get('/plato/:codigo_plato', trazabilidadController.obtenerPorPlato);
router.get('/lote/:lote', trazabilidadController.obtenerPorLote);
router.get('/partida/:partida', trazabilidadController.obtenerPorPartida);
router.get('/fecha/:fecha', trazabilidadController.obtenerPorFecha);
router.get('/responsable/:responsable', trazabilidadController.obtenerPorResponsable);

router.post('/', trazabilidadController.crear);

router.put('/:id', trazabilidadController.actualizar);

router.delete('/:id', trazabilidadController.eliminar);

module.exports = router;
