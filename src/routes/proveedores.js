const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedoresController');

router.get('/', proveedoresController.obtenerTodos);
router.get('/count', proveedoresController.contar);
router.get('/:id', proveedoresController.obtenerPorId);

router.post('/', proveedoresController.crear);

router.put('/:id', proveedoresController.actualizar);

router.delete('/:id', proveedoresController.eliminar);

module.exports = router;
