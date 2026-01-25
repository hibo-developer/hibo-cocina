/**
 * ============================================================================
 * IMPORTADOR DE DATOS DESDE EXCEL A SQLite
 * ============================================================================
 */

const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./data/hibo-cocina.db', (err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err);
    process.exit(1);
  }
  console.log('✅ Conectado a la base de datos SQLite');
});

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

async function importarFabricacion() {
  try {
    console.log('\n📊 Importando fabricación.xlsx...\n');
    
    const workbook = XLSX.readFile('./fabricación.xlsx');

    // Importar Partidas (Producción)
    if (workbook.SheetNames.includes('Partidas')) {
      console.log('📥 Partidas de Cocina:');
      const partidas = XLSX.utils.sheet_to_json(workbook.Sheets['Partidas']);
      console.log(`   Encontradas: ${partidas.length}`);
      
      let importados = 0;
      for (const p of partidas) {
        try {
          const nombre = p['Nombre'] || p['nombre'] || p['NOMBRE'] || '';
          if (nombre) {
            await runAsync(
              'INSERT OR IGNORE INTO partidas_cocina (nombre, responsable, descripcion, activo) VALUES (?, ?, ?, ?)',
              [
                nombre,
                p['Responsable'] || p['responsable'] || p['RESPONSABLE'] || '',
                p['Descripción'] || p['descripcion'] || p['DESCRIPCION'] || '',
                1
              ]
            );
            importados++;
          }
        } catch (e) {}
      }
      console.log(`   ✅ Importadas: ${importados}\n`);
    }

    // Importar Platos
    if (workbook.SheetNames.includes('Platos')) {
      console.log('📥 Platos:');
      const platos = XLSX.utils.sheet_to_json(workbook.Sheets['Platos']);
      console.log(`   Encontrados: ${platos.length}`);
      
      let importados = 0;
      for (const p of platos) {
        try {
          const nombre = p['Nombre'] || p['nombre'] || p['NOMBRE'] || '';
          if (nombre) {
            await runAsync(
              'INSERT OR IGNORE INTO platos (codigo, nombre, categoria, pvp, coste_produccion, activo) VALUES (?, ?, ?, ?, ?, ?)',
              [
                p['Código'] || p['codigo'] || p['CODIGO'] || '',
                nombre,
                p['Categoría'] || p['categoria'] || p['CATEGORIA'] || '',
                parseFloat(p['PVP'] || p['pvp'] || p['Precio'] || 0),
                parseFloat(p['Coste Producción'] || p['coste_produccion'] || p['COSTE'] || 0),
                1
              ]
            );
            importados++;
          }
        } catch (e) {}
      }
      console.log(`   ✅ Importados: ${importados}\n`);
    }

    // Importar Articulos
    if (workbook.SheetNames.includes('Articulos')) {
      console.log('📥 Artículos (Ingredientes):');
      const articulos = XLSX.utils.sheet_to_json(workbook.Sheets['Articulos']);
      console.log(`   Encontrados: ${articulos.length}`);
      
      let importados = 0;
      for (const a of articulos) {
        try {
          const nombre = a['Nombre'] || a['nombre'] || a['NOMBRE'] || '';
          if (nombre) {
            await runAsync(
              'INSERT OR IGNORE INTO ingredientes (nombre, unidad, precio, stock_actual, activo) VALUES (?, ?, ?, ?, ?)',
              [
                nombre,
                a['Unidad'] || a['unidad'] || a['UNIDAD'] || 'kg',
                parseFloat(a['Precio'] || a['precio'] || a['PRECIO'] || 0),
                parseFloat(a['Stock'] || a['stock'] || a['STOCK'] || 0),
                1
              ]
            );
            importados++;
          }
        } catch (e) {}
      }
      console.log(`   ✅ Importados: ${importados}\n`);
    }

    // Importar Escandallos
    if (workbook.SheetNames.includes('Escandallos')) {
      console.log('📥 Escandallos:');
      const escandallos = XLSX.utils.sheet_to_json(workbook.Sheets['Escandallos']);
      console.log(`   Encontrados: ${escandallos.length}`);
      
      let importados = 0;
      for (const e of escandallos) {
        try {
          const platoNombre = e['Plato'] || e['plato'] || e['PLATO'] || '';
          const ingNombre = e['Articulo'] || e['ingrediente'] || e['ARTICULO'] || e['Ingrediente'] || '';
          const cantidad = parseFloat(e['Cantidad'] || e['cantidad'] || e['CANTIDAD'] || 0);
          
          if (platoNombre && ingNombre && cantidad > 0) {
            const plato = await getAsync('SELECT id FROM platos WHERE nombre = ?', [platoNombre]);
            const ingrediente = await getAsync('SELECT id FROM ingredientes WHERE nombre = ?', [ingNombre]);
            
            if (plato && ingrediente) {
              await runAsync(
                'INSERT OR IGNORE INTO escandallos (plato_id, ingrediente_id, cantidad) VALUES (?, ?, ?)',
                [plato.id, ingrediente.id, cantidad]
              );
              importados++;
            }
          }
        } catch (e) {}
      }
      console.log(`   ✅ Importados: ${importados}\n`);
    }

  } catch (error) {
    console.error('❌ Error en fabricación.xlsx:', error.message);
  }
}

async function main() {
  try {
    console.log(`
╔════════════════════════════════════════╗
║   IMPORTADOR: EXCEL → SQLite           ║
╚════════════════════════════════════════╝`);

    await importarFabricacion();

    console.log(`
╔════════════════════════════════════════╗
║   ✅ IMPORTACIÓN COMPLETADA            ║
╚════════════════════════════════════════╝`);

    db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    db.close();
    process.exit(1);
  }
}

main();
