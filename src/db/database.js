const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/hibo-cocina.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error abriendo base de datos:', err);
  } else {
    console.log('Base de datos conectada:', dbPath);
  }
});

// Permitir que las consultas ejecuten una después de otra
db.configure('busyTimeout', 30000);

module.exports = db;
