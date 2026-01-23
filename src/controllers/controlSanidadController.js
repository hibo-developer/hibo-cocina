const ControlSanidad = require('../models/ControlSanidad');

exports.obtenerTodos = async (req, res) => {
  try {
    const controles = await ControlSanidad.obtenerTodos();
    res.json(controles);
  } catch (error) {
    console.error('Error al obtener controles:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const control = await ControlSanidad.obtenerPorId(id);
    if (!control) {
      return res.status(404).json({ error: 'Control no encontrado' });
    }
    res.json(control);
  } catch (error) {
    console.error('Error al obtener control:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerPorPlato = async (req, res) => {
  try {
    const { plato_codigo } = req.params;
    const controles = await ControlSanidad.obtenerPorPlato(plato_codigo);
    res.json(controles);
  } catch (error) {
    console.error('Error al obtener controles:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { plato_codigo, ingrediente_codigo, fecha_produccion, punto_critico, corrector, responsable, observaciones } = req.body;
    
    if (!plato_codigo) {
      return res.status(400).json({ error: 'Código de plato es requerido' });
    }
    
    const control = await ControlSanidad.crear({
      plato_codigo,
      ingrediente_codigo,
      fecha_produccion,
      punto_critico,
      corrector,
      responsable,
      observaciones
    });
    
    res.status(201).json(control);
  } catch (error) {
    console.error('Error al crear control:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await ControlSanidad.actualizar(id, req.body);
    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar control:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    await ControlSanidad.eliminar(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar control:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.contar = async (req, res) => {
  try {
    const total = await ControlSanidad.contar();
    res.json({ total });
  } catch (error) {
    console.error('Error al contar controles:', error);
    res.status(500).json({ error: error.message });
  }
};
