const db = require('../db/database');

class Inventario {
  // Crear nuevo registro de inventario
  static async crear(datos) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO inventario 
        (ingrediente_id, cantidad, fecha_registro, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      db.run(sql, [
        datos.ingrediente_id || datos.articulo_id,
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
          i.ingrediente_id,
          ing.codigo,
          ing.nombre,
          ing.descripcion,
          ing.familia,
          ing.grupo_conservacion,
          ing.unidad_economato as unidad,
          ing.coste_kilo,
          0 as stock_minimo
        FROM inventario i
        LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
        WHERE i.fecha_registro = (SELECT MAX(fecha_registro) FROM inventario)
        ORDER BY ing.nombre
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener inventario por ingrediente
  static async obtenerPorIngrediente(ingrediente_id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          i.id,
          i.cantidad,
          i.fecha_registro,
          ing.nombre
        FROM inventario i
        LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
        WHERE i.ingrediente_id = ?
        ORDER BY i.fecha_registro DESC
      `;
      
      db.all(sql, [ingrediente_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
  
  // Alias para compatibilidad
  static async obtenerPorArticulo(articulo_id) {
    return this.obtenerPorIngrediente(articulo_id);
  }

  // Obtener inventario por ID
  static async obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          i.id,
          i.cantidad,
          i.unidad,
          i.lote,
          i.fecha AS fecha,
          i.fecha_caducidad,
          i.ubicacion,
          i.ingrediente_id,
          ing.codigo as ingrediente_codigo,
          ing.nombre as ingrediente_nombre,
          ing.familia as ingrediente_familia
        FROM inventario i
        LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
        WHERE i.id = ?
      `;
      
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
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
          i.ingrediente_id,
          ing.codigo,
          ing.nombre,
          ing.unidad_economato as unidad,
          ing.coste_kilo
        FROM inventario i
        LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
        WHERE i.fecha_registro = ?
        ORDER BY ing.nombre
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
          SUM(i.cantidad * ing.coste_kilo) as valor_total,
          COUNT(*) as total_ingredientes
        FROM inventario i
        LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
        WHERE i.fecha_registro = (SELECT MAX(fecha_registro) FROM inventario)
      `;
      
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve({
          valor_total: row?.valor_total || 0,
          total_ingredientes: row?.total_ingredientes || 0
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
