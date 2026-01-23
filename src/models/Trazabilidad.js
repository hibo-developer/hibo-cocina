const db = require('../db/database');

class Trazabilidad {
  // Crear nuevo registro de trazabilidad
  static async crear(datos) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO trazabilidad 
        (codigo_plato, lote_produccion, fecha_produccion, partida_cocina, 
         cantidad_producida, responsable, observaciones, estado, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      db.run(sql, [
        datos.codigo_plato,
        datos.lote_produccion || '',
        datos.fecha_produccion || new Date().toISOString(),
        datos.partida_cocina || '',
        datos.cantidad_producida || 0,
        datos.responsable || '',
        datos.observaciones || '',
        datos.estado || 'activo'
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...datos });
      });
    });
  }

  // Obtener todas las trazabilidades
  static async obtenerTodas() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, p.nombre as nombre_plato
        FROM trazabilidad t
        LEFT JOIN platos p ON t.codigo_plato = p.codigo
        ORDER BY t.fecha_produccion DESC
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener por código de plato
  static async obtenerPorPlato(codigo_plato) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, p.nombre as nombre_plato
        FROM trazabilidad t
        LEFT JOIN platos p ON t.codigo_plato = p.codigo
        WHERE t.codigo_plato = ?
        ORDER BY t.fecha_produccion DESC
      `;
      
      db.all(sql, [codigo_plato], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener por lote
  static async obtenerPorLote(lote_produccion) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, p.nombre as nombre_plato
        FROM trazabilidad t
        LEFT JOIN platos p ON t.codigo_plato = p.codigo
        WHERE t.lote_produccion = ?
      `;
      
      db.all(sql, [lote_produccion], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener por partida de cocina
  static async obtenerPorPartida(partida_cocina) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, p.nombre as nombre_plato
        FROM trazabilidad t
        LEFT JOIN platos p ON t.codigo_plato = p.codigo
        WHERE t.partida_cocina = ?
        ORDER BY t.fecha_produccion DESC
      `;
      
      db.all(sql, [partida_cocina], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener por ID
  static async obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, p.nombre as nombre_plato
        FROM trazabilidad t
        LEFT JOIN platos p ON t.codigo_plato = p.codigo
        WHERE t.id = ?
      `;
      
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Actualizar trazabilidad
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
        UPDATE trazabilidad 
        SET ${campos.join(', ')}, updated_at = datetime('now')
        WHERE id = ?
      `;
      
      db.run(sql, valores, (err) => {
        if (err) reject(err);
        else resolve({ id, ...datos });
      });
    });
  }

  // Eliminar trazabilidad
  static async eliminar(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM trazabilidad WHERE id = ?';
      db.run(sql, [id], (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }

  // Contar registros
  static async contar() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as total FROM trazabilidad';
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }

  // Obtener trazabilidad por fecha
  static async obtenerPorFecha(fecha) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, p.nombre as nombre_plato
        FROM trazabilidad t
        LEFT JOIN platos p ON t.codigo_plato = p.codigo
        WHERE DATE(t.fecha_produccion) = ?
        ORDER BY t.fecha_produccion DESC
      `;
      
      db.all(sql, [fecha], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener por responsable
  static async obtenerPorResponsable(responsable) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, p.nombre as nombre_plato
        FROM trazabilidad t
        LEFT JOIN platos p ON t.codigo_plato = p.codigo
        WHERE t.responsable = ?
        ORDER BY t.fecha_produccion DESC
      `;
      
      db.all(sql, [responsable], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

module.exports = Trazabilidad;
