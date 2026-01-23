const Proveedor = require('../models/Proveedor');

exports.obtenerTodos = async (req, res) => {
  try {
    const proveedores = await Proveedor.obtenerTodos();
    res.json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedor = await Proveedor.obtenerPorId(id);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    res.json(proveedor);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { codigo, nombre, email, telefono, direccion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }
    
    const proveedor = await Proveedor.crear({
      codigo,
      nombre,
      email,
      telefono,
      direccion
    });
    
    res.status(201).json(proveedor);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await Proveedor.actualizar(id, req.body);
    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    await Proveedor.eliminar(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.contar = async (req, res) => {
  try {
    const total = await Proveedor.contar();
    res.json({ total });
  } catch (error) {
    console.error('Error al contar proveedores:', error);
    res.status(500).json({ error: error.message });
  }
};
