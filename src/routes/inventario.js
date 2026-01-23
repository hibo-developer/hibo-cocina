const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

// Rutas para inventario
router.get('/', inventarioController.obtenerActual);
router.get('/count', inventarioController.contar);
router.get('/valor', inventarioController.obtenerValorTotal);
router.get('/articulo/:articulo_id', inventarioController.obtenerPorArticulo);

router.post('/', inventarioController.crear);

router.put('/:id', inventarioController.actualizar);

router.delete('/:id', inventarioController.eliminar);

module.exports = router;
