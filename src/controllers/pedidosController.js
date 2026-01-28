/**
 * Controlador para PEDIDOS
 */
const { getDatabase } = require('../utils/database');
const { createResponse } = require('../middleware/errorHandler');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const ServicioCalculos = require('../utils/servicioCalculos');
const logger = require('../utils/logger');

async function obtenerTodos(req, res, next) {
  try {
    const db = getDatabase();
    db.all('SELECT * FROM pedidos ORDER BY fecha_pedido DESC', (err, rows) => {
      if (err) {
        console.error('Error al obtener pedidos:', err);
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
    db.get('SELECT * FROM pedidos WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error al obtener pedido:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (!row) {
        return res.status(404).json(createResponse(false, null, 'Pedido no encontrado', 404));
      }
      res.json(createResponse(true, row, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { numero, cliente_codigo, fecha_pedido, fecha_entrega, estado, total } = req.body;
    
    // Validar estructura del pedido
    const validacion = ServicioValidaciones.validarPedido(req.body, true);
    if (!validacion.valido) {
      logger.error('Validación fallida al crear pedido:', validacion.errores);
      return res.status(400).json(
        createResponse(false, { errores: validacion.errores }, 'Errores de validación', 400)
      );
    }

    // Verificar número único del pedido
    if (numero) {
      const esUnico = await ServicioValidaciones.verificarCodigoUnico('pedidos', numero, null, 'numero');
      if (!esUnico) {
        return res.status(400).json(
          createResponse(false, null, `Número de pedido '${numero}' ya existe`, 400)
        );
      }
    }

    const db = getDatabase();
    db.run(
      'INSERT INTO pedidos (numero, cliente_codigo, fecha_pedido, fecha_entrega, estado, total) VALUES (?, ?, ?, ?, ?, ?)',
      [numero, cliente_codigo, fecha_pedido || new Date().toISOString(), fecha_entrega, estado || 'pendiente', total || 0],
      function(err) {
        if (err) {
          logger.error('Error al crear pedido:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        logger.info(`Pedido creado: ID ${this.lastID} - Número ${numero}`);
        res.status(201).json(createResponse(true, { id: this.lastID }, null, 201));
      }
    );
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { numero, cliente_codigo, fecha_pedido, fecha_entrega, estado, total } = req.body;
    
    // Validar estructura del pedido
    const validacion = ServicioValidaciones.validarPedido(req.body, false);
    if (!validacion.valido) {
      logger.error('Validación fallida al actualizar pedido:', validacion.errores);
      return res.status(400).json(
        createResponse(false, { errores: validacion.errores }, 'Errores de validación', 400)
      );
    }

    // Verificar número único (excluir ID actual)
    if (numero) {
      const esUnico = await ServicioValidaciones.verificarCodigoUnico('pedidos', numero, id, 'numero');
      if (!esUnico) {
        return res.status(400).json(
          createResponse(false, null, `Número de pedido '${numero}' ya existe en otro pedido`, 400)
        );
      }
    }

    const db = getDatabase();
    db.run(
      'UPDATE pedidos SET numero = ?, cliente_codigo = ?, fecha_pedido = ?, fecha_entrega = ?, estado = ?, total = ? WHERE id = ?',
      [numero, cliente_codigo, fecha_pedido, fecha_entrega, estado, total, id],
      function(err) {
        if (err) {
          logger.error('Error al actualizar pedido:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        if (this.changes === 0) {
          return res.status(404).json(createResponse(false, null, 'Pedido no encontrado', 404));
        }
        logger.info(`Pedido actualizado: ID ${id} - Número ${numero}`);
        res.json(createResponse(true, null, 'Pedido actualizado correctamente', 200));
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
    
    db.run('DELETE FROM pedidos WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error al eliminar pedido:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (this.changes === 0) {
        return res.status(404).json(createResponse(false, null, 'Pedido no encontrado', 404));
      }
      res.json(createResponse(true, { deleted: true }, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/pedidos/estadisticas
 * Obtiene estadísticas de pedidos
 */
async function obtenerEstadisticas(req, res, next) {
  try {
    const db = getDatabase();
    
    db.get(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completados,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelados,
        AVG(total) as total_promedio,
        SUM(total) as total_vendido
      FROM pedidos
    `, (err, stats) => {
      if (err) {
        console.error('Error al obtener estadísticas:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      
      res.json(createResponse(true, stats || {
        total: 0,
        completados: 0,
        pendientes: 0,
        cancelados: 0,
        total_promedio: 0,
        total_vendido: 0
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
  obtenerEstadisticas
};
