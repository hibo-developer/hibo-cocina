/**
 * Controlador para PEDIDOS
 */
const { getDatabase } = require('../utils/database');
const { createResponse } = require('../middleware/errorHandler');

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
    
    if (!numero) {
      return res.status(400).json(createResponse(false, null, 'numero es requerido', 400));
    }

    const db = getDatabase();
    db.run(
      'INSERT INTO pedidos (numero, cliente_codigo, fecha_pedido, fecha_entrega, estado, total) VALUES (?, ?, ?, ?, ?, ?)',
      [numero, cliente_codigo, fecha_pedido || new Date().toISOString(), fecha_entrega, estado || 'pendiente', total || 0],
      function(err) {
        if (err) {
          console.error('Error al crear pedido:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
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
    
    if (!numero) {
      return res.status(400).json(createResponse(false, null, 'numero es requerido', 400));
    }

    const db = getDatabase();
    db.run(
      'UPDATE pedidos SET numero = ?, cliente_codigo = ?, fecha_pedido = ?, fecha_entrega = ?, estado = ?, total = ? WHERE id = ?',
      [numero, cliente_codigo, fecha_pedido, fecha_entrega, estado, total, id],
      function(err) {
        if (err) {
          console.error('Error al actualizar pedido:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        if (this.changes === 0) {
          return res.status(404).json(createResponse(false, null, 'Pedido no encontrado', 404));
        }
        res.json(createResponse(true, { id }, null, 200));
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

module.exports = {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
