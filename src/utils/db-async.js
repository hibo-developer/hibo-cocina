/**
 * Wrapper promisificado para sqlite3
 * Proporciona métodos async: run(), get(), all()
 */
const { getDatabase } = require('./database');

/**
 * Ejecutar un statement (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL query
 * @param {Array} params - Parámetros
 * @returns {Promise<Object>} Objeto con { lastID, changes }
 */
async function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ 
        lastID: this.lastID,
        changes: this.changes 
      });
    });
  });
}

/**
 * Obtener una fila
 * @param {string} sql - SQL query
 * @param {Array} params - Parámetros
 * @returns {Promise<Object>} Primera fila encontrada
 */
async function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Obtener todas las filas
 * @param {string} sql - SQL query
 * @param {Array} params - Parámetros
 * @returns {Promise<Array>} Todas las filas encontradas
 */
async function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

module.exports = {
  run,
  get,
  all
};
