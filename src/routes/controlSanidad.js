const express = require('express');
const router = express.Router();
const controlSanidadController = require('../controllers/controlSanidadController');

router.get('/', controlSanidadController.obtenerTodos);
router.get('/count', controlSanidadController.contar);
router.get('/id/:id', controlSanidadController.obtenerPorId);
router.get('/plato/:plato_codigo', controlSanidadController.obtenerPorPlato);

router.post('/', controlSanidadController.crear);

router.put('/:id', controlSanidadController.actualizar);

router.delete('/:id', controlSanidadController.eliminar);

module.exports = router;
