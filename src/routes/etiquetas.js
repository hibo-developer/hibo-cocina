const express = require('express');
const router = express.Router();
const etiquetasController = require('../controllers/etiquetasController');

// Rutas para etiquetas
router.get('/', etiquetasController.obtenerTodas);
router.get('/count', etiquetasController.contar);
router.get('/:id', etiquetasController.obtenerPorId);
router.get('/plato/:codigo_plato', etiquetasController.obtenerPorPlato);
router.get('/lote/:lote', etiquetasController.obtenerPorLote);
router.get('/alergeno/:alergeno', etiquetasController.obtenerPorAlergeno);

router.post('/', etiquetasController.crear);

router.put('/:id', etiquetasController.actualizar);

router.delete('/:id', etiquetasController.eliminar);

module.exports = router;
