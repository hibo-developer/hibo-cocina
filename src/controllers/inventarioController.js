/**
 * Controlador para INVENTARIO
 */
const { getDatabase } = require('../utils/database');
const { createResponse } = require('../middleware/errorHandler');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const ServicioCalculos = require('../utils/servicioCalculos');
const logger = require('../utils/logger');

async function obtenerTodos(req, res, next) {
  try {
    const db = getDatabase();
    db.all(`
      SELECT i.*, ing.nombre as ingrediente_nombre
      FROM inventario i
      LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
      ORDER BY i.fecha_registro DESC
    `, (err, rows) => {
      if (err) {
        console.error('Error al obtener inventario:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      res.json(createResponse(true, rows || [], null, 200));
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();
    db.get('SELECT * FROM inventario WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error al obtener item de inventario:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (!row) {
        return res.status(404).json(createResponse(false, null, 'Item no encontrado', 404));
      }
      res.json(createResponse(true, row, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { ingrediente_id, cantidad, unidad, lote, fecha, fecha_caducidad, ubicacion } = req.body;
    
    // Validar estructura del movimiento de inventario
    const validacion = ServicioValidaciones.validarMovimientoInventario(req.body, true);
    if (!validacion.valido) {
      logger.error('Validación fallida al crear movimiento de inventario:', validacion.errores);
      return res.status(400).json(
        createResponse(false, { errores: validacion.errores }, 'Errores de validación', 400)
      );
    }

    // Validar que el ingrediente existe
    const db = getDatabase();
    db.get('SELECT id FROM ingredientes WHERE id = ?', [ingrediente_id], (err, row) => {
      if (err) {
        logger.error('Error al verificar ingrediente:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (!row) {
        return res.status(400).json(
          createResponse(false, null, `Ingrediente con ID ${ingrediente_id} no existe`, 400)
        );
      }

      // Crear movimiento de inventario
      db.run(
        'INSERT INTO inventario (ingrediente_id, cantidad, unidad, lote, fecha, fecha_caducidad, ubicacion) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ingrediente_id, cantidad || 0, unidad || 'kg', lote, fecha || new Date().toISOString(), fecha_caducidad, ubicacion],
        function(err) {
          if (err) {
            logger.error('Error al crear movimiento de inventario:', err);
            return res.status(500).json(createResponse(false, null, err.message, 500));
          }
          logger.info(`Movimiento de inventario creado: ID ${this.lastID} - Ingrediente ${ingrediente_id}, Cantidad ${cantidad}`);
          res.status(201).json(createResponse(true, { id: this.lastID }, null, 201));
        }
      );
    });
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { ingrediente_id, cantidad, unidad, lote, fecha, fecha_caducidad, ubicacion } = req.body;
    
    // Validar estructura del movimiento de inventario
    const validacion = ServicioValidaciones.validarMovimientoInventario(req.body, false);
    if (!validacion.valido) {
      logger.error('Validación fallida al actualizar movimiento de inventario:', validacion.errores);
      return res.status(400).json(
        createResponse(false, { errores: validacion.errores }, 'Errores de validación', 400)
      );
    }

    const db = getDatabase();
    db.run(
      'UPDATE inventario SET ingrediente_id = ?, cantidad = ?, unidad = ?, lote = ?, fecha = ?, fecha_caducidad = ?, ubicacion = ? WHERE id = ?',
      [ingrediente_id, cantidad, unidad, lote, fecha, fecha_caducidad, ubicacion, id],
      function(err) {
        if (err) {
          logger.error('Error al actualizar movimiento de inventario:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        if (this.changes === 0) {
          return res.status(404).json(createResponse(false, null, 'Movimiento de inventario no encontrado', 404));
        }
        logger.info(`Movimiento de inventario actualizado: ID ${id}`);
        res.json(createResponse(true, { id }, 'Movimiento de inventario actualizado correctamente', 200));
      }
    );
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.run('DELETE FROM inventario WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error al eliminar item de inventario:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (this.changes === 0) {
        return res.status(404).json(createResponse(false, null, 'Item no encontrado', 404));
      }
      res.json(createResponse(true, { deleted: true }, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener alertas de inventario (stock bajo, próximo a caducar, etc.)
 */
async function obtenerAlertas(req, res, next) {
  try {
    const db = getDatabase();
    const { tipo } = req.query; // 'bajo', 'critico', 'caducidad', 'todos'

    // Definir niveles de alerta
    const alertasSQL = `
      SELECT 
        i.id,
        i.ingrediente_id,
        ing.nombre as ingrediente_nombre,
        ing.codigo as ingrediente_codigo,
        i.cantidad,
        i.unidad,
        ing.stock_actual,
        ing.stock_minimo || ' ' || ing.unidad as stock_recomendado,
        i.fecha_caducidad,
        i.lote,
        i.ubicacion,
        CASE 
          WHEN i.cantidad <= (ing.stock_minimo * 0.5) THEN 'CRÍTICO'
          WHEN i.cantidad <= ing.stock_minimo THEN 'BAJO'
          WHEN DATE(i.fecha_caducidad) <= DATE('now', '+7 days') AND i.fecha_caducidad IS NOT NULL THEN 'PRÓXIMO_VENCER'
          WHEN DATE(i.fecha_caducidad) <= DATE('now') AND i.fecha_caducidad IS NOT NULL THEN 'VENCIDO'
          ELSE 'OK'
        END as tipo_alerta,
        CASE 
          WHEN i.cantidad <= (ing.stock_minimo * 0.5) THEN 1
          WHEN i.cantidad <= ing.stock_minimo THEN 2
          WHEN DATE(i.fecha_caducidad) <= DATE('now') THEN 0
          WHEN DATE(i.fecha_caducidad) <= DATE('now', '+7 days') THEN 3
          ELSE 4
        END as prioridad
      FROM inventario i
      LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
      WHERE 
        (i.cantidad <= ing.stock_minimo OR 
         DATE(i.fecha_caducidad) <= DATE('now', '+7 days') OR
         (ing.stock_actual < ing.stock_minimo))
      ORDER BY prioridad ASC, i.fecha_caducidad ASC
    `;

    db.all(alertasSQL, (err, rows) => {
      if (err) {
        logger.error('Error al obtener alertas de inventario:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      // Agrupar por tipo de alerta
      const alertasPorTipo = {
        CRÍTICO: [],
        BAJO: [],
        PRÓXIMO_VENCER: [],
        VENCIDO: [],
        OK: []
      };

      rows.forEach(alerta => {
        if (alertasPorTipo[alerta.tipo_alerta]) {
          alertasPorTipo[alerta.tipo_alerta].push(alerta);
        }
      });

      // Calcular resumen
      const resumen = {
        total_alertas: rows.length,
        criticas: alertasPorTipo.CRÍTICO.length,
        bajas: alertasPorTipo.BAJO.length,
        proximas_vencer: alertasPorTipo.PRÓXIMO_VENCER.length,
        vencidos: alertasPorTipo.VENCIDO.length,
        normales: alertasPorTipo.OK.length
      };

      logger.info(`Alertas de inventario solicitadas: ${rows.length} alertas activas`);
      
      res.json(createResponse(true, {
        resumen,
        alertas: alertasPorTipo,
        detalles: rows
      }, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener solo alertas críticas de inventario
 */
async function obtenerAlertasCriticas(req, res, next) {
  try {
    const db = getDatabase();

    const criticasSQL = `
      SELECT 
        i.id,
        i.ingrediente_id,
        ing.nombre as ingrediente_nombre,
        ing.codigo as ingrediente_codigo,
        i.cantidad,
        i.unidad,
        ing.stock_minimo,
        ROUND(((ing.stock_minimo - i.cantidad) / ing.stock_minimo) * 100, 2) as falta_porcentaje,
        i.lote,
        i.ubicacion,
        'CRÍTICO' as tipo_alerta,
        CASE 
          WHEN i.cantidad <= (ing.stock_minimo * 0.25) THEN 'EMERGENCIA'
          WHEN i.cantidad <= (ing.stock_minimo * 0.5) THEN 'CRÍTICO'
          ELSE 'BAJO'
        END as nivel_severidad
      FROM inventario i
      LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
      WHERE i.cantidad <= (ing.stock_minimo * 0.5)
      ORDER BY i.cantidad ASC
      LIMIT 20
    `;

    db.all(criticasSQL, (err, rows) => {
      if (err) {
        logger.error('Error al obtener alertas críticas:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      const emergencias = rows.filter(r => r.nivel_severidad === 'EMERGENCIA');
      const criticas = rows.filter(r => r.nivel_severidad === 'CRÍTICO');
      const bajas = rows.filter(r => r.nivel_severidad === 'BAJO');

      logger.info(`Alertas críticas: ${rows.length} (${emergencias.length} emergencias, ${criticas.length} críticas)`);

      res.json(createResponse(true, {
        resumen: {
          total: rows.length,
          emergencias: emergencias.length,
          criticas: criticas.length,
          bajas: bajas.length
        },
        emergencias,
        criticas,
        bajas
      }, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener alertas de caducidad próxima
 */
async function obtenerAlertasCaducidad(req, res, next) {
  try {
    const db = getDatabase();
    const { dias } = req.query || { dias: 7 }; // Por defecto 7 días

    const caducidadSQL = `
      SELECT 
        i.id,
        i.ingrediente_id,
        ing.nombre as ingrediente_nombre,
        ing.codigo as ingrediente_codigo,
        i.cantidad,
        i.unidad,
        i.fecha_caducidad,
        i.lote,
        i.ubicacion,
        CASE 
          WHEN DATE(i.fecha_caducidad) <= DATE('now') THEN 'VENCIDO'
          WHEN DATE(i.fecha_caducidad) <= DATE('now', '+1 day') THEN 'VENCE_HOY'
          WHEN DATE(i.fecha_caducidad) <= DATE('now', '+${dias} days') THEN 'PRÓXIMO_VENCER'
          ELSE 'OK'
        END as tipo_alerta,
        CAST((JULIANDAY(i.fecha_caducidad) - JULIANDAY('now')) AS INTEGER) as dias_restantes
      FROM inventario i
      LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
      WHERE 
        (DATE(i.fecha_caducidad) <= DATE('now', '+${dias} days') AND i.fecha_caducidad IS NOT NULL)
        OR DATE(i.fecha_caducidad) <= DATE('now')
      ORDER BY i.fecha_caducidad ASC
      LIMIT 30
    `;

    db.all(caducidadSQL, (err, rows) => {
      if (err) {
        logger.error('Error al obtener alertas de caducidad:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }

      const vencidos = rows.filter(r => r.tipo_alerta === 'VENCIDO');
      const venceHoy = rows.filter(r => r.tipo_alerta === 'VENCE_HOY');
      const proximoVencer = rows.filter(r => r.tipo_alerta === 'PRÓXIMO_VENCER');

      logger.info(`Alertas de caducidad: ${rows.length} (${vencidos.length} vencidos, ${venceHoy.length} vence hoy, ${proximoVencer.length} próximos)`);

      res.json(createResponse(true, {
        resumen: {
          total: rows.length,
          vencidos: vencidos.length,
          vence_hoy: venceHoy.length,
          proximo_vencer: proximoVencer.length
        },
        vencidos,
        vence_hoy: venceHoy,
        proximo_vencer: proximoVencer
      }, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  obtenerAlertas,
  obtenerAlertasCriticas,
  obtenerAlertasCaducidad
};
