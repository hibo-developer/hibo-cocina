/**
 * Controlador para PRODUCCIÓN
 * Gestión de órdenes de producción, lotes y consumos
 */

const { getDatabase } = require('../utils/database');
const { createResponse } = require('../middleware/errorHandler');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const ServicioCalculos = require('../utils/servicioCalculos');
const logger = require('../utils/logger');

// ============================================================================
// ÓRDENES DE PRODUCCIÓN
// ============================================================================

/**
 * GET /api/produccion/ordenes
 * Obtener todas las órdenes de producción
 */
async function obtenerOrdenes(req, res, next) {
  try {
    const { estado, desde, hasta, plato_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        po.*,
        p.nombre as plato_nombre,
        p.codigo as plato_codigo,
        COUNT(DISTINCT pl.id) as num_lotes,
        SUM(pc.coste_total) as coste_total_consumos
      FROM produccion_ordenes po
      LEFT JOIN platos p ON po.plato_id = p.id
      LEFT JOIN produccion_lotes pl ON po.id = pl.orden_id
      LEFT JOIN produccion_consumos pc ON po.id = pc.orden_id
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      query += ' AND po.estado = ?';
      params.push(estado);
    }

    if (desde) {
      query += ' AND po.fecha_planificada >= ?';
      params.push(desde);
    }

    if (hasta) {
      query += ' AND po.fecha_planificada <= ?';
      params.push(hasta);
    }

    if (plato_id) {
      query += ' AND po.plato_id = ?';
      params.push(plato_id);
    }

    query += ' GROUP BY po.id ORDER BY po.fecha_planificada DESC, po.id DESC';

    db.all(query, params, (err, rows) => {
      if (err) {
        logger.error('Error al obtener órdenes de producción:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      res.json(createResponse(true, rows || [], null, 200));
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/produccion/ordenes/:id
 * Obtener una orden específica con detalles completos
 */
async function obtenerOrdenPorId(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.get(`
      SELECT 
        po.*,
        p.nombre as plato_nombre,
        p.codigo as plato_codigo,
        p.pvp as plato_pvp
      FROM produccion_ordenes po
      LEFT JOIN platos p ON po.plato_id = p.id
      WHERE po.id = ?
    `, [id], (err, orden) => {
      if (err) {
        logger.error('Error al obtener orden:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!orden) {
        return res.status(404).json(createResponse(false, null, 'Orden no encontrada', 404));
      }

      // Obtener lotes de la orden
      db.all('SELECT * FROM produccion_lotes WHERE orden_id = ?', [id], (err, lotes) => {
        if (err) {
          logger.error('Error al obtener lotes:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        // Obtener consumos de la orden
        db.all(`
          SELECT 
            pc.*,
            i.nombre as ingrediente_nombre,
            i.codigo as ingrediente_codigo,
            i.unidad as ingrediente_unidad
          FROM produccion_consumos pc
          LEFT JOIN ingredientes i ON pc.ingrediente_id = i.id
          WHERE pc.orden_id = ?
        `, [id], (err, consumos) => {
          if (err) {
            logger.error('Error al obtener consumos:', err);
            return res.status(500).json(createResponse(false, null, err.message, 500));
          }

          // Obtener incidencias
          db.all('SELECT * FROM produccion_incidencias WHERE orden_id = ?', [id], (err, incidencias) => {
            if (err) {
              logger.error('Error al obtener incidencias:', err);
              return res.status(500).json(createResponse(false, null, err.message, 500));
            }

            const resultado = {
              ...orden,
              lotes: lotes || [],
              consumos: consumos || [],
              incidencias: incidencias || []
            };

            res.json(createResponse(true, resultado, null, 200));
          });
        });
      });
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/produccion/ordenes
 * Crear una nueva orden de producción
 */
async function crearOrden(req, res, next) {
  try {
    const { plato_id, cantidad_planificada, fecha_planificada, responsable, prioridad, observaciones } = req.body;

    // Validaciones básicas
    if (!plato_id || !cantidad_planificada || !fecha_planificada) {
      return res.status(400).json(
        createResponse(false, null, 'plato_id, cantidad_planificada y fecha_planificada son requeridos', 400)
      );
    }

    if (cantidad_planificada <= 0) {
      return res.status(400).json(
        createResponse(false, null, 'cantidad_planificada debe ser mayor a 0', 400)
      );
    }

    const db = getDatabase();

    // Verificar que el plato existe
    db.get('SELECT * FROM platos WHERE id = ?', [plato_id], (err, plato) => {
      if (err) {
        logger.error('Error al verificar plato:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!plato) {
        return res.status(404).json(createResponse(false, null, 'Plato no encontrado', 404));
      }

      // Generar código de orden
      const codigo = `ORD-${Date.now()}-${plato_id}`;

      // Calcular coste estimado (si hay escandallo)
      db.all(`
        SELECT 
          e.cantidad,
          i.coste_unidad,
          i.unidad
        FROM escandallos e
        LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
        WHERE e.plato_id = ?
      `, [plato_id], (err, escandallo) => {
        if (err) {
          logger.error('Error al obtener escandallo:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        let coste_estimado = 0;
        if (escandallo && escandallo.length > 0) {
          coste_estimado = escandallo.reduce((acc, item) => {
            return acc + (item.cantidad * (item.coste_unidad || 0));
          }, 0) * cantidad_planificada;
        }

        // Insertar orden
        db.run(`
          INSERT INTO produccion_ordenes (
            codigo, plato_id, cantidad_planificada, fecha_planificada, 
            responsable, prioridad, coste_estimado, observaciones
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          codigo,
          plato_id,
          cantidad_planificada,
          fecha_planificada,
          responsable || null,
          prioridad || 'NORMAL',
          coste_estimado,
          observaciones || null
        ], function(err) {
          if (err) {
            logger.error('Error al crear orden:', err);
            return res.status(500).json(createResponse(false, null, err.message, 500));
          }

          const nuevaOrden = {
            id: this.lastID,
            codigo,
            plato_id,
            plato_nombre: plato.nombre,
            cantidad_planificada,
            fecha_planificada,
            estado: 'PENDIENTE',
            coste_estimado
          };

          logger.info(`Orden de producción creada: ${codigo}`);
          res.status(201).json(createResponse(true, nuevaOrden, null, 201));
        });
      });
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/produccion/ordenes/:id
 * Actualizar una orden de producción
 */
async function actualizarOrden(req, res, next) {
  try {
    const { id } = req.params;
    const { cantidad_planificada, fecha_planificada, responsable, prioridad, observaciones } = req.body;

    const db = getDatabase();

    // Verificar que la orden existe y no está finalizada
    db.get('SELECT * FROM produccion_ordenes WHERE id = ?', [id], (err, orden) => {
      if (err) {
        logger.error('Error al verificar orden:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!orden) {
        return res.status(404).json(createResponse(false, null, 'Orden no encontrada', 404));
      }

      if (orden.estado === 'COMPLETADA' || orden.estado === 'CANCELADA') {
        return res.status(400).json(
          createResponse(false, null, 'No se puede modificar una orden completada o cancelada', 400)
        );
      }

      const updates = [];
      const params = [];

      if (cantidad_planificada !== undefined) {
        updates.push('cantidad_planificada = ?');
        params.push(cantidad_planificada);
      }
      if (fecha_planificada !== undefined) {
        updates.push('fecha_planificada = ?');
        params.push(fecha_planificada);
      }
      if (responsable !== undefined) {
        updates.push('responsable = ?');
        params.push(responsable);
      }
      if (prioridad !== undefined) {
        updates.push('prioridad = ?');
        params.push(prioridad);
      }
      if (observaciones !== undefined) {
        updates.push('observaciones = ?');
        params.push(observaciones);
      }

      if (updates.length === 0) {
        return res.status(400).json(createResponse(false, null, 'No hay campos para actualizar', 400));
      }

      params.push(id);

      db.run(`UPDATE produccion_ordenes SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
        if (err) {
          logger.error('Error al actualizar orden:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        logger.info(`Orden actualizada: ${id}`);
        res.json(createResponse(true, { id, ...req.body }, 'Orden actualizada correctamente', 200));
      });
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/produccion/ordenes/:id/iniciar
 * Iniciar producción de una orden
 */
async function iniciarProduccion(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.get('SELECT * FROM produccion_ordenes WHERE id = ?', [id], (err, orden) => {
      if (err) {
        logger.error('Error al verificar orden:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!orden) {
        return res.status(404).json(createResponse(false, null, 'Orden no encontrada', 404));
      }

      if (orden.estado !== 'PENDIENTE' && orden.estado !== 'PAUSADA') {
        return res.status(400).json(
          createResponse(false, null, 'La orden no está en estado PENDIENTE o PAUSADA', 400)
        );
      }

      db.run(`
        UPDATE produccion_ordenes 
        SET estado = 'EN_PROCESO', fecha_inicio = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id], (err) => {
        if (err) {
          logger.error('Error al iniciar producción:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        logger.info(`Producción iniciada: Orden ${id}`);
        res.json(createResponse(true, { id, estado: 'EN_PROCESO' }, 'Producción iniciada', 200));
      });
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/produccion/ordenes/:id/finalizar
 * Finalizar producción de una orden
 */
async function finalizarProduccion(req, res, next) {
  try {
    const { id } = req.params;
    const { cantidad_producida } = req.body;

    if (!cantidad_producida || cantidad_producida <= 0) {
      return res.status(400).json(
        createResponse(false, null, 'cantidad_producida es requerida y debe ser mayor a 0', 400)
      );
    }

    const db = getDatabase();

    db.get('SELECT * FROM produccion_ordenes WHERE id = ?', [id], (err, orden) => {
      if (err) {
        logger.error('Error al verificar orden:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!orden) {
        return res.status(404).json(createResponse(false, null, 'Orden no encontrada', 404));
      }

      if (orden.estado !== 'EN_PROCESO') {
        return res.status(400).json(
          createResponse(false, null, 'La orden no está en proceso', 400)
        );
      }

      // Calcular rendimiento
      const rendimiento = (cantidad_producida / orden.cantidad_planificada) * 100;

      db.run(`
        UPDATE produccion_ordenes 
        SET 
          estado = 'COMPLETADA',
          fecha_fin = CURRENT_TIMESTAMP,
          cantidad_producida = ?,
          rendimiento = ?
        WHERE id = ?
      `, [cantidad_producida, rendimiento, id], (err) => {
        if (err) {
          logger.error('Error al finalizar producción:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        logger.info(`Producción finalizada: Orden ${id}, Rendimiento: ${rendimiento.toFixed(2)}%`);
        res.json(createResponse(true, {
          id,
          estado: 'COMPLETADA',
          cantidad_producida,
          rendimiento: rendimiento.toFixed(2)
        }, 'Producción finalizada', 200));
      });
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/produccion/ordenes/:id/cancelar
 * Cancelar una orden de producción
 */
async function cancelarOrden(req, res, next) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const db = getDatabase();

    db.get('SELECT * FROM produccion_ordenes WHERE id = ?', [id], (err, orden) => {
      if (err) {
        logger.error('Error al verificar orden:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!orden) {
        return res.status(404).json(createResponse(false, null, 'Orden no encontrada', 404));
      }

      if (orden.estado === 'COMPLETADA') {
        return res.status(400).json(
          createResponse(false, null, 'No se puede cancelar una orden completada', 400)
        );
      }

      db.run(`
        UPDATE produccion_ordenes 
        SET estado = 'CANCELADA', motivo_cancelacion = ?
        WHERE id = ?
      `, [motivo || null, id], (err) => {
        if (err) {
          logger.error('Error al cancelar orden:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        logger.info(`Orden cancelada: ${id}`);
        res.json(createResponse(true, { id, estado: 'CANCELADA' }, 'Orden cancelada', 200));
      });
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/produccion/ordenes/:id
 * Eliminar una orden de producción
 */
async function eliminarOrden(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.get('SELECT * FROM produccion_ordenes WHERE id = ?', [id], (err, orden) => {
      if (err) {
        logger.error('Error al verificar orden:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!orden) {
        return res.status(404).json(createResponse(false, null, 'Orden no encontrada', 404));
      }

      if (orden.estado === 'EN_PROCESO') {
        return res.status(400).json(
          createResponse(false, null, 'No se puede eliminar una orden en proceso', 400)
        );
      }

      db.run('DELETE FROM produccion_ordenes WHERE id = ?', [id], (err) => {
        if (err) {
          logger.error('Error al eliminar orden:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        logger.info(`Orden eliminada: ${id}`);
        res.json(createResponse(true, null, 'Orden eliminada correctamente', 200));
      });
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// ============================================================================
// LOTES DE PRODUCCIÓN
// ============================================================================

/**
 * GET /api/produccion/lotes
 * Obtener todos los lotes de producción
 */
async function obtenerLotes(req, res, next) {
  try {
    const { orden_id, estado } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        pl.*,
        po.codigo as orden_codigo,
        po.cantidad_planificada,
        p.nombre as plato_nombre
      FROM produccion_lotes pl
      LEFT JOIN produccion_ordenes po ON pl.orden_id = po.id
      LEFT JOIN platos p ON po.plato_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (orden_id) {
      query += ' AND pl.orden_id = ?';
      params.push(orden_id);
    }

    if (estado) {
      query += ' AND pl.estado = ?';
      params.push(estado);
    }

    query += ' ORDER BY pl.fecha_produccion DESC, pl.id DESC';

    db.all(query, params, (err, rows) => {
      if (err) {
        logger.error('Error al obtener lotes:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      res.json(createResponse(true, rows || [], null, 200));
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/produccion/lotes/:id
 * Obtener un lote específico con detalles
 */
async function obtenerLotePorId(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.get(`
      SELECT 
        pl.*,
        po.codigo as orden_codigo,
        p.nombre as plato_nombre
      FROM produccion_lotes pl
      LEFT JOIN produccion_ordenes po ON pl.orden_id = po.id
      LEFT JOIN platos p ON po.plato_id = p.id
      WHERE pl.id = ?
    `, [id], (err, lote) => {
      if (err) {
        logger.error('Error al obtener lote:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!lote) {
        return res.status(404).json(createResponse(false, null, 'Lote no encontrado', 404));
      }

      // Obtener consumos del lote
      db.all(`
        SELECT 
          pc.*,
          i.nombre as ingrediente_nombre,
          i.codigo as ingrediente_codigo
        FROM produccion_consumos pc
        LEFT JOIN ingredientes i ON pc.ingrediente_id = i.id
        WHERE pc.orden_id = ?
      `, [lote.orden_id], (err, consumos) => {
        if (err) {
          logger.error('Error al obtener consumos:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        const resultado = {
          ...lote,
          consumos: consumos || []
        };

        res.json(createResponse(true, resultado, null, 200));
      });
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/produccion/lotes
 * Crear un nuevo lote
 */
async function crearLote(req, res, next) {
  try {
    const { orden_id, cantidad, fecha_produccion, fecha_caducidad, ubicacion, observaciones } = req.body;

    // Validaciones
    if (!orden_id || !cantidad || !fecha_produccion) {
      return res.status(400).json(
        createResponse(false, null, 'orden_id, cantidad y fecha_produccion son requeridos', 400)
      );
    }

    if (cantidad <= 0) {
      return res.status(400).json(
        createResponse(false, null, 'cantidad debe ser mayor a 0', 400)
      );
    }

    const db = getDatabase();

    // Verificar que la orden existe
    db.get('SELECT * FROM produccion_ordenes WHERE id = ?', [orden_id], (err, orden) => {
      if (err) {
        logger.error('Error al verificar orden:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!orden) {
        return res.status(404).json(createResponse(false, null, 'Orden no encontrada', 404));
      }

      // Generar código de lote
      const codigo_lote = `LTE-${Date.now()}-${orden_id}`;

      // Insertar lote
      db.run(`
        INSERT INTO produccion_lotes (
          orden_id, codigo_lote, cantidad, fecha_produccion, 
          fecha_caducidad, ubicacion, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        orden_id,
        codigo_lote,
        cantidad,
        fecha_produccion,
        fecha_caducidad || null,
        ubicacion || null,
        observaciones || null
      ], function(err) {
        if (err) {
          logger.error('Error al crear lote:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        const nuevoLote = {
          id: this.lastID,
          orden_id,
          codigo_lote,
          cantidad,
          fecha_produccion,
          estado: 'ACTIVO'
        };

        logger.info(`Lote creado: ${codigo_lote}`);
        res.status(201).json(createResponse(true, nuevoLote, null, 201));
      });
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/produccion/lotes/:id
 * Actualizar un lote
 */
async function actualizarLote(req, res, next) {
  try {
    const { id } = req.params;
    const { cantidad, fecha_caducidad, rendimiento, coste_total, estado, ubicacion, observaciones } = req.body;

    const db = getDatabase();

    // Verificar que el lote existe
    db.get('SELECT * FROM produccion_lotes WHERE id = ?', [id], (err, lote) => {
      if (err) {
        logger.error('Error al verificar lote:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!lote) {
        return res.status(404).json(createResponse(false, null, 'Lote no encontrado', 404));
      }

      const updates = [];
      const params = [];

      if (cantidad !== undefined) {
        updates.push('cantidad = ?');
        params.push(cantidad);
      }
      if (fecha_caducidad !== undefined) {
        updates.push('fecha_caducidad = ?');
        params.push(fecha_caducidad);
      }
      if (rendimiento !== undefined) {
        updates.push('rendimiento = ?');
        params.push(rendimiento);
      }
      if (coste_total !== undefined) {
        updates.push('coste_total = ?');
        params.push(coste_total);
      }
      if (estado !== undefined) {
        updates.push('estado = ?');
        params.push(estado);
      }
      if (ubicacion !== undefined) {
        updates.push('ubicacion = ?');
        params.push(ubicacion);
      }
      if (observaciones !== undefined) {
        updates.push('observaciones = ?');
        params.push(observaciones);
      }

      if (updates.length === 0) {
        return res.status(400).json(createResponse(false, null, 'No hay campos para actualizar', 400));
      }

      params.push(id);

      db.run(`UPDATE produccion_lotes SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
        if (err) {
          logger.error('Error al actualizar lote:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        logger.info(`Lote actualizado: ${id}`);
        res.json(createResponse(true, { id, ...req.body }, 'Lote actualizado correctamente', 200));
      });
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/produccion/lotes/:id
 * Eliminar un lote
 */
async function eliminarLote(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.get('SELECT * FROM produccion_lotes WHERE id = ?', [id], (err, lote) => {
      if (err) {
        logger.error('Error al verificar lote:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!lote) {
        return res.status(404).json(createResponse(false, null, 'Lote no encontrado', 404));
      }

      db.run('DELETE FROM produccion_lotes WHERE id = ?', [id], (err) => {
        if (err) {
          logger.error('Error al eliminar lote:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        logger.info(`Lote eliminado: ${id}`);
        res.json(createResponse(true, null, 'Lote eliminado correctamente', 200));
      });
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// CONSUMOS DE PRODUCCIÓN
// ============================================================================

/**
 * GET /api/produccion/consumos
 * Obtener todos los consumos
 */
async function obtenerConsumos(req, res, next) {
  try {
    const { orden_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        pc.*,
        po.codigo as orden_codigo,
        i.nombre as ingrediente_nombre,
        i.codigo as ingrediente_codigo,
        i.unidad as ingrediente_unidad
      FROM produccion_consumos pc
      LEFT JOIN produccion_ordenes po ON pc.orden_id = po.id
      LEFT JOIN ingredientes i ON pc.ingrediente_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (orden_id) {
      query += ' AND pc.orden_id = ?';
      params.push(orden_id);
    }

    query += ' ORDER BY pc.fecha_consumo DESC, pc.id DESC';

    db.all(query, params, (err, rows) => {
      if (err) {
        logger.error('Error al obtener consumos:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      res.json(createResponse(true, rows || [], null, 200));
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/produccion/consumos/:id
 * Obtener un consumo específico
 */
async function obtenerConsumoPorId(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.get(`
      SELECT 
        pc.*,
        po.codigo as orden_codigo,
        i.nombre as ingrediente_nombre,
        i.codigo as ingrediente_codigo,
        i.unidad as ingrediente_unidad
      FROM produccion_consumos pc
      LEFT JOIN produccion_ordenes po ON pc.orden_id = po.id
      LEFT JOIN ingredientes i ON pc.ingrediente_id = i.id
      WHERE pc.id = ?
    `, [id], (err, consumo) => {
      if (err) {
        logger.error('Error al obtener consumo:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!consumo) {
        return res.status(404).json(createResponse(false, null, 'Consumo no encontrado', 404));
      }

      res.json(createResponse(true, consumo, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/produccion/consumos
 * Registrar un consumo de ingrediente
 */
async function crearConsumo(req, res, next) {
  try {
    const { orden_id, ingrediente_id, cantidad_planificada, cantidad_consumida, unidad, coste, observaciones } = req.body;

    // Validaciones
    if (!orden_id || !ingrediente_id || !cantidad_planificada) {
      return res.status(400).json(
        createResponse(false, null, 'orden_id, ingrediente_id y cantidad_planificada son requeridos', 400)
      );
    }

    if (cantidad_planificada <= 0) {
      return res.status(400).json(
        createResponse(false, null, 'cantidad_planificada debe ser mayor a 0', 400)
      );
    }

    const db = getDatabase();

    // Verificar que la orden existe
    db.get('SELECT * FROM produccion_ordenes WHERE id = ?', [orden_id], (err, orden) => {
      if (err) {
        logger.error('Error al verificar orden:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!orden) {
        return res.status(404).json(createResponse(false, null, 'Orden no encontrada', 404));
      }

      // Verificar que el ingrediente existe
      db.get('SELECT * FROM ingredientes WHERE id = ?', [ingrediente_id], (err, ingrediente) => {
        if (err) {
          logger.error('Error al verificar ingrediente:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        if (!ingrediente) {
          return res.status(404).json(createResponse(false, null, 'Ingrediente no encontrado', 404));
        }

        // Insertar consumo
        db.run(`
          INSERT INTO produccion_consumos (
            orden_id, ingrediente_id, cantidad_planificada, cantidad_consumida,
            unidad, coste, fecha_consumo, usuario, observaciones
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
        `, [
          orden_id,
          ingrediente_id,
          cantidad_planificada,
          cantidad_consumida || null,
          unidad || ingrediente.unidad || 'unidades',
          coste || (ingrediente.coste_unidad * cantidad_planificada),
          req.user?.nombre || 'SISTEMA',
          observaciones || null
        ], function(err) {
          if (err) {
            logger.error('Error al crear consumo:', err);
            return res.status(500).json(createResponse(false, null, err.message, 500));
          }

          const nuevoConsumo = {
            id: this.lastID,
            orden_id,
            ingrediente_id,
            ingrediente_nombre: ingrediente.nombre,
            cantidad_planificada,
            coste: coste || (ingrediente.coste_unidad * cantidad_planificada)
          };

          logger.info(`Consumo registrado: Orden ${orden_id}, Ingrediente ${ingrediente_id}`);
          res.status(201).json(createResponse(true, nuevoConsumo, null, 201));
        });
      });
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/produccion/consumos/:id
 * Actualizar un consumo
 */
async function actualizarConsumo(req, res, next) {
  try {
    const { id } = req.params;
    const { cantidad_consumida, coste, observaciones } = req.body;

    const db = getDatabase();

    // Verificar que el consumo existe
    db.get('SELECT * FROM produccion_consumos WHERE id = ?', [id], (err, consumo) => {
      if (err) {
        logger.error('Error al verificar consumo:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!consumo) {
        return res.status(404).json(createResponse(false, null, 'Consumo no encontrado', 404));
      }

      const updates = [];
      const params = [];

      if (cantidad_consumida !== undefined) {
        updates.push('cantidad_consumida = ?');
        params.push(cantidad_consumida);
      }
      if (coste !== undefined) {
        updates.push('coste = ?');
        params.push(coste);
      }
      if (observaciones !== undefined) {
        updates.push('observaciones = ?');
        params.push(observaciones);
      }

      if (updates.length === 0) {
        return res.status(400).json(createResponse(false, null, 'No hay campos para actualizar', 400));
      }

      params.push(id);

      db.run(`UPDATE produccion_consumos SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
        if (err) {
          logger.error('Error al actualizar consumo:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        logger.info(`Consumo actualizado: ${id}`);
        res.json(createResponse(true, { id, ...req.body }, 'Consumo actualizado correctamente', 200));
      });
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/produccion/consumos/:id
 * Eliminar un consumo
 */
async function eliminarConsumo(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.get('SELECT * FROM produccion_consumos WHERE id = ?', [id], (err, consumo) => {
      if (err) {
        logger.error('Error al verificar consumo:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      if (!consumo) {
        return res.status(404).json(createResponse(false, null, 'Consumo no encontrado', 404));
      }

      db.run('DELETE FROM produccion_consumos WHERE id = ?', [id], (err) => {
        if (err) {
          logger.error('Error al eliminar consumo:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }

        logger.info(`Consumo eliminado: ${id}`);
        res.json(createResponse(true, null, 'Consumo eliminado correctamente', 200));
      });
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// REPORTES Y ESTADÍSTICAS
// ============================================================================

/**
 * GET /api/produccion/rendimientos
 * Obtener rendimientos por plato
 */
async function obtenerRendimientos(req, res, next) {
  try {
    const { desde, hasta } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        p.id,
        p.nombre as plato_nombre,
        COUNT(po.id) as total_ordenes,
        SUM(CASE WHEN po.estado = 'COMPLETADA' THEN 1 ELSE 0 END) as ordenes_completadas,
        AVG(po.rendimiento) as rendimiento_promedio,
        MIN(po.rendimiento) as rendimiento_minimo,
        MAX(po.rendimiento) as rendimiento_maximo
      FROM platos p
      LEFT JOIN produccion_ordenes po ON p.id = po.plato_id
      WHERE 1=1
    `;
    const params = [];

    if (desde) {
      query += ' AND po.fecha_planificada >= ?';
      params.push(desde);
    }
    if (hasta) {
      query += ' AND po.fecha_planificada <= ?';
      params.push(hasta);
    }

    query += ' GROUP BY p.id ORDER BY rendimiento_promedio DESC';

    db.all(query, params, (err, rows) => {
      if (err) {
        logger.error('Error al obtener rendimientos:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      res.json(createResponse(true, rows || [], null, 200));
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/produccion/costes
 * Obtener análisis de costes de producción
 */
async function obtenerCostes(req, res, next) {
  try {
    const { desde, hasta } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        p.id,
        p.nombre as plato_nombre,
        COUNT(po.id) as ordenes_producidas,
        SUM(po.cantidad_producida) as cantidad_total,
        SUM(po.coste_real) as coste_total,
        AVG(po.coste_real) as coste_promedio,
        (SUM(po.coste_real) / SUM(CASE WHEN po.cantidad_producida > 0 THEN po.cantidad_producida ELSE 1 END)) as coste_unitario
      FROM platos p
      LEFT JOIN produccion_ordenes po ON p.id = po.plato_id
      WHERE 1=1
    `;
    const params = [];

    if (desde) {
      query += ' AND po.fecha_planificada >= ?';
      params.push(desde);
    }
    if (hasta) {
      query += ' AND po.fecha_planificada <= ?';
      params.push(hasta);
    }

    query += ' AND po.estado = "COMPLETADA" GROUP BY p.id ORDER BY coste_total DESC';

    db.all(query, params, (err, rows) => {
      if (err) {
        logger.error('Error al obtener costes:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      res.json(createResponse(true, rows || [], null, 200));
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/produccion/estadisticas
 * Obtener KPIs de producción
 */
async function obtenerEstadisticas(req, res, next) {
  try {
    const { desde, hasta } = req.query;
    const db = getDatabase();

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (desde) {
      whereClause += ' AND po.fecha_planificada >= ?';
      params.push(desde);
    }
    if (hasta) {
      whereClause += ' AND po.fecha_planificada <= ?';
      params.push(hasta);
    }

    db.get(`
      SELECT 
        COUNT(DISTINCT po.id) as total_ordenes,
        SUM(CASE WHEN po.estado = 'COMPLETADA' THEN 1 ELSE 0 END) as ordenes_completadas,
        SUM(CASE WHEN po.estado = 'EN_PROCESO' THEN 1 ELSE 0 END) as ordenes_en_proceso,
        SUM(CASE WHEN po.estado = 'PENDIENTE' THEN 1 ELSE 0 END) as ordenes_pendientes,
        SUM(CASE WHEN po.estado = 'CANCELADA' THEN 1 ELSE 0 END) as ordenes_canceladas,
        AVG(po.rendimiento) as rendimiento_general,
        SUM(po.cantidad_producida) as cantidad_total_producida,
        SUM(po.coste_real) as coste_total
      FROM produccion_ordenes po
      ${whereClause}
    `, params, (err, stats) => {
      if (err) {
        logger.error('Error al obtener estadísticas:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      // Calcular porcentajes
      if (stats.total_ordenes > 0) {
        stats.porcentaje_completadas = ((stats.ordenes_completadas / stats.total_ordenes) * 100).toFixed(2);
        stats.porcentaje_en_proceso = ((stats.ordenes_en_proceso / stats.total_ordenes) * 100).toFixed(2);
        stats.porcentaje_canceladas = ((stats.ordenes_canceladas / stats.total_ordenes) * 100).toFixed(2);
      }

      res.json(createResponse(true, stats, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  obtenerOrdenes,
  obtenerOrdenPorId,
  crearOrden,
  actualizarOrden,
  iniciarProduccion,
  finalizarProduccion,
  cancelarOrden,
  eliminarOrden,
  obtenerLotes,
  obtenerLotePorId,
  crearLote,
  actualizarLote,
  eliminarLote,
  obtenerConsumos,
  obtenerConsumoPorId,
  crearConsumo,
  actualizarConsumo,
  eliminarConsumo,
  obtenerRendimientos,
  obtenerCostes,
  obtenerEstadisticas
};
