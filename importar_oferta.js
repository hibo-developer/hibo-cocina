const XLSX = require('xlsx');
const db = require('./src/db/database');

const EXCEL_OFERTA = 'oferta_c.xlsx';

// Promisificar db.run y db.get
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
 * Actualizar platos con datos comerciales de oferta_c.xlsx
 */
async function actualizarPlatosComerciales() {
  console.log('\n💰 Actualizando platos con datos comerciales...');
  
  const workbook = XLSX.readFile(EXCEL_OFERTA);
  const sheet = workbook.Sheets['Platos a la venta'];
  
  if (!sheet) {
    console.log('❌ Hoja "Platos a la venta" no encontrada');
    return 0;
  }

  const range = XLSX.utils.decode_range(sheet['!ref']);
  
  // Encontrar fila de encabezados (fila 2 según análisis)
  const headerRow = 1; // índice 1 = fila 2
  
  // Leer encabezados
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

  const colCodigo = findColumn(['Codigos', 'Codigo']);
  const colNombre = findColumn(['Platos', 'Nombre']);
  const colGrupoMenu = findColumn(['Grupo Menu', 'Grupo']);
  const colPreparacion = findColumn(['Preparacion']);
  const colVenta = findColumn(['Plato a la Venta', 'Venta']);
  const colStock = findColumn(['Activar Stock', 'Stock']);
  const colUnidad = findColumn(['unidad escandallo', 'unidad']);
  const colCosteRacion = findColumn(['Coste Raciones', 'Coste Racion']);
  const colPesoRaciones = findColumn(['PESO RACIONES', 'Peso']);
  const colCosteKilo = findColumn(['Coste kilo', 'Coste/kg']);

  console.log(`  📋 Columnas encontradas:`);
  console.log(`     Codigo=${colCodigo}, Nombre=${colNombre}, CosteRacion=${colCosteRacion}`);

  let actualizados = 0;
  let nuevos = 0;
  let errores = 0;

  // Leer datos desde después del encabezado
  for (let R = headerRow + 1; R <= range.e.r; R++) {
    try {
      const codigoCell = sheet[XLSX.utils.encode_cell({ r: R, c: colCodigo })];
      const nombreCell = sheet[XLSX.utils.encode_cell({ r: R, c: colNombre })];

      if (!codigoCell || !codigoCell.v) continue;

      const codigo = String(codigoCell.v).trim();
      const nombre = nombreCell ? String(nombreCell.v).trim() : codigo;

      if (!codigo) continue;

      // Leer otros campos
      const grupoMenuCell = colGrupoMenu >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colGrupoMenu })] : null;
      const preparacionCell = colPreparacion >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colPreparacion })] : null;
      const ventaCell = colVenta >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colVenta })] : null;
      const stockCell = colStock >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colStock })] : null;
      const unidadCell = colUnidad >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colUnidad })] : null;
      const costeRacionCell = colCosteRacion >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colCosteRacion })] : null;
      const pesoRacionesCell = colPesoRaciones >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colPesoRaciones })] : null;
      const costeKiloCell = colCosteKilo >= 0 ? sheet[XLSX.utils.encode_cell({ r: R, c: colCosteKilo })] : null;

      const platoVenta = ventaCell && String(ventaCell.v).toUpperCase().includes('SI') ? 1 : 0;
      const stockActivo = stockCell && String(stockCell.v).toUpperCase().includes('SI') ? 1 : 0;
      const costeRacion = costeRacionCell && costeRacionCell.v ? parseFloat(costeRacionCell.v) : 0;
      const pesoRaciones = pesoRacionesCell && pesoRacionesCell.v ? parseFloat(pesoRacionesCell.v) : 0;
      const costeKilo = costeKiloCell && costeKiloCell.v ? parseFloat(costeKiloCell.v) : 0;

      // Verificar si existe
      const existe = await getQuery('SELECT id FROM platos WHERE codigo = ?', [codigo]);

      if (existe) {
        // Actualizar plato existente con datos comerciales
        await runQuery(`
          UPDATE platos 
          SET nombre = ?,
              grupo_menu = ?,
              preparacion = ?,
              plato_venta = ?,
              stock_activo = ?,
              unidad = ?,
              coste_racion = ?,
              peso_raciones = ?,
              coste = ?
          WHERE codigo = ?
        `, [
          nombre,
          grupoMenuCell ? String(grupoMenuCell.v) : null,
          preparacionCell ? String(preparacionCell.v) : null,
          platoVenta,
          stockActivo,
          unidadCell ? String(unidadCell.v) : 'Ud',
          costeRacion,
          pesoRaciones,
          costeKilo,
          codigo
        ]);
        actualizados++;
      } else {
        // Crear plato nuevo si no existe
        await runQuery(`
          INSERT INTO platos (
            codigo, nombre, grupo_menu, preparacion, plato_venta, 
            stock_activo, unidad, coste_racion, peso_raciones, coste
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          codigo,
          nombre,
          grupoMenuCell ? String(grupoMenuCell.v) : 'General',
          preparacionCell ? String(preparacionCell.v) : 'Caliente',
          platoVenta,
          stockActivo,
          unidadCell ? String(unidadCell.v) : 'Ud',
          costeRacion,
          pesoRaciones,
          costeKilo
        ]);
        nuevos++;
      }

      if ((actualizados + nuevos) % 100 === 0) {
        console.log(`  📊 Progreso: ${actualizados} actualizados, ${nuevos} nuevos...`);
      }

    } catch (error) {
      errores++;
      if (errores < 10) {
        console.error(`❌ Error en fila ${R + 1}:`, error.message);
      }
    }
  }

  console.log(`\n✅ Platos actualizados: ${actualizados}`);
  console.log(`✅ Platos nuevos: ${nuevos}`);
  console.log(`❌ Errores: ${errores}`);
  
  return { actualizados, nuevos, errores };
}

/**
 * Importar clientes
 */
async function importarClientes() {
  console.log('\n👥 Importando clientes...');
  
  const workbook = XLSX.readFile(EXCEL_OFERTA);
  const sheet = workbook.Sheets['Clientes'];
  
  if (!sheet) {
    console.log('❌ Hoja "Clientes" no encontrada');
    return 0;
  }

  // Verificar si la tabla eventos_clientes existe
  const tablaExiste = await getQuery(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='eventos_clientes'"
  );

  if (!tablaExiste) {
    console.log('  📝 Creando tabla eventos_clientes...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS eventos_clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        menu_evento TEXT,
        nombre_evento TEXT,
        opciones TEXT,
        fecha TEXT,
        num_clientes INTEGER DEFAULT 0,
        coste_estimado REAL DEFAULT 0,
        precio_venta REAL DEFAULT 0,
        servicios TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const headerRow = 1; // Fila 2 tiene los encabezados
  const headers = data[headerRow];

  let importados = 0;
  let errores = 0;

  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    try {
      const codigo = String(row[0]).trim();
      const nombre = row[1] ? String(row[1]).trim() : '';
      
      if (!codigo) continue;

      const existe = await getQuery('SELECT id FROM eventos_clientes WHERE codigo = ?', [codigo]);
      if (existe) continue;

      await runQuery(`
        INSERT INTO eventos_clientes (
          codigo, nombre, menu_evento, nombre_evento, opciones,
          fecha, num_clientes, coste_estimado, precio_venta, servicios
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        codigo,
        nombre,
        row[2] || null,
        row[3] || null,
        row[4] || null,
        row[5] || null,
        parseInt(row[6]) || 0,
        parseFloat(row[8]) || 0,
        parseFloat(row[9]) || 0,
        row[10] || null
      ]);

      importados++;
    } catch (error) {
      errores++;
      if (errores < 5) {
        console.error(`❌ Error en fila ${i + 1}:`, error.message);
      }
    }
  }

  console.log(`✅ Clientes: ${importados} importados, ${errores} errores`);
  return importados;
}

