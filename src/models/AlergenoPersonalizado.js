const db = require('../db/database');

class AlergenoPersonalizado {
  // Obtener todos los alérgenos personalizados
  static async obtenerTodos() {
    const sql = `SELECT * FROM alergenos_personalizados WHERE activo = 1 ORDER BY nombre`;
    return new Promise((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Obtener un alérgeno por ID
  static async obtenerPorId(id) {
    const sql = `SELECT * FROM alergenos_personalizados WHERE id = ?`;
    return new Promise((resolve, reject) => {
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Crear nuevo alérgeno personalizado
  static async crear(alergeno) {
    const { nombre, descripcion, icono, palabras_clave } = alergeno;
    const sql = `INSERT INTO alergenos_personalizados (nombre, descripcion, icono, palabras_clave) VALUES (?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      db.run(sql, [nombre, descripcion, icono, palabras_clave], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...alergeno });
      });
    });
  }

  // Actualizar alérgeno existente
  static async actualizar(id, alergeno) {
    const { nombre, descripcion, icono, activo, palabras_clave } = alergeno;
    const sql = `UPDATE alergenos_personalizados SET nombre = ?, descripcion = ?, icono = ?, palabras_clave = ?, activo = ? WHERE id = ?`;
    return new Promise((resolve, reject) => {
      db.run(sql, [nombre, descripcion, icono, palabras_clave, activo !== undefined ? activo : 1, id], function(err) {
        if (err) reject(err);
        else resolve({ id, ...alergeno });
      });
    });
  }

  // Eliminar (desactivar) alérgeno
  static async eliminar(id) {
    const sql = `UPDATE alergenos_personalizados SET activo = 0 WHERE id = ?`;
    return new Promise((resolve, reject) => {
      db.run(sql, [id], function(err) {
        if (err) reject(err);
        else resolve({ id, eliminado: true });
      });
    });
  }

  // Obtener alérgenos personalizados de un ingrediente
  static async obtenerDeIngrediente(ingrediente_id) {
    const sql = `
      SELECT ap.* 
      FROM alergenos_personalizados ap
      INNER JOIN ingredientes_alergenos_personalizados iap ON ap.id = iap.alergeno_id
      WHERE iap.ingrediente_id = ? AND ap.activo = 1
      ORDER BY ap.nombre
    `;
    return new Promise((resolve, reject) => {
      db.all(sql, [ingrediente_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Obtener alérgenos personalizados de un plato
  static async obtenerDePlato(plato_id) {
    const sql = `
      SELECT ap.* 
      FROM alergenos_personalizados ap
      INNER JOIN platos_alergenos_personalizados pap ON ap.id = pap.alergeno_id
      WHERE pap.plato_id = ? AND ap.activo = 1
      ORDER BY ap.nombre
    `;
    return new Promise((resolve, reject) => {
      db.all(sql, [plato_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Asignar alérgeno a ingrediente
  static async asignarAIngrediente(ingrediente_id, alergeno_id) {
    const sql = `INSERT OR IGNORE INTO ingredientes_alergenos_personalizados (ingrediente_id, alergeno_id) VALUES (?, ?)`;
    return new Promise((resolve, reject) => {
      db.run(sql, [ingrediente_id, alergeno_id], function(err) {
        if (err) reject(err);
        else resolve({ ingrediente_id, alergeno_id });
      });
    });
  }

  // Desasignar alérgeno de ingrediente
  static async desasignarDeIngrediente(ingrediente_id, alergeno_id) {
    const sql = `DELETE FROM ingredientes_alergenos_personalizados WHERE ingrediente_id = ? AND alergeno_id = ?`;
    return new Promise((resolve, reject) => {
      db.run(sql, [ingrediente_id, alergeno_id], function(err) {
        if (err) reject(err);
        else resolve({ ingrediente_id, alergeno_id, eliminado: true });
      });
    });
  }

  // Asignar alérgeno a plato
  static async asignarAPlato(plato_id, alergeno_id) {
    const sql = `INSERT OR IGNORE INTO platos_alergenos_personalizados (plato_id, alergeno_id) VALUES (?, ?)`;
    return new Promise((resolve, reject) => {
      db.run(sql, [plato_id, alergeno_id], function(err) {
        if (err) reject(err);
        else resolve({ plato_id, alergeno_id });
      });
    });
  }

  // Desasignar alérgeno de plato
  static async desasignarDePlato(plato_id, alergeno_id) {
    const sql = `DELETE FROM platos_alergenos_personalizados WHERE plato_id = ? AND alergeno_id = ?`;
    return new Promise((resolve, reject) => {
      db.run(sql, [plato_id, alergeno_id], function(err) {
        if (err) reject(err);
        else resolve({ plato_id, alergeno_id, eliminado: true });
      });
    });
  }

  // Actualizar alérgenos de un ingrediente (reemplaza todos)
  static async actualizarDeIngrediente(ingrediente_id, alergenos_ids) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Primero eliminar todos los alérgenos personalizados del ingrediente
        db.run(`DELETE FROM ingredientes_alergenos_personalizados WHERE ingrediente_id = ?`, [ingrediente_id], (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Si no hay alérgenos que asignar, terminar aquí
          if (!alergenos_ids || alergenos_ids.length === 0) {
            resolve([]);
            return;
          }

          // Insertar los nuevos alérgenos
          const stmt = db.prepare(`INSERT INTO ingredientes_alergenos_personalizados (ingrediente_id, alergeno_id) VALUES (?, ?)`);
          
          alergenos_ids.forEach(alergeno_id => {
            stmt.run(ingrediente_id, alergeno_id);
          });

          stmt.finalize((err) => {
            if (err) reject(err);
            else resolve(alergenos_ids);
          });
        });
      });
    });
  }

  // Actualizar alérgenos de un plato (reemplaza todos)
  static async actualizarDePlato(plato_id, alergenos_ids) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Primero eliminar todos los alérgenos personalizados del plato
        db.run(`DELETE FROM platos_alergenos_personalizados WHERE plato_id = ?`, [plato_id], (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Si no hay alérgenos que asignar, terminar aquí
          if (!alergenos_ids || alergenos_ids.length === 0) {
            resolve([]);
            return;
          }

          // Insertar los nuevos alérgenos
          const stmt = db.prepare(`INSERT INTO platos_alergenos_personalizados (plato_id, alergeno_id) VALUES (?, ?)`);
          
          alergenos_ids.forEach(alergeno_id => {
            stmt.run(plato_id, alergeno_id);
          });

          stmt.finalize((err) => {
            if (err) reject(err);
            else resolve(alergenos_ids);
          });
        });
      });
    });
  }
}

module.exports = AlergenoPersonalizado;
