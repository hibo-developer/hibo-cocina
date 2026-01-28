/**
 * Controlador para SANIDAD (APPCC)
 */
const { getDatabase } = require('../utils/database');
const { createResponse } = require('../middleware/errorHandler');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const ServicioCalculos = require('../utils/servicioCalculos');
const logger = require('../utils/logger');

async function obtenerTodas(req, res, next) {
  try {
    const db = getDatabase();
    db.all('SELECT * FROM control_sanidad ORDER BY fecha_produccion DESC', (err, rows) => {
      if (err) {
        console.error('Error al obtener controles de sanidad:', err);
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
    db.get('SELECT * FROM control_sanidad WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error al obtener control:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (!row) {
        return res.status(404).json(createResponse(false, null, 'Control no encontrado', 404));
      }
      res.json(createResponse(true, row, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { plato_codigo, ingrediente_codigo, fecha_produccion, punto_critico, corrector, responsable, observaciones } = req.body;
    
    // Validar estructura del control de sanidad (APPCC)
    const validacion = ServicioValidaciones.validarSanidad(req.body, true);
    if (!validacion.valido) {
      logger.error('Validación fallida al crear control de sanidad:', validacion.errores);
      return res.status(400).json(
        createResponse(false, { errores: validacion.errores }, 'Errores de validación', 400)
      );
    }

    const db = getDatabase();
    db.run(
      'INSERT INTO control_sanidad (plato_codigo, ingrediente_codigo, fecha_produccion, punto_critico, corrector, responsable, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [plato_codigo, ingrediente_codigo, fecha_produccion, punto_critico, corrector, responsable, observaciones],
      function(err) {
        if (err) {
          logger.error('Error al crear control de sanidad:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        logger.info(`Control de sanidad creado: ID ${this.lastID} - ${fecha_produccion}`);
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
    const { plato_codigo, ingrediente_codigo, fecha_produccion, punto_critico, corrector, responsable, observaciones } = req.body;
    
    // Validar estructura del control de sanidad (APPCC)
    const validacion = ServicioValidaciones.validarSanidad(req.body, false);
    if (!validacion.valido) {
      logger.error('Validación fallida al actualizar control de sanidad:', validacion.errores);
      return res.status(400).json(
        createResponse(false, { errores: validacion.errores }, 'Errores de validación', 400)
      );
    }

    const db = getDatabase();
    db.run(
      'UPDATE control_sanidad SET plato_codigo = ?, ingrediente_codigo = ?, fecha_produccion = ?, punto_critico = ?, corrector = ?, responsable = ?, observaciones = ? WHERE id = ?',
      [plato_codigo, ingrediente_codigo, fecha_produccion, punto_critico, corrector, responsable, observaciones, id],
      function(err) {
        if (err) {
          logger.error('Error al actualizar control de sanidad:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        if (this.changes === 0) {
          return res.status(404).json(createResponse(false, null, 'Control de sanidad no encontrado', 404));
        }
        logger.info(`Control de sanidad actualizado: ID ${id}`);
        res.json(createResponse(true, { id }, 'Control de sanidad actualizado correctamente', 200));
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
    
    db.run('DELETE FROM control_sanidad WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error al eliminar control:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (this.changes === 0) {
        return res.status(404).json(createResponse(false, null, 'Control no encontrado', 404));
      }
      res.json(createResponse(true, { deleted: true }, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  obtenerTodas,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