/**
 * Mostrar estadísticas finales
 */
async function mostrarEstadisticas() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ESTADÍSTICAS FINALES:');
  console.log('='.repeat(60));

  const stats = await getQuery(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN coste_racion > 0 THEN 1 END) as con_coste,
      COUNT(CASE WHEN plato_venta = 1 THEN 1 END) as en_venta,
      AVG(coste_racion) as promedio_coste,
      AVG(peso_raciones) as promedio_peso
    FROM platos
  `);

  console.log(`  Total platos: ${stats.total}`);
  console.log(`  Con coste: ${stats.con_coste} (${(stats.con_coste / stats.total * 100).toFixed(1)}%)`);
  console.log(`  En venta: ${stats.en_venta} (${(stats.en_venta / stats.total * 100).toFixed(1)}%)`);
  console.log(`  Coste promedio: €${(stats.promedio_coste || 0).toFixed(4)}`);
  console.log(`  Peso promedio: ${(stats.promedio_peso || 0).toFixed(3)} kg`);

  // Clientes de eventos
  const eventosClientes = await getQuery('SELECT COUNT(*) as total FROM eventos_clientes');
  if (eventosClientes) {
    console.log(`  Eventos/Clientes: ${eventosClientes.total}`);
  }

  console.log('='.repeat(60));
}

/**
 * Proceso principal
 */
async function main() {
  try {
    console.log('🚀 IMPORTACIÓN DE OFERTA_C.XLSX\n');
    console.log('='.repeat(60));

    const resultadoPlatos = await actualizarPlatosComerciales();
    const totalClientes = await importarClientes();

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

// Ejecutar
main();
