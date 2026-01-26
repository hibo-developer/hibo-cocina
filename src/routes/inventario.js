/**
 * Rutas para INVENTARIO
 */
const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { validate } = require('../middleware/validator');
const { inventarioSchemas } = require('../middleware/validationSchemas');
const { createLimiter, updateLimiter, deleteLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/inventario:
 *   get:
 *     summary: Obtener inventario completo
 *     description: Retorna lista de todos los items del inventario con sus cantidades
 *     tags:
 *       - Inventario
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventario obtenido
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
 *                         $ref: '#/components/schemas/InventarioItem'
 */
router.get('/', inventarioController.obtenerTodos);

/**
 * @swagger
 * /api/inventario/{id}:
 *   get:
 *     summary: Obtener item de inventario
 *     tags:
 *       - Inventario
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item obtenido
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/InventarioItem'
 */
router.get('/:id', inventarioController.obtenerPorId);

/**
 * @swagger
 * /api/inventario:
 *   post:
 *     summary: Crear item de inventario
 *     tags:
 *       - Inventario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ingrediente_id
 *               - cantidad
 *             properties:
 *               ingrediente_id:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *               cantidad_minima:
 *                 type: number
 *               ubicacion:
 *                 type: string
 *               estado:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item creado
 */
router.post('/', createLimiter, validate(inventarioSchemas.crear), inventarioController.crear);

/**
 * @swagger
 * /api/inventario/{id}:
 *   put:
 *     summary: Actualizar item de inventario
 *     tags:
 *       - Inventario
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
 *               cantidad:
 *                 type: number
 *               cantidad_minima:
 *                 type: number
 *               ubicacion:
 *                 type: string
 *               estado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item actualizado
 */
router.put('/:id', updateLimiter, validate(inventarioSchemas.actualizar), inventarioController.actualizar);

/**
 * @swagger
 * /api/inventario/{id}:
 *   delete:
 *     summary: Eliminar item de inventario
 *     tags:
 *       - Inventario
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item eliminado
 */
router.delete('/:id', deleteLimiter, inventarioController.eliminar);

module.exports = router;

module.exports = router;
