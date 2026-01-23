const Ingrediente = require('../models/Ingrediente');

exports.obtenerTodos = async (req, res) => {
  try {
    const ingredientes = await Ingrediente.obtenerTodos();
    res.json(ingredientes);
  } catch (error) {
    console.error('Error al obtener ingredientes:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const ingrediente = await Ingrediente.obtenerPorId(id);
    if (!ingrediente) {
      return res.status(404).json({ error: 'Ingrediente no encontrado' });
    }
    res.json(ingrediente);
  } catch (error) {
    console.error('Error al obtener ingrediente:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { codigo, nombre, descripcion, grupo_conservacion, proveedor } = req.body;
    
    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'Código y nombre son requeridos' });
    }
    
    const ingrediente = await Ingrediente.crear({
      codigo,
      nombre,
      descripcion,
      grupo_conservacion,
      proveedor
    });
    
    res.status(201).json(ingrediente);
  } catch (error) {
    console.error('Error al crear ingrediente:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await Ingrediente.actualizar(id, req.body);
    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar ingrediente:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    await Ingrediente.eliminar(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar ingrediente:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.contar = async (req, res) => {
  try {
    const total = await Ingrediente.contar();
    res.json({ total });
  } catch (error) {
    console.error('Error al contar ingredientes:', error);
    res.status(500).json({ error: error.message });
  }
};
