const db = require('../db/database');
const ControlStock = require('../services/ControlStock');

const controlStock = new ControlStock(db);

// Obtener alertas de stock bajo
exports.obtenerAlertas = async (req, res) => {
  try {
    const alertas = await controlStock.verificarAlertas();
    res.json(alertas);
  } catch (error) {
    console.error('Error al obtener alertas de stock:', error);
    res.status(500).json({ error: error.message });
  }
};

// Calcular necesidades semanales
exports.calcularNecesidadesSemanales = async (req, res) => {
  try {
    const { semana } = req.params;
    const necesidades = await controlStock.calcularNecesidadesSemanales(parseInt(semana));
    res.json(necesidades);
  } catch (error) {
    console.error('Error al calcular necesidades:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener valor del inventario
exports.obtenerValorInventario = async (req, res) => {
  try {
    const valor = await controlStock.calcularValorInventario();
    res.json(valor);
  } catch (error) {
    console.error('Error al calcular valor de inventario:', error);
    res.status(500).json({ error: error.message });
  }
};

// Registrar entrada de stock
exports.registrarEntrada = async (req, res) => {
  try {
    const { ingrediente_id, cantidad, motivo } = req.body;
    
    if (!ingrediente_id || !cantidad) {
      return res.status(400).json({ error: 'ingrediente_id y cantidad son requeridos' });
    }

    const resultado = await controlStock.actualizarStock(
      ingrediente_id,
      parseFloat(cantidad),
      motivo || 'Entrada manual'
    );

    res.json(resultado);
  } catch (error) {
    console.error('Error al registrar entrada:', error);
    res.status(500).json({ error: error.message });
  }
};

// Registrar salida de stock
exports.registrarSalida = async (req, res) => {
  try {
    const { ingrediente_id, cantidad, motivo } = req.body;
    
    if (!ingrediente_id || !cantidad) {
      return res.status(400).json({ error: 'ingrediente_id y cantidad son requeridos' });
    }

    const resultado = await controlStock.actualizarStock(
      ingrediente_id,
      -parseFloat(cantidad), // Negativo para salida
      motivo || 'Salida manual'
    );

    res.json(resultado);
  } catch (error) {
    console.error('Error al registrar salida:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener historial de movimientos
exports.obtenerMovimientos = async (req, res) => {
  try {
    const { ingrediente_id, fecha_inicio, fecha_fin, tipo } = req.query;
    
    let sql = 'SELECT * FROM movimientos_stock WHERE 1=1';
    const params = [];

    if (ingrediente_id) {
      sql += ' AND articulo_codigo = ?';
      params.push(ingrediente_id);
    }

    if (fecha_inicio) {
      sql += ' AND fecha >= ?';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      sql += ' AND fecha <= ?';
      params.push(fecha_fin);
    }

    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }

    sql += ' ORDER BY fecha DESC LIMIT 100';

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error al obtener movimientos:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
