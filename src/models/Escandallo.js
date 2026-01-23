const db = require('../db/database');
const Plato = require('./Plato');

class Escandallo {
  // Crear nuevo escandallo (compatible con estructura platos/ingredientes)
  static async crear(datos) {
    return new Promise(async (resolve, reject) => {
      try {
        // Intentar obtener el plato por código
        let plato_id = datos.plato_id;
        if (!plato_id && datos.codigo_plato) {
          const plato = await Plato.obtenerPorCodigo(datos.codigo_plato);
          if (plato) plato_id = plato.id;
        }
        
        // El ingrediente_id puede ser de ingredientes o articulos
        const ingrediente_id = datos.ingrediente_id || datos.articulo_id || 0;
        
        const sql = `
          INSERT INTO escandallos 
          (plato_id, ingrediente_id, cantidad, unidad, coste)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        db.run(sql, [
          plato_id || 0,
          ingrediente_id,
          datos.cantidad || 0,
          datos.unidad || 'Kg',
          datos.coste || datos.coste_total || 0
        ], function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...datos });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Obtener escandallos de un plato
  static async obtenerPorPlato(codigo_plato) {
    return new Promise(async (resolve, reject) => {
      try {
        // Obtener el plato primero
        const plato = await Plato.obtenerPorCodigo(codigo_plato);
        if (!plato) return resolve([]);
        
        const sql = `
          SELECT 
            e.id,
            e.plato_id,
            e.ingrediente_id,
            e.cantidad,
            e.unidad,
            e.coste,
            i.nombre as ingrediente_nombre
          FROM escandallos e
          LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
          WHERE e.plato_id = ?
          ORDER BY i.nombre
        `;
        
        db.all(sql, [plato.id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Obtener todos los escandallos
  static async obtenerTodos() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          e.id,
          e.plato_id,
          e.ingrediente_id,
          e.cantidad,
          e.unidad,
          e.coste,
          p.nombre as plato_nombre,
          p.codigo as plato_codigo,
          i.nombre as ingrediente_nombre
        FROM escandallos e
        LEFT JOIN platos p ON e.plato_id = p.id
        LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
        ORDER BY p.codigo, i.nombre
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Actualizar escandallo
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
        UPDATE escandallos 
        SET ${campos.join(', ')}, updated_at = datetime('now')
        WHERE id = ?
      `;
      
      db.run(sql, valores, (err) => {
        if (err) reject(err);
        else resolve({ id, ...datos });
      });
    });
  }

  // Eliminar escandallo
  static async eliminar(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM escandallos WHERE id = ?';
      db.run(sql, [id], (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }

  // Obtener escandallo por ID
  static async obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT e.*, 
               p.codigo as plato_codigo,
               i.codigo as ingrediente_codigo
        FROM escandallos e
        LEFT JOIN platos p ON e.plato_id = p.id
        LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
        WHERE e.id = ?
      `;
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  // Calcular coste total de un plato
  static async calcularCostePlato(codigo_plato) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT SUM(coste_total) as coste_total
        FROM escandallos
        WHERE codigo_plato = ?
      `;
      
      db.get(sql, [codigo_plato], (err, row) => {
        if (err) reject(err);
        else resolve(row?.coste_total || 0);
      });
    });
  }

  // Contar escandallos
  static async contar() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as total FROM escandallos';
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
  }
}

module.exports = Escandallo;
