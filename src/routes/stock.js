const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// Obtener alertas de stock bajo
router.get('/alertas', stockController.obtenerAlertas);

// Calcular necesidades semanales
router.get('/necesidades/:semana', stockController.calcularNecesidadesSemanales);

// Obtener valor del inventario
router.get('/valor', stockController.obtenerValorInventario);

// Registrar entrada de stock
router.post('/entrada', stockController.registrarEntrada);

// Registrar salida de stock
router.post('/salida', stockController.registrarSalida);

// Obtener historial de movimientos
router.get('/movimientos', stockController.obtenerMovimientos);

module.exports = router;
