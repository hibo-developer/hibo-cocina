/**
 * Rutas para INVENTARIO
 */
const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { validate } = require('../middleware/validator');
const { inventarioSchemas } = require('../middleware/validationSchemas');
const { createLimiter, updateLimiter, deleteLimiter } = require('../middleware/rateLimiter');
const { emitInventarioUpdate } = require('../utils/websocket-helper');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const { createResponse } = require('../middleware/errorHandler');
const { getLogger } = require('../utils/logger');

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
router.post('/', createLimiter, validate(inventarioSchemas.crear), async (req, res) => {
  try {
    const result = await inventarioController.crear(req, res);
    if (res.statusCode === 201 && result) {
      emitInventarioUpdate(req.app, result, 'created');
    }
  } catch (error) {
    // Error ya manejado por el controlador
  }
});

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
router.put('/:id', updateLimiter, validate(inventarioSchemas.actualizar), async (req, res) => {
  try {
    const result = await inventarioController.actualizar(req, res);
    if (res.statusCode === 200 && result) {
      // Emitir actualización
      emitInventarioUpdate(req.app, result, 'updated');
      
      // Verificar stock bajo y emitir alerta
      if (result.cantidad_actual < result.cantidad_minima) {
        emitInventarioUpdate(req.app, {
          ...result,
          alerta: true,
          mensaje: `Stock bajo: ${result.cantidad_actual} < ${result.cantidad_minima}`
        }, 'low-stock');
      }
    }
  } catch (error) {
    // Error ya manejado por el controlador
  }
});

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
router.delete('/:id', deleteLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await inventarioController.eliminar(req, res);
    if (res.statusCode === 200) {
      emitInventarioUpdate(req.app, { id: parseInt(id) }, 'deleted');
    }
  } catch (error) {
    // Error ya manejado por el controlador
  }
});

/**
 * @swagger
 * /api/inventario/validar:
 *   post:
 *     summary: Validar datos de movimiento de inventario
 *     description: Valida los datos de un movimiento sin registrarlo
 *     tags:
 *       - Inventario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.post('/validar', (req, res) => {
  try {
    const validacion = ServicioValidaciones.validarMovimientoInventario(req.body, true);
    res.json(createResponse(validacion.valido, validacion, 
      validacion.valido ? 'Datos válidos' : 'Errores de validación'));
  } catch (error) {
    const log = getLogger();
    log.error('Error validando movimiento de inventario:', error);
    res.status(500).json(createResponse(false, null, error.message));
  }
});

/**
 * @swagger
 * /api/inventario/alertas:
 *   get:
 *     summary: Obtener alertas de inventario
 *     description: Retorna alertas de stock bajo, próximo a caducar, etc.
 *     tags:
 *       - Inventario
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [bajo, critico, caducidad, todos]
 *     responses:
 *       200:
 *         description: Alertas obtenidas
 */
router.get('/alertas', inventarioController.obtenerAlertas);

/**
 * @swagger
 * /api/inventario/alertas/criticas:
 *   get:
 *     summary: Obtener solo alertas críticas
 *     description: Retorna items con stock crítico (< 50% del mínimo)
 *     tags:
 *       - Inventario
 *     responses:
 *       200:
 *         description: Alertas críticas obtenidas
 */
router.get('/alertas/criticas', inventarioController.obtenerAlertasCriticas);

/**
 * @swagger
 * /api/inventario/alertas/caducidad:
 *   get:
 *     summary: Obtener alertas de caducidad
 *     description: Retorna items próximos a vencer o vencidos
 *     tags:
 *       - Inventario
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Alertas de caducidad obtenidas
 */
router.get('/alertas/caducidad', inventarioController.obtenerAlertasCaducidad);

module.exports = router;
