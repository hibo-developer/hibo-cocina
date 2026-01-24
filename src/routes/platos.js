const express = require('express');
const router = express.Router();
const platosController = require('../controllers/platosController');
const alergenosPersonalizadosController = require('../controllers/alergenosPersonalizadosController');

router.get('/', platosController.obtenerTodos);
router.get('/estadisticas', platosController.estadisticas);
router.get('/id/:id', platosController.obtenerPorId);
router.get('/:id(\\d+)', platosController.obtenerPorId); // Captura solo números
router.get('/:codigo', platosController.obtenerPorCodigo);
router.post('/', platosController.crear);
router.put('/:id', platosController.actualizar);
router.delete('/:id', platosController.eliminar);

// Rutas para alérgenos personalizados de platos
router.get('/:id/alergenos-personalizados', alergenosPersonalizadosController.obtenerDePlato);
router.put('/:id/alergenos-personalizados', alergenosPersonalizadosController.actualizarDePlato);

module.exports = router;
