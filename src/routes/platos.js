/**
 * Rutas para PLATOS
 */
const express = require('express');
const router = express.Router();
const platosController = require('../controllers/platosController');
const { validate } = require('../middleware/validator');
const { platosSchemas } = require('../middleware/validationSchemas');
const { createLimiter, updateLimiter, deleteLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/platos/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de platos
 *     description: Retorna agregaciones de datos sobre platos (total, activos, costes promedio, etc.)
 *     tags:
 *       - Platos
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
 *                       $ref: '#/components/schemas/StatisticsPlatos'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/estadisticas', platosController.obtenerEstadisticas);

/**
 * @swagger
 * /api/platos:
 *   get:
 *     summary: Obtener todos los platos
 *     description: Retorna una lista paginada de todos los platos del sistema
 *     tags:
 *       - Platos
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página (paginación)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: grupo_menu
 *         schema:
 *           type: string
 *         description: Filtrar por grupo de menú
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *     responses:
 *       200:
 *         description: Lista de platos obtenida correctamente
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
 *                         $ref: '#/components/schemas/Plato'
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', platosController.obtenerTodos);

/**
 * @swagger
 * /api/platos/{id}:
 *   get:
 *     summary: Obtener plato por ID
 *     description: Retorna los detalles de un plato específico
 *     tags:
 *       - Platos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del plato
 *     responses:
 *       200:
 *         description: Plato obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Plato'
 *       404:
 *         description: Plato no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', platosController.obtenerPorId);

/**
 * @swagger
 * /api/platos:
 *   post:
 *     summary: Crear nuevo plato
 *     description: Crea un nuevo plato en el sistema
 *     tags:
 *       - Platos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - grupo_menu
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Paella Valenciana"
 *               descripcion:
 *                 type: string
 *                 example: "Paella tradicional con conejo y pollo"
 *               grupo_menu:
 *                 type: string
 *                 example: "Arroces"
 *               tipo:
 *                 type: string
 *                 example: "Plato Principal"
 *               precio_venta:
 *                 type: number
 *                 example: 18.50
 *               precio_menu:
 *                 type: number
 *                 example: 16.00
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Plato creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Plato'
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', createLimiter, validate(platosSchemas.crear), platosController.crear);

/**
 * @swagger
 * /api/platos/{id}:
 *   put:
 *     summary: Actualizar plato
 *     description: Actualiza los datos de un plato existente
 *     tags:
 *       - Platos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del plato a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               grupo_menu:
 *                 type: string
 *               precio_venta:
 *                 type: number
 *               precio_menu:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Plato actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Plato'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Plato no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', updateLimiter, validate(platosSchemas.actualizar), platosController.actualizar);

/**
 * @swagger
 * /api/platos/{id}:
 *   delete:
 *     summary: Eliminar plato
 *     description: Elimina un plato del sistema
 *     tags:
 *       - Platos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del plato a eliminar
 *     responses:
 *       200:
 *         description: Plato eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Plato no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', deleteLimiter, platosController.eliminar);

module.exports = router;
