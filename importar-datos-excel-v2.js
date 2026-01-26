#!/usr/bin/env node
/**
 * ============================================================================
 * IMPORTADOR DE DATOS DESDE EXCEL - VERSIÓN MEJORADA
 * ============================================================================
 * 
 * Basado en patrones de Flask (hibo-cocina-p):
 * - Lectura completa en un pase
 * - Validación sin fallar completamente
 * - Reporte detallado de resultados
 * - Soporte para múltiples archivos
 */

const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const ServicioExcel = require('./src/utils/servicioExcel');

// Conectar a BD
const db = new sqlite3.Database('./data/hibo-cocina.db', (err) => {
  if (err) {
    console.error('❌ Error conectando a BD:', err);
    process.exit(1);
  }
  console.log('✅ Conectado a SQLite');
});

// Promisify db operations
function runAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * IMPORTADORES POR ENTIDAD
 */

async function importarPlatos(datos) {
  console.log('\n📥 Importando Platos...');
  
  const platosDatos = ServicioExcel.limpiarDatos(datos);
  console.log(`   Encontrados: ${platosDatos.length}`);
  
  const resultados = await ServicioExcel.importarConValidacion(
    platosDatos,
    // Validador
    (fila, idx) => {
      const codigo = ServicioExcel.extraerCodigo(fila.Código || fila.codigo);
      const nombre = (fila.Nombre || fila.nombre || '').trim();
      
      if (!codigo || !nombre) {
        return { 
          valido: false, 
          error: `Fila ${idx}: Código o nombre vacío` 
        };
      }
      
      return { valido: true };
    },
    // Procesador
    async (fila) => {
      const codigo = ServicioExcel.extraerCodigo(fila.Código || fila.codigo);
      const nombre = (fila.Nombre || fila.nombre).trim();
      const categoria = fila.Categoría || fila.categoria || fila.Grupo || fila.grupo || null;
      
      // Verificar duplicado
      const existe = await getAsync('SELECT id FROM platos WHERE codigo = ?', [codigo]);
      if (existe) {
        throw new Error(`Código ${codigo} ya existe`);
      }
      
      // Crear
      const result = await runAsync(
        `INSERT INTO platos (codigo, nombre, grupo, activo, created_at, updated_at)
         VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [codigo, nombre, categoria]
      );
      
      return result;
    },
    'Plato'
  );
  
  console.log(`   ✅ Importados: ${resultados.importados}/${resultados.procesados}`);
  if (resultados.errores.length > 0) {
    console.log(`   ⚠️  Errores: ${resultados.errores.length}`);
    resultados.errores.slice(0, 3).forEach(e => console.log(`      - ${e}`));
  }
  
  return resultados;
}

async function importarIngredientes(datos) {
  console.log('\n📥 Importando Ingredientes...');
  
  const ingredientesDatos = ServicioExcel.limpiarDatos(datos);
  console.log(`   Encontrados: ${ingredientesDatos.length}`);
  
  const resultados = await ServicioExcel.importarConValidacion(
    ingredientesDatos,
    // Validador
    (fila, idx) => {
      const codigo = ServicioExcel.extraerCodigo(fila.Código || fila.codigo);
      const nombre = (fila.Nombre || fila.nombre || '').trim();
      
      if (!codigo || !nombre) {
        return { 
          valido: false, 
          error: `Fila ${idx}: Código o nombre vacío` 
        };
      }
      
      return { valido: true };
    },
    // Procesador
    async (fila) => {
      const codigo = ServicioExcel.extraerCodigo(fila.Código || fila.codigo);
      const nombre = (fila.Nombre || fila.nombre).trim();
      const unidad = fila.Unidad || fila.unidad || 'kg';
      const precio = parseFloat(fila.Precio || fila.precio || fila['Precio Unit'] || 0);
      
      // Verificar duplicado
      const existe = await getAsync('SELECT id FROM ingredientes WHERE codigo = ?', [codigo]);
      if (existe) {
        throw new Error(`Código ${codigo} ya existe`);
      }
      
      // Crear
      const result = await runAsync(
        `INSERT INTO ingredientes (codigo, nombre, unidad, precio_unitario, activo, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [codigo, nombre, unidad, precio]
      );
      
      return result;
    },
    'Ingrediente'
  );
  
  console.log(`   ✅ Importados: ${resultados.importados}/${resultados.procesados}`);
  if (resultados.errores.length > 0) {
    console.log(`   ⚠️  Errores: ${resultados.errores.length}`);
    resultados.errores.slice(0, 3).forEach(e => console.log(`      - ${e}`));
  }
  
  return resultados;
}

async function importarEscandallos(datos) {
  console.log('\n📥 Importando Escandallos...');
  
  const escandalloDatos = ServicioExcel.limpiarDatos(datos);
  console.log(`   Encontrados: ${escandalloDatos.length}`);
  
  let importados = 0;
  let errores = [];
  
  for (const fila of escandalloDatos) {
    try {
      const platoCode = ServicioExcel.extraerCodigo(fila['Código Plato'] || fila.plato);
      const ingredienteCode = ServicioExcel.extraerCodigo(fila['Código Ingrediente'] || fila.ingrediente);
      const cantidad = parseFloat(fila.Cantidad || fila.cantidad || 0);
      
      if (!platoCode || !ingredienteCode || cantidad <= 0) {
        errores.push(`Fila con datos incompletos: ${platoCode}, ${ingredienteCode}`);
        continue;
      }
      
      // Obtener IDs
      const plato = await getAsync('SELECT id FROM platos WHERE codigo = ?', [platoCode]);
      const ingrediente = await getAsync('SELECT id FROM ingredientes WHERE codigo = ?', [ingredienteCode]);
      
      if (!plato || !ingrediente) {
        errores.push(`Referencia no encontrada: ${platoCode} o ${ingredienteCode}`);
        continue;
      }
      
      // Crear
      await runAsync(
        `INSERT INTO escandallos (plato_id, ingrediente_id, cantidad, activo, created_at, updated_at)
         VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [plato.id, ingrediente.id, cantidad]
      );
      
      importados++;
    } catch (error) {
      errores.push(`Error: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Importados: ${importados}/${escandalloDatos.length}`);
  if (errores.length > 0) {
    console.log(`   ⚠️  Errores: ${errores.length}`);
  }
  
  return { importados, errores };
}

/**
 * FUNCIÓN PRINCIPAL
 */

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log(' IMPORTACIÓN DE DATOS DESDE EXCEL - VERSIÓN MEJORADA');
  console.log('='.repeat(70));
  
  const resumenGlobal = {
    platos: { importados: 0, errores: 0 },
    ingredientes: { importados: 0, errores: 0 },
    escandallos: { importados: 0, errores: 0 },
    totalErrores: 0
  };

  try {
    // Importar desde fabricación.xlsx
    const rutaFabricacion = './fabricación.xlsx';
    console.log(`\n📂 Leyendo ${rutaFabricacion}...`);
    
    const datosFabricacion = ServicioExcel.extraerDatos(rutaFabricacion);
    if (!datosFabricacion) {
      throw new Error(`No se puede leer ${rutaFabricacion}`);
    }
    
    console.log(`   Hojas encontradas: ${Object.keys(datosFabricacion).join(', ')}`);
    
    // Importar cada entidad
    if (datosFabricacion['Platos']) {
      const res = await importarPlatos(datosFabricacion['Platos']);
      resumenGlobal.platos = { 
        importados: res.importados, 
        errores: res.errores.length 
      };
    }
    
    if (datosFabricacion['Articulos']) {
      const res = await importarIngredientes(datosFabricacion['Articulos']);
      resumenGlobal.ingredientes = { 
        importados: res.importados, 
        errores: res.errores.length 
      };
    }
    
    if (datosFabricacion['Escandallos']) {
      const res = await importarEscandallos(datosFabricacion['Escandallos']);
      resumenGlobal.escandallos = res;
    }

    // Importar desde oferta_c.xlsx si existe
    try {
      const rutaOferta = './oferta_c.xlsx';
      console.log(`\n📂 Leyendo ${rutaOferta}...`);
      
      const datosOferta = ServicioExcel.extraerDatos(rutaOferta);
      if (datosOferta) {
        console.log(`   Hojas encontradas: ${Object.keys(datosOferta).join(', ')}`);
        // TODO: Importar eventos, ofertas, etc.
      }
    } catch (error) {
      console.log(`   ⚠️  Archivo no encontrado (opcional): ${error.message}`);
    }

    // Resumen final
    console.log('\n' + '='.repeat(70));
    console.log(' RESUMEN DE IMPORTACIÓN');
    console.log('='.repeat(70));
    
    const totalImportados = 
      resumenGlobal.platos.importados +
      resumenGlobal.ingredientes.importados +
      resumenGlobal.escandallos.importados;
    
    const totalErrores =
      resumenGlobal.platos.errores +
      resumenGlobal.ingredientes.errores +
      resumenGlobal.escandallos.errores;

    console.log(`\n✅ Platos:       ${resumenGlobal.platos.importados} importados`);
    if (resumenGlobal.platos.errores > 0) 
      console.log(`   ⚠️  ${resumenGlobal.platos.errores} errores`);
    
    console.log(`✅ Ingredientes: ${resumenGlobal.ingredientes.importados} importados`);
    if (resumenGlobal.ingredientes.errores > 0)
      console.log(`   ⚠️  ${resumenGlobal.ingredientes.errores} errores`);
    
    console.log(`✅ Escandallos:  ${resumenGlobal.escandallos.importados} importados`);
    if (resumenGlobal.escandallos.errores > 0)
      console.log(`   ⚠️  ${resumenGlobal.escandallos.errores} errores`);
    
    console.log(`\n📊 TOTAL: ${totalImportados} registros importados`);
    if (totalErrores > 0) {
      console.log(`⚠️  Errores totales: ${totalErrores}`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log(' IMPORTACIÓN COMPLETADA');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
