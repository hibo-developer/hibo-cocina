const express = require('express');
const router = express.Router();
const articulosController = require('../controllers/articulosController');

// Rutas para artículos
router.get('/', articulosController.obtenerTodos);
router.get('/count', articulosController.contar);
router.get('/codigo/:codigo', articulosController.obtenerPorCodigo);
router.get('/:id', articulosController.obtenerPorId);
router.get('/grupo/:grupo', articulosController.obtenerPorGrupo);

router.post('/', articulosController.crear);

router.put('/:id', articulosController.actualizar);

router.delete('/:id', articulosController.eliminar);

module.exports = router;
