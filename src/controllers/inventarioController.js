/**
 * Controlador para INVENTARIO
 */
const { getDatabase } = require('../utils/database');
const { createResponse } = require('../middleware/errorHandler');

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
    
    if (!ingrediente_id) {
      return res.status(400).json(createResponse(false, null, 'ingrediente_id es requerido', 400));
    }

    const db = getDatabase();
    db.run(
      'INSERT INTO inventario (ingrediente_id, cantidad, unidad, lote, fecha, fecha_caducidad, ubicacion) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ingrediente_id, cantidad || 0, unidad || 'kg', lote, fecha || new Date().toISOString(), fecha_caducidad, ubicacion],
      function(err) {
        if (err) {
          console.error('Error al crear item de inventario:', err);
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
    const { ingrediente_id, cantidad, unidad, lote, fecha, fecha_caducidad, ubicacion } = req.body;
    
    if (!ingrediente_id) {
      return res.status(400).json(createResponse(false, null, 'ingrediente_id es requerido', 400));
    }

    const db = getDatabase();
    db.run(
      'UPDATE inventario SET ingrediente_id = ?, cantidad = ?, unidad = ?, lote = ?, fecha = ?, fecha_caducidad = ?, ubicacion = ? WHERE id = ?',
      [ingrediente_id, cantidad, unidad, lote, fecha, fecha_caducidad, ubicacion, id],
      function(err) {
        if (err) {
          console.error('Error al actualizar item de inventario:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        if (this.changes === 0) {
          return res.status(404).json(createResponse(false, null, 'Item no encontrado', 404));
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

module.exports = {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
