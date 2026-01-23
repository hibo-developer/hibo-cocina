const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

// Rutas para clientes
router.get('/', clientesController.obtenerTodos);
router.get('/count', clientesController.contar);
router.get('/:id', clientesController.obtenerPorId);

router.post('/', clientesController.crear);

router.put('/:id', clientesController.actualizar);

router.delete('/:id', clientesController.eliminar);

module.exports = router;
