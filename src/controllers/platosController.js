/**
 * Controlador para PLATOS
 * Maneja todas las operaciones CRUD de platos
 */
const { getDatabase } = require('../utils/database');
const { createResponse } = require('../middleware/errorHandler');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const ServicioCalculos = require('../utils/servicioCalculos');

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
    const { codigo, nombre, tipo, precio_venta, coste_racion, activo, descripcion, familia, alergenos } = req.body;
    
    // Validar datos
    const validacion = ServicioValidaciones.validarPlato(req.body, true);
    if (!validacion.valido) {
      return res.status(400).json(
        createResponse(false, { errores: validacion.errores }, 'Errores de validación', 400)
      );
    }

    // Verificar código único
    const esUnico = await ServicioValidaciones.verificarCodigoUnico('platos', codigo);
    if (!esUnico) {
      return res.status(400).json(
        createResponse(false, null, `El código ${codigo} ya existe`, 400)
      );
    }

    const db = getDatabase();
    db.run(
      `INSERT INTO platos (codigo, nombre, tipo, precio_venta, coste_racion, activo, descripcion, familia) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, nombre, tipo, precio_venta || 0, coste_racion || 0, activo !== false ? 1 : 0, descripcion || '', familia || ''],
      function(err) {
        if (err) {
          console.error('Error al crear plato:', err);
          return res.status(500).json(
            createResponse(false, null, err.message, 500)
          );
        }
        res.status(201).json(
          createResponse(true, { id: this.lastID }, 'Plato creado correctamente', 201)
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
    const { codigo, nombre, tipo, precio_venta, coste_racion, activo, descripcion, familia } = req.body;
    
    // Validar datos
    const validacion = ServicioValidaciones.validarPlato(req.body, false);
    if (!validacion.valido) {
      return res.status(400).json(
        createResponse(false, { errores: validacion.errores }, 'Errores de validación', 400)
      );
    }

    // Verificar código único (excluyendo el actual)
    if (codigo) {
      const esUnico = await ServicioValidaciones.verificarCodigoUnico('platos', codigo, parseInt(id));
      if (!esUnico) {
        return res.status(400).json(
          createResponse(false, null, `El código ${codigo} ya existe en otro plato`, 400)
        );
      }
    }

    const db = getDatabase();
    db.run(
      `UPDATE platos SET codigo = ?, nombre = ?, tipo = ?, precio_venta = ?, coste_racion = ?, activo = ?, descripcion = ?, familia = ? WHERE id = ?`,
      [codigo, nombre, tipo, precio_venta || 0, coste_racion || 0, activo ? 1 : 0, descripcion || '', familia || '', id],
      function(err) {
        if (err) {
          logger.error('Error al actualizar plato:', err);
          return res.status(500).json(
            createResponse(false, null, err.message, 500)
          );
        }
        if (this.changes === 0) {
          return res.status(404).json(
            createResponse(false, null, 'Plato no encontrado', 404)
          );
        }
        logger.info(`Plato actualizado: ID ${id} - ${nombre}`);
        res.json(
          createResponse(true, { id }, 'Plato actualizado correctamente', 200)
        );
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
        COUNT(CASE WHEN activo = 1 THEN 1 END) as activos,
        COUNT(CASE WHEN plato_venta = 1 THEN 1 END) as platos_venta,
        AVG(precio_venta) as precio_venta_promedio,
        MIN(precio_venta) as precio_venta_minimo,
        MAX(precio_venta) as precio_venta_maximo,
        AVG(coste_escandallo) as coste_promedio,
        SUM(CASE WHEN escandallado = 1 THEN 1 ELSE 0 END) as escandallados
      FROM platos
      WHERE activo = 1
    `, (err, stats) => {
      if (err) {
        console.error('Error al obtener estadísticas:', err);
        return res.status(500).json(
          createResponse(false, null, err.message, 500)
        );
      }
      
      res.json(createResponse(true, stats || {
        total: 0,
        activos: 0,
        platos_venta: 0,
        precio_venta_promedio: 0,
        precio_venta_minimo: 0,
        precio_venta_maximo: 0,
        coste_promedio: 0,
        escandallados: 0
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
