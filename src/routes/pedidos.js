/**
 * Rutas para PEDIDOS
 */
const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { validate } = require('../middleware/validator');
const { pedidosSchemas } = require('../middleware/validationSchemas');

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
router.post('/', validate(pedidosSchemas.crear), pedidosController.crear);

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
router.put('/:id', validate(pedidosSchemas.actualizar), pedidosController.actualizar);

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
router.delete('/:id', pedidosController.eliminar);

module.exports = router;

module.exports = router;
