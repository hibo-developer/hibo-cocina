const AlergenoPersonalizado = require('../models/AlergenoPersonalizado');

class AlergenosPersonalizadosController {
  // GET /api/alergenos-personalizados - Listar todos
  static async listar(req, res) {
    try {
      const alergenos = await AlergenoPersonalizado.obtenerTodos();
      res.json(alergenos);
    } catch (error) {
      console.error('Error al listar alérgenos personalizados:', error);
      res.status(500).json({ error: 'Error al obtener alérgenos personalizados' });
    }
  }

  // GET /api/alergenos-personalizados/:id - Obtener uno
  static async obtener(req, res) {
    try {
      const alergeno = await AlergenoPersonalizado.obtenerPorId(req.params.id);
      if (!alergeno) {
        return res.status(404).json({ error: 'Alérgeno no encontrado' });
      }
      res.json(alergeno);
    } catch (error) {
      console.error('Error al obtener alérgeno:', error);
      res.status(500).json({ error: 'Error al obtener alérgeno' });
    }
  }

  // POST /api/alergenos-personalizados - Crear nuevo
  static async crear(req, res) {
    try {
      const alergeno = await AlergenoPersonalizado.crear(req.body);
      res.status(201).json(alergeno);
    } catch (error) {
      console.error('Error al crear alérgeno:', error);
      res.status(500).json({ error: 'Error al crear alérgeno' });
    }
  }

  // PUT /api/alergenos-personalizados/:id - Actualizar
  static async actualizar(req, res) {
    try {
      const alergeno = await AlergenoPersonalizado.actualizar(req.params.id, req.body);
      res.json(alergeno);
    } catch (error) {
      console.error('Error al actualizar alérgeno:', error);
      res.status(500).json({ error: 'Error al actualizar alérgeno' });
    }
  }

  // DELETE /api/alergenos-personalizados/:id - Eliminar (desactivar)
  static async eliminar(req, res) {
    try {
      const resultado = await AlergenoPersonalizado.eliminar(req.params.id);
      res.json(resultado);
    } catch (error) {
      console.error('Error al eliminar alérgeno:', error);
      res.status(500).json({ error: 'Error al eliminar alérgeno' });
    }
  }

  // GET /api/ingredientes/:id/alergenos-personalizados - Obtener alérgenos de un ingrediente
  static async obtenerDeIngrediente(req, res) {
    try {
      const alergenos = await AlergenoPersonalizado.obtenerDeIngrediente(req.params.id);
      res.json(alergenos);
    } catch (error) {
      console.error('Error al obtener alérgenos del ingrediente:', error);
      res.status(500).json({ error: 'Error al obtener alérgenos del ingrediente' });
    }
  }

  // PUT /api/ingredientes/:id/alergenos-personalizados - Actualizar alérgenos de un ingrediente
  static async actualizarDeIngrediente(req, res) {
    try {
      const { alergenos_ids } = req.body;
      await AlergenoPersonalizado.actualizarDeIngrediente(req.params.id, alergenos_ids || []);
      res.json({ success: true });
    } catch (error) {
      console.error('Error al actualizar alérgenos del ingrediente:', error);
      res.status(500).json({ error: 'Error al actualizar alérgenos del ingrediente' });
    }
  }

  // GET /api/platos/:id/alergenos-personalizados - Obtener alérgenos de un plato
  static async obtenerDePlato(req, res) {
    try {
      const alergenos = await AlergenoPersonalizado.obtenerDePlato(req.params.id);
      res.json(alergenos);
    } catch (error) {
      console.error('Error al obtener alérgenos del plato:', error);
      res.status(500).json({ error: 'Error al obtener alérgenos del plato' });
    }
  }

  // PUT /api/platos/:id/alergenos-personalizados - Actualizar alérgenos de un plato
  static async actualizarDePlato(req, res) {
    try {
      const { alergenos_ids } = req.body;
      await AlergenoPersonalizado.actualizarDePlato(req.params.id, alergenos_ids || []);
      res.json({ success: true });
    } catch (error) {
      console.error('Error al actualizar alérgenos del plato:', error);
      res.status(500).json({ error: 'Error al actualizar alérgenos del plato' });
    }
  }
}

module.exports = AlergenosPersonalizadosController;
