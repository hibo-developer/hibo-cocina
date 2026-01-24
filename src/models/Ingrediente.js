const db = require('../db/database');

class Ingrediente {
  // Obtener todos los ingredientes
  static async obtenerTodos() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM ingredientes WHERE tipo_entidad = 'ingrediente' ORDER BY nombre`;
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener TODOS los ingredientes incluyendo elaborados y preelaborados
  static async obtenerTodosCompleto() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM ingredientes ORDER BY tipo_entidad, nombre`;
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
        (codigo, nombre, descripcion, familia, grupo_conservacion, partidas_almacen,
         unidad_economato, unidad_escandallo, formato_envases, peso_neto_envase,
         unidad_por_formatos, coste_unidad, coste_kilo, proveedores, bulto,
         envases_por_bulto, coste_envase, activo, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      
      db.run(sql, [
        datos.codigo,
        datos.nombre,
        datos.descripcion || '',
        datos.familia || '',
        datos.grupo_conservacion || 'Neutro',
        datos.partidas_almacen || 'Economato',
        datos.unidad_economato || 'Kg',
        datos.unidad_escandallo || 'Kg',
        datos.formato_envases || 'Caja',
        datos.peso_neto_envase || 0,
        datos.unidad_por_formatos || 1,
        datos.coste_unidad || 0,
        datos.coste_kilo || 0,
        datos.proveedores || '',
        datos.bulto || 'Caja',
        datos.envases_por_bulto || 1,
        datos.coste_envase || 0,
        datos.activo !== false ? 1 : 0
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
      const sql = "SELECT COUNT(*) as total FROM ingredientes WHERE tipo_entidad = 'ingrediente'";
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }
}

module.exports = Ingrediente;
