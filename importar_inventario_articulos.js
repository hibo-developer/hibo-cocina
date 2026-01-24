const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'hibo-cocina.db');
const EXCEL_FILE = 'fabricación.xlsb';

let db;

// Helpers de base de datos
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function importarInventarioDesdeArticulos() {
  console.log('\n📦 Importando inventario desde hoja Articulos (con precios)...');
  
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheet = workbook.Sheets['Articulos'];
  
  if (!sheet) {
    console.log('❌ Hoja no encontrada');
    return 0;
  }

  const data = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ''});
  
  let importados = 0;
  let actualizados = 0;
  let errores = 0;

  // Los datos comienzan en la fila 6 (índice 6) - fila 5 es encabezados
  for (let i = 6; i < data.length; i++) {
    try {
      const row = data[i];
      
      const codigo = row[1] ? String(row[1]).trim() : ''; // Columna B
      const nombre = row[2] ? String(row[2]).trim() : ''; // Columna C
      const familia = row[3] ? String(row[3]).trim() : ''; // Columna D
      const grupoConservacion = row[4] ? String(row[4]).trim() : ''; // Columna E
      const unidadEconomato = row[6] ? String(row[6]).trim() : ''; // Columna G
      const unidadEscandallo = row[7] ? String(row[7]).trim() : ''; // Columna H
      const pesoNeto = row[9] && !isNaN(row[9]) ? parseFloat(row[9]) : null; // Columna J
      const costeUnidad = row[11] && !isNaN(row[11]) ? parseFloat(row[11]) : 0; // Columna L
      
      if (!codigo || !nombre) continue;
      
      // Buscar ingrediente por código
      let ingrediente = await getQuery(
        'SELECT id FROM ingredientes WHERE codigo = ?',
        [codigo]
      );
      
      // Si no existe, buscar por nombre similar
      if (!ingrediente) {
        ingrediente = await getQuery(
          'SELECT id FROM ingredientes WHERE LOWER(nombre) LIKE ?',
          [`%${nombre.toLowerCase().substring(0, 20)}%`]
        );
      }
      
      // Si no existe, crear el ingrediente
      if (!ingrediente) {
        // Calcular coste_kilo desde coste_unidad y peso_neto
        let costeKilo = 0;
        if (costeUnidad > 0 && pesoNeto > 0) {
          costeKilo = costeUnidad / pesoNeto;
        }
        
        await runQuery(
          `INSERT INTO ingredientes (codigo, nombre, familia, grupo_conservacion, unidad_economato, unidad_escandallo, 
           peso_neto_envase, coste_unidad, coste_kilo, activo, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
          [codigo, nombre, familia, grupoConservacion, unidadEconomato, unidadEscandallo, pesoNeto, costeUnidad, costeKilo]
        );
        
        ingrediente = await getQuery('SELECT last_insert_rowid() as id');
        console.log(`  ➕ Creado: ${codigo} - ${nombre} (€${costeUnidad})`);
      } else {
        // Actualizar precio si ya existe
        let costeKilo = 0;
        if (costeUnidad > 0 && pesoNeto > 0) {
          costeKilo = costeUnidad / pesoNeto;
        }
        
        await runQuery(
          `UPDATE ingredientes SET coste_unidad = ?, coste_kilo = ?, peso_neto_envase = ?, 
           unidad_economato = ?, unidad_escandallo = ?
           WHERE id = ?`,
          [costeUnidad, costeKilo, pesoNeto, unidadEconomato, unidadEscandallo, ingrediente.id]
        );
      }
      
      if (ingrediente) {
        // Verificar si ya existe un registro de inventario
        const existe = await getQuery(
          'SELECT id FROM inventario WHERE ingrediente_id = ?',
          [ingrediente.id]
        );
        
        if (!existe) {
          // Crear registro de inventario con cantidad 0
          await runQuery(
            `INSERT INTO inventario (ingrediente_id, cantidad, unidad, fecha, fecha_registro, created_at, updated_at)
             VALUES (?, 0, 'kg', date('now'), date('now'), datetime('now'), datetime('now'))`,
            [ingrediente.id]
          );
          importados++;
        } else {
          actualizados++;
        }
      }

      if ((importados + actualizados) % 100 === 0 && (importados + actualizados) > 0) {
        console.log(`  📊 Progreso: ${importados} nuevos, ${actualizados} ya existían...`);
      }
    } catch (error) {
      errores++;
      console.error(`  ❌ Error en fila ${i}:`, error.message);
    }
  }

  console.log(`\n✅ Inventario importado:`);
  console.log(`   - ${importados} registros nuevos`);
  console.log(`   - ${actualizados} ya existían`);
  console.log(`   - ${errores} errores`);
  
  return importados;
}

async function main() {
  console.log('🚀 IMPORTACIÓN DE INVENTARIO DESDE ARTÍCULOS');
  console.log('============================================================\n');
  
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Error al conectar a la base de datos:', err);
      process.exit(1);
    }
    console.log('Base de datos conectada:', DB_PATH);
  });

  try {
    await importarInventarioDesdeArticulos();
    
    // Mostrar estadísticas
    const stats = await getQuery('SELECT COUNT(*) as total FROM inventario');
    console.log(`\n📊 Total de registros en inventario: ${stats.total}`);
    
    console.log('\n✅ IMPORTACIÓN COMPLETADA\n');
  } catch (error) {
    console.error('❌ Error en la importación:', error);
  } finally {
    db.close(() => {
      console.log('🔒 Conexión cerrada');
    });
  }
}

main();
