const Cliente = require('../models/Cliente');

// Obtener todos los clientes
exports.obtenerTodos = async (req, res) => {
  try {
    const clientes = await Cliente.obtenerTodos();
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: error.message });
  }
};

// Crear nuevo cliente
exports.crear = async (req, res) => {
  try {
    const { codigo, nombre, email, telefono, direccion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    const cliente = await Cliente.crear({
      codigo: codigo || '',
      nombre,
      email: email || '',
      telefono: telefono || '',
      direccion: direccion || ''
    });
    
    res.status(201).json(cliente);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener cliente por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.obtenerPorId(id);
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar cliente
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizacion = await Cliente.actualizar(id, req.body);
    res.json(actualizacion);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar cliente
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    await Cliente.eliminar(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: error.message });
  }
};

// Contar clientes
exports.contar = async (req, res) => {
  try {
    const total = await Cliente.contar();
    res.json({ total });
  } catch (error) {
    console.error('Error al contar clientes:', error);
    res.status(500).json({ error: error.message });
  }
};
