/**
 * Rutas para NOTIFICACIONES
 */
const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificacionesController');

/**
 * @swagger
 * /api/notificaciones:
 *   get:
 *     summary: Obtener notificaciones de un usuario
 *     description: Retorna lista de notificaciones con opciones de filtrado
 *     tags:
 *       - Notificaciones
 *     parameters:
 *       - in: query
 *         name: usuario_id
 *         schema:
 *           type: integer
 *         description: ID del usuario (si no está autenticado)
 *       - in: query
 *         name: leida
 *         schema:
 *           type: boolean
 *         description: Filtrar por leída/no leída
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo (platos, ingredientes, pedidos, etc.)
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginación
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 */
router.get('/', notificacionesController.obtenerNotificaciones);

/**
 * @swagger
 * /api/notificaciones/no-leidas:
 *   get:
 *     summary: Obtener notificaciones no leídas
 *     description: Retorna solo las notificaciones que no han sido leídas
 *     tags:
 *       - Notificaciones
 *     parameters:
 *       - in: query
 *         name: usuario_id
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Notificaciones no leídas
 */
router.get('/no-leidas', notificacionesController.obtenerNoLeidas);

/**
 * @swagger
 * /api/notificaciones/contador:
 *   get:
 *     summary: Contar notificaciones no leídas
 *     description: Retorna el número de notificaciones pendientes
 *     tags:
 *       - Notificaciones
 *     parameters:
 *       - in: query
 *         name: usuario_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contador de notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: integer
 */
router.get('/contador', notificacionesController.contarNoLeidas);

/**
 * @swagger
 * /api/notificaciones/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de notificaciones
 *     description: Retorna agregaciones y métricas de notificaciones
 *     tags:
 *       - Notificaciones
 *     parameters:
 *       - in: query
 *         name: usuario_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas
 */
router.get('/estadisticas', notificacionesController.obtenerEstadisticas);

/**
 * @swagger
 * /api/notificaciones/preferencias:
 *   get:
 *     summary: Obtener preferencias de notificación
 *     description: Retorna configuración de preferencias del usuario
 *     tags:
 *       - Notificaciones
 *     parameters:
 *       - in: query
 *         name: usuario_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Preferencias obtenidas
 */
router.get('/preferencias', notificacionesController.obtenerPreferencias);

/**
 * @swagger
 * /api/notificaciones/preferencias:
 *   put:
 *     summary: Actualizar preferencias de notificación
 *     description: Actualiza la configuración de notificaciones del usuario
 *     tags:
 *       - Notificaciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario_id:
 *                 type: integer
 *               recibir_platos:
 *                 type: boolean
 *               recibir_ingredientes:
 *                 type: boolean
 *               recibir_inventario:
 *                 type: boolean
 *               recibir_pedidos:
 *                 type: boolean
 *               recibir_stock_bajo:
 *                 type: boolean
 *               silencio_inicio:
 *                 type: string
 *                 format: time
 *               silencio_fin:
 *                 type: string
 *                 format: time
 *     responses:
 *       200:
 *         description: Preferencias actualizadas
 */
router.put('/preferencias', notificacionesController.actualizarPreferencias);

/**
 * @swagger
 * /api/notificaciones/{id}/marcar-leida:
 *   patch:
 *     summary: Marcar notificación como leída
 *     description: Marca una notificación específica como leída
 *     tags:
 *       - Notificaciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 */
router.patch('/:id/marcar-leida', notificacionesController.marcarComoLeida);

/**
 * @swagger
 * /api/notificaciones/marcar-todas-leidas:
 *   post:
 *     summary: Marcar todas las notificaciones como leídas
 *     description: Marca todas las notificaciones del usuario como leídas
 *     tags:
 *       - Notificaciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Todas marcadas como leídas
 */
router.post('/marcar-todas-leidas', notificacionesController.marcarTodasComoLeidas);

/**
 * @swagger
 * /api/notificaciones/limpiar:
 *   post:
 *     summary: Limpiar notificaciones leídas antiguas
 *     description: Elimina notificaciones leídas más antiguas que N días
 *     tags:
 *       - Notificaciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario_id:
 *                 type: integer
 *               dias:
 *                 type: integer
 *                 default: 30
 *     responses:
 *       200:
 *         description: Notificaciones limpiadas
 */
router.post('/limpiar', notificacionesController.limpiarLeidas);

/**
 * @swagger
 * /api/notificaciones/{id}:
 *   delete:
 *     summary: Eliminar notificación
 *     description: Elimina una notificación específica
 *     tags:
 *       - Notificaciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificación eliminada
 */
router.delete('/:id', notificacionesController.eliminar);

module.exports = router;
