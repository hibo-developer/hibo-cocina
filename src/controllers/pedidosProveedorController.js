const PedidoProveedor = require('../models/PedidoProveedor');

exports.obtenerTodos = async (req, res) => {
  try {
    const pedidos = await PedidoProveedor.obtenerTodos();
    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await PedidoProveedor.obtenerPorId(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(pedido);
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerPorProveedor = async (req, res) => {
  try {
    const { proveedor_id } = req.params;
    const pedidos = await PedidoProveedor.obtenerPorProveedor(proveedor_id);
    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { numero_pedido, proveedor_id, fecha_pedido, estado, total, grupo_conservacion } = req.body;
    
    if (!numero_pedido || !proveedor_id) {
      return res.status(400).json({ error: 'Número de pedido y proveedor son requeridos' });
    }
    
    const pedido = await PedidoProveedor.crear({
      numero_pedido,
      proveedor_id,
      fecha_pedido,
      estado,
      total,
      grupo_conservacion
    });
    
    res.status(201).json(pedido);
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await PedidoProveedor.actualizar(id, req.body);
    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    await PedidoProveedor.eliminar(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.contar = async (req, res) => {
  try {
    const total = await PedidoProveedor.contar();
    res.json({ total });
  } catch (error) {
    console.error('Error al contar pedidos:', error);
    res.status(500).json({ error: error.message });
  }
};
