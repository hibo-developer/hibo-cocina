const AlergenoOficial = require('../models/AlergenoOficial');

exports.obtenerTodos = async (req, res) => {
  try {
    const alergenos = await AlergenoOficial.obtenerTodos();
    res.json(alergenos);
  } catch (error) {
    console.error('Error al obtener alérgenos oficiales:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const alergeno = await AlergenoOficial.obtenerPorId(id);
    if (!alergeno) {
      return res.status(404).json({ error: 'Alérgeno no encontrado' });
    }
    res.json(alergeno);
  } catch (error) {
    console.error('Error al obtener alérgeno oficial:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await AlergenoOficial.actualizar(id, req.body);
    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar alérgeno oficial:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.buscarPorPalabrasClave = async (req, res) => {
  try {
    const { texto } = req.query;
    if (!texto) {
      return res.status(400).json({ error: 'Parámetro texto requerido' });
    }
    const alergenos = await AlergenoOficial.buscarPorPalabrasClave(texto);
    res.json(alergenos);
  } catch (error) {
    console.error('Error al buscar alérgenos:', error);
    res.status(500).json({ error: error.message });
  }
};
