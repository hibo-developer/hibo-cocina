/**
 * Script para importar datos del Excel fabricación.xlsb a la base de datos
 */

const XLSX = require('xlsx');
const db = require('./src/db/database');
const { crearTablas } = require('./src/db/schema');

// Rutas de los archivos Excel
const EXCEL_FABRICACION = './fabricación.xlsb';
const EXCEL_OFERTA = './oferta_c.xlsb';

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
 * Importar artículos/ingredientes
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
      // Saltar fila de encabezados y filas vacías
      const codigo = row['__EMPTY_1']; // Columna B: Codigo Interno
      const nombre = row['__EMPTY_2']; // Columna C: ARTICULOS
      
      if (!codigo || !nombre || codigo === 'Codigo Interno') continue;

      // Verificar si ya existe
      const existe = await getQuery('SELECT id FROM ingredientes WHERE codigo = ?', [codigo]);
      if (existe) {
        console.log(`  ⏭️  Ya existe: ${codigo}`);
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
        row['__EMPTY_3'] || 'General', // Familia
        row['__EMPTY_4'] || 'Neutro', // Grupo Conservacion
        row['__EMPTY_5'] || 'Economato', // Partidas Almacen
        row['__EMPTY_6'] || 'Kg', // Unidad Economato
        row['__EMPTY_7'] || 'Kg', // Unidad Escandallo
        row['__EMPTY_8'] || null, // Formato envases
        parseFloat(row['__EMPTY_9']) || 0, // Peso neto envase
        parseInt(row['__EMPTY_10']) || 1, // Unidad por formatos
        parseFloat(row['__EMPTY_11']) || 0, // Coste unidad
        parseFloat(row['__EMPTY_16']) || 0, // Coste envase
        parseFloat(row['__EMPTY_12']) || 0, // Coste kilo
        row['__EMPTY_22'] || 0, // Sesamo
        row['__EMPTY_23'] || 0, // Pescado
        row['__EMPTY_24'] || 0, // Mariscos
        row['__EMPTY_25'] || 0, // Apio
        row['__EMPTY_26'] || 0, // Frutos secos
        row['__EMPTY_27'] || 0, // Sulfitos
        row['__EMPTY_28'] || 0, // Lacteos
        row['__EMPTY_29'] || 0, // Altramuces
        row['__EMPTY_30'] || 0, // Gluten
        row['__EMPTY_31'] || 0, // Ovoproductos
        1 // activo por defecto
      ]);

      importados++;
      if (importados % 50 === 0) {
        console.log(`  📊 Progreso: ${importados} ingredientes...`);
      }
    } catch (error) {
      errores++;
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  console.log(`\n✅ Ingredientes: ${importados} importados, ${errores} errores`);
  return importados;
}

/**
 * Importar platos del menú
 */
