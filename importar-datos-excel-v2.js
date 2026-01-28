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

// Obtener columnas reales de una tabla
function getTableColumns(table) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(r => r.name));
    });
  });
}

/**
 * IMPORTADORES POR ENTIDAD
 */

// Grabar datos crudos en la tabla espejo para copia exacta del Excel
async function grabarRawData(archivo, hoja, filaNumero, filaDatos, mapeadoA = null, idMapeado = null, estado = 'importado', errorMsg = null) {
  try {
    await runAsync(
      `INSERT INTO excel_raw_data (archivo, hoja, fila_numero, datos, mapeado_a, id_mapeado, estado, error_mensaje)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        archivo,
        hoja,
        filaNumero,
        JSON.stringify(filaDatos),
        mapeadoA,
        idMapeado,
        estado,
        errorMsg
      ]
    );
  } catch (err) {
    console.warn(`  ⚠️  Error grabando raw data fila ${filaNumero}:`, err.message);
  }
}

async function importarPlatos(datos) {
  console.log('\n📥 Importando Platos...');
  
  const platosDatos = ServicioExcel.limpiarDatos(datos);
  console.log(`   Encontrados: ${platosDatos.length}`);
  
  const resultados = await ServicioExcel.importarConValidacion(
    platosDatos,
    // Validador
    (fila, idx) => {
      const codigo = ServicioExcel.extraerCodigo(
        ServicioExcel.getCampo(fila, [
          'Código','Codigo','CODIGO','COD','REF','ID','Cod_Platos','Codigo Plato','Código Plato','Cod Plato'
        ])
      );
      const nombreRaw = ServicioExcel.getCampo(fila, [
        'Nombre','PLATO','Plato','Nombre Plato','Nombre PLATO','Plato a la venta','Nombre plato','Titulo','Título'
      ]);
      const nombre = String(nombreRaw || '').trim();
      
      if (!codigo || !nombre) {
        return { 
          valido: false, 
          error: `Fila ${idx}: Código o nombre vacío` 
        };
      }
      
      return { valido: true };
    },
    // Procesador
    async (fila, idx) => {
      const codigo = ServicioExcel.extraerCodigo(
        ServicioExcel.getCampo(fila, [
          'Código','Codigo','CODIGO','COD','REF','ID','Cod_Platos','Codigo Plato','Código Plato','Cod Plato'
        ])
      );
      const nombre = String(
        ServicioExcel.getCampo(fila, [
          'Nombre','PLATO','Plato','Nombre Plato','Nombre PLATO','Plato a la venta','Nombre plato','Titulo','Título'
        ])
      ).trim();
      const categoria = ServicioExcel.getCampo(fila, [
        'Categoría','categoria','CATEGORIA','Grupo','grupo','GRUPO','Grupo Menu','Sección','Seccion','Partida','Partidas'
      ]) || null;
      
      // Verificar duplicado
      const existe = await getAsync('SELECT id FROM platos WHERE codigo = ?', [codigo]);
      if (existe) {
        await grabarRawData('fabricación.xlsx', 'Platos', idx + 1, fila, 'platos', null, 'duplicado', `Código ${codigo} ya existe`);
        throw new Error(`Código ${codigo} ya existe`);
      }
      // Insert dinámico según columnas disponibles
      const columnas = await getTableColumns('platos');
      const valores = { codigo, nombre, grupo: categoria, tipo: null, precio_venta: 0, coste_racion: 0, activo: 1, descripcion: null, familia: null, pvp: 0, coste_produccion: 0 };
      const colsUsadas = ['codigo','nombre'].filter(c => columnas.includes(c));
      // Campos adicionales si existen
      ;['grupo','tipo','precio_venta','coste_racion','activo','descripcion','familia','pvp','coste_produccion'].forEach(c => {
        if (columnas.includes(c)) colsUsadas.push(c);
      });
      const placeholders = colsUsadas.map(() => '?').join(', ');
      const params = colsUsadas.map(c => valores[c]);
      const result = await runAsync(
        `INSERT INTO platos (${colsUsadas.join(', ')}) VALUES (${placeholders})`,
        params
      );
      
      // Grabar datos crudos en tabla espejo
      await grabarRawData('fabricación.xlsx', 'Platos', idx + 1, fila, 'platos', result.lastID, 'importado', null);

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

async function importarPartidas(datos) {
  console.log('\n📥 Importando Partidas de Cocina...');

  const partidasDatos = ServicioExcel.limpiarDatos(datos);
  console.log(`   Encontradas: ${partidasDatos.length}`);

  const resultados = await ServicioExcel.importarConValidacion(
    partidasDatos,
    // Validador
    (fila, idx) => {
      const nombre = (fila.Nombre || fila.nombre || '').trim();
      if (!nombre) {
        return {
          valido: false,
          error: `Fila ${idx}: Nombre vacío`
        };
      }
      return { valido: true };
    },
    // Procesador
    async (fila) => {
      const nombre = (fila.Nombre || fila.nombre).trim();
      const responsable = fila.Responsable || fila.responsable || null;
      const descripcion = fila['Descripción'] || fila.descripcion || null;

      // Verificar duplicado por nombre
      const existe = await getAsync('SELECT id FROM partidas_cocina WHERE nombre = ?', [nombre]);
      if (existe) {
        throw new Error(`Partida ${nombre} ya existe`);
      }

      const result = await runAsync(
        `INSERT INTO partidas_cocina (nombre, responsable, descripcion, activo, created_at, updated_at)
         VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [nombre, responsable, descripcion]
      );

      return result;
    },
    'Partida'
  );

  console.log(`   ✅ Importadas: ${resultados.importados}/${resultados.procesados}`);
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
      const codigo = ServicioExcel.extraerCodigo(
        ServicioExcel.getCampo(fila, [
          'Código','Codigo','CODIGO','COD','REF','ID','Cod_Articulo','Codigo Articulo','Código Articulo','Cod Articulo'
        ])
      );
      const nombreRaw = ServicioExcel.getCampo(fila, [
        'Nombre','Articulo','ARTICULO','Nombre Articulo','Nombre artículo','Descripción','Descripcion'
      ]);
      const nombre = String(nombreRaw || '').trim();
      
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
      const codigo = ServicioExcel.extraerCodigo(
        ServicioExcel.getCampo(fila, [
          'Código','Codigo','CODIGO','COD','REF','ID','Cod_Articulo','Codigo Articulo','Código Articulo','Cod Articulo'
        ])
      );
      const nombre = String(
        ServicioExcel.getCampo(fila, [
          'Nombre','Articulo','ARTICULO','Nombre Articulo','Nombre artículo','Descripción','Descripcion'
        ])
      ).trim();
      const unidad = ServicioExcel.getCampo(fila, [
        'Unidad','UM','Unidad Medida','Unidad medida','unidad'
      ]) || 'kg';
      const precio = parseFloat(
        ServicioExcel.getCampo(fila, [
          'Precio','precio','Precio base','Precio Unit','€','Precio unitario'
        ]) || 0
      );
      
      // Verificar duplicado
      const existe = await getAsync('SELECT id FROM ingredientes WHERE codigo = ?', [codigo]);
      if (existe) {
        throw new Error(`Código ${codigo} ya existe`);
      }
      
      // Insert dinámico según columnas disponibles
      const columnas = await getTableColumns('ingredientes');
      const valores = { codigo, nombre, unidad, precio, stock_actual: 0, activo: 1, precio_unitario: precio, coste_unidad: precio, coste_kilo: 0 };
      const colsUsadas = ['codigo','nombre'].filter(c => columnas.includes(c));
      ;['unidad','precio','stock_actual','activo','precio_unitario','coste_unidad','coste_kilo'].forEach(c => {
        if (columnas.includes(c)) colsUsadas.push(c);
      });
      const placeholders = colsUsadas.map(() => '?').join(', ');
      const params = colsUsadas.map(c => valores[c]);
      const result = await runAsync(
        `INSERT INTO ingredientes (${colsUsadas.join(', ')}) VALUES (${placeholders})`,
        params
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
      const platoCode = ServicioExcel.extraerCodigo(
        ServicioExcel.getCampo(fila, [
          'Código Plato','Codigo Plato','Cod Plato','PLATO','Plato','Codigo PLATO','Cod_Platos'
        ])
      );
      const ingredienteCode = ServicioExcel.extraerCodigo(
        ServicioExcel.getCampo(fila, [
          'Código Ingrediente','Codigo Ingrediente','Cod Ingrediente','INGREDIENTE','Ingrediente','Cod_Articulo','Codigo Articulo'
        ])
      );
      const cantidad = parseFloat(
        ServicioExcel.getCampo(fila, ['Cantidad','cantidad','Cant','CANTIDAD']) || 0
      );
      
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

async function importarOfertas(datos) {
  console.log('\n📥 Importando Ofertas...');
  
  const ofertasDatos = ServicioExcel.limpiarDatos(datos);
  console.log(`   Encontradas: ${ofertasDatos.length}`);
  
  const resultados = await ServicioExcel.importarConValidacion(
    ofertasDatos,
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
      const precioRegular = parseFloat(fila['Precio Regular'] || fila['precio_regular'] || 0);
      const precioOferta = parseFloat(fila['Precio Oferta'] || fila['precio_oferta'] || 0);
      const descuento = fila['Descuento %'] || fila['descuento_porcentaje'] || 0;
      const fechaInicio = ServicioExcel.convertirFecha(fila['Fecha Inicio'] || fila['fecha_inicio']);
      const fechaFin = ServicioExcel.convertirFecha(fila['Fecha Fin'] || fila['fecha_fin']);
      
      // Verificar duplicado
      const existe = await getAsync('SELECT id FROM ofertas WHERE codigo = ?', [codigo]);
      if (existe) {
        throw new Error(`Código ${codigo} ya existe`);
      }
      
      // Crear
      const result = await runAsync(
        `INSERT INTO ofertas (codigo, nombre, estado, precio_regular, precio_oferta, descuento_porcentaje, fecha_inicio, fecha_fin, created_at, updated_at)
         VALUES (?, ?, 'activa', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [codigo, nombre, precioRegular, precioOferta, descuento, fechaInicio, fechaFin]
      );
      
      return result;
    },
    'Oferta'
  );
  
  console.log(`   ✅ Importadas: ${resultados.importados}/${resultados.procesados}`);
  if (resultados.errores.length > 0) {
    console.log(`   ⚠️  Errores: ${resultados.errores.length}`);
    resultados.errores.slice(0, 3).forEach(e => console.log(`      - ${e}`));
  }
  
  return resultados;
}

async function importarEventos(datos) {
  console.log('\n📥 Importando Eventos...');
  
  const eventosDatos = ServicioExcel.limpiarDatos(datos);
  console.log(`   Encontrados: ${eventosDatos.length}`);
  
  const resultados = await ServicioExcel.importarConValidacion(
    eventosDatos,
    // Validador
    (fila, idx) => {
      const codigo = ServicioExcel.extraerCodigo(
        ServicioExcel.getCampo(fila, ['Código','Codigo','COD','ID','REF'])
      );
      const nombreRaw = ServicioExcel.getCampo(fila, ['Evento','Nombre','Titulo','Título','Nombre Evento']);
      const nombre = String(nombreRaw || '').trim();
      const fecha = ServicioExcel.convertirFecha(
        ServicioExcel.getCampo(fila, ['Fecha','FECHA','Fecha Evento','Dia','Día'])
      );
      
      if (!codigo || !nombre || !fecha) {
        return { 
          valido: false, 
          error: `Fila ${idx}: Código, nombre o fecha vacío` 
        };
      }
      
      return { valido: true };
    },
    // Procesador
    async (fila) => {
      const codigo = ServicioExcel.extraerCodigo(
        ServicioExcel.getCampo(fila, ['Código','Codigo','COD','ID','REF'])
      );
      const nombre = String(
        ServicioExcel.getCampo(fila, ['Evento','Nombre','Titulo','Título','Nombre Evento'])
      ).trim();
      const tipoEvento = ServicioExcel.getCampo(fila, ['Tipo Evento','tipo_evento','Tipo','tipo']) || 'reunion';
      const fechaEvento = ServicioExcel.convertirFecha(
        ServicioExcel.getCampo(fila, ['Fecha','FECHA','Fecha Evento','Dia','Día'])
      );
      const lugar = ServicioExcel.getCampo(fila, ['Lugar','Sitio','Ubicación','Ubicacion']) || null;
      const capacidad = parseInt(ServicioExcel.getCampo(fila, ['Capacidad','Aforo']) || 0);
      const precioEntrada = parseFloat(ServicioExcel.getCampo(fila, ['Precio Entrada','precio_entrada','Precio','€']) || 0);
      
      // Verificar duplicado
      const existe = await getAsync('SELECT id FROM eventos WHERE codigo = ?', [codigo]);
      if (existe) {
        throw new Error(`Código ${codigo} ya existe`);
      }
      
      // Crear
      const result = await runAsync(
        `INSERT INTO eventos (codigo, nombre, tipo_evento, fecha_evento, lugar, capacidad, precio_entrada, estado, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'planificacion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [codigo, nombre, tipoEvento, fechaEvento, lugar, capacidad, precioEntrada]
      );
      
      return result;
    },
    'Evento'
  );
  
  console.log(`   ✅ Importados: ${resultados.importados}/${resultados.procesados}`);
  if (resultados.errores.length > 0) {
    console.log(`   ⚠️  Errores: ${resultados.errores.length}`);
    resultados.errores.slice(0, 3).forEach(e => console.log(`      - ${e}`));
  }
  
  return resultados;
}

/**
 * FUNCIÓN PRINCIPAL
 */

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log(' IMPORTACIÓN DE DATOS DESDE EXCEL - VERSIÓN MEJORADA');
  console.log('='.repeat(70));
  
  const resumenGlobal = {
    partidas: { importados: 0, errores: 0 },
    platos: { importados: 0, errores: 0 },
    ingredientes: { importados: 0, errores: 0 },
    escandallos: { importados: 0, errores: 0 },
    ofertas: { importados: 0, errores: 0 },
    eventos: { importados: 0, errores: 0 },
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
    if (datosFabricacion['Partidas']) {
      const res = await importarPartidas(datosFabricacion['Partidas']);
      resumenGlobal.partidas = {
        importados: res.importados,
        errores: res.errores.length
      };
    }

    if (datosFabricacion['Platos']) {
      const res = await importarPlatos(datosFabricacion['Platos']);
      resumenGlobal.platos = { 
        importados: res.importados, 
        errores: res.errores.length 
      };
    }
    
    if (datosFabricacion['Articulos'] || datosFabricacion['Ingredientes']) {
      const res = await importarIngredientes(datosFabricacion['Articulos'] || datosFabricacion['Ingredientes']);
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
        
        // Importar ofertas
        if (datosOferta['Ofertas'] || datosOferta['ofertas']) {
          const res = await importarOfertas(datosOferta['Ofertas'] || datosOferta['ofertas']);
          resumenGlobal.ofertas = { 
            importados: res.importados, 
            errores: res.errores.length 
          };
        }
        
        // Importar eventos
        if (datosOferta['Eventos'] || datosOferta['eventos']) {
          const res = await importarEventos(datosOferta['Eventos'] || datosOferta['eventos']);
          resumenGlobal.eventos = { 
            importados: res.importados, 
            errores: res.errores.length 
          };
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Archivo no encontrado (opcional): ${error.message}`);
    }

    // Resumen final
    console.log('\n' + '='.repeat(70));
    console.log(' RESUMEN DE IMPORTACIÓN');
    console.log('='.repeat(70));
    
    const totalImportados = 
      resumenGlobal.partidas.importados +
      resumenGlobal.platos.importados +
      resumenGlobal.ingredientes.importados +
      resumenGlobal.escandallos.importados +
      resumenGlobal.ofertas.importados +
      resumenGlobal.eventos.importados;
    
    const totalErrores =
      resumenGlobal.partidas.errores +
      resumenGlobal.platos.errores +
      resumenGlobal.ingredientes.errores +
      resumenGlobal.escandallos.errores +
      resumenGlobal.ofertas.errores +
      resumenGlobal.eventos.errores;

    console.log(`✅ Partidas:     ${resumenGlobal.partidas.importados} importadas`);
    if (resumenGlobal.partidas.errores > 0)
      console.log(`   ⚠️  ${resumenGlobal.partidas.errores} errores`);

    console.log(`✅ Platos:       ${resumenGlobal.platos.importados} importados`);
    if (resumenGlobal.platos.errores > 0) 
      console.log(`   ⚠️  ${resumenGlobal.platos.errores} errores`);
    
    console.log(`✅ Ingredientes: ${resumenGlobal.ingredientes.importados} importados`);
    if (resumenGlobal.ingredientes.errores > 0)
      console.log(`   ⚠️  ${resumenGlobal.ingredientes.errores} errores`);
    
    console.log(`✅ Escandallos:  ${resumenGlobal.escandallos.importados} importados`);
    if (resumenGlobal.escandallos.errores > 0)
      console.log(`   ⚠️  ${resumenGlobal.escandallos.errores} errores`);
    
    console.log(`✅ Ofertas:      ${resumenGlobal.ofertas.importados} importadas`);
    if (resumenGlobal.ofertas.errores > 0)
      console.log(`   ⚠️  ${resumenGlobal.ofertas.errores} errores`);
    
    console.log(`✅ Eventos:      ${resumenGlobal.eventos.importados} importados`);
    if (resumenGlobal.eventos.errores > 0)
      console.log(`   ⚠️  ${resumenGlobal.eventos.errores} errores`);
    
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
