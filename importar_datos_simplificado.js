/**
 * Script mejorado para importar datos del Excel
 * Analiza primero la estructura y luego importa
 */

const XLSX = require('xlsx');
const db = require('./src/db/database');
const { crearTablas } = require('./src/db/schema');

const EXCEL_FABRICACION = './fabricación.xlsb';

// Función auxiliar para promisificar db.run
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Función auxiliar para promisificar db.get
function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Importar ingredientes de Articulos
 */
async function importarIngredientes() {
  console.log('\n📦 Importando ingredientes/artículos...');
  
  const workbook = XLSX.readFile(EXCEL_FABRICACION);
  const sheet = workbook.Sheets['Articulos'];
  const data = XLSX.utils.sheet_to_json(sheet);

  let importados = 0;
  let errores = 0;

  for (const row of data) {
    try {
      const codigo = row['__EMPTY_1'];
      const nombre = row['__EMPTY_2'];
      
      // Saltar encabezados y vacíos
      if (!codigo || !nombre || codigo === 'Codigo Interno') continue;

      // Verificar si ya existe
      const existe = await getQuery('SELECT id FROM ingredientes WHERE codigo = ?', [codigo]);
      if (existe) {
        continue;
      }

      await runQuery(`
        INSERT INTO ingredientes (
          codigo, nombre, familia, grupo_conservacion,
          partidas_almacen, unidad_economato, unidad_escandallo,
          formato_envases, peso_neto_envase, unidad_por_formatos,
          coste_unidad, coste_envase, coste_kilo,
          sesamo, pescado, mariscos, apio, frutos_secos,
          sulfitos, lacteos, altramuces, gluten, ovoproductos, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        codigo,
        nombre,
        row['__EMPTY_3'] || 'General',
        row['__EMPTY_4'] || 'Neutro',
        row['__EMPTY_5'] || 'Economato',
        row['__EMPTY_6'] || 'Kg',
        row['__EMPTY_7'] || 'Kg',
        row['__EMPTY_8'] || null,
        parseFloat(row['__EMPTY_9']) || 0,
        parseInt(row['__EMPTY_10']) || 1,
        parseFloat(row['__EMPTY_11']) || 0,
        parseFloat(row['__EMPTY_16']) || 0,
        parseFloat(row['__EMPTY_12']) || 0,
        row['__EMPTY_22'] || 0,
        row['__EMPTY_23'] || 0,
        row['__EMPTY_24'] || 0,
        row['__EMPTY_25'] || 0,
        row['__EMPTY_26'] || 0,
        row['__EMPTY_27'] || 0,
        row['__EMPTY_28'] || 0,
        row['__EMPTY_29'] || 0,
        row['__EMPTY_30'] || 0,
        row['__EMPTY_31'] || 0,
        1
      ]);

      importados++;
      if (importados % 50 === 0) {
        console.log(`  📊 Progreso: ${importados} ingredientes...`);
      }
    } catch (error) {
      console.error(`❌ Error en fila ${importados + errores + 1}:`, error.message);
      errores++;
    }
  }

  console.log(`✅ Ingredientes: ${importados} importados, ${errores} errores`);
  return importados;
}

/**
 * Importar platos usando datos en formato tabla
 */
async function importarPlatos() {
  console.log('\n🍽️  Importando platos...');
  
  const workbook = XLSX.readFile(EXCEL_FABRICACION);
  const sheet = workbook.Sheets['Platos'];
  
  // Leer como array de arrays para procesar manualmente
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const data = [];
  
  // Encontrar fila de encabezados (buscar "Codigo")
  let headerRow = -1;
  for (let R = range.s.r; R <= Math.min(range.s.r + 20, range.e.r); R++) {
    const cellAddress = XLSX.utils.encode_cell({ r: R, c: 1 }); // Columna B
    const cell = sheet[cellAddress];
    if (cell && cell.v && cell.v.toString().includes('Codigo')) {
      headerRow = R;
      break;
    }
  }

  if (headerRow === -1) {
    console.log('❌ No se encontró fila de encabezados');
    return 0;
  }

  console.log(`  📍 Encabezados en fila ${headerRow + 1}`);

  // Leer encabezados
  const headers = [];
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: C });
    const cell = sheet[cellAddress];
    headers[C] = cell ? String(cell.v).trim() : '';
  }

  // Encontrar índices de columnas importantes (búsqueda flexible)
  const findColumn = (names) => {
    for (const name of names) {
      const idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const colCodigo = findColumn(['Codigo Platos', 'Codigo']);
  const colNombre = findColumn(['PLATOS', 'Nombre']);
  const colPlanning = findColumn(['Planning', 'Familia']);
  const colPartidas = findColumn(['Partidas']);
  const colUnidad = findColumn(['Unidad Mise', 'Unidad']);
  const colPreparacion = findColumn(['Preparacion']);
  const colPeso = findColumn(['Peso Unidad', 'Peso Raciones']);
  const colVenta = findColumn(['Plato a la Venta', 'Venta']);

  console.log(`  📋 Columnas: Codigo=${colCodigo}, Nombre=${colNombre}, Planning=${colPlanning}`);

  let importados = 0;
  let errores = 0;

  // Leer datos desde después del encabezado
  for (let R = headerRow + 1; R <= range.e.r; R++) {
    try {
      const codigoCell = sheet[XLSX.utils.encode_cell({ r: R, c: colCodigo })];
      const nombreCell = sheet[XLSX.utils.encode_cell({ r: R, c: colNombre })];

      if (!codigoCell || !nombreCell) continue;

      const codigo = String(codigoCell.v).trim();
      const nombre = String(nombreCell.v).trim();

      if (!codigo || !nombre) continue;

      // Verificar si ya existe
      const existe = await getQuery('SELECT id FROM platos WHERE codigo = ?', [codigo]);
      if (existe) {
        continue;
      }

      // Leer otros campos
      const planningCell = colPlanning >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colPlanning })] : null;
      const partidasCell = colPartidas >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colPartidas })] : null;
      const unidadCell = colUnidad >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colUnidad })] : null;
      const pesoCell = colPeso >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colPeso })] : null;
      const ventaCell = colVenta >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colVenta })] : null;
      const preparacionCell = colPreparacion >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colPreparacion })] : null;

      const platoVenta = ventaCell && String(ventaCell.v).toUpperCase() === 'SI' ? 1 : 0;

      await runQuery(`
        INSERT INTO platos (
          codigo, nombre, familia, tipo, unidad, peso_raciones,
          plato_venta, preparacion, cocina
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        codigo,
        nombre,
        planningCell ? String(planningCell.v) : 'General',
        partidasCell ? String(partidasCell.v) : 'cocina',
        unidadCell ? String(unidadCell.v) : 'Ud',
        pesoCell ? parseFloat(pesoCell.v) : 0,
        platoVenta,
        preparacionCell ? String(preparacionCell.v) : 'Caliente',
        partidasCell ? String(partidasCell.v) : 'cocina'
      ]);

      importados++;
      if (importados % 20 === 0) {
        console.log(`  📊 Progreso: ${importados} platos...`);
      }
    } catch (error) {
      console.error(`❌ Error en fila ${R + 1}:`, error.message);
      errores++;
    }
  }

  console.log(`✅ Platos: ${importados} importados, ${errores} errores`);
  return importados;
}

