const express = require('express');
const router = express.Router();
const alergenosOficialesController = require('../controllers/alergenosOficialesController');

router.get('/', alergenosOficialesController.obtenerTodos);
router.get('/buscar', alergenosOficialesController.buscarPorPalabrasClave);
router.get('/:id', alergenosOficialesController.obtenerPorId);
router.put('/:id', alergenosOficialesController.actualizar);

module.exports = router;
