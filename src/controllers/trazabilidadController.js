const Trazabilidad = require('../models/Trazabilidad');
const db = require('../db/database');
const ControlStock = require('../services/ControlStock');

const controlStock = new ControlStock(db);

// Obtener todas las trazabilidades
exports.obtenerTodas = async (req, res) => {
  try {
    const trazabilidades = await Trazabilidad.obtenerTodas();
    res.json(trazabilidades);
  } catch (error) {
    console.error('Error al obtener trazabilidades:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener por plato
exports.obtenerPorPlato = async (req, res) => {
  try {
    const { codigo_plato } = req.params;
    const trazabilidades = await Trazabilidad.obtenerPorPlato(codigo_plato);
    res.json(trazabilidades);
  } catch (error) {
    console.error('Error al obtener trazabilidad:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener por lote
exports.obtenerPorLote = async (req, res) => {
  try {
    const { lote } = req.params;
    const trazabilidades = await Trazabilidad.obtenerPorLote(lote);
    res.json(trazabilidades);
  } catch (error) {
    console.error('Error al obtener trazabilidad por lote:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener por partida
exports.obtenerPorPartida = async (req, res) => {
  try {
    const { partida } = req.params;
    const trazabilidades = await Trazabilidad.obtenerPorPartida(partida);
    res.json(trazabilidades);
  } catch (error) {
    console.error('Error al obtener trazabilidad por partida:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener por fecha
exports.obtenerPorFecha = async (req, res) => {
  try {
    const { fecha } = req.params;
    const trazabilidades = await Trazabilidad.obtenerPorFecha(fecha);
    res.json(trazabilidades);
  } catch (error) {
    console.error('Error al obtener trazabilidad por fecha:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener por responsable
exports.obtenerPorResponsable = async (req, res) => {
  try {
    const { responsable } = req.params;
    const trazabilidades = await Trazabilidad.obtenerPorResponsable(responsable);
    res.json(trazabilidades);
  } catch (error) {
    console.error('Error al obtener trazabilidad por responsable:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const trazabilidad = await Trazabilidad.obtenerPorId(id);
    if (!trazabilidad) {
      return res.status(404).json({ error: 'Trazabilidad no encontrada' });
    }
    res.json(trazabilidad);
  } catch (error) {
    console.error('Error al obtener trazabilidad:', error);
    res.status(500).json({ error: error.message });
  }
};

// Crear nueva trazabilidad
exports.crear = async (req, res) => {
  try {
    const { codigo_plato, lote_produccion, fecha_produccion, partida_cocina, 
            cantidad_producida, responsable, observaciones } = req.body;
    
    if (!codigo_plato) {
      return res.status(400).json({ error: 'Código de plato requerido' });
    }
    
    const trazabilidad = await Trazabilidad.crear({
      codigo_plato,
      lote_produccion,
      fecha_produccion,
      partida_cocina,
      cantidad_producida,
      responsable,
      observaciones
    });

    // Descontar ingredientes del stock automáticamente
    if (cantidad_producida && cantidad_producida > 0) {
      try {
        const descuento = await controlStock.descontarProduccion(
          codigo_plato, 
          cantidad_producida
        );
        console.log('Stock actualizado:', descuento);
      } catch (stockError) {
        console.warn('Error al actualizar stock:', stockError);
        // No fallar la creación de trazabilidad si falla el stock
      }
    }
    
    res.status(201).json(trazabilidad);
  } catch (error) {
    console.error('Error al crear trazabilidad:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar trazabilidad
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizacion = await Trazabilidad.actualizar(id, req.body);
    res.json(actualizacion);
  } catch (error) {
    console.error('Error al actualizar trazabilidad:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar trazabilidad
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await Trazabilidad.eliminar(id);
    res.json(resultado);
  } catch (error) {
    console.error('Error al eliminar trazabilidad:', error);
    res.status(500).json({ error: error.message });
  }
};

// Contar trazabilidades
exports.contar = async (req, res) => {
  try {
    const total = await Trazabilidad.contar();
    res.json({ total });
  } catch (error) {
    console.error('Error al contar trazabilidades:', error);
    res.status(500).json({ error: error.message });
  }
};
