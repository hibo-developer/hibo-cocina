/**
 * Controlador para OFERTAS Y EVENTOS
 * Proporciona CRUD completo y funcionalidades avanzadas
 */
const { getDatabase } = require('../utils/database');
const { createResponse } = require('../middleware/errorHandler');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const ServicioCalculos = require('../utils/servicioCalculos');
const logger = require('../utils/logger');

// Promisificar database para usar async/await
const promisifyDb = (db, operation) => {
  return new Promise((resolve, reject) => {
    db[operation]((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

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

    // Verificar código único
    const esUnico = await ServicioValidaciones.verificarCodigoUnico('ofertas', codigo);
    if (!esUnico) {
      return res.status(400).json(
        createResponse(false, null, `Código '${codigo}' ya existe en ofertas`, 400)
      );
    }

    const db = getDatabase();
    db.run(
      'INSERT INTO ofertas (codigo, nombre, descripcion, tipo, precio_regular, precio_oferta, descuento_porcentaje, fecha_inicio, fecha_fin, platos, ingredientes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [codigo, nombre, descripcion, tipo || 'oferta', precio_regular, precio_oferta, descuento_porcentaje, fecha_inicio, fecha_fin, platos, ingredientes],
      function(err) {
        if (err) {
          logger.error('Error al crear oferta:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        logger.info(`Oferta creada: ID ${this.lastID} - ${nombre}`);
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

    // Verificar código único (excluir ID actual)
    const esUnico = await ServicioValidaciones.verificarCodigoUnico('ofertas', codigo, id);
    if (!esUnico) {
      return res.status(400).json(
        createResponse(false, null, `Código '${codigo}' ya existe en otra oferta`, 400)
      );
    }

    const db = getDatabase();
    db.run(
      'UPDATE ofertas SET codigo = ?, nombre = ?, descripcion = ?, tipo = ?, estado = ?, precio_regular = ?, precio_oferta = ?, descuento_porcentaje = ?, fecha_inicio = ?, fecha_fin = ?, platos = ?, ingredientes = ? WHERE id = ?',
      [codigo, nombre, descripcion, tipo, estado, precio_regular, precio_oferta, descuento_porcentaje, fecha_inicio, fecha_fin, platos, ingredientes, id],
      function(err) {
        if (err) {
          logger.error('Error al actualizar oferta:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        if (this.changes === 0) {
          return res.status(404).json(createResponse(false, null, 'Oferta no encontrada', 404));
        }
        logger.info(`Oferta actualizada: ID ${id} - ${nombre}`);
        res.json(createResponse(true, { id }, 'Oferta actualizada correctamente', 200));
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

// ============================================================================
// FUNCIONES ADICIONALES - OFERTAS
// ============================================================================

async function obtenerOfertasActivas(req, res, next) {
  try {
    const db = getDatabase();
    const hoy = new Date().toISOString().split('T')[0];
    
    db.all(
      `SELECT * FROM ofertas 
       WHERE estado = 'activa' 
       AND (fecha_inicio IS NULL OR fecha_inicio <= ?)
       AND (fecha_fin IS NULL OR fecha_fin >= ?)
       ORDER BY fecha_fin DESC`,
      [hoy, hoy],
      (err, rows) => {
        if (err) {
          logger.error('Error al obtener ofertas activas:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        res.json(createResponse(true, rows || [], null, 200));
      }
    );
  } catch (error) {
    next(error);
  }
}

async function aplicarOferta(req, res, next) {
  try {
    const { oferta_id, pedido_id, cliente_id, tipo_aplicacion } = req.body;
    
    if (!oferta_id) {
      return res.status(400).json(createResponse(false, null, 'oferta_id es requerido', 400));
    }

    const db = getDatabase();
    
    // Obtener oferta
    db.get('SELECT * FROM ofertas WHERE id = ?', [oferta_id], (err, oferta) => {
      if (err || !oferta) {
        logger.error('Error al obtener oferta:', err);
        return res.status(404).json(createResponse(false, null, 'Oferta no encontrada', 404));
      }

      // Calcular descuento
      const monto_descuento = (oferta.precio_regular * oferta.descuento_porcentaje) / 100 || 0;
      const monto_final = Math.max(0, (oferta.precio_regular || 0) - monto_descuento);

      // Registrar aplicación
      db.run(
        `INSERT INTO oferta_aplicaciones 
         (oferta_id, pedido_id, cliente_id, monto_descuento, monto_final, tipo_aplicacion) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [oferta_id, pedido_id || null, cliente_id || null, monto_descuento, monto_final, tipo_aplicacion || 'manual'],
        function(err) {
          if (err) {
            logger.error('Error al aplicar oferta:', err);
            return res.status(500).json(createResponse(false, null, err.message, 500));
          }
          logger.info(`Oferta aplicada: Oferta ${oferta_id} - Descuento $${monto_descuento.toFixed(2)}`);
          res.status(201).json(createResponse(true, { id: this.lastID, monto_descuento, monto_final }, null, 201));
        }
      );
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerEstadisticasOferta(req, res, next) {
  try {
    const db = getDatabase();
    
    db.all(
      `SELECT o.id, o.codigo, o.nombre, o.descuento_porcentaje,
              COUNT(DISTINCT oa.id) AS veces_aplicada,
              COALESCE(SUM(oa.monto_descuento), 0) AS descuento_total,
              COUNT(DISTINCT oa.cliente_id) AS clientes_beneficiados,
              o.fecha_inicio, o.fecha_fin
       FROM ofertas o
       LEFT JOIN oferta_aplicaciones oa ON o.id = oa.oferta_id
       GROUP BY o.id
       ORDER BY veces_aplicada DESC`,
      (err, rows) => {
        if (err) {
          logger.error('Error al obtener estadísticas de ofertas:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        res.json(createResponse(true, rows || [], null, 200));
      }
    );
  } catch (error) {
    next(error);
  }
}

async function validarOferta(req, res, next) {
  try {
    const datos = req.body;
    const errores = [];
    
    if (!datos.codigo || datos.codigo.trim() === '') errores.push('Código requerido');
    if (!datos.nombre || datos.nombre.trim() === '') errores.push('Nombre requerido');
    if (datos.precio_oferta && datos.precio_regular && datos.precio_oferta > datos.precio_regular) {
      errores.push('Precio de oferta no puede ser mayor al precio regular');
    }
    if (datos.descuento_porcentaje && (datos.descuento_porcentaje < 0 || datos.descuento_porcentaje > 100)) {
      errores.push('Descuento debe estar entre 0 y 100');
    }
    if (datos.fecha_inicio && datos.fecha_fin && datos.fecha_inicio > datos.fecha_fin) {
      errores.push('Fecha inicio no puede ser posterior a fecha fin');
    }

    const esValido = errores.length === 0;
    logger.info(`Validación de oferta: ${esValido ? 'exitosa' : 'con errores'}`);
    res.json(createResponse(esValido, { errores }, esValido ? 'Oferta válida' : 'Errores de validación', 200));
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// FUNCIONES ADICIONALES - EVENTOS
// ============================================================================

async function obtenerEventosProximos(req, res, next) {
  try {
    const { dias = 30 } = req.query;
    const db = getDatabase();
    
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + parseInt(dias));
    const fechaLimiteStr = fechaLimite.toISOString();

    db.all(
      `SELECT e.*, 
              COUNT(DISTINCT ea.id) AS total_asistentes,
              SUM(CASE WHEN ea.estado_confirmacion = 'confirmado' THEN 1 ELSE 0 END) AS confirmados
       FROM eventos e
       LEFT JOIN evento_asistentes ea ON e.id = ea.evento_id
       WHERE e.estado IN ('planificado', 'confirmado', 'en_progreso')
       AND e.fecha_evento <= ?
       AND e.fecha_evento >= DATETIME('now')
       GROUP BY e.id
       ORDER BY e.fecha_evento ASC`,
      [fechaLimiteStr],
      (err, rows) => {
        if (err) {
          logger.error('Error al obtener eventos próximos:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        res.json(createResponse(true, rows || [], null, 200));
      }
    );
  } catch (error) {
    next(error);
  }
}

async function agregarAsistente(req, res, next) {
  try {
    const { evento_id, nombre, email, telefono, numero_acompanantes, restricciones_dieteticas } = req.body;
    
    if (!evento_id || !nombre) {
      return res.status(400).json(createResponse(false, null, 'evento_id y nombre son requeridos', 400));
    }

    const db = getDatabase();
    
    db.run(
      `INSERT INTO evento_asistentes 
       (evento_id, nombre, email, telefono, numero_acompanantes, restricciones_dieteticas) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [evento_id, nombre, email || null, telefono || null, numero_acompanantes || 0, 
       restricciones_dieteticas ? JSON.stringify(restricciones_dieteticas) : null],
      function(err) {
        if (err) {
          logger.error('Error al agregar asistente:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        logger.info(`Asistente agregado: ${nombre} al evento ${evento_id}`);
        res.status(201).json(createResponse(true, { id: this.lastID }, null, 201));
      }
    );
  } catch (error) {
    next(error);
  }
}

async function obtenerAsistentes(req, res, next) {
  try {
    const { evento_id } = req.params;
    
    if (!evento_id) {
      return res.status(400).json(createResponse(false, null, 'evento_id es requerido', 400));
    }

    const db = getDatabase();
    
    db.all(
      `SELECT id, evento_id, nombre, email, telefono, estado_confirmacion, 
              numero_acompanantes, restricciones_dieteticas, created_at 
       FROM evento_asistentes 
       WHERE evento_id = ? 
       ORDER BY created_at DESC`,
      [evento_id],
      (err, rows) => {
        if (err) {
          logger.error('Error al obtener asistentes:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        res.json(createResponse(true, rows || [], null, 200));
      }
    );
  } catch (error) {
    next(error);
  }
}

async function actualizarConfirmacionAsistente(req, res, next) {
  try {
    const { asistente_id } = req.params;
    const { estado_confirmacion } = req.body;
    
    if (!asistente_id || !estado_confirmacion) {
      return res.status(400).json(createResponse(false, null, 'asistente_id y estado_confirmacion son requeridos', 400));
    }

    if (!['pendiente', 'confirmado', 'rechazado', 'no_confirmo'].includes(estado_confirmacion)) {
      return res.status(400).json(createResponse(false, null, 'estado_confirmacion inválido', 400));
    }

    const db = getDatabase();
    
    db.run(
      'UPDATE evento_asistentes SET estado_confirmacion = ? WHERE id = ?',
      [estado_confirmacion, asistente_id],
      function(err) {
        if (err) {
          logger.error('Error al actualizar asistente:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        if (this.changes === 0) {
          return res.status(404).json(createResponse(false, null, 'Asistente no encontrado', 404));
        }
        logger.info(`Confirmación actualizada: Asistente ${asistente_id} -> ${estado_confirmacion}`);
        res.json(createResponse(true, { id: asistente_id }, 'Confirmación actualizada', 200));
      }
    );
  } catch (error) {
    next(error);
  }
}

async function eliminarAsistente(req, res, next) {
  try {
    const { asistente_id } = req.params;
    const db = getDatabase();
    
    db.run('DELETE FROM evento_asistentes WHERE id = ?', [asistente_id], function(err) {
      if (err) {
        logger.error('Error al eliminar asistente:', err);
        return res.status(500).json(createResponse(false, null, err.message, 500));
      }
      if (this.changes === 0) {
        return res.status(404).json(createResponse(false, null, 'Asistente no encontrado', 404));
      }
      res.json(createResponse(true, { deleted: true }, null, 200));
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerEstadisticasEvento(req, res, next) {
  try {
    const db = getDatabase();
    
    db.all(
      `SELECT e.id, e.codigo, e.nombre, e.tipo_evento, e.estado,
              COUNT(DISTINCT ea.id) AS total_asistentes,
              SUM(CASE WHEN ea.estado_confirmacion = 'confirmado' THEN 1 ELSE 0 END) AS confirmados,
              SUM(CASE WHEN ea.estado_confirmacion = 'rechazado' THEN 1 ELSE 0 END) AS rechazados,
              SUM(CASE WHEN ea.estado_confirmacion = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
              e.precio_total, e.fecha_evento, e.capacidad
       FROM eventos e
       LEFT JOIN evento_asistentes ea ON e.id = ea.evento_id
       GROUP BY e.id
       ORDER BY e.fecha_evento DESC`,
      (err, rows) => {
        if (err) {
          logger.error('Error al obtener estadísticas de eventos:', err);
          return res.status(500).json(createResponse(false, null, err.message, 500));
        }
        res.json(createResponse(true, rows || [], null, 200));
      }
    );
  } catch (error) {
    next(error);
  }
}

async function validarEvento(req, res, next) {
  try {
    const datos = req.body;
    const errores = [];
    
    if (!datos.codigo || datos.codigo.trim() === '') errores.push('Código requerido');
    if (!datos.nombre || datos.nombre.trim() === '') errores.push('Nombre requerido');
    if (!datos.fecha_evento) errores.push('Fecha del evento requerida');
    if (datos.capacidad && datos.capacidad < 0) errores.push('Capacidad no puede ser negativa');
    if (datos.fecha_evento && new Date(datos.fecha_evento) < new Date()) {
      errores.push('La fecha del evento no puede ser en el pasado');
    }

    const esValido = errores.length === 0;
    logger.info(`Validación de evento: ${esValido ? 'exitosa' : 'con errores'}`);
    res.json(createResponse(esValido, { errores }, esValido ? 'Evento válido' : 'Errores de validación', 200));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  // Ofertas
  obtenerOfertasTodas,
  obtenerOfertaPorId,
  obtenerOfertasActivas,
  crearOferta,
  actualizarOferta,
  eliminarOferta,
  aplicarOferta,
  obtenerEstadisticasOferta,
  validarOferta,
  // Eventos
  obtenerEventosTodos,
  obtenerEventoPorId,
  obtenerEventosProximos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  agregarAsistente,
  obtenerAsistentes,
  actualizarConfirmacionAsistente,
  eliminarAsistente,
  obtenerEstadisticasEvento,
  validarEvento
};
