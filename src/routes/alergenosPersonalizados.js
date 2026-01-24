const express = require('express');
const router = express.Router();
const AlergenosPersonalizadosController = require('../controllers/alergenosPersonalizadosController');

// Rutas para alérgenos personalizados
router.get('/', AlergenosPersonalizadosController.listar);
router.get('/:id', AlergenosPersonalizadosController.obtener);
router.post('/', AlergenosPersonalizadosController.crear);
router.put('/:id', AlergenosPersonalizadosController.actualizar);
router.delete('/:id', AlergenosPersonalizadosController.eliminar);

module.exports = router;
