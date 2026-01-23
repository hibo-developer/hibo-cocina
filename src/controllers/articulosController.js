const Articulo = require('../models/Articulo');

// Obtener todos los artículos
exports.obtenerTodos = async (req, res) => {
  try {
    const articulos = await Articulo.obtenerTodos();
    res.json(articulos);
  } catch (error) {
    console.error('Error al obtener artículos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Crear nuevo artículo
exports.crear = async (req, res) => {
  try {
    const { codigo, nombre, unidad, coste_kilo, tipo, grupo_conservacion } = req.body;
    
    if (!codigo || !nombre || !unidad) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    
    const articulo = await Articulo.crear({
      codigo,
      nombre,
      unidad,
      coste_kilo: coste_kilo || 0,
      tipo: tipo || '',
      grupo_conservacion: grupo_conservacion || 'Temperatura Ambiente'
    });
    
    res.status(201).json(articulo);
  } catch (error) {
    console.error('Error al crear artículo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener artículo por código
exports.obtenerPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const articulo = await Articulo.obtenerPorCodigo(codigo);
    
    if (!articulo) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    
    res.json(articulo);
  } catch (error) {
    console.error('Error al obtener artículo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener artículo por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const articulo = await Articulo.obtenerPorId(id);
    
    if (!articulo) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    
    res.json(articulo);
  } catch (error) {
    console.error('Error al obtener artículo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener artículos por grupo de conservación
exports.obtenerPorGrupo = async (req, res) => {
  try {
    const { grupo } = req.params;
    const articulos = await Articulo.obtenerPorGrupoConservacion(grupo);
    res.json(articulos);
  } catch (error) {
    console.error('Error al obtener artículos por grupo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar artículo
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizacion = await Articulo.actualizar(id, req.body);
    res.json(actualizacion);
  } catch (error) {
    console.error('Error al actualizar artículo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar artículo
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await Articulo.eliminar(id);
    res.json(resultado);
  } catch (error) {
    console.error('Error al eliminar artículo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener conteo de artículos
exports.contar = async (req, res) => {
  try {
    const total = await Articulo.contar();
    res.json({ total });
  } catch (error) {
    console.error('Error al contar artículos:', error);
    res.status(500).json({ error: error.message });
  }
};
