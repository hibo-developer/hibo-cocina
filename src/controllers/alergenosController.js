const db = require('../config/database');

const alergenosController = {
  // Listar todos los alérgenos personalizados
  listar: (req, res) => {
    const query = `
      SELECT 
        id, nombre, descripcion, icono, activo, palabras_clave, created_at
      FROM alergenos_personalizados
      ORDER BY nombre
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error al listar alérgenos:', err);
        return res.status(500).json({ error: 'Error al listar alérgenos' });
      }
      res.json(rows);
    });
  },

  // Obtener un alérgeno por ID
  obtenerPorId: (req, res) => {
    const { id } = req.params;
    
    const query = `
      SELECT 
        id, nombre, descripcion, icono, activo, palabras_clave, created_at
      FROM alergenos_personalizados
      WHERE id = ?
    `;
    
    db.get(query, [id], (err, row) => {
      if (err) {
        console.error('Error al obtener alérgeno:', err);
        return res.status(500).json({ error: 'Error al obtener alérgeno' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Alérgeno no encontrado' });
      }
      res.json(row);
    });
  },

  // Crear nuevo alérgeno personalizado
  crear: (req, res) => {
    const { nombre, descripcion, icono, palabras_clave } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const query = `
      INSERT INTO alergenos_personalizados 
        (nombre, descripcion, icono, palabras_clave, activo)
      VALUES (?, ?, ?, ?, 1)
    `;
    
    db.run(query, [nombre, descripcion || null, icono || null, palabras_clave || null], function(err) {
      if (err) {
        console.error('Error al crear alérgeno:', err);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Ya existe un alérgeno con ese nombre' });
        }
        return res.status(500).json({ error: 'Error al crear alérgeno' });
      }
      
      res.status(201).json({ 
        id: this.lastID,
        mensaje: 'Alérgeno creado exitosamente'
      });
    });
  },

  // Actualizar alérgeno
  actualizar: (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, icono, palabras_clave, activo } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const query = `
      UPDATE alergenos_personalizados 
      SET nombre = ?,
          descripcion = ?,
          icono = ?,
          palabras_clave = ?,
          activo = ?
      WHERE id = ?
    `;
    
    db.run(query, [
      nombre,
      descripcion || null,
      icono || null,
      palabras_clave || null,
      activo !== undefined ? activo : 1,
      id
    ], function(err) {
      if (err) {
        console.error('Error al actualizar alérgeno:', err);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Ya existe un alérgeno con ese nombre' });
        }
        return res.status(500).json({ error: 'Error al actualizar alérgeno' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Alérgeno no encontrado' });
      }
      
      res.json({ mensaje: 'Alérgeno actualizado exitosamente' });
    });
  },

  // Eliminar alérgeno
  eliminar: (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM alergenos_personalizados WHERE id = ?';
    
    db.run(query, [id], function(err) {
      if (err) {
        console.error('Error al eliminar alérgeno:', err);
        return res.status(500).json({ error: 'Error al eliminar alérgeno' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Alérgeno no encontrado' });
      }
      
      res.json({ mensaje: 'Alérgeno eliminado exitosamente' });
    });
  },

  // Listar alérgenos oficiales UE
  listarOficiales: (req, res) => {
    const query = `
      SELECT 
        id, codigo, nombre, descripcion, icono, palabras_clave, orden, activo, created_at
      FROM alergenos_oficiales
      ORDER BY orden, nombre
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error al listar alérgenos oficiales:', err);
        return res.status(500).json({ error: 'Error al listar alérgenos oficiales' });
      }
      res.json(rows);
    });
  },

  // Actualizar palabras clave de alérgeno oficial
  actualizarOficial: (req, res) => {
    const { id } = req.params;
    const { palabras_clave, activo } = req.body;

    const query = `
      UPDATE alergenos_oficiales 
      SET palabras_clave = ?,
          activo = ?
      WHERE id = ?
    `;
    
    db.run(query, [
      palabras_clave || null,
      activo !== undefined ? activo : 1,
      id
    ], function(err) {
      if (err) {
        console.error('Error al actualizar alérgeno oficial:', err);
        return res.status(500).json({ error: 'Error al actualizar alérgeno oficial' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Alérgeno oficial no encontrado' });
      }
      
      res.json({ mensaje: 'Alérgeno oficial actualizado exitosamente' });
    });
  }
};

module.exports = alergenosController;
