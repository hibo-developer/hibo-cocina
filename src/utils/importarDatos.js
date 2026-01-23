const XLSX = require('xlsx');
const path = require('path');
const db = require('../db/database');

async function importarPlatos(rutaArchivo) {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.readFile(rutaArchivo);
      const sheet = workbook.Sheets['Platos Menu'];
      
      if (!sheet) {
        reject(new Error('Hoja "Platos Menu" no encontrada'));
        return;
      }

      const datos = XLSX.utils.sheet_to_json(sheet);
      let importados = 0;

      datos.forEach(row => {
        if (row['Codigo Platos'] && row['PLATOS']) {
          const sql = `
            INSERT OR IGNORE INTO platos 
            (codigo, nombre, unidad, coste, tipo, peso_raciones, grupo_menu, cocina, preparacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.run(sql, [
            row['Codigo Platos'],
            row['PLATOS'],
            row['unidad escandallo'] || 'Ud',
            parseFloat(row['Coste Raciones']) || 0,
            'Platos',
            parseFloat(row['PESO RACIONES']) || 0,
            row['Grupo Menu'] || '',
            row['Cocina'] || '',
            row['Plantillas PROD'] || ''
          ], function(err) {
            if (!err && this.changes > 0) importados++;
          });
        }
      });

      setTimeout(() => resolve(importados), 500);
    } catch (error) {
      reject(error);
    }
  });
}

async function importarIngredientes(rutaArchivo) {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.readFile(rutaArchivo);
      const sheet = workbook.Sheets['Articulos Escandallos'];
      
      if (!sheet) {
        reject(new Error('Hoja "Articulos Escandallos" no encontrada'));
        return;
      }

      const datos = XLSX.utils.sheet_to_json(sheet);
      let importados = 0;

      datos.forEach(row => {
        if (row['Codigo Platos'] && row['Ingredientes']) {
          const sql = `
            INSERT OR IGNORE INTO ingredientes (codigo, nombre, grupo_conservacion)
            VALUES (?, ?, ?)
          `;

          db.run(sql, [
            row['Codigo Platos'],
            row['Ingredientes'],
            row['Tipo'] || 'General'
          ], function(err) {
            if (!err && this.changes > 0) importados++;
          });
        }
      });

      setTimeout(() => resolve(importados), 500);
    } catch (error) {
      reject(error);
    }
  });
}

async function importarEnvases(rutaArchivo) {
  return new Promise((resolve, reject) => {
    try {
      const envases = [
        { tipo: 'Cubetas', capacidad: 50, costo: 0.50 },
        { tipo: 'Barqueta GN 100', capacidad: 100, costo: 0.75 },
        { tipo: 'Barqueta GN 60', capacidad: 60, costo: 0.55 },
        { tipo: 'Barqueta GN 30', capacidad: 30, costo: 0.40 },
        { tipo: 'Mono', capacidad: 1, costo: 0.30 }
      ];

      let importados = 0;

      envases.forEach(envase => {
        const sql = `
          INSERT OR IGNORE INTO envases (tipo, capacidad_raciones, costo)
          VALUES (?, ?, ?)
        `;

        db.run(sql, [envase.tipo, envase.capacidad, envase.costo], function(err) {
          if (!err && this.changes > 0) importados++;
        });
      });

      setTimeout(() => resolve(importados), 300);
    } catch (error) {
      reject(error);
    }
  });
}

async function importarPartidas(rutaArchivo) {
  return new Promise((resolve, reject) => {
    try {
      const partidas = [
        { codigo: 'ARROCES', nombre: 'Arroces', descripcion: 'Sección de arroces' },
        { codigo: 'CARNES', nombre: 'Carnes', descripcion: 'Preparación de carnes' },
        { codigo: 'PESCADOS', nombre: 'Pescados', descripcion: 'Sección de pescados' },
        { codigo: 'VERDURAS', nombre: 'Verduras', descripcion: 'Preparación de verduras' },
        { codigo: 'PASTAS', nombre: 'Pastas', descripcion: 'Preparación de pastas' },
        { codigo: 'SALSAS', nombre: 'Salsas', descripcion: 'Elaboración de salsas' },
        { codigo: 'POSTRES', nombre: 'Postres', descripcion: 'Preparación de postres' }
      ];

      let importados = 0;

      partidas.forEach(partida => {
        const sql = `
          INSERT OR IGNORE INTO partidas_cocina (codigo, nombre, descripcion)
          VALUES (?, ?, ?)
        `;

        db.run(sql, [partida.codigo, partida.nombre, partida.descripcion], function(err) {
          if (!err && this.changes > 0) importados++;
        });
      });

      setTimeout(() => resolve(importados), 300);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  importarPlatos,
  importarIngredientes,
  importarEnvases,
  importarPartidas
};
