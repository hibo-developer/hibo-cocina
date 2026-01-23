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
    const { 
      plato_id, 
      ingrediente_id, 
      planning,
      cantidad, 
      unidad, 
      peso_unidad,
      kilo_bruto,
      perdida_elaboracion,
      peso_neto_real,
      coste,
      partidas,
      activa,
      mise_en_place,
      punto_critico,
      punto_corrector
    } = req.body;
    
    if (!plato_id || !ingrediente_id || !cantidad) {
      return res.status(400).json({ error: 'Faltan datos requeridos (plato_id, ingrediente_id, cantidad)' });
    }
    
    const escandallo = await Escandallo.crear({
      plato_id,
      ingrediente_id,
      planning: planning || null,
      cantidad,
      unidad: unidad || 'Kg',
      peso_unidad: peso_unidad || null,
      kilo_bruto: kilo_bruto || null,
      perdida_elaboracion: perdida_elaboracion || null,
      peso_neto_real: peso_neto_real || null,
      coste: coste || 0,
      partidas: partidas || null,
      activa: activa !== undefined ? activa : true,
      mise_en_place: mise_en_place || null,
      punto_critico: punto_critico || null,
      punto_corrector: punto_corrector || null
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
