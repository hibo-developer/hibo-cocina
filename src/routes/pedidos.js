/**
 * Rutas para PEDIDOS
 */
const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { validate } = require('../middleware/validator');
const { pedidosSchemas } = require('../middleware/validationSchemas');
const { createLimiter, updateLimiter, deleteLimiter } = require('../middleware/rateLimiter');
const { emitPedidosUpdate, emitNotification } = require('../utils/websocket-helper');

/**
 * @swagger
 * /api/pedidos/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de pedidos
 *     description: Retorna agregaciones de datos sobre pedidos (total, completados, pendientes, etc.)
 *     tags:
 *       - Pedidos
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/StatisticsPedidos'
 */
router.get('/estadisticas', pedidosController.obtenerEstadisticas);

/**
 * @swagger
 * /api/pedidos:
 *   get:
 *     summary: Obtener todos los pedidos
 *     description: Retorna una lista paginada de todos los pedidos
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, completado, cancelado]
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Pedido'
 */
router.get('/', pedidosController.obtenerTodos);

/**
 * @swagger
 * /api/pedidos/{id}:
 *   get:
 *     summary: Obtener pedido por ID
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido obtenido
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Pedido'
 *       404:
 *         description: Pedido no encontrado
 */
router.get('/:id', pedidosController.obtenerPorId);

/**
 * @swagger
 * /api/pedidos:
 *   post:
 *     summary: Crear nuevo pedido
 *     tags:
 *       - Pedidos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero_pedido
 *               - cliente
 *             properties:
 *               numero_pedido:
 *                 type: string
 *                 example: "PED-2026-001"
 *               cliente:
 *                 type: string
 *                 example: "Hotel Gran Vía"
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               estado:
 *                 type: string
 *                 enum: [pendiente, completado, cancelado]
 *                 example: "pendiente"
 *               total:
 *                 type: number
 *                 example: 150.50
 *     responses:
 *       201:
 *         description: Pedido creado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Pedido'
 */
router.post('/', validate(pedidosSchemas.crear), async (req, res) => {
  try {
    const result = await pedidosController.crear(req, res);
    if (res.statusCode === 201 && result) {
      emitPedidosUpdate(req.app, result, 'created', result.usuario_id);
      
      // Notificación personal al usuario
      if (result.usuario_id) {
        emitNotification(req.app, result.usuario_id, {
          type: 'pedido',
          title: 'Pedido Creado',
          message: `Tu pedido #${result.id} ha sido creado exitosamente`,
          data: { pedidoId: result.id }
        });
      }
    }
  } catch (error) {
    // Error ya manejado por el controlador
  }
});

/**
 * @swagger
 * /api/pedidos/{id}:
 *   put:
 *     summary: Actualizar pedido
 *     tags:
 *       - Pedidos
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
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [pendiente, completado, cancelado]
 *               total:
 *                 type: number
 *     responses:
 *       200:
 *         description: Pedido actualizado
 */
router.put('/:id', validate(pedidosSchemas.actualizar), async (req, res) => {
  try {
    const result = await pedidosController.actualizar(req, res);
    if (res.statusCode === 200 && result) {
      emitPedidosUpdate(req.app, result, 'updated', result.usuario_id);
      
      // Notificación de cambio de estado si cambió
      if (req.body.estado && result.usuario_id) {
        const mensajesEstado = {
          'pendiente': 'está pendiente de confirmación',
          'confirmado': 'ha sido confirmado',
          'en_preparacion': 'está en preparación',
          'listo': 'está listo para recoger',
          'entregado': 'ha sido entregado',
          'cancelado': 'ha sido cancelado'
        };
        
        emitNotification(req.app, result.usuario_id, {
          type: 'pedido',
          title: 'Estado de Pedido Actualizado',
          message: `Tu pedido #${result.id} ${mensajesEstado[result.estado] || 'ha sido actualizado'}`,
          data: { pedidoId: result.id, nuevoEstado: result.estado }
        });
      }
    }
  } catch (error) {
    // Error ya manejado por el controlador
  }
});

/**
 * @swagger
 * /api/pedidos/{id}:
 *   delete:
 *     summary: Eliminar pedido
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido eliminado
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pedidosController.eliminar(req, res);
    if (res.statusCode === 200) {
      emitPedidosUpdate(req.app, { id: parseInt(id) }, 'deleted');
    }
  } catch (error) {
    // Error ya manejado por el controlador
  }
});

module.exports = router;

module.exports = router;
