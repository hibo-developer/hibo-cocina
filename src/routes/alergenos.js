const express = require('express');
const router = express.Router();
const alergenosController = require('../controllers/alergenosController');

// Rutas para alérgenos personalizados
router.get('/personalizados', alergenosController.listar);
router.get('/personalizados/:id', alergenosController.obtenerPorId);
router.post('/personalizados', alergenosController.crear);
router.put('/personalizados/:id', alergenosController.actualizar);
router.delete('/personalizados/:id', alergenosController.eliminar);

// Rutas para alérgenos oficiales UE
router.get('/oficiales', alergenosController.listarOficiales);
router.put('/oficiales/:id', alergenosController.actualizarOficial);

module.exports = router;
