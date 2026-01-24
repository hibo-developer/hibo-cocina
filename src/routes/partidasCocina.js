const express = require('express');
const router = express.Router();
const partidasCocinaController = require('../controllers/partidasCocinaController');

// Rutas para partidas de cocina
router.get('/', partidasCocinaController.obtenerTodas);
router.get('/count', partidasCocinaController.contar);
router.get('/:id', partidasCocinaController.obtenerPorId);
router.get('/responsable/:responsable', partidasCocinaController.obtenerPorResponsable);

router.post('/', partidasCocinaController.crear);

router.put('/:id', partidasCocinaController.actualizar);

router.delete('/:id', partidasCocinaController.eliminar);

module.exports = router;
