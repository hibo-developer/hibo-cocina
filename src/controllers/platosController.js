/**
 * Controlador para PLATOS
 * Maneja todas las operaciones CRUD de platos
 */
const { getDatabase } = require('../utils/database');
const { createResponse } = require('../middleware/errorHandler');

/**
 * GET /api/platos
 * Obtiene todos los platos
 */
async function obtenerTodos(req, res, next) {
  try {
    const db = getDatabase();
    db.all('SELECT * FROM platos ORDER BY codigo', (err, rows) => {
      if (err) {
        console.error('Error al obtener platos:', err);
        return res.status(500).json(
          createResponse(false, null, err.message, 500)
        );
      }
      res.json(createResponse(true, rows || [], null, 200));
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/platos/:id
 * Obtiene un plato por ID
 */
async function obtenerPorId(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.get('SELECT * FROM platos WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error al obtener plato:', err);
        return res.status(500).json(
          createResponse(false, null, err.message, 500)
        );
      }
      if (!row) {
        return res.status(404).json(
          createResponse(false, null, 'Plato no encontrado', 404)
        );
      }
      res.json(createResponse(true, row, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/platos
 * Crea un nuevo plato
 */
async function crear(req, res, next) {
  try {
    const { codigo, nombre, categoria, pvp, coste_produccion, activo, descripcion } = req.body;
    
    // Validaciones básicas
    if (!nombre || !codigo) {
      return res.status(400).json(
        createResponse(false, null, 'nombre y codigo son requeridos', 400)
      );
    }

    const db = getDatabase();
    db.run(
      'INSERT INTO platos (codigo, nombre, categoria, pvp, coste_produccion, activo, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [codigo, nombre, categoria, pvp || 0, coste_produccion || 0, activo !== false ? 1 : 0, descripcion],
      function(err) {
        if (err) {
          console.error('Error al crear plato:', err);
          return res.status(500).json(
            createResponse(false, null, err.message, 500)
          );
        }
        res.status(201).json(
          createResponse(true, { id: this.lastID }, null, 201)
        );
      }
    );
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/platos/:id
 * Actualiza un plato
 */
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { codigo, nombre, categoria, pvp, coste_produccion, activo, descripcion } = req.body;
    
    if (!nombre || !codigo) {
      return res.status(400).json(
        createResponse(false, null, 'nombre y codigo son requeridos', 400)
      );
    }

    const db = getDatabase();
    db.run(
      'UPDATE platos SET codigo = ?, nombre = ?, categoria = ?, pvp = ?, coste_produccion = ?, activo = ?, descripcion = ? WHERE id = ?',
      [codigo, nombre, categoria, pvp, coste_produccion, activo ? 1 : 0, descripcion, id],
      function(err) {
        if (err) {
          console.error('Error al actualizar plato:', err);
          return res.status(500).json(
            createResponse(false, null, err.message, 500)
          );
        }
        if (this.changes === 0) {
          return res.status(404).json(
            createResponse(false, null, 'Plato no encontrado', 404)
          );
        }
        res.json(createResponse(true, { id }, null, 200));
      }
    );
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/platos/:id
 * Elimina un plato
 */
async function eliminar(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.run('DELETE FROM platos WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error al eliminar plato:', err);
        return res.status(500).json(
          createResponse(false, null, err.message, 500)
        );
      }
      if (this.changes === 0) {
        return res.status(404).json(
          createResponse(false, null, 'Plato no encontrado', 404)
        );
      }
      res.json(createResponse(true, { deleted: true }, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/platos/estadisticas
 * Obtiene estadísticas de platos
 */
async function obtenerEstadisticas(req, res, next) {
  try {
    const db = getDatabase();
    
    // Usar una query de estadísticas
    db.get(`
      SELECT 
        COUNT(*) as total,
        AVG(pvp) as pvp_promedio,
        MIN(pvp) as pvp_minimo,
        MAX(pvp) as pvp_maximo
      FROM platos
    `, (err, stats) => {
      if (err) {
        console.error('Error al obtener estadísticas:', err);
        return res.status(500).json(
          createResponse(false, null, err.message, 500)
        );
      }
      
      res.json(createResponse(true, stats || {
        total: 0,
        pvp_promedio: 0,
        pvp_minimo: 0,
        pvp_maximo: 0
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
