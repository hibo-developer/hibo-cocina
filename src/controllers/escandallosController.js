/**
 * Controlador para ESCANDALLOS
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
      SELECT e.*, i.nombre as ingrediente_nombre, p.nombre as plato_nombre
      FROM escandallos e
      LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
      LEFT JOIN platos p ON e.plato_id = p.id
      ORDER BY e.plato_id, e.ingrediente_id
    `, (err, rows) => {
      if (err) {
        console.error('Error al obtener escandallos:', err);
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
    db.get('SELECT * FROM escandallos WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error al obtener escandallo:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (!row) {
        return res.status(404).json(createResponse(false, null, 'Escandallo no encontrado', 404));
      }
      res.json(createResponse(true, row, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { plato_id, ingrediente_id, cantidad } = req.body;
    
    // Validar estructura del escandallo
    const validacion = ServicioValidaciones.validarEscandallo(req.body, true);
    if (!validacion.valido) {
      logger.error('Validación fallida al crear escandallo:', validacion.errores);
      return res.status(400).json(
        createResponse(false, { errores: validacion.errores }, 'Errores de validación', 400)
      );
    }

    // Validar referencias a plato e ingrediente
    const refValidas = await ServicioValidaciones.validarReferencias('escandallo', {
      plato_id,
      ingrediente_id
    });
    if (!refValidas.valido) {
      return res.status(400).json(
        createResponse(false, { errores: refValidas.errores }, 'Referencias inválidas', 400)
      );
    }

    // Validar que no exista escandallo duplicado
    const db = getDatabase();
    db.get(
      'SELECT id FROM escandallos WHERE plato_id = ? AND ingrediente_id = ?',
      [plato_id, ingrediente_id],
      (err, row) => {
        if (err) {
          logger.error('Error al verificar escandallo duplicado:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        if (row) {
          return res.status(400).json(
            createResponse(false, null, 'Ya existe un escandallo con este plato e ingrediente', 400)
          );
        }

        // Crear escandallo
        db.run(
          'INSERT INTO escandallos (plato_id, ingrediente_id, cantidad) VALUES (?, ?, ?)',
          [plato_id, ingrediente_id, cantidad || 0],
          function(err) {
            if (err) {
              logger.error('Error al crear escandallo:', err);
              return res.status(500).json(createResponse(false, null, err.message, 500));
            }
            logger.info(`Escandallo creado: ID ${this.lastID} - Plato ${plato_id}, Ingrediente ${ingrediente_id}`);
            res.status(201).json(createResponse(true, { id: this.lastID }, null, 201));
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { plato_id, ingrediente_id, cantidad } = req.body;
    
    // Validar estructura del escandallo
    const validacion = ServicioValidaciones.validarEscandallo(req.body, false);
    if (!validacion.valido) {
      logger.error('Validación fallida al actualizar escandallo:', validacion.errores);
      return res.status(400).json(
        createResponse(false, { errores: validacion.errores }, 'Errores de validación', 400)
      );
    }

    // Validar referencias a plato e ingrediente
    const refValidas = await ServicioValidaciones.validarReferencias('escandallo', {
      plato_id,
      ingrediente_id
    });
    if (!refValidas.valido) {
      return res.status(400).json(
        createResponse(false, { errores: refValidas.errores }, 'Referencias inválidas', 400)
      );
    }

    const db = getDatabase();
    db.run(
      'UPDATE escandallos SET plato_id = ?, ingrediente_id = ?, cantidad = ? WHERE id = ?',
      [plato_id, ingrediente_id, cantidad, id],
      function(err) {
        if (err) {
          logger.error('Error al actualizar escandallo:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        if (this.changes === 0) {
          return res.status(404).json(createResponse(false, null, 'Escandallo no encontrado', 404));
        }
        logger.info(`Escandallo actualizado: ID ${id}`);
        res.json(createResponse(true, { id }, 'Escandallo actualizado correctamente', 200));
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
    
    db.run('DELETE FROM escandallos WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error al eliminar escandallo:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (this.changes === 0) {
        return res.status(404).json(createResponse(false, null, 'Escandallo no encontrado', 404));
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
