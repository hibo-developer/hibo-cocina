/**
 * Rutas para OFERTAS Y EVENTOS
 */
const express = require('express');
const router = express.Router();
const ofertasController = require('../controllers/ofertasController');
const { validate } = require('../middleware/validator');
const { ofertasSchemas } = require('../middleware/validationSchemas');
const { createLimiter, updateLimiter, deleteLimiter } = require('../middleware/rateLimiter');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const { createResponse } = require('../middleware/errorHandler');
const { getLogger } = require('../utils/logger');

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

/**
 * @swagger
 * /api/ofertas/validar:
 *   post:
 *     summary: Validar datos de oferta
 *     description: Valida los datos de una oferta sin crear/actualizar el registro
 *     tags:
 *       - Ofertas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.post('/ofertas/validar', (req, res) => {
  try {
    const validacion = ServicioValidaciones.validarOferta ? 
      ServicioValidaciones.validarOferta(req.body, true) : 
      { valido: true, errores: [] };
    res.json(createResponse(validacion.valido, validacion, 
      validacion.valido ? 'Datos válidos' : 'Errores de validación'));
  } catch (error) {
    const log = getLogger();
    log.error('Error validando oferta:', error);
    res.status(500).json(createResponse(false, null, error.message));
  }
});

module.exports = router;
