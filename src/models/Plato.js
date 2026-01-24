const db = require('../db/database');

class Plato {
  static crear(datos) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO platos (
          codigo, nombre, descripcion, unidad_escandallo, coste, coste_racion, tipo, 
          peso_raciones, plato_venta, grupo_menu, preparacion, 
          formato_cubetas, formato_gn100, formato_mono, formato_gn60, formato_gn30,
          stock_activo, stock_cantidad, plantilla_produccion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(sql, [
        datos.codigo,
        datos.nombre,
        datos.descripcion || '',
        datos.unidad_escandallo || 'Kg',
        datos.coste || 0,
        datos.coste_racion || 0,
        datos.tipo || 'Platos',
        datos.peso_raciones || 0.75,
        datos.plato_venta !== false ? 1 : 0,
        datos.grupo_menu || '',
        datos.preparacion || 'Caliente',
        datos.formato_cubetas || 0,
        datos.formato_gn100 || 0,
        datos.formato_mono || 0,
        datos.formato_gn60 || 0,
        datos.formato_gn30 || 0,
        datos.stock_activo ? 1 : 0,
        datos.stock_cantidad || 0,
        datos.plantilla_produccion || 'Preparacion'
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...datos });
      });
    });
  }

  static obtenerPorCodigo(codigo) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM platos WHERE codigo = ?', [codigo], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM platos WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static obtenerTodos(filtro = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM platos WHERE 1=1';
      const params = [];

      if (filtro.tipo) {
        sql += ' AND tipo = ?';
        params.push(filtro.tipo);
      }

      if (filtro.grupo_menu) {
        sql += ' AND grupo_menu = ?';
        params.push(filtro.grupo_menu);
      }

      if (filtro.stock_activo !== undefined) {
        sql += ' AND stock_activo = ?';
        params.push(filtro.stock_activo ? 1 : 0);
      }

      sql += ' ORDER BY nombre';

      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  static actualizar(id, datos) {
    return new Promise((resolve, reject) => {
      const campos = [];
      const valores = [];

      Object.keys(datos).forEach(key => {
        campos.push(`${key} = ?`);
        valores.push(datos[key]);
      });

      valores.push(id);

      const sql = `UPDATE platos SET ${campos.join(', ')} WHERE id = ?`;

      db.run(sql, valores, function(err) {
        if (err) reject(err);
        else resolve({ id, ...datos });
      });
    });
  }

  static eliminar(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM platos WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ mensaje: 'Plato eliminado' });
      });
    });
  }

  static contarPorGrupo() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT grupo_menu, COUNT(*) as cantidad, ROUND(AVG(coste), 2) as coste_promedio
        FROM platos
        WHERE grupo_menu != ''
        GROUP BY grupo_menu
        ORDER BY cantidad DESC
      `;

      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

module.exports = Plato;
