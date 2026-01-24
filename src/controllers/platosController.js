const Plato = require('../models/Plato');

exports.obtenerTodos = async (req, res) => {
  try {
    const filtros = {
      tipo: req.query.tipo,
      grupo_menu: req.query.grupo_menu,
      stock_activo: req.query.stock_activo
    };

    const platos = await Plato.obtenerTodos(filtros);
    res.json({
      success: true,
      data: platos,
      total: platos.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.obtenerPorCodigo = async (req, res) => {
  try {
    const plato = await Plato.obtenerPorCodigo(req.params.codigo);
    if (!plato) {
      return res.status(404).json({ success: false, error: 'Plato no encontrado' });
    }
    res.json({ success: true, data: plato });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const plato = await Plato.obtenerPorId(req.params.id);
    if (!plato) {
      return res.status(404).json({ success: false, error: 'Plato no encontrado' });
    }
    res.json({ success: true, data: plato });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const plato = await Plato.crear(req.body);
    res.status(201).json({ success: true, data: plato });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const plato = await Plato.actualizar(req.params.id, req.body);
    res.json({ success: true, data: plato });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const resultado = await Plato.eliminar(req.params.id);
    res.json({ success: true, data: resultado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.estadisticas = async (req, res) => {
  try {
    const stats = await Plato.contarPorGrupo();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
