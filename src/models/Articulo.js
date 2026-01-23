const db = require('../db/database');

class Articulo {
  // Crear nuevo artículo
  static async crear(datos) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO articulos 
        (codigo, nombre, unidad, coste_kilo, tipo, grupo_conservacion, activo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      db.run(sql, [
        datos.codigo,
        datos.nombre,
        datos.unidad || 'Kg',
        datos.coste_kilo || 0,
        datos.tipo || 'Ingrediente',
        datos.grupo_conservacion || 'General',
        datos.activo !== false ? 1 : 0
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...datos });
      });
    });
  }

  // Obtener todos los artículos
  static async obtenerTodos() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM articulos WHERE activo = 1 ORDER BY nombre';
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener por código
  static async obtenerPorCodigo(codigo) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM articulos WHERE codigo = ?';
      db.get(sql, [codigo], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Obtener por ID
  static async obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM articulos WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Actualizar artículo
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
        UPDATE articulos 
        SET ${campos.join(', ')}, updated_at = datetime('now')
        WHERE id = ?
      `;
      
      db.run(sql, valores, (err) => {
        if (err) reject(err);
        else resolve({ id, ...datos });
      });
    });
  }

  // Eliminar artículo (soft delete)
  static async eliminar(id) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE articulos SET activo = 0, updated_at = datetime(\'now\') WHERE id = ?';
      db.run(sql, [id], (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }

  // Buscar por grupo de conservación
  static async obtenerPorGrupoConservacion(grupo) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM articulos WHERE grupo_conservacion = ? AND activo = 1';
      db.all(sql, [grupo], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Contar artículos
  static async contar() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as total FROM articulos WHERE activo = 1';
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }
}

module.exports = Articulo;
