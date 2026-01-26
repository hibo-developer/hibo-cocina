/**
 * Controlador para OFERTAS Y EVENTOS
 */
const { getDatabase } = require('../utils/database');
const { createResponse } = require('../middleware/errorHandler');

// ============================================================================
// OFERTAS
// ============================================================================

async function obtenerOfertasTodas(req, res, next) {
  try {
    const db = getDatabase();
    db.all('SELECT * FROM ofertas ORDER BY fecha_inicio DESC', (err, rows) => {
      if (err) {
        console.error('Error al obtener ofertas:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      res.json(createResponse(true, rows || [], null, 200));
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerOfertaPorId(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();
    db.get('SELECT * FROM ofertas WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error al obtener oferta:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (!row) {
        return res.status(404).json(createResponse(false, null, 'Oferta no encontrada', 404));
      }
      res.json(createResponse(true, row, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

async function crearOferta(req, res, next) {
  try {
    const { codigo, nombre, descripcion, tipo, precio_regular, precio_oferta, descuento_porcentaje, fecha_inicio, fecha_fin, platos, ingredientes } = req.body;
    
    if (!codigo || !nombre) {
      return res.status(400).json(createResponse(false, null, 'codigo y nombre son requeridos', 400));
    }

    const db = getDatabase();
    db.run(
      'INSERT INTO ofertas (codigo, nombre, descripcion, tipo, precio_regular, precio_oferta, descuento_porcentaje, fecha_inicio, fecha_fin, platos, ingredientes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [codigo, nombre, descripcion, tipo || 'oferta', precio_regular, precio_oferta, descuento_porcentaje, fecha_inicio, fecha_fin, platos, ingredientes],
      function(err) {
        if (err) {
          console.error('Error al crear oferta:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        res.status(201).json(createResponse(true, { id: this.lastID }, null, 201));
      }
    );
  } catch (error) {
    next(error);
  }
}

async function actualizarOferta(req, res, next) {
  try {
    const { id } = req.params;
    const { codigo, nombre, descripcion, tipo, estado, precio_regular, precio_oferta, descuento_porcentaje, fecha_inicio, fecha_fin, platos, ingredientes } = req.body;
    
    if (!codigo || !nombre) {
      return res.status(400).json(createResponse(false, null, 'codigo y nombre son requeridos', 400));
    }

    const db = getDatabase();
    db.run(
      'UPDATE ofertas SET codigo = ?, nombre = ?, descripcion = ?, tipo = ?, estado = ?, precio_regular = ?, precio_oferta = ?, descuento_porcentaje = ?, fecha_inicio = ?, fecha_fin = ?, platos = ?, ingredientes = ? WHERE id = ?',
      [codigo, nombre, descripcion, tipo, estado, precio_regular, precio_oferta, descuento_porcentaje, fecha_inicio, fecha_fin, platos, ingredientes, id],
      function(err) {
        if (err) {
          console.error('Error al actualizar oferta:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        if (this.changes === 0) {
          return res.status(404).json(createResponse(false, null, 'Oferta no encontrada', 404));
        }
        res.json(createResponse(true, { id }, null, 200));
      }
    );
  } catch (error) {
    next(error);
  }
}

async function eliminarOferta(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.run('DELETE FROM ofertas WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error al eliminar oferta:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (this.changes === 0) {
        return res.status(404).json(createResponse(false, null, 'Oferta no encontrada', 404));
      }
      res.json(createResponse(true, { deleted: true }, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// EVENTOS
// ============================================================================

async function obtenerEventosTodos(req, res, next) {
  try {
    const db = getDatabase();
    db.all('SELECT * FROM eventos ORDER BY fecha_evento DESC', (err, rows) => {
      if (err) {
        console.error('Error al obtener eventos:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      res.json(createResponse(true, rows || [], null, 200));
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerEventoPorId(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();
    db.get('SELECT * FROM eventos WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error al obtener evento:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (!row) {
        return res.status(404).json(createResponse(false, null, 'Evento no encontrado', 404));
      }
      res.json(createResponse(true, row, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

async function crearEvento(req, res, next) {
  try {
    const { codigo, nombre, descripcion, tipo_evento, fecha_evento, lugar, capacidad, precio_entrada, menu_especial, notas } = req.body;
    
    if (!codigo || !nombre || !fecha_evento) {
      return res.status(400).json(createResponse(false, null, 'codigo, nombre y fecha_evento son requeridos', 400));
    }

    const db = getDatabase();
    db.run(
      'INSERT INTO eventos (codigo, nombre, descripcion, tipo_evento, fecha_evento, lugar, capacidad, precio_entrada, menu_especial, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [codigo, nombre, descripcion, tipo_evento, fecha_evento, lugar, capacidad || 0, precio_entrada, menu_especial, notas],
      function(err) {
        if (err) {
          console.error('Error al crear evento:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        res.status(201).json(createResponse(true, { id: this.lastID }, null, 201));
      }
    );
  } catch (error) {
    next(error);
  }
}

async function actualizarEvento(req, res, next) {
  try {
    const { id } = req.params;
    const { codigo, nombre, descripcion, tipo_evento, fecha_evento, lugar, capacidad, personas_confirmadas, precio_entrada, estado, menu_especial, notas } = req.body;
    
    if (!codigo || !nombre || !fecha_evento) {
      return res.status(400).json(createResponse(false, null, 'codigo, nombre y fecha_evento son requeridos', 400));
    }

    const db = getDatabase();
    db.run(
      'UPDATE eventos SET codigo = ?, nombre = ?, descripcion = ?, tipo_evento = ?, fecha_evento = ?, lugar = ?, capacidad = ?, personas_confirmadas = ?, precio_entrada = ?, estado = ?, menu_especial = ?, notas = ? WHERE id = ?',
      [codigo, nombre, descripcion, tipo_evento, fecha_evento, lugar, capacidad || 0, personas_confirmadas, precio_entrada, estado, menu_especial, notas, id],
      function(err) {
        if (err) {
          console.error('Error al actualizar evento:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        if (this.changes === 0) {
          return res.status(404).json(createResponse(false, null, 'Evento no encontrado', 404));
        }
        res.json(createResponse(true, { id }, null, 200));
      }
    );
  } catch (error) {
    next(error);
  }
}

async function eliminarEvento(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.run('DELETE FROM eventos WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error al eliminar evento:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (this.changes === 0) {
        return res.status(404).json(createResponse(false, null, 'Evento no encontrado', 404));
      }
      res.json(createResponse(true, { deleted: true }, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  // Ofertas
  obtenerOfertasTodas,
  obtenerOfertaPorId,
  crearOferta,
  actualizarOferta,
  eliminarOferta,
  // Eventos
  obtenerEventosTodos,
  obtenerEventoPorId,
  crearEvento,
  actualizarEvento,
  eliminarEvento
};
