const db = require('../db/database');

class Inventario {
  // Crear nuevo registro de inventario
  static async crear(datos) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO inventario 
        (articulo_id, cantidad, fecha_registro, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      db.run(sql, [
        datos.articulo_id,
        datos.cantidad || 0,
        datos.fecha_registro || new Date().toISOString().split('T')[0]
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...datos });
      });
    });
  }

  // Obtener inventario actual
  static async obtenerActual() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          i.id,
          i.cantidad,
          i.fecha_registro,
          a.codigo,
          a.nombre,
          a.unidad,
          a.coste_kilo
        FROM inventario i
        LEFT JOIN articulos a ON i.articulo_id = a.id
        WHERE i.fecha_registro = (SELECT MAX(fecha_registro) FROM inventario)
        ORDER BY a.nombre
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener inventario por artículo
  static async obtenerPorArticulo(articulo_id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          i.id,
          i.cantidad,
          i.fecha_registro,
          a.nombre
        FROM inventario i
        LEFT JOIN articulos a ON i.articulo_id = a.id
        WHERE i.articulo_id = ?
        ORDER BY i.fecha_registro DESC
      `;
      
      db.all(sql, [articulo_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener inventario por fecha
  static async obtenerPorFecha(fecha) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          i.id,
          i.cantidad,
          i.fecha_registro,
          a.codigo,
          a.nombre,
          a.unidad,
          a.coste_kilo
        FROM inventario i
        LEFT JOIN articulos a ON i.articulo_id = a.id
        WHERE i.fecha_registro = ?
        ORDER BY a.nombre
      `;
      
      db.all(sql, [fecha], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Actualizar cantidad
  static async actualizar(id, datos) {
    return new Promise((resolve, reject) => {
      const campos = [];
      const valores = [];
      
      Object.keys(datos).forEach(key => {
        campos.push(`${key} = ?`);
        valores.push(datos[key]);
      });
      
      valores.push(id);
      
      const sql = `
        UPDATE inventario 
        SET ${campos.join(', ')}, updated_at = datetime('now')
        WHERE id = ?
      `;
      
      db.run(sql, valores, (err) => {
        if (err) reject(err);
        else resolve({ id, ...datos });
      });
    });
  }

  // Eliminar registro de inventario
  static async eliminar(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM inventario WHERE id = ?';
      db.run(sql, [id], (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }

  // Obtener valor total de inventario
  static async obtenerValorTotal() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          SUM(i.cantidad * a.coste_kilo) as valor_total,
          COUNT(*) as total_articulos
        FROM inventario i
        LEFT JOIN articulos a ON i.articulo_id = a.id
        WHERE i.fecha_registro = (SELECT MAX(fecha_registro) FROM inventario)
      `;
      
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve({
          valor_total: row?.valor_total || 0,
          total_articulos: row?.total_articulos || 0
        });
      });
    });
  }

  // Contar registros
  static async contar() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as total FROM inventario';
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }
}

module.exports = Inventario;
