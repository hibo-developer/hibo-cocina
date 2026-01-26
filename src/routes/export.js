/**
 * Rutas para exportación masiva (ideas desde rutas_bulk.py)
 */
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../utils/database');
const ServicioExcel = require('../utils/servicioExcel');
const { createResponse } = require('../middleware/errorHandler');

/**
 * GET /api/export/platos?ids=1,2,3
 * Exporta platos seleccionados a CSV
 */
router.get('/platos', (req, res, next) => {
  try {
    const idsStr = req.query.ids;
    if (!idsStr) {
      return res.status(400).json(
        createResponse(false, null, 'Se requiere parámetro "ids"', 400)
      );
    }

    const ids = idsStr.split(',').map(Number).filter(id => !isNaN(id));
    if (ids.length === 0) {
      return res.status(400).json(
        createResponse(false, null, 'IDs inválidos', 400)
      );
    }

    const db = getDatabase();
    const placeholders = ids.map(() => '?').join(',');
    
    db.all(
      `SELECT id, codigo, nombre, grupo, created_at FROM platos WHERE id IN (${placeholders})`,
      ids,
      (err, rows) => {
        if (err) {
          return res.status(500).json(
            createResponse(false, null, err.message, 500)
          );
        }

        if (!rows || rows.length === 0) {
          return res.status(404).json(
            createResponse(false, null, 'No se encontraron platos', 404)
          );
        }

        // Generar CSV
        const csv = ServicioExcel.generarCSV(rows);
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="platos_${Date.now()}.csv"`
        );
        res.send(csv);
      }
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/ingredientes?ids=1,2,3
 * Exporta ingredientes seleccionados a CSV
 */
router.get('/ingredientes', (req, res, next) => {
  try {
    const idsStr = req.query.ids;
    if (!idsStr) {
      return res.status(400).json(
        createResponse(false, null, 'Se requiere parámetro "ids"', 400)
      );
    }

    const ids = idsStr.split(',').map(Number).filter(id => !isNaN(id));
    if (ids.length === 0) {
      return res.status(400).json(
        createResponse(false, null, 'IDs inválidos', 400)
      );
    }

    const db = getDatabase();
    const placeholders = ids.map(() => '?').join(',');
    
    db.all(
      `SELECT id, codigo, nombre, unidad, precio_unitario, created_at FROM ingredientes WHERE id IN (${placeholders})`,
      ids,
      (err, rows) => {
        if (err) {
          return res.status(500).json(
            createResponse(false, null, err.message, 500)
          );
        }

        if (!rows || rows.length === 0) {
          return res.status(404).json(
            createResponse(false, null, 'No se encontraron ingredientes', 404)
          );
        }

        // Generar CSV
        const csv = ServicioExcel.generarCSV(rows);
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="ingredientes_${Date.now()}.csv"`
        );
        res.send(csv);
      }
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/reporte-completo
 * Exporta un reporte completo (múltiples hojas)
 */
router.get('/reporte-completo', (req, res, next) => {
  try {
    const db = getDatabase();
    const datosPara = {};

    // Obtener todos los datos
    db.all('SELECT id, codigo, nombre, grupo FROM platos', (err, platos) => {
      if (err) {
        return res.status(500).json(
          createResponse(false, null, err.message, 500)
        );
      }

      datosPara['Platos'] = platos;

      db.all('SELECT id, codigo, nombre, unidad, precio_unitario FROM ingredientes', (err, ingredientes) => {
        if (err) {
          return res.status(500).json(
            createResponse(false, null, err.message, 500)
          );
        }

        datosPara['Ingredientes'] = ingredientes;

        // Generar y descargar Excel
        const rutaArchivo = ServicioExcel.generarExcelMultiples(
          datosPara,
          `reporte_${Date.now()}.xlsx`
        );

        if (!rutaArchivo) {
          return res.status(500).json(
            createResponse(false, null, 'Error generando Excel', 500)
          );
        }

        res.download(rutaArchivo, `reporte_${new Date().toISOString().slice(0, 10)}.xlsx`, (err) => {
          if (err) {
            console.error('Error descargando:', err);
          }
          // Opcionalmente: eliminar archivo después de descargar
          // fs.unlink(rutaArchivo, () => {});
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
