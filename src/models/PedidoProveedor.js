const db = require('../db/database');

class PedidoProveedor {
  // Obtener todos
  static async obtenerTodos() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM pedidos_proveedor ORDER BY fecha_pedido DESC`;
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener por ID
  static async obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM pedidos_proveedor WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Obtener por proveedor
  static async obtenerPorProveedor(proveedor_id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM pedidos_proveedor WHERE proveedor_id = ? ORDER BY fecha_pedido DESC';
      db.all(sql, [proveedor_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Crear
  static async crear(datos) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO pedidos_proveedor 
        (numero_pedido, proveedor_id, fecha_pedido, estado, total, grupo_conservacion, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      
      db.run(sql, [
        datos.numero_pedido,
        datos.proveedor_id,
        datos.fecha_pedido || new Date().toISOString(),
        datos.estado || 'pendiente',
        datos.total || 0,
        datos.grupo_conservacion || ''
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...datos });
      });
    });
  }

  // Actualizar
  static async actualizar(id, datos) {
    return new Promise((resolve, reject) => {
      const campos = [];
      const valores = [];
      
      Object.keys(datos).forEach(key => {
        if (key !== 'id') {
          campos.push(`${key} = ?`);
          valores.push(datos[key]);
        }
      });
      
      valores.push(id);
      
      const sql = `UPDATE pedidos_proveedor SET ${campos.join(', ')}, updated_at = datetime('now') WHERE id = ?`;
      db.run(sql, valores, (err) => {
        if (err) reject(err);
        else resolve({ id, ...datos });
      });
    });
  }

  // Eliminar
  static async eliminar(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM pedidos_proveedor WHERE id = ?';
      db.run(sql, [id], (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }

  // Contar
  static async contar() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as total FROM pedidos_proveedor';
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }
}

module.exports = PedidoProveedor;
