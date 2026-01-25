/**
 * Módulo centralizado de conexión a base de datos
 * Patrón Singleton para una única conexión
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db = null;

/**
 * Inicializa la conexión a la base de datos
 * @returns {Promise<sqlite3.Database>}
 */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, '../../data/hibo-cocina.db');
    
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        reject(err);
      } else {
        console.log('✅ Conectado a la base de datos SQLite');
        resolve(db);
      }
    });
  });
}

/**
 * Obtiene la conexión actual a la BD
 * @returns {sqlite3.Database}
 */
function getDatabase() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama a initializeDatabase() primero.');
  }
  return db;
}

/**
 * Cierra la conexión a la base de datos
 * @returns {Promise<void>}
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase
};
