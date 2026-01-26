/**
 * Controlador para INGREDIENTES
 */
const { getDatabase } = require('../utils/database');
const { createResponse } = require('../middleware/errorHandler');

async function obtenerTodos(req, res, next) {
  try {
    const db = getDatabase();
    db.all('SELECT * FROM ingredientes ORDER BY nombre', (err, rows) => {
      if (err) {
        console.error('Error al obtener ingredientes:', err);
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
    db.get('SELECT * FROM ingredientes WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error al obtener ingrediente:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (!row) {
        return res.status(404).json(createResponse(false, null, 'Ingrediente no encontrado', 404));
      }
      res.json(createResponse(true, row, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { nombre, unidad, precio, stock_actual, activo } = req.body;
    
    if (!nombre) {
      return res.status(400).json(createResponse(false, null, 'nombre es requerido', 400));
    }

    const db = getDatabase();
    db.run(
      'INSERT INTO ingredientes (nombre, unidad, precio, stock_actual, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre, unidad || 'kg', precio || 0, stock_actual || 0, activo !== false ? 1 : 0],
      function(err) {
        if (err) {
          console.error('Error al crear ingrediente:', err);
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
    const { nombre, unidad, precio, stock_actual, activo } = req.body;
    
    if (!nombre) {
      return res.status(400).json(createResponse(false, null, 'nombre es requerido', 400));
    }

    const db = getDatabase();
    db.run(
      'UPDATE ingredientes SET nombre = ?, unidad = ?, precio = ?, stock_actual = ?, activo = ? WHERE id = ?',
      [nombre, unidad, precio, stock_actual, activo ? 1 : 0, id],
      function(err) {
        if (err) {
          console.error('Error al actualizar ingrediente:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        if (this.changes === 0) {
          return res.status(404).json(createResponse(false, null, 'Ingrediente no encontrado', 404));
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
    
    db.run('DELETE FROM ingredientes WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error al eliminar ingrediente:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (this.changes === 0) {
        return res.status(404).json(createResponse(false, null, 'Ingrediente no encontrado', 404));
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
