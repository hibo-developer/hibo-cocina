const db = require('../db/database');

class Pedido {
  static crear(datos) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO pedidos (numero, cliente_codigo, fecha_pedido, fecha_entrega, estado, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.run(sql, [
        datos.numero,
        datos.cliente_codigo || '',
        datos.fecha_pedido || new Date().toISOString(),
        datos.fecha_entrega || '',
        datos.estado || 'pendiente',
        datos.total || 0
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...datos });
      });
    });
  }

  static obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM pedidos WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static obtenerTodos(filtro = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM pedidos WHERE 1=1';
      const params = [];

      if (filtro.estado) {
        sql += ' AND estado = ?';
        params.push(filtro.estado);
      }

      if (filtro.cliente) {
        sql += ' AND cliente_codigo LIKE ?';
        params.push(`%${filtro.cliente}%`);
      }

      sql += ' ORDER BY fecha_pedido DESC';

      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  static obtenerConDetalles(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          p.*,
          COUNT(lp.id) as total_lineas,
          SUM(lp.subtotal) as total_calculado
        FROM pedidos p
        LEFT JOIN lineas_pedido lp ON p.id = lp.pedido_id
        WHERE p.id = ?
        GROUP BY p.id
      `;

      db.get(sql, [id], async (err, pedido) => {
        if (err) {
          reject(err);
          return;
        }

        if (!pedido) {
          resolve(null);
          return;
        }

        const sqlLineas = `
          SELECT lp.*, pl.nombre, pl.codigo
          FROM lineas_pedido lp
          JOIN platos pl ON lp.plato_id = pl.id
          WHERE lp.pedido_id = ?
        `;

        db.all(sqlLineas, [id], (errLineas, lineas) => {
          if (errLineas) {
            reject(errLineas);
            return;
          }

          resolve({
            ...pedido,
            lineas: lineas || []
          });
        });
      });
    });
  }

  static actualizar(id, datos) {
    return new Promise((resolve, reject) => {
      const campos = [];
      const valores = [];

      Object.keys(datos).forEach(key => {
        campos.push(`${key} = ?`);
        valores.push(datos[key]);
      });

      valores.push(id);

      const sql = `UPDATE pedidos SET ${campos.join(', ')} WHERE id = ?`;

      db.run(sql, valores, function(err) {
        if (err) reject(err);
        else resolve({ id, ...datos });
      });
    });
  }

  static eliminar(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM pedidos WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ mensaje: 'Pedido eliminado' });
      });
    });
  }

  static estadisticas() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          estado,
          COUNT(*) as cantidad,
          ROUND(AVG(total), 2) as promedio_total,
          SUM(total) as total_acumulado
        FROM pedidos
        GROUP BY estado
      `;

      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

module.exports = Pedido;
