const express = require('express');
const router = express.Router();
const escandallosController = require('../controllers/escandallosController');

// Rutas para escandallos
router.get('/', escandallosController.obtenerTodos);
router.get('/count', escandallosController.contar);
router.get('/:id', escandallosController.obtenerPorId);
router.get('/plato/:codigo_plato', escandallosController.obtenerPorPlato);
router.get('/costo/:codigo_plato', escandallosController.calcularCostePlato);

router.post('/', escandallosController.crear);

router.put('/:id', escandallosController.actualizar);

router.delete('/:id', escandallosController.eliminar);

module.exports = router;
