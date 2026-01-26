/**
 * Rutas para ESCANDALLOS
 */
const express = require('express');
const router = express.Router();
const escandallosController = require('../controllers/escandallosController');
const { validate } = require('../middleware/validator');
const { escandallosSchemas } = require('../middleware/validationSchemas');
const { createLimiter, updateLimiter, deleteLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/escandallos:
 *   get:
 *     summary: Obtener todos los escandallos
 *     description: Retorna lista de escandallos (detalles de ingredientes de cada plato)
 *     tags:
 *       - Escandallos
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de escandallos
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
 *                         type: object
 */
router.get('/', escandallosController.obtenerTodos);

/**
 * @swagger
 * /api/escandallos/{id}:
 *   get:
 *     summary: Obtener escandallo por ID
 *     tags:
 *       - Escandallos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Escandallo obtenido
 */
router.get('/:id', escandallosController.obtenerPorId);

/**
 * @swagger
 * /api/escandallos:
 *   post:
 *     summary: Crear escandallo
 *     description: Crea un nuevo escandallo (asocia ingredientes a un plato)
 *     tags:
 *       - Escandallos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plato_id
 *               - ingrediente_id
 *             properties:
 *               plato_id:
 *                 type: integer
 *               ingrediente_id:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *     responses:
 *       201:
 *         description: Escandallo creado
 */
router.post('/', createLimiter, validate(escandallosSchemas.crear), escandallosController.crear);

/**
 * @swagger
 * /api/escandallos/{id}:
 *   put:
 *     summary: Actualizar escandallo
 *     tags:
 *       - Escandallos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Escandallo actualizado
 */
router.put('/:id', updateLimiter, validate(escandallosSchemas.actualizar), escandallosController.actualizar);

/**
 * @swagger
 * /api/escandallos/{id}:
 *   delete:
 *     summary: Eliminar escandallo
 *     tags:
 *       - Escandallos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Escandallo eliminado
 */
router.delete('/:id', deleteLimiter, escandallosController.eliminar);

module.exports = router;

module.exports = router;
