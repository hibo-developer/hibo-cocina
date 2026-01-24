const XLSX = require('xlsx');
const db = require('./src/db/database');

const EXCEL_FILE = 'fabricación.xlsx';

const runQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

/**
 * Importar ingredientes desde Articulos Escandallos
 */
async function importarIngredientesEscandallos() {
  console.log('\n📦 Importando ingredientes de escandallos...');
  
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheet = workbook.Sheets['Articulos Escandallos'];
  
  if (!sheet) {
    console.log('❌ Hoja no encontrada');
    return 0;
  }

  const data = XLSX.utils.sheet_to_json(sheet);
  let importados = 0;
  let actualizados = 0;

  for (const row of data) {
    try {
      const codigo = row['Codigo Platos'];
      const nombre = row['Ingredientes'];
      const unidad = row['unidad '];
      const costeKilo = row['Coste kilo'];
      const tipo = row['Tipo'];

      if (!codigo || !nombre) continue;

      // Verificar si existe
      const existe = await getQuery('SELECT id FROM ingredientes WHERE codigo = ?', [codigo]);

      if (existe) {
        // Actualizar coste si es mayor a 0
        if (costeKilo && costeKilo > 0) {
          await runQuery(
            'UPDATE ingredientes SET coste_kilo = ?, nombre = ? WHERE codigo = ?',
            [costeKilo, nombre, codigo]
          );
          actualizados++;
        }
      } else {
        // Insertar nuevo ingrediente
        await runQuery(`
          INSERT INTO ingredientes (
            codigo, nombre, familia, unidad_escandallo, coste_kilo, activo
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [codigo, nombre, tipo || 'General', unidad || 'Kg', costeKilo || 0, 1]);
        importados++;
      }

      if ((importados + actualizados) % 100 === 0) {
        console.log(`  📊 Progreso: ${importados} nuevos, ${actualizados} actualizados...`);
      }
    } catch (error) {
      // Skip errores
    }
  }

  console.log(`✅ Ingredientes nuevos: ${importados}`);
  console.log(`✅ Ingredientes actualizados: ${actualizados}`);
  return importados;
}

/**
 * Importar todos los escandallos (8,402 registros)
 */
async function importarTodosEscandallos() {
  console.log('\n📋 Importando TODOS los escandallos...');
  
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheet = workbook.Sheets['Escandallos'];
  
  if (!sheet) {
    console.log('❌ Hoja no encontrada');
    return 0;
  }

  const range = XLSX.utils.decode_range(sheet['!ref']);
  const headerRow = 5; // Fila 6 tiene los encabezados

  let importados = 0;
  let nuevos = 0;
  let platosSinExistir = new Set();
  let ingredientesSinExistir = new Set();

  for (let R = headerRow + 1; R <= range.e.r; R++) {
    try {
      const codigoPlatoCell = sheet[XLSX.utils.encode_cell({ r: R, c: 0 })]; // Columna A
      const codigoIngCell = sheet[XLSX.utils.encode_cell({ r: R, c: 2 })]; // Columna C
      const cantidadCell = sheet[XLSX.utils.encode_cell({ r: R, c: 7 })]; // Columna H
      const unidadCell = sheet[XLSX.utils.encode_cell({ r: R, c: 15 })]; // Columna P

      if (!codigoPlatoCell || !codigoIngCell || !cantidadCell) continue;

      const codigoPlato = String(codigoPlatoCell.v).trim();
      const codigoIngrediente = String(codigoIngCell.v).trim();
      const cantidad = parseFloat(cantidadCell.v);

      if (!codigoPlato || !codigoIngrediente || isNaN(cantidad)) continue;

      // Buscar plato
      const plato = await getQuery('SELECT id FROM platos WHERE codigo = ?', [codigoPlato]);
      if (!plato) {
        platosSinExistir.add(codigoPlato);
        
        // Crear plato si no existe
        try {
          await runQuery(
            'INSERT INTO platos (codigo, nombre) VALUES (?, ?)',
            [codigoPlato, codigoPlato]
          );
          const platoNuevo = await getQuery('SELECT id FROM platos WHERE codigo = ?', [codigoPlato]);
          if (!platoNuevo) continue;
          nuevos++;
        } catch (e) {
          continue;
        }
      }

      const platoFinal = await getQuery('SELECT id FROM platos WHERE codigo = ?', [codigoPlato]);
      if (!platoFinal) continue;

      // Buscar ingrediente (puede ser ingrediente o sub-plato)
      let ingrediente = null;
      if (codigoIngrediente.startsWith('AR-')) {
        ingrediente = await getQuery('SELECT id FROM ingredientes WHERE codigo = ?', [codigoIngrediente]);
        if (!ingrediente) {
          ingredientesSinExistir.add(codigoIngrediente);
          continue;
        }
      } else if (codigoIngrediente.startsWith('PL-')) {
        ingrediente = await getQuery('SELECT id FROM platos WHERE codigo = ?', [codigoIngrediente]);
        if (!ingrediente) {
          // Crear el sub-plato si no existe
          try {
            await runQuery(
              'INSERT INTO platos (codigo, nombre) VALUES (?, ?)',
              [codigoIngrediente, codigoIngrediente]
            );
            ingrediente = await getQuery('SELECT id FROM platos WHERE codigo = ?', [codigoIngrediente]);
            if (!ingrediente) continue;
          } catch (e) {
            continue;
          }
        }
      }

      if (!ingrediente) continue;

      // Verificar si ya existe
      const existe = await getQuery(
        'SELECT id FROM escandallos WHERE plato_id = ? AND ingrediente_id = ?',
        [platoFinal.id, ingrediente.id]
      );
      
      if (existe) continue;

      const unidad = unidadCell ? String(unidadCell.v) : 'Kg';

      await runQuery(`
        INSERT INTO escandallos (plato_id, ingrediente_id, cantidad, unidad)
        VALUES (?, ?, ?, ?)
      `, [platoFinal.id, ingrediente.id, cantidad, unidad]);

      importados++;
      if (importados % 500 === 0) {
        console.log(`  📊 Progreso: ${importados} escandallos...`);
      }
    } catch (error) {
      if (importados < 10) {
        console.error(`❌ Error en fila ${R + 1}:`, error.message);
      }
    }
  }

  console.log(`\n✅ Escandallos importados: ${importados}`);
  console.log(`✅ Platos nuevos creados: ${nuevos}`);
  if (platosSinExistir.size > 0) {
    console.log(`⚠️  Platos sin existir: ${platosSinExistir.size} únicos`);
  }
  if (ingredientesSinExistir.size > 0) {
    console.log(`⚠️  Ingredientes sin existir: ${ingredientesSinExistir.size} únicos`);
  }
  
  return importados;
}

/**
 * Importar inventario (stock actual)
 */
async function importarInventario() {
  console.log('\n📦 Importando inventario...');
  
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheet = workbook.Sheets['Inventario'];
  
  if (!sheet) {
    console.log('❌ Hoja no encontrada');
    return 0;
  }

  const range = XLSX.utils.decode_range(sheet['!ref']);
  
  // Buscar fila de encabezados
  let headerRow = -1;
  for (let R = 0; R <= Math.min(20, range.e.r); R++) {
    const cellA = sheet[XLSX.utils.encode_cell({ r: R, c: 0 })];
    if (cellA && String(cellA.v).toLowerCase().includes('codigo')) {
      headerRow = R;
      break;
    }
  }

  if (headerRow === -1) {
    console.log('❌ No se encontraron encabezados');
    return 0;
  }

  console.log(`  📍 Encabezados en fila ${headerRow + 1}`);

  let importados = 0;
  let errores = 0;

  for (let R = headerRow + 1; R <= range.e.r; R++) {
    try {
      const codigoCell = sheet[XLSX.utils.encode_cell({ r: R, c: 0 })];
      const stockCell = sheet[XLSX.utils.encode_cell({ r: R, c: 5 })]; // Columna F típicamente tiene stock

      if (!codigoCell) continue;

      const codigo = String(codigoCell.v).trim();
      const stock = stockCell && !isNaN(stockCell.v) ? parseFloat(stockCell.v) : 0;

      if (!codigo) continue;

      // Buscar o crear ingrediente
      let ingrediente = await getQuery('SELECT id FROM ingredientes WHERE codigo = ?', [codigo]);
      
      if (ingrediente && stock > 0) {
        // Actualizar el peso_neto_envase
        await runQuery(
          'UPDATE ingredientes SET peso_neto_envase = ? WHERE id = ?',
          [stock, ingrediente.id]
        );

        // Verificar si ya existe un registro de inventario para este ingrediente
        const existe = await getQuery(
          'SELECT id FROM inventario WHERE ingrediente_id = ?',
          [ingrediente.id]
        );

        if (!existe) {
          // Crear registro de inventario
          await runQuery(
            `INSERT INTO inventario (ingrediente_id, cantidad, unidad, fecha, created_at, updated_at)
             VALUES (?, ?, 'kg', date('now'), datetime('now'), datetime('now'))`,
            [ingrediente.id, stock]
          );
        } else {
          // Actualizar cantidad existente
          await runQuery(
            'UPDATE inventario SET cantidad = ?, updated_at = datetime(\'now\') WHERE ingrediente_id = ?',
            [stock, ingrediente.id]
          );
        }
        
        importados++;
      }

      if (importados % 100 === 0 && importados > 0) {
        console.log(`  📊 Progreso: ${importados} stocks actualizados...`);
      }
    } catch (error) {
      errores++;
    }
  }

  console.log(`✅ Inventario: ${importados} actualizados, ${errores} errores`);
  return importados;
}

/**
 * Importar partidas (áreas de cocina)
 */
async function importarPartidas() {
  console.log('\n🏪 Importando partidas...');
  
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheet = workbook.Sheets['Partidas'];
  
  if (!sheet) {
    console.log('❌ Hoja no encontrada');
    return 0;
  }

  // Verificar si existe la tabla partidas_cocina
  const tablaExiste = await getQuery(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='partidas_cocina'"
  );

  if (!tablaExiste) {
    console.log('  📝 Creando tabla partidas_cocina...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS partidas_cocina (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        tipo TEXT,
        descripcion TEXT,
        orden INTEGER DEFAULT 0,
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  const data = XLSX.utils.sheet_to_json(sheet);
  let importados = 0;

  for (const row of data) {
    try {
      const nombre = row['Seleccionar la partida abajo'] || row['__EMPTY'] || null;
      
      if (!nombre || typeof nombre !== 'string') continue;
      
      const nombreLimpio = String(nombre).trim();
      if (!nombreLimpio || nombreLimpio === 'Seleccionar la partida abajo') continue;

      const existe = await getQuery('SELECT id FROM partidas_cocina WHERE nombre = ?', [nombreLimpio]);
      if (existe) continue;

      await runQuery(
        'INSERT INTO partidas_cocina (nombre, activo) VALUES (?, ?)',
        [nombreLimpio, 1]
      );
      importados++;
    } catch (error) {
      // Skip duplicados
    }
  }

  console.log(`✅ Partidas: ${importados} importadas`);
  return importados;
}

/**
 * Estadísticas finales
 */
async function mostrarEstadisticas() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ESTADÍSTICAS FINALES:');
  console.log('='.repeat(60));

  const ingredientes = await getQuery('SELECT COUNT(*) as total FROM ingredientes');
  const platos = await getQuery('SELECT COUNT(*) as total FROM platos');
  const escandallos = await getQuery('SELECT COUNT(*) as total FROM escandallos');
  const platosConEscandallo = await getQuery('SELECT COUNT(DISTINCT plato_id) as total FROM escandallos');
  const partidas = await getQuery('SELECT COUNT(*) as total FROM partidas_cocina');

  console.log(`  Ingredientes: ${ingredientes.total}`);
  console.log(`  Platos: ${platos.total}`);
  console.log(`  Escandallos: ${escandallos.total}`);
  console.log(`  Platos con receta: ${platosConEscandallo.total}`);
  if (partidas) {
    console.log(`  Partidas cocina: ${partidas.total}`);
  }
  console.log('='.repeat(60));
}

/**
 * Proceso principal
 */
async function main() {
  try {
    console.log('🚀 IMPORTACIÓN COMPLETA DE FABRICACIÓN.XLSX\n');
    console.log('='.repeat(60));

    await importarIngredientesEscandallos();
    await importarTodosEscandallos();
    await importarInventario();
    await importarPartidas();
    await mostrarEstadisticas();

    console.log('\n✅ IMPORTACIÓN COMPLETADA\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    db.close(() => {
      console.log('🔒 Conexión cerrada');
      process.exit(0);
    });
  }
}

main();
