const db = require('../db/database');

class PartidaCocina {
  // Crear nueva partida
  static async crear(datos) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO partidas_cocina 
        (nombre, responsable, anticipado, trazabilidad_activa, descripcion, activo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      db.run(sql, [
        datos.nombre,
        datos.responsable || '',
        datos.anticipado ? 1 : 0,
        datos.trazabilidad_activa !== false ? 1 : 0,
        datos.descripcion || '',
        datos.activo !== false ? 1 : 0
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...datos });
      });
    });
  }

  // Obtener todas las partidas
  static async obtenerTodas() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM partidas_cocina 
        WHERE activo = 1
        ORDER BY nombre
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener por ID
  static async obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM partidas_cocina WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Obtener por responsable
  static async obtenerPorResponsable(responsable) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM partidas_cocina 
        WHERE responsable = ? AND activo = 1
      `;
      
      db.all(sql, [responsable], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Actualizar partida
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
        UPDATE partidas_cocina 
        SET ${campos.join(', ')}, updated_at = datetime('now')
        WHERE id = ?
      `;
      
      db.run(sql, valores, (err) => {
        if (err) reject(err);
        else resolve({ id, ...datos });
      });
    });
  }

  // Eliminar partida (soft delete)
  static async eliminar(id) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE partidas_cocina SET activo = 0, updated_at = datetime(\'now\') WHERE id = ?';
      db.run(sql, [id], (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }

  // Contar partidas
  static async contar() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as total FROM partidas_cocina WHERE activo = 1';
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }
}

module.exports = PartidaCocina;
