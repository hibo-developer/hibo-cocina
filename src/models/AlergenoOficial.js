const db = require('../db/database');

class AlergenoOficial {
  // Obtener todos los alérgenos oficiales activos
  static async obtenerTodos() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM alergenos_oficiales WHERE activo = 1 ORDER BY orden';
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Obtener alérgeno por ID
  static async obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM alergenos_oficiales WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Obtener alérgeno por código
  static async obtenerPorCodigo(codigo) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM alergenos_oficiales WHERE codigo = ?';
      db.get(sql, [codigo], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Actualizar palabras clave de un alérgeno oficial
  static async actualizar(id, datos) {
    return new Promise((resolve, reject) => {
      const { palabras_clave, descripcion, icono, activo } = datos;
      const sql = `
        UPDATE alergenos_oficiales 
        SET palabras_clave = ?, descripcion = ?, icono = ?, activo = ?
        WHERE id = ?
      `;
      db.run(sql, [palabras_clave, descripcion, icono, activo !== undefined ? activo : 1, id], (err) => {
        if (err) reject(err);
        else resolve({ id, ...datos });
      });
    });
  }

  // Buscar por palabras clave (para detección automática)
  static async buscarPorPalabrasClave(texto) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM alergenos_oficiales 
        WHERE activo = 1 
        AND (palabras_clave LIKE ? OR nombre LIKE ?)
        ORDER BY orden
      `;
      const pattern = `%${texto.toLowerCase()}%`;
      db.all(sql, [pattern, pattern], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = AlergenoOficial;
