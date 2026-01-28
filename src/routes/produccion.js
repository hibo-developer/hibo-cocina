/**
 * Rutas para PRODUCCIÓN
 * Gestión de órdenes de producción, lotes y consumos
 */

const express = require('express');
const router = express.Router();
const produccionController = require('../controllers/produccionController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { createLimiter } = require('../middleware/rateLimiter');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// ============================================================================
// ÓRDENES DE PRODUCCIÓN
// ============================================================================

/**
 * @swagger
 * /api/produccion/ordenes:
 *   get:
 *     summary: Obtener todas las órdenes de producción
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, EN_PROCESO, PAUSADA, COMPLETADA, CANCELADA]
 *         description: Filtrar por estado
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha desde (YYYY-MM-DD)
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha hasta (YYYY-MM-DD)
 *       - in: query
 *         name: plato_id
 *         schema:
 *           type: integer
 *         description: Filtrar por plato
 *     responses:
 *       200:
 *         description: Lista de órdenes
 *       401:
 *         description: No autenticado
 */
router.get('/ordenes', produccionController.obtenerOrdenes);

/**
 * @swagger
 * /api/produccion/ordenes/{id}:
 *   get:
 *     summary: Obtener una orden específica con detalles completos
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles de la orden
 *       404:
 *         description: Orden no encontrada
 */
router.get('/ordenes/:id', produccionController.obtenerOrdenPorId);

/**
 * @swagger
 * /api/produccion/ordenes:
 *   post:
 *     summary: Crear nueva orden de producción
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plato_id
 *               - cantidad_planificada
 *               - fecha_planificada
 *             properties:
 *               plato_id:
 *                 type: integer
 *               cantidad_planificada:
 *                 type: number
 *               fecha_planificada:
 *                 type: string
 *                 format: date
 *               responsable:
 *                 type: string
 *               prioridad:
 *                 type: string
 *                 enum: [BAJA, NORMAL, ALTA, URGENTE]
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Orden creada
 *       400:
 *         description: Datos inválidos
 */
router.post('/ordenes', createLimiter, produccionController.crearOrden);

/**
 * @swagger
 * /api/produccion/ordenes/{id}:
 *   put:
 *     summary: Actualizar orden de producción
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cantidad_planificada:
 *                 type: number
 *               fecha_planificada:
 *                 type: string
 *                 format: date
 *               responsable:
 *                 type: string
 *               prioridad:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Orden actualizada
 *       404:
 *         description: Orden no encontrada
 */
router.put('/ordenes/:id', produccionController.actualizarOrden);

/**
 * @swagger
 * /api/produccion/ordenes/{id}/iniciar:
 *   post:
 *     summary: Iniciar producción de una orden
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producción iniciada
 *       400:
 *         description: Orden no puede iniciarse
 */
router.post('/ordenes/:id/iniciar', produccionController.iniciarProduccion);

/**
 * @swagger
 * /api/produccion/ordenes/{id}/finalizar:
 *   post:
 *     summary: Finalizar producción de una orden
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad_producida
 *             properties:
 *               cantidad_producida:
 *                 type: number
 *     responses:
 *       200:
 *         description: Producción finalizada
 *       400:
 *         description: Orden no puede finalizarse
 */
router.post('/ordenes/:id/finalizar', produccionController.finalizarProduccion);

/**
 * @swagger
 * /api/produccion/ordenes/{id}/cancelar:
 *   post:
 *     summary: Cancelar orden de producción
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Orden cancelada
 */
router.post('/ordenes/:id/cancelar', produccionController.cancelarOrden);

/**
 * @swagger
 * /api/produccion/ordenes/{id}:
 *   delete:
 *     summary: Eliminar orden de producción
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orden eliminada
 *       400:
 *         description: Orden no puede eliminarse
 */
router.delete('/ordenes/:id', produccionController.eliminarOrden);

// ============================================================================
// LOTES DE PRODUCCIÓN
// ============================================================================

/**
 * @swagger
 * /api/produccion/lotes:
 *   get:
 *     summary: Obtener todos los lotes de producción
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orden_id
 *         schema:
 *           type: integer
 *         description: Filtrar por orden
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [ACTIVO, INACTIVO]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de lotes
 */
router.get('/lotes', produccionController.obtenerLotes);

/**
 * @swagger
 * /api/produccion/lotes/{id}:
 *   get:
 *     summary: Obtener un lote específico con detalles
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles del lote
 *       404:
 *         description: Lote no encontrado
 */
router.get('/lotes/:id', produccionController.obtenerLotePorId);

/**
 * @swagger
 * /api/produccion/lotes:
 *   post:
 *     summary: Crear nuevo lote
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orden_id
 *               - cantidad
 *               - fecha_produccion
 *             properties:
 *               orden_id:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *               fecha_produccion:
 *                 type: string
 *                 format: date-time
 *               fecha_caducidad:
 *                 type: string
 *                 format: date
 *               ubicacion:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lote creado
 *       400:
 *         description: Datos inválidos
 */
router.post('/lotes', createLimiter, produccionController.crearLote);

/**
 * @swagger
 * /api/produccion/lotes/{id}:
 *   put:
 *     summary: Actualizar un lote
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cantidad:
 *                 type: number
 *               fecha_caducidad:
 *                 type: string
 *                 format: date
 *               rendimiento:
 *                 type: number
 *               coste_total:
 *                 type: number
 *               estado:
 *                 type: string
 *               ubicacion:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lote actualizado
 */
router.put('/lotes/:id', produccionController.actualizarLote);

/**
 * @swagger
 * /api/produccion/lotes/{id}:
 *   delete:
 *     summary: Eliminar un lote
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lote eliminado
 */
router.delete('/lotes/:id', produccionController.eliminarLote);

// ============================================================================
// CONSUMOS DE PRODUCCIÓN
// ============================================================================

/**
 * @swagger
 * /api/produccion/consumos:
 *   get:
 *     summary: Obtener todos los consumos de ingredientes
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orden_id
 *         schema:
 *           type: integer
 *         description: Filtrar por orden
 *     responses:
 *       200:
 *         description: Lista de consumos
 */
router.get('/consumos', produccionController.obtenerConsumos);

/**
 * @swagger
 * /api/produccion/consumos/{id}:
 *   get:
 *     summary: Obtener un consumo específico
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles del consumo
 *       404:
 *         description: Consumo no encontrado
 */
router.get('/consumos/:id', produccionController.obtenerConsumoPorId);

/**
 * @swagger
 * /api/produccion/consumos:
 *   post:
 *     summary: Registrar consumo de ingrediente
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orden_id
 *               - ingrediente_id
 *               - cantidad_planificada
 *             properties:
 *               orden_id:
 *                 type: integer
 *               ingrediente_id:
 *                 type: integer
 *               cantidad_planificada:
 *                 type: number
 *               cantidad_consumida:
 *                 type: number
 *               unidad:
 *                 type: string
 *               coste:
 *                 type: number
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Consumo registrado
 *       400:
 *         description: Datos inválidos
 */
router.post('/consumos', createLimiter, produccionController.crearConsumo);

/**
 * @swagger
 * /api/produccion/consumos/{id}:
 *   put:
 *     summary: Actualizar un consumo
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cantidad_consumida:
 *                 type: number
 *               coste:
 *                 type: number
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Consumo actualizado
 */
router.put('/consumos/:id', produccionController.actualizarConsumo);

/**
 * @swagger
 * /api/produccion/consumos/{id}:
 *   delete:
 *     summary: Eliminar un consumo
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Consumo eliminado
 */
router.delete('/consumos/:id', produccionController.eliminarConsumo);

// ============================================================================
// REPORTES Y ESTADÍSTICAS
// ============================================================================

/**
 * @swagger
 * /api/produccion/rendimientos:
 *   get:
 *     summary: Obtener rendimientos por plato
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Rendimientos por plato
 */
router.get('/rendimientos', produccionController.obtenerRendimientos);

/**
 * @swagger
 * /api/produccion/costes:
 *   get:
 *     summary: Análisis de costes de producción
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Costes de producción
 */
router.get('/costes', produccionController.obtenerCostes);

/**
 * @swagger
 * /api/produccion/estadisticas:
 *   get:
 *     summary: KPIs de producción
 *     tags: [Producción]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: KPIs generales de producción
 */
router.get('/estadisticas', produccionController.obtenerEstadisticas);

module.exports = router;
