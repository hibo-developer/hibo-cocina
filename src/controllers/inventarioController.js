const Inventario = require('../models/Inventario');

// Obtener todo el inventario actual
exports.obtenerActual = async (req, res) => {
  try {
    const inventario = await Inventario.obtenerActual();
    res.json(inventario);
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener inventario por artículo
exports.obtenerPorArticulo = async (req, res) => {
  try {
    const { articulo_id } = req.params;
    const inventario = await Inventario.obtenerPorArticulo(articulo_id);
    res.json(inventario);
  } catch (error) {
    console.error('Error al obtener inventario del artículo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener inventario por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const inventario = await Inventario.obtenerPorId(id);
    
    if (!inventario) {
      return res.status(404).json({ error: 'Registro de inventario no encontrado' });
    }
    
    res.json(inventario);
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ error: error.message });
  }
};

// Crear nuevo registro de inventario
exports.crear = async (req, res) => {
  try {
    const { ingrediente_id, articulo_id, cantidad, fecha_registro } = req.body;
    
    // Aceptar tanto ingrediente_id como articulo_id para compatibilidad
    const id = ingrediente_id || articulo_id;
    
    if (!id || cantidad === undefined) {
      return res.status(400).json({ error: 'Faltan datos requeridos (ingrediente_id y cantidad)' });
    }
    
    const inventario = await Inventario.crear({
      ingrediente_id: id,
      cantidad,
      fecha_registro: fecha_registro || new Date().toISOString().split('T')[0]
    });
    
    res.status(201).json(inventario);
  } catch (error) {
    console.error('Error al crear inventario:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener valor total del inventario
exports.obtenerValorTotal = async (req, res) => {
  try {
    const valor = await Inventario.obtenerValorTotal();
    res.json({ valor_total: valor });
  } catch (error) {
    console.error('Error al obtener valor total:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar inventario
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizacion = await Inventario.actualizar(id, req.body);
    res.json(actualizacion);
  } catch (error) {
    console.error('Error al actualizar inventario:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar registro de inventario
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await Inventario.eliminar(id);
    res.json(resultado);
  } catch (error) {
    console.error('Error al eliminar inventario:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener conteo
exports.contar = async (req, res) => {
  try {
    const total = await Inventario.contar();
    res.json({ total });
  } catch (error) {
    console.error('Error al contar registros:', error);
    res.status(500).json({ error: error.message });
  }
};
