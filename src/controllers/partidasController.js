/**
 * Controlador para PARTIDAS DE COCINA (PRODUCCIÓN)
 */
const { getDatabase } = require('../utils/database');
const { createResponse } = require('../middleware/errorHandler');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const ServicioCalculos = require('../utils/servicioCalculos');
const logger = require('../utils/logger');

async function obtenerTodas(req, res, next) {
  try {
    const db = getDatabase();
    db.all('SELECT * FROM partidas_cocina ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        console.error('Error al obtener partidas:', err);
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
    db.get('SELECT * FROM partidas_cocina WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error al obtener partida:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (!row) {
        return res.status(404).json(createResponse(false, null, 'Partida no encontrada', 404));
      }
      res.json(createResponse(true, row, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { nombre, responsable, descripcion, activo } = req.body;
    
    if (!nombre) {
      return res.status(400).json(createResponse(false, null, 'nombre es requerido', 400));
    }

    const db = getDatabase();
    db.run(
      'INSERT INTO partidas_cocina (nombre, responsable, descripcion, activo) VALUES (?, ?, ?, ?)',
      [nombre, responsable, descripcion, activo !== false ? 1 : 0],
      function(err) {
        if (err) {
          logger.error('Error al crear partida:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        logger.info(`Partida creada: ID ${this.lastID} - ${nombre}`);
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
    const { nombre, responsable, descripcion, activo } = req.body;
    
    if (!nombre) {
      return res.status(400).json(createResponse(false, null, 'nombre es requerido', 400));
    }

    const db = getDatabase();
    db.run(
      'UPDATE partidas_cocina SET nombre = ?, responsable = ?, descripcion = ?, activo = ? WHERE id = ?',
      [nombre, responsable, descripcion, activo ? 1 : 0, id],
      function(err) {
        if (err) {
          logger.error('Error al actualizar partida:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        if (this.changes === 0) {
          return res.status(404).json(createResponse(false, null, 'Partida no encontrada', 404));
        }
        logger.info(`Partida actualizada: ID ${id} - ${nombre}`);
        res.json(createResponse(true, { id }, 'Partida actualizada correctamente', 200));
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
    
    db.run('DELETE FROM partidas_cocina WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error al eliminar partida:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (this.changes === 0) {
        return res.status(404).json(createResponse(false, null, 'Partida no encontrada', 404));
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
