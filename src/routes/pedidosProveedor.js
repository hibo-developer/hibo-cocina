const express = require('express');
const router = express.Router();
const pedidosProveedorController = require('../controllers/pedidosProveedorController');

router.get('/', pedidosProveedorController.obtenerTodos);
router.get('/count', pedidosProveedorController.contar);
router.get('/id/:id', pedidosProveedorController.obtenerPorId);
router.get('/proveedor/:proveedor_id', pedidosProveedorController.obtenerPorProveedor);

router.post('/', pedidosProveedorController.crear);

router.put('/:id', pedidosProveedorController.actualizar);

router.delete('/:id', pedidosProveedorController.eliminar);

module.exports = router;