/**
 * Importar escandallos (recetas ingrediente-plato)
 */
async function importarEscandallos() {
  console.log('\n📋 Importando escandallos...');
  
  const workbook = XLSX.readFile(EXCEL_FABRICACION);
  const sheet = workbook.Sheets['Escandallos'];
  
  if (!sheet) {
    console.log('❌ Hoja Escandallos no encontrada');
    return 0;
  }

  const range = XLSX.utils.decode_range(sheet['!ref']);
  
  // Encontrar fila de encabezados
  let headerRow = -1;
  for (let R = range.s.r; R <= Math.min(range.s.r + 20, range.e.r); R++) {
    const cellA = sheet[XLSX.utils.encode_cell({ r: R, c: 0 })]; // Columna A
    if (cellA && String(cellA.v).toLowerCase().includes('codigo platos')) {
      headerRow = R;
      break;
    }
  }

  if (headerRow === -1) {
    console.log('❌ No se encontró fila de encabezados');
    return 0;
  }

  console.log(`  📍 Encabezados en fila ${headerRow + 1}`);

  // Encontrar columnas
  const headers = [];
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: headerRow, c: C })];
    headers[C] = cell ? String(cell.v).trim() : '';
  }

  const findColumn = (names) => {
    for (const name of names) {
      const idx = headers.findIndex(h => h && h.toLowerCase().includes(name.toLowerCase()));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const colCodigoPlato = findColumn(['codigo platos', 'codigo plato']);
  const colCodigoIngrediente = findColumn(['codigo articulo', 'codigo ingredientes']);
  const colCantidad = findColumn(['cantidad ud', 'cantidad']);
  const colUnidad = findColumn(['unidad plato', 'unidad']);

  console.log(`  📋 Columnas: CodigoPlato=${colCodigoPlato}, CodigoIngrediente=${colCodigoIngrediente}, Cantidad=${colCantidad}, Unidad=${colUnidad}`);

  let importados = 0;
  let errores = 0;

  for (let R = headerRow + 1; R <= range.e.r; R++) {
    try {
      const codigoPlatoCell = sheet[XLSX.utils.encode_cell({ r: R, c: colCodigoPlato })];
      const codigoIngCell = sheet[XLSX.utils.encode_cell({ r: R, c: colCodigoIngrediente })];
      const cantidadCell = sheet[XLSX.utils.encode_cell({ r: R, c: colCantidad })];

      if (!codigoPlatoCell || !codigoIngCell || !cantidadCell) continue;

      const codigoPlato = String(codigoPlatoCell.v).trim();
      const codigoIngrediente = String(codigoIngCell.v).trim();
      const cantidad = parseFloat(cantidadCell.v);

      if (!codigoPlato || !codigoIngrediente || isNaN(cantidad)) continue;

      // Buscar IDs - puede ser ingrediente o sub-plato
      const plato = await getQuery('SELECT id FROM platos WHERE codigo = ?', [codigoPlato]);
      
      if (!plato) continue; // Skip si el plato no existe

      let ingrediente = null;
      let esSubplato = false;

      // Intentar buscar como ingrediente primero
      if (codigoIngrediente.startsWith('AR-')) {
        ingrediente = await getQuery('SELECT id FROM ingredientes WHERE codigo = ?', [codigoIngrediente]);
      } else if (codigoIngrediente.startsWith('PL-')) {
        // Es un sub-plato, buscar en la tabla platos
        ingrediente = await getQuery('SELECT id FROM platos WHERE codigo = ?', [codigoIngrediente]);
        esSubplato = true;
      }

      if (!ingrediente) continue; // Skip si no existe

      // Verificar si ya existe
      const existe = await getQuery(
        'SELECT id FROM escandallos WHERE plato_id = ? AND ingrediente_id = ?',
        [plato.id, ingrediente.id]
      );
      
      if (existe) continue;

      const unidadCell = colUnidad >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colUnidad })] : null;

      await runQuery(`
        INSERT INTO escandallos (
          plato_id, ingrediente_id, cantidad, unidad
        ) VALUES (?, ?, ?, ?)
      `, [
        plato.id,
        ingrediente.id,
        cantidad,
        unidadCell ? String(unidadCell.v) : 'Kg'
      ]);

      importados++;
      if (importados % 100 === 0) {
        console.log(`  📊 Progreso: ${importados} escandallos...`);
      }
    } catch (error) {
      errores++;
      if (errores < 10) {
        console.error(`❌ Error en fila ${R + 1}:`, error.message);
      }
    }
  }

  console.log(`✅ Escandallos: ${importados} importados, ${errores} errores`);
  return importados;
}

/**
 * Proceso principal
 */
async function importarTodo() {
  console.log('🚀 IMPORTACIÓN DE DATOS DEL EXCEL\n');
  console.log('='.repeat(60));

  try {
    console.log('\n1️⃣  Preparando base de datos...');
    await crearTablas();
    console.log('✅ Base de datos lista');

    const totalIngredientes = await importarIngredientes();
    const totalPlatos = await importarPlatos();
    const totalEscandallos = await importarEscandallos();

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN:');
    console.log('='.repeat(60));
    console.log(`  🔹 Ingredientes: ${totalIngredientes}`);
    console.log(`  🔹 Platos: ${totalPlatos}`);
    console.log(`  🔹 Escandallos: ${totalEscandallos}`);
    console.log('='.repeat(60));
    console.log('\n✅ IMPORTACIÓN COMPLETADA\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  } finally {
    db.close(() => {
      console.log('🔒 Conexión cerrada');
      process.exit(0);
    });
  }
}

if (require.main === module) {
  importarTodo();
}

module.exports = { importarTodo };
