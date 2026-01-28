/**
 * Rutas para OFERTAS Y EVENTOS
 * Incluye CRUD completo, aplicaciones de ofertas, y gestión de asistentes a eventos
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
// RUTAS DE OFERTAS - CRUD Y CONSULTAS
// ============================================================================

/**
 * @swagger
 * /api/ofertas:
 *   get:
 *     summary: Obtener todas las ofertas
 *     description: Retorna lista completa de ofertas con todas sus características
 *     tags: [Ofertas]
 *     responses:
 *       200:
 *         description: Lista de ofertas
 */
router.get('/ofertas', ofertasController.obtenerOfertasTodas);

/**
 * @swagger
 * /api/ofertas/activas:
 *   get:
 *     summary: Obtener ofertas activas
 *     description: Retorna solo las ofertas activas y vigentes
 *     tags: [Ofertas]
 */
router.get('/ofertas/activas', ofertasController.obtenerOfertasActivas);

/**
 * @swagger
 * /api/ofertas/estadisticas:
 *   get:
 *     summary: Estadísticas de ofertas
 *     description: Retorna estadísticas de uso, aplicaciones y beneficiarios
 *     tags: [Ofertas]
 */
router.get('/ofertas/estadisticas', ofertasController.obtenerEstadisticasOferta);

/**
 * @swagger
 * /api/ofertas/{id}:
 *   get:
 *     summary: Obtener oferta por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/ofertas/:id', ofertasController.obtenerOfertaPorId);

/**
 * @swagger
 * /api/ofertas:
 *   post:
 *     summary: Crear nueva oferta
 *     tags: [Ofertas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codigo, nombre]
 */
router.post('/ofertas', createLimiter, ofertasController.crearOferta);

/**
 * @swagger
 * /api/ofertas/{id}:
 *   put:
 *     summary: Actualizar oferta
 *     tags: [Ofertas]
 */
router.put('/ofertas/:id', updateLimiter, ofertasController.actualizarOferta);

/**
 * @swagger
 * /api/ofertas/{id}:
 *   delete:
 *     summary: Eliminar oferta
 *     tags: [Ofertas]
 */
router.delete('/ofertas/:id', deleteLimiter, ofertasController.eliminarOferta);

// ============================================================================
// APLICACIÓN DE OFERTAS
// ============================================================================

/**
 * @swagger
 * /api/ofertas/aplicar:
 *   post:
 *     summary: Aplicar oferta a un pedido
 *     tags: [Ofertas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oferta_id:
 *                 type: integer
 *               pedido_id:
 *                 type: integer
 *               cliente_id:
 *                 type: integer
 */
router.post('/ofertas/aplicar', createLimiter, ofertasController.aplicarOferta);

// ============================================================================
// VALIDACIÓN DE OFERTAS
// ============================================================================

/**
 * @swagger
 * /api/ofertas/validar:
 *   post:
 *     summary: Validar datos de oferta
 *     tags: [Ofertas]
 */
router.post('/ofertas/validar', ofertasController.validarOferta);

// ============================================================================
// RUTAS DE EVENTOS - CRUD Y CONSULTAS
// ============================================================================

/**
 * @swagger
 * /api/eventos:
 *   get:
 *     summary: Obtener todos los eventos
 *     tags: [Eventos]
 */
router.get('/eventos', ofertasController.obtenerEventosTodos);

/**
 * @swagger
 * /api/eventos/proximos:
 *   get:
 *     summary: Obtener eventos próximos
 *     tags: [Eventos]
 *     parameters:
 *       - in: query
 *         name: dias
 *         description: Número de días a futuro (default: 30)
 *         schema:
 *           type: integer
 */
router.get('/eventos/proximos', ofertasController.obtenerEventosProximos);

/**
 * @swagger
 * /api/eventos/estadisticas:
 *   get:
 *     summary: Estadísticas de eventos
 *     tags: [Eventos]
 */
router.get('/eventos/estadisticas', ofertasController.obtenerEstadisticasEvento);

/**
 * @swagger
 * /api/eventos/{id}:
 *   get:
 *     summary: Obtener evento por ID
 *     tags: [Eventos]
 */
router.get('/eventos/:id', ofertasController.obtenerEventoPorId);

/**
 * @swagger
 * /api/eventos:
 *   post:
 *     summary: Crear nuevo evento
 *     tags: [Eventos]
 */
router.post('/eventos', createLimiter, ofertasController.crearEvento);

/**
 * @swagger
 * /api/eventos/{id}:
 *   put:
 *     summary: Actualizar evento
 *     tags: [Eventos]
 */
router.put('/eventos/:id', updateLimiter, ofertasController.actualizarEvento);

/**
 * @swagger
 * /api/eventos/{id}:
 *   delete:
 *     summary: Eliminar evento
 *     tags: [Eventos]
 */
router.delete('/eventos/:id', deleteLimiter, ofertasController.eliminarEvento);

// ============================================================================
// GESTIÓN DE ASISTENTES A EVENTOS
// ============================================================================

/**
 * @swagger
 * /api/eventos/{evento_id}/asistentes:
 *   get:
 *     summary: Obtener asistentes de un evento
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: evento_id
 *         required: true
 */
router.get('/eventos/:evento_id/asistentes', ofertasController.obtenerAsistentes);

/**
 * @swagger
 * /api/eventos/{evento_id}/asistentes:
 *   post:
 *     summary: Agregar asistente a evento
 *     tags: [Eventos]
 */
router.post('/eventos/:evento_id/asistentes', createLimiter, ofertasController.agregarAsistente);

/**
 * @swagger
 * /api/asistentes/{asistente_id}/confirmar:
 *   put:
 *     summary: Actualizar confirmación de asistente
 *     tags: [Eventos]
 */
router.put('/asistentes/:asistente_id/confirmar', updateLimiter, ofertasController.actualizarConfirmacionAsistente);

/**
 * @swagger
 * /api/asistentes/{asistente_id}:
 *   delete:
 *     summary: Eliminar asistente
 *     tags: [Eventos]
 */
router.delete('/asistentes/:asistente_id', deleteLimiter, ofertasController.eliminarAsistente);

// ============================================================================
// VALIDACIÓN DE EVENTOS
// ============================================================================

/**
 * @swagger
 * /api/eventos/validar:
 *   post:
 *     summary: Validar datos de evento
 *     tags: [Eventos]
 */
router.post('/eventos/validar', ofertasController.validarEvento);

module.exports = router;
