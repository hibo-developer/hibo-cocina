/**
 * Rutas para OFERTAS Y EVENTOS
 */
const express = require('express');
const router = express.Router();
const ofertasController = require('../controllers/ofertasController');
const { validate } = require('../middleware/validator');
const { ofertasSchemas } = require('../middleware/validationSchemas');
const { createLimiter, updateLimiter, deleteLimiter } = require('../middleware/rateLimiter');

// ============================================================================
// RUTAS DE OFERTAS
// ============================================================================

router.get('/ofertas', ofertasController.obtenerOfertasTodas);
router.get('/ofertas/:id', ofertasController.obtenerOfertaPorId);
router.post('/ofertas', createLimiter, ofertasController.crearOferta);
router.put('/ofertas/:id', updateLimiter, ofertasController.actualizarOferta);
router.delete('/ofertas/:id', deleteLimiter, ofertasController.eliminarOferta);

// ============================================================================
// RUTAS DE EVENTOS
// ============================================================================

router.get('/eventos', ofertasController.obtenerEventosTodos);
router.get('/eventos/:id', ofertasController.obtenerEventoPorId);
router.post('/eventos', createLimiter, ofertasController.crearEvento);
router.put('/eventos/:id', updateLimiter, ofertasController.actualizarEvento);
router.delete('/eventos/:id', deleteLimiter, ofertasController.eliminarEvento);

module.exports = router;
