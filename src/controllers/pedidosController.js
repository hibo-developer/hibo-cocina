const Pedido = require('../models/Pedido');

exports.obtenerTodos = async (req, res) => {
  try {
    const filtros = {
      estado: req.query.estado,
      cliente: req.query.cliente
    };

    const pedidos = await Pedido.obtenerTodos(filtros);
    res.json({
      success: true,
      data: pedidos,
      total: pedidos.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const pedido = await Pedido.obtenerConDetalles(req.params.id);
    if (!pedido) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    }
    res.json({ success: true, data: pedido });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const pedido = await Pedido.crear(req.body);
    res.status(201).json({ success: true, data: pedido });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const pedido = await Pedido.actualizar(req.params.id, req.body);
    res.json({ success: true, data: pedido });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const resultado = await Pedido.eliminar(req.params.id);
    res.json({ success: true, data: resultado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.estadisticas = async (req, res) => {
  try {
    const stats = await Pedido.estadisticas();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
