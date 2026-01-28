/**
 * Rutas para INGREDIENTES
 */
const express = require('express');
const router = express.Router();
const ingredientesController = require('../controllers/ingredientesController');
const { validate } = require('../middleware/validator');
const { ingredientesSchemas } = require('../middleware/validationSchemas');
const { createLimiter, updateLimiter, deleteLimiter } = require('../middleware/rateLimiter');
const { emitIngredientesUpdate } = require('../utils/websocket-helper');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const { createResponse } = require('../middleware/errorHandler');
const { getLogger } = require('../utils/logger');

/**
 * @swagger
 * /api/ingredientes:
 *   get:
 *     summary: Obtener todos los ingredientes
 *     description: Retorna una lista de todos los ingredientes disponibles en el sistema
 *     tags:
 *       - Ingredientes
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
 *         name: activo
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de ingredientes
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
 *                         $ref: '#/components/schemas/Ingrediente'
 */
router.get('/', ingredientesController.obtenerTodos);

/**
 * @swagger
 * /api/ingredientes/{id}:
 *   get:
 *     summary: Obtener ingrediente por ID
 *     tags:
 *       - Ingredientes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ingrediente obtenido
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Ingrediente'
 *       404:
 *         description: Ingrediente no encontrado
 */
router.get('/:id', ingredientesController.obtenerPorId);

/**
 * @swagger
 * /api/ingredientes:
 *   post:
 *     summary: Crear nuevo ingrediente
 *     tags:
 *       - Ingredientes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - unidad
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Tomate"
 *               unidad:
 *                 type: string
 *                 example: "kg"
 *               precio_base:
 *                 type: number
 *                 example: 2.50
 *               alergenos:
 *                 type: string
 *                 example: "gluten"
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Ingrediente creado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Ingrediente'
 */
router.post('/', createLimiter, validate(ingredientesSchemas.crear), async (req, res) => {
  try {
    const result = await ingredientesController.crear(req, res);
    if (res.statusCode === 201 && result) {
      emitIngredientesUpdate(req.app, result, 'created');
    }
  } catch (error) {
    // Error ya manejado por el controlador
  }
});

/**
 * @swagger
 * /api/ingredientes/{id}:
 *   put:
 *     summary: Actualizar ingrediente
 *     tags:
 *       - Ingredientes
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
 *               nombre:
 *                 type: string
 *               unidad:
 *                 type: string
 *               precio_base:
 *                 type: number
 *               alergenos:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Ingrediente actualizado
 */
router.put('/:id', updateLimiter, validate(ingredientesSchemas.actualizar), async (req, res) => {
  try {
    const result = await ingredientesController.actualizar(req, res);
    if (res.statusCode === 200 && result) {
      emitIngredientesUpdate(req.app, result, 'updated');
    }
  } catch (error) {
    // Error ya manejado por el controlador
  }
});

/**
 * @swagger
 * /api/ingredientes/{id}:
 *   delete:
 *     summary: Eliminar ingrediente
 *     tags:
 *       - Ingredientes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ingrediente eliminado
 */
router.delete('/:id', deleteLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ingredientesController.eliminar(req, res);
    if (res.statusCode === 200) {
      emitIngredientesUpdate(req.app, { id: parseInt(id) }, 'deleted');
    }
  } catch (error) {
    // Error ya manejado por el controlador
  }
});

/**
 * @swagger
 * /api/ingredientes/validar:
 *   post:
 *     summary: Validar datos de ingrediente
 *     description: Valida los datos de un ingrediente sin crear/actualizar el registro
 *     tags:
 *       - Ingredientes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Validación completada
 */
router.post('/validar', (req, res) => {
  try {
    const validacion = ServicioValidaciones.validarIngrediente(req.body, true);
    res.json(createResponse(validacion.valido, validacion, 
      validacion.valido ? 'Datos válidos' : 'Errores de validación'));
  } catch (error) {
    const log = getLogger();
    log.error('Error validando ingrediente:', error);
    res.status(500).json(createResponse(false, null, error.message));
  }
});

module.exports = router;
