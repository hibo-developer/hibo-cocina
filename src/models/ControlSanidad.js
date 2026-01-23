const db = require('../db/database');

class ControlSanidad {
  // Obtener todos los controles
  static async obtenerTodos() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM control_sanidad ORDER BY fecha_produccion DESC`;
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener por ID
  static async obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM control_sanidad WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Obtener por plato
  static async obtenerPorPlato(platos) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM control_sanidad WHERE platos = ? ORDER BY fecha_produccion DESC';
      db.all(sql, [platos], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Crear control
  static async crear(datos) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO control_sanidad 
        (platos, ingredientes, lote_produccion, fecha_produccion, punto_critico, 
         valor_medido, valor_esperado, punto_corrector, resultado, responsable, 
         observaciones, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      db.run(sql, [
        datos.platos,
        datos.ingredientes || '',
        datos.lote_produccion || '',
        datos.fecha_produccion || new Date().toISOString(),
        datos.punto_critico || '',
        datos.valor_medido || 0,
        datos.valor_esperado || '',
        datos.punto_corrector || '',
        datos.resultado || '',
        datos.responsable || '',
        datos.observaciones || ''
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
      
      const sql = `UPDATE control_sanidad SET ${campos.join(', ')}, updated_at = datetime('now') WHERE id = ?`;
      db.run(sql, valores, (err) => {
        if (err) reject(err);
        else resolve({ id, ...datos });
      });
    });
  }

  // Eliminar
  static async eliminar(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM control_sanidad WHERE id = ?';
      db.run(sql, [id], (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }

  // Contar
  static async contar() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as total FROM control_sanidad';
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }
}

module.exports = ControlSanidad;
