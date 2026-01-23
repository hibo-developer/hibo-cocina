const db = require('../db/database');

class Ingrediente {
  // Obtener todos los ingredientes
  static async obtenerTodos() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM ingredientes ORDER BY nombre`;
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener por ID
  static async obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM ingredientes WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Obtener por código
  static async obtenerPorCodigo(codigo) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM ingredientes WHERE codigo = ?';
      db.get(sql, [codigo], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Crear ingrediente
  static async crear(datos) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO ingredientes 
        (codigo, nombre, descripcion, grupo_conservacion, proveedor, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `;
      
      db.run(sql, [
        datos.codigo,
        datos.nombre,
        datos.descripcion || '',
        datos.grupo_conservacion || 'Temperatura Ambiente',
        datos.proveedor || ''
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
      
      const sql = `UPDATE ingredientes SET ${campos.join(', ')} WHERE id = ?`;
      db.run(sql, valores, (err) => {
        if (err) reject(err);
        else resolve({ id, ...datos });
      });
    });
  }

  // Eliminar
  static async eliminar(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM ingredientes WHERE id = ?';
      db.run(sql, [id], (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }

  // Contar
  static async contar() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as total FROM ingredientes';
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }
}

module.exports = Ingrediente;
