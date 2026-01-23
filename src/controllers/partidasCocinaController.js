const PartidaCocina = require('../models/PartidaCocina');

// Obtener todas las partidas
exports.obtenerTodas = async (req, res) => {
  try {
    const partidas = await PartidaCocina.obtenerTodas();
    res.json(partidas);
  } catch (error) {
    console.error('Error al obtener partidas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Crear nueva partida
exports.crear = async (req, res) => {
  try {
    const { nombre, responsable, descripcion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    const partida = await PartidaCocina.crear({
      nombre,
      responsable: responsable || '',
      descripcion: descripcion || ''
    });
    
    res.status(201).json(partida);
  } catch (error) {
    console.error('Error al crear partida:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener partida por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const partida = await PartidaCocina.obtenerPorId(id);
    
    if (!partida) {
      return res.status(404).json({ error: 'Partida no encontrada' });
    }
    
    res.json(partida);
  } catch (error) {
    console.error('Error al obtener partida:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener partidas por responsable
exports.obtenerPorResponsable = async (req, res) => {
  try {
    const { responsable } = req.params;
    const partidas = await PartidaCocina.obtenerPorResponsable(responsable);
    res.json(partidas);
  } catch (error) {
    console.error('Error al obtener partidas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar partida
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizacion = await PartidaCocina.actualizar(id, req.body);
    res.json(actualizacion);
  } catch (error) {
    console.error('Error al actualizar partida:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar partida
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await PartidaCocina.eliminar(id);
    res.json(resultado);
  } catch (error) {
    console.error('Error al eliminar partida:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener conteo
exports.contar = async (req, res) => {
  try {
    const total = await PartidaCocina.contar();
    res.json({ total });
  } catch (error) {
    console.error('Error al contar partidas:', error);
    res.status(500).json({ error: error.message });
  }
};
