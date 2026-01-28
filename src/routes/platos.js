/**
 * Rutas para PLATOS
 */
const express = require('express');
const router = express.Router();
const platosController = require('../controllers/platosController');
const { validate } = require('../middleware/validator');
const { platosSchemas } = require('../middleware/validationSchemas');
const { createLimiter, updateLimiter, deleteLimiter } = require('../middleware/rateLimiter');
const { emitPlatosUpdate, getIO } = require('../utils/websocket-helper');
const ServicioCalculos = require('../utils/servicioCalculos');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const { createResponse } = require('../middleware/errorHandler');
const { getLogger } = require('../utils/logger');

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
router.post('/', createLimiter, validate(platosSchemas.crear), async (req, res) => {
  try {
    // Llamar al controlador
    const result = await platosController.crear(req, res);
    
    // Emitir evento de WebSocket
    if (res.statusCode === 201 && result) {
      emitPlatosUpdate(req.app, result, 'created');
    }
  } catch (error) {
    // El error ya fue manejado por el controlador
  }
});

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
router.put('/:id', updateLimiter, validate(platosSchemas.actualizar), async (req, res) => {
  try {
    // Llamar al controlador
    const result = await platosController.actualizar(req, res);
    
    // Emitir evento de WebSocket
    if (res.statusCode === 200 && result) {
      emitPlatosUpdate(req.app, result, 'updated');
    }
  } catch (error) {
    // El error ya fue manejado por el controlador
  }
});

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
router.delete('/:id', deleteLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Llamar al controlador
    const result = await platosController.eliminar(req, res);
    
    // Emitir evento de WebSocket
    if (res.statusCode === 200) {
      emitPlatosUpdate(req.app, { id: parseInt(id) }, 'deleted');
    }
  } catch (error) {
    // El error ya fue manejado por el controlador
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// NUEVOS ENDPOINTS - CÁLCULOS Y VALIDACIONES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/platos/{id}/coste:
 *   get:
 *     summary: Calcular coste de un plato
 *     description: Calcula el coste total del plato basado en sus escandallos
 *     tags:
 *       - Platos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Coste calculado correctamente
 */
router.get('/:id/coste', async (req, res) => {
  try {
    const { id } = req.params;
    const coste = await ServicioCalculos.calcularCostePlato(parseInt(id));
    res.json(createResponse(true, coste, 'Coste calculado'));
  } catch (error) {
    const log = getLogger();
    log.error('Error calculando coste:', error);
    res.status(500).json(createResponse(false, null, error.message));
  }
});

/**
 * @swagger
 * /api/platos/{id}/margen:
 *   get:
 *     summary: Calcular margen de ganancia
 *     description: Calcula el margen de ganancia del plato
 *     tags:
 *       - Platos
 */
router.get('/:id/margen', async (req, res) => {
  try {
    const { id } = req.params;
    const margen = await ServicioCalculos.calcularMargen(parseInt(id));
    res.json(createResponse(true, margen, 'Margen calculado'));
  } catch (error) {
    const log = getLogger();
    log.error('Error calculando margen:', error);
    res.status(500).json(createResponse(false, null, error.message));
  }
});

/**
 * @swagger
 * /api/platos/{id}/disponibilidad:
 *   get:
 *     summary: Validar disponibilidad de ingredientes
 *     description: Verifica si hay stock suficiente para elaborar el plato
 *     tags:
 *       - Platos
 */
router.get('/:id/disponibilidad', async (req, res) => {
  try {
    const { id } = req.params;
    const disponibilidad = await ServicioCalculos.validarDisponibilidadIngredientes(parseInt(id));
    res.json(createResponse(true, disponibilidad, 'Disponibilidad validada'));
  } catch (error) {
    const log = getLogger();
    log.error('Error validando disponibilidad:', error);
    res.status(500).json(createResponse(false, null, error.message));
  }
});

/**
 * @swagger
 * /api/platos/validar:
 *   post:
 *     summary: Validar datos de plato
 *     description: Valida los datos de un plato antes de crear/editar
 *     tags:
 *       - Platos
 */
router.post('/validar', (req, res) => {
  try {
    const validacion = ServicioValidaciones.validarPlato(req.body, true);
    res.json(createResponse(validacion.valido, validacion, 
      validacion.valido ? 'Datos válidos' : 'Errores de validación'));
  } catch (error) {
    const log = getLogger();
    log.error('Error validando:', error);
    res.status(500).json(createResponse(false, null, error.message));
  }
});

module.exports = router;

