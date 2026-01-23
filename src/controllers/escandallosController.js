const Escandallo = require('../models/Escandallo');

// Obtener todos los escandallos
exports.obtenerTodos = async (req, res) => {
  try {
    const escandallos = await Escandallo.obtenerTodos();
    res.json(escandallos);
  } catch (error) {
    console.error('Error al obtener escandallos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener escandallos por plato
exports.obtenerPorPlato = async (req, res) => {
  try {
    const { codigo_plato } = req.params;
    const escandallos = await Escandallo.obtenerPorPlato(codigo_plato);
    res.json(escandallos);
  } catch (error) {
    console.error('Error al obtener escandallos del plato:', error);
    res.status(500).json({ error: error.message });
  }
};

// Crear nuevo escandallo
exports.crear = async (req, res) => {
  try {
    const { codigo_plato, articulo_id, cantidad, unidad, coste_total } = req.body;
    
    if (!codigo_plato || !articulo_id || !cantidad) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    
    const escandallo = await Escandallo.crear({
      codigo_plato,
      articulo_id,
      cantidad,
      unidad: unidad || 'kg',
      coste_total: coste_total || 0
    });
    
    res.status(201).json(escandallo);
  } catch (error) {
    console.error('Error al crear escandallo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Calcular costo total de un plato
exports.calcularCostePlato = async (req, res) => {
  try {
    const { codigo_plato } = req.params;
    const costo = await Escandallo.calcularCostePlato(codigo_plato);
    res.json({ codigo_plato, costo_total: costo });
  } catch (error) {
    console.error('Error al calcular costo del plato:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar escandallo
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizacion = await Escandallo.actualizar(id, req.body);
    res.json(actualizacion);
  } catch (error) {
    console.error('Error al actualizar escandallo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar escandallo
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await Escandallo.eliminar(id);
    res.json(resultado);
  } catch (error) {
    console.error('Error al eliminar escandallo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener conteo
exports.contar = async (req, res) => {
  try {
    const total = await Escandallo.contar();
    res.json({ total });
  } catch (error) {
    console.error('Error al contar escandallos:', error);
    res.status(500).json({ error: error.message });
  }
};
