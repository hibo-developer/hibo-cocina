const Etiqueta = require('../models/Etiqueta');

// Obtener todas las etiquetas
exports.obtenerTodas = async (req, res) => {
  try {
    const etiquetas = await Etiqueta.obtenerTodas();
    res.json(etiquetas);
  } catch (error) {
    console.error('Error al obtener etiquetas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener por plato
exports.obtenerPorPlato = async (req, res) => {
  try {
    const { codigo_plato } = req.params;
    const etiqueta = await Etiqueta.obtenerPorPlato(codigo_plato);
    if (!etiqueta) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }
    res.json(etiqueta);
  } catch (error) {
    console.error('Error al obtener etiqueta:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const etiqueta = await Etiqueta.obtenerPorId(id);
    if (!etiqueta) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }
    res.json(etiqueta);
  } catch (error) {
    console.error('Error al obtener etiqueta:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener por lote
exports.obtenerPorLote = async (req, res) => {
  try {
    const { lote } = req.params;
    const etiquetas = await Etiqueta.obtenerPorLote(lote);
    res.json(etiquetas);
  } catch (error) {
    console.error('Error al obtener etiquetas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener por alergeno
exports.obtenerPorAlergeno = async (req, res) => {
  try {
    const { alergeno } = req.params;
    const etiquetas = await Etiqueta.obtenerPorAlergeno(alergeno);
    res.json(etiquetas);
  } catch (error) {
    console.error('Error al obtener etiquetas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Crear nueva etiqueta
exports.crear = async (req, res) => {
  try {
    const { codigo_plato, descripcion, informacion_nutricional, ingredientes,
            alergenos, instrucciones_preparacion, modo_conservacion, durabilidad_dias } = req.body;
    
    if (!codigo_plato) {
      return res.status(400).json({ error: 'Código de plato requerido' });
    }
    
    const etiqueta = await Etiqueta.crear({
      codigo_plato,
      descripcion,
      informacion_nutricional,
      ingredientes,
      alergenos,
      instrucciones_preparacion,
      modo_conservacion,
      durabilidad_dias
    });
    
    res.status(201).json(etiqueta);
  } catch (error) {
    console.error('Error al crear etiqueta:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar etiqueta
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizacion = await Etiqueta.actualizar(id, req.body);
    res.json(actualizacion);
  } catch (error) {
    console.error('Error al actualizar etiqueta:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar etiqueta
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await Etiqueta.eliminar(id);
    res.json(resultado);
  } catch (error) {
    console.error('Error al eliminar etiqueta:', error);
    res.status(500).json({ error: error.message });
  }
};

// Contar etiquetas
exports.contar = async (req, res) => {
  try {
    const total = await Etiqueta.contar();
    res.json({ total });
  } catch (error) {
    console.error('Error al contar etiquetas:', error);
    res.status(500).json({ error: error.message });
  }
};
