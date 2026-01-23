const db = require('../db/database');

class Etiqueta {
  // Crear nueva etiqueta
  static async crear(datos) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO etiquetas 
        (codigo_plato, descripcion, informacion_nutricional, ingredientes, 
         alergenos, instrucciones_preparacion, modo_conservacion, 
         durabilidad_dias, lote_impresion, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      db.run(sql, [
        datos.codigo_plato,
        datos.descripcion || '',
        datos.informacion_nutricional || '',
        datos.ingredientes || '',
        datos.alergenos || '',
        datos.instrucciones_preparacion || '',
        datos.modo_conservacion || '',
        datos.durabilidad_dias || 0,
        datos.lote_impresion || ''
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...datos });
      });
    });
  }

  // Obtener todas las etiquetas
  static async obtenerTodas() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT e.*, p.nombre as nombre_plato
        FROM etiquetas e
        LEFT JOIN platos p ON e.codigo_plato = p.codigo
        ORDER BY e.codigo_plato
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
        SELECT e.*, p.nombre as nombre_plato
        FROM etiquetas e
        LEFT JOIN platos p ON e.codigo_plato = p.codigo
        WHERE e.codigo_plato = ?
      `;
      
      db.get(sql, [codigo_plato], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Obtener por ID
  static async obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT e.*, p.nombre as nombre_plato
        FROM etiquetas e
        LEFT JOIN platos p ON e.codigo_plato = p.codigo
        WHERE e.id = ?
      `;
      
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Obtener por lote de impresión
  static async obtenerPorLote(lote_impresion) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT e.*, p.nombre as nombre_plato
        FROM etiquetas e
        LEFT JOIN platos p ON e.codigo_plato = p.codigo
        WHERE e.lote_impresion = ?
        ORDER BY e.codigo_plato
      `;
      
      db.all(sql, [lote_impresion], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Obtener por alergenos
  static async obtenerPorAlergeno(alergeno) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT e.*, p.nombre as nombre_plato
        FROM etiquetas e
        LEFT JOIN platos p ON e.codigo_plato = p.codigo
        WHERE e.alergenos LIKE ?
        ORDER BY e.codigo_plato
      `;
      
      db.all(sql, [`%${alergeno}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Actualizar etiqueta
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
        UPDATE etiquetas 
        SET ${campos.join(', ')}, updated_at = datetime('now')
        WHERE id = ?
      `;
      
      db.run(sql, valores, (err) => {
        if (err) reject(err);
        else resolve({ id, ...datos });
      });
    });
  }

  // Eliminar etiqueta
  static async eliminar(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM etiquetas WHERE id = ?';
      db.run(sql, [id], (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }

  // Contar registros
  static async contar() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as total FROM etiquetas';
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }
}

module.exports = Etiqueta;