async function importarPlatos() {
  console.log('\n🍽️  Importando platos...');
  
  const workbook = XLSX.readFile(EXCEL_FABRICACION);
  const sheet = workbook.Sheets['Platos Menu'];
  const data = XLSX.utils.sheet_to_json(sheet);

  let importados = 0;
  let errores = 0;

  for (const row of data) {
    try {
      // Saltar filas vacías
      if (!row['Nombre'] || !row['Codigo']) continue;

      const codigo = row['Codigo'];
      const nombre = row['Nombre'];
      
      // Verificar si ya existe
      const existe = await getQuery('SELECT id FROM platos WHERE codigo = ?', [codigo]);
      if (existe) {
        console.log(`  ⏭️  Ya existe: ${codigo}`);
        continue;
      }

      await runQuery(`
        INSERT INTO platos (
          codigo, nombre, descripcion, unidad_escandallo, coste_racion,
          tipo, peso_raciones, plato_venta, grupo_menu, preparacion,
          formato_cubetas, formato_gn100, formato_mono, formato_gn60, formato_gn30,
          stock_activo, stock_cantidad, plantilla_produccion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        codigo,
        nombre,
        row['Descripcion'] || null,
        row['Unidad'] || 'Ud',
        parseFloat(row['Coste ración']) || 0,
        row['Familia'] || 'General',
        parseFloat(row['Peso Raciones']) || 0.75,
        row['Plato Venta'] !== 0 ? 1 : 0,
        row['Grupo Menu'] || null,
        row['Preparacion'] || 'Caliente',
        parseInt(row['Formato Cubetas']) || 0,
        parseInt(row['GN 1/1']) || 0,
        parseInt(row['Mono']) || 0,
        parseInt(row['GN 2/3']) || 0,
        parseInt(row['GN 1/3']) || 0,
        row['Stock'] ? 1 : 0,
        parseInt(row['Stock']) || 0,
        row['Plantilla Produccion'] || 'Preparacion'
      ]);

      importados++;
      console.log(`  ✅ Importado: ${codigo} - ${nombre}`);
    } catch (error) {
      errores++;
      console.error(`  ❌ Error en ${row['Codigo']}: ${error.message}`);
    }
  }

  console.log(`\n✅ Platos: ${importados} importados, ${errores} errores`);
  return importados;
}

/**
 * Importar escandallos (recetas)
 */
async function importarEscandallos() {
  console.log('\n📋 Importando escandallos...');
  
  const workbook = XLSX.readFile(EXCEL_FABRICACION);
  const sheet = workbook.Sheets['Escandallos'];
  const data = XLSX.utils.sheet_to_json(sheet);

  let importados = 0;
  let errores = 0;

  for (const row of data) {
    try {
      // Saltar filas vacías o de resumen
      const platoNombre = row['Articulos  INVENTARIO'];
      const ingredienteNombre = row['__EMPTY_3']; // Columna D
      const cantidad = parseFloat(row['__EMPTY_7']); // Columna H - cantidad

      if (!platoNombre || !ingredienteNombre || !cantidad || cantidad === 0) {
        continue;
      }

      // Buscar IDs en la base de datos
      const plato = await getQuery(
        'SELECT id FROM platos WHERE nombre LIKE ? OR codigo LIKE ?',
        [`%${platoNombre}%`, `%${platoNombre}%`]
      );

      const ingrediente = await getQuery(
        'SELECT id, peso_unidad FROM ingredientes WHERE nombre LIKE ? OR codigo LIKE ?',
        [`%${ingredienteNombre}%`, `%${ingredienteNombre}%`]
      );

      if (!plato || !ingrediente) {
        console.log(`  ⏭️  Relación no encontrada: ${platoNombre} -> ${ingredienteNombre}`);
        continue;
      }

      // Verificar si ya existe esta relación
      const existe = await getQuery(
        'SELECT id FROM escandallos WHERE plato_id = ? AND ingrediente_id = ?',
        [plato.id, ingrediente.id]
      );

      if (existe) {
        console.log(`  ⏭️  Ya existe escandallo: ${platoNombre} -> ${ingredienteNombre}`);
        continue;
      }

      await runQuery(`
        INSERT INTO escandallos (
          plato_id, ingrediente_id, cantidad, unidad, peso_unidad,
          perdida_elaboracion, coste, activa, mise_en_place,
          punto_critico, punto_corrector
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        plato.id,
        ingrediente.id,
        cantidad,
        row['__EMPTY_5'] || 'Kg', // Columna F - unidad
        ingrediente.peso_unidad || 0,
        parseFloat(row['__EMPTY_9']) || 0, // Columna J - pérdida
        parseFloat(row['__EMPTY_12']) || 0, // Columna M - coste
        1, // activa
        row['Mise en place'] || null,
        row['Punto critico'] || null,
        row['Punto corrector'] || null
      ]);

      importados++;
      if (importados % 50 === 0) {
        console.log(`  📊 Progreso: ${importados} escandallos...`);
      }
    } catch (error) {
      errores++;
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  console.log(`\n✅ Escandallos: ${importados} importados, ${errores} errores`);
  return importados;
}

/**
 * Importar inventario inicial
 */
async function importarInventario() {
  console.log('\n📊 Importando inventario...');
  
  const workbook = XLSX.readFile(EXCEL_FABRICACION);
  const sheet = workbook.Sheets['Inventario'];
  const data = XLSX.utils.sheet_to_json(sheet);

  let importados = 0;
  let errores = 0;

  for (const row of data) {
    try {
      const codigo = row['Codigo Interno'];
      const stockActual = parseFloat(row['Inventario']) || 0;

      if (!codigo) continue;

      // Buscar el ingrediente
      const ingrediente = await getQuery(
        'SELECT id FROM ingredientes WHERE codigo = ?',
        [codigo]
      );

      if (!ingrediente) {
        console.log(`  ⏭️  Ingrediente no encontrado: ${codigo}`);
        continue;
      }

      // Verificar si ya existe inventario
      const existe = await getQuery(
        'SELECT id FROM inventario WHERE codigo_articulo = ?',
        [codigo]
      );

      if (existe) {
        // Actualizar
        await runQuery(
          'UPDATE inventario SET stock_actual = ? WHERE codigo_articulo = ?',
          [stockActual, codigo]
        );
        console.log(`  🔄 Actualizado: ${codigo} = ${stockActual}`);
      } else {
        // Insertar
        await runQuery(`
          INSERT INTO inventario (codigo_articulo, stock_actual)
          VALUES (?, ?)
        `, [codigo, stockActual]);
        console.log(`  ✅ Creado: ${codigo} = ${stockActual}`);
      }

      importados++;
    } catch (error) {
      errores++;
      console.error(`  ❌ Error en ${row['Codigo Interno']}: ${error.message}`);
    }
  }

  console.log(`\n✅ Inventario: ${importados} registros, ${errores} errores`);
  return importados;
}

/**
 * Importar partidas de cocina
 */
async function importarPartidas() {
  console.log('\n🏷️  Importando partidas de cocina...');
  
  const workbook = XLSX.readFile(EXCEL_FABRICACION);
  const sheet = workbook.Sheets['Partidas'];
  
  if (!sheet) {
    console.log('  ⚠️  Hoja "Partidas" no encontrada');
    return 0;
  }

  const data = XLSX.utils.sheet_to_json(sheet);

  let importados = 0;
  let errores = 0;

  for (const row of data) {
    try {
      const nombre = row['Partida'] || row['Nombre'];
      if (!nombre) continue;

      const existe = await getQuery(
        'SELECT id FROM partidas_cocina WHERE nombre = ?',
        [nombre]
      );

      if (existe) {
        console.log(`  ⏭️  Ya existe: ${nombre}`);
        continue;
      }

      await runQuery(`
        INSERT INTO partidas_cocina (nombre, descripcion, responsable, activa)
        VALUES (?, ?, ?, ?)
      `, [
        nombre,
        row['Descripcion'] || null,
        row['Responsable'] || null,
        1
      ]);

      importados++;
      console.log(`  ✅ Importado: ${nombre}`);
    } catch (error) {
      errores++;
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  console.log(`\n✅ Partidas: ${importados} importadas, ${errores} errores`);
  return importados;
}

/**
 * Actualizar costes de platos usando el servicio de cálculo
 */
async function recalcularCostesPlatos() {
  console.log('\n💰 Recalculando costes de platos...');

  const CalculadoraCostes = require('./src/services/CalculadoraCostes');
  const calculadora = new CalculadoraCostes(db);

  return new Promise((resolve, reject) => {
    db.all('SELECT codigo FROM platos', [], async (err, platos) => {
      if (err) return reject(err);

      let actualizados = 0;
      let errores = 0;

      for (const plato of platos) {
        try {
          await calculadora.actualizarCostePlato(plato.codigo);
          actualizados++;
          if (actualizados % 10 === 0) {
            console.log(`  📊 Progreso: ${actualizados}/${platos.length} platos...`);
          }
        } catch (error) {
          errores++;
          console.error(`  ❌ Error en ${plato.codigo}: ${error.message}`);
        }
      }

      console.log(`\n✅ Costes recalculados: ${actualizados} platos, ${errores} errores`);
      resolve(actualizados);
    });
  });
}

/**
 * Proceso principal de importación
 */
async function importarTodo() {
  console.log('🚀 INICIANDO IMPORTACIÓN DE DATOS DEL EXCEL\n');
  console.log('=' .repeat(60));

  try {
    // 1. Asegurar que las tablas existen
    console.log('\n1️⃣  Creando estructura de base de datos...');
    await crearTablas();
    console.log('✅ Base de datos preparada');

    // 2. Importar datos base
    const totalIngredientes = await importarIngredientes();
    const totalPlatos = await importarPlatos();
    const totalPartidas = await importarPartidas();
    
    // 3. Importar relaciones
    const totalEscandallos = await importarEscandallos();
    const totalInventario = await importarInventario();
    
    // 4. Recalcular costes con fórmulas
    const totalCostes = await recalcularCostesPlatos();

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE IMPORTACIÓN:');
    console.log('='.repeat(60));
    console.log(`  🔹 Ingredientes/Artículos: ${totalIngredientes}`);
    console.log(`  🔹 Platos: ${totalPlatos}`);
    console.log(`  🔹 Partidas: ${totalPartidas}`);
    console.log(`  🔹 Escandallos: ${totalEscandallos}`);
    console.log(`  🔹 Inventario: ${totalInventario}`);
    console.log(`  🔹 Costes recalculados: ${totalCostes}`);
    console.log('='.repeat(60));
    console.log('\n✅ IMPORTACIÓN COMPLETADA CON ÉXITO\n');

  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error);
    process.exit(1);
  } finally {
    // Cerrar conexión a la base de datos
    db.close((err) => {
      if (err) console.error('Error al cerrar BD:', err);
      else console.log('🔒 Conexión a BD cerrada');
      process.exit(0);
    });
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  importarTodo();
}

module.exports = { importarTodo };
