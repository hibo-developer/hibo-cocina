const XLSX = require('xlsx');
const db = require('./src/db/database');
const path = require('path');

console.log('🔄 REIMPORTACIÓN DE ESCANDALLOS\n');

// Paso 1: Limpiar tabla de escandallos
console.log('1️⃣ Limpiando tabla de escandallos...');
db.run('DELETE FROM escandallos', [], async (err) => {
  if (err) {
    console.error('❌ Error al limpiar:', err);
    process.exit(1);
  }
  
  console.log('✅ Tabla limpiada\n');
  
  // Paso 2: Cargar archivos Excel
  console.log('2️⃣ Cargando archivos Excel...');
  
  const fabricacionPath = path.join(__dirname, 'fabricación.xlsb');
  const ofertaPath = path.join(__dirname, 'oferta_c.xlsb');
  
  let workbookFab, workbookOferta;
  
  try {
    workbookFab = XLSX.readFile(fabricacionPath, { type: 'binary', cellDates: true });
    console.log('   ✓ fabricación.xlsb cargado');
  } catch (error) {
    console.error('   ❌ Error cargando fabricación.xlsb:', error.message);
  }
  
  try {
    workbookOferta = XLSX.readFile(ofertaPath, { type: 'binary', cellDates: true });
    console.log('   ✓ oferta_c.xlsb cargado\n');
  } catch (error) {
    console.error('   ❌ Error cargando oferta_c.xlsb:', error.message);
  }
  
  if (!workbookFab && !workbookOferta) {
    console.error('❌ No se pudo cargar ningún archivo');
    process.exit(1);
  }
  
  // Paso 3: Obtener mapeo de platos e ingredientes
  console.log('3️⃣ Cargando mapeo de platos e ingredientes...');
  
  const platos = await new Promise((resolve, reject) => {
    db.all('SELECT id, codigo FROM platos', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  const ingredientes = await new Promise((resolve, reject) => {
    db.all('SELECT id, codigo, nombre FROM ingredientes', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  const platoMap = {};
  platos.forEach(p => {
    platoMap[p.codigo] = p.id;
  });
  
  const ingredienteMap = {};
  ingredientes.forEach(i => {
    ingredienteMap[i.codigo] = i.id;
    // También mapear por nombre para mayor flexibilidad
    ingredienteMap[i.nombre.toLowerCase()] = i.id;
  });
  
  console.log(`   ✓ ${platos.length} platos mapeados`);
  console.log(`   ✓ ${ingredientes.length} ingredientes mapeados\n`);
  
  // Paso 4: Importar escandallos
  console.log('4️⃣ Importando escandallos...\n');
  
  let totalImportados = 0;
  let errores = 0;
  
  // Buscar hoja de escandallos en fabricación.xlsb
  const hojasPosibles = [
    'INV_ESC',
    'Inv_Esc',
    'Escandallos',
    'ESCANDALLOS'
  ];
  
  let hoja = null;
  
  if (workbookFab) {
    for (const nombreHoja of hojasPosibles) {
      if (workbookFab.Sheets[nombreHoja]) {
        hoja = workbookFab.Sheets[nombreHoja];
        console.log(`   📄 Usando hoja: ${nombreHoja}`);
        break;
      }
    }
  }
  
  if (!hoja) {
    console.log('   📋 Hojas disponibles en fabricación.xlsb:');
    if (workbookFab) {
      workbookFab.SheetNames.forEach(name => console.log(`      - ${name}`));
    }
    console.log('\n   ⚠️ No se encontró hoja de escandallos con nombre esperado');
    console.log('   Por favor, indica el nombre exacto de la hoja de escandallos.');
    process.exit(0);
  }
  
  // Obtener el rango de celdas
  const range = XLSX.utils.decode_range(hoja['!ref']);
  const headerRow = 5; // Fila 6 tiene los encabezados (índice 5)
  
  console.log(`   📊 Rango: ${hoja['!ref']} (${range.e.r + 1} filas)\n`);
  console.log(`   Leyendo desde fila ${headerRow + 2} (datos comienzan después de headers)...\n`);
  
  // Procesar cada fila desde headerRow + 1
  for (let R = headerRow + 1; R <= range.e.r; R++) {
    // Leer celdas directamente
    const codigoPlatoCell = hoja[XLSX.utils.encode_cell({ r: R, c: 0 })]; // Columna A
    const codigoIngCell = hoja[XLSX.utils.encode_cell({ r: R, c: 2 })]; // Columna C  
    const cantidadCell = hoja[XLSX.utils.encode_cell({ r: R, c: 7 })]; // Columna H
    
    if (!codigoPlatoCell || !codigoIngCell || !cantidadCell) continue;
    
    const codigoPlato = String(codigoPlatoCell.v).trim().toUpperCase();
    const codigoIngrediente = String(codigoIngCell.v).trim();
    const cantidad = parseFloat(cantidadCell.v);
    
    if (!codigoPlato || !codigoIngrediente || isNaN(cantidad) || cantidad === 0) continue;
    
    const platoId = platoMap[codigoPlato];
    const ingredienteId = ingredienteMap[codigoIngrediente];
    
    if (!platoId) {
      errores++;
      if (errores <= 10) {
        console.log(`   ⚠️ Fila ${R+1}: No se encontró plato '${codigoPlato}'`);
      }
      continue;
    }
    
    if (!ingredienteId) {
      errores++;
      if (errores <= 10) {
        console.log(`   ⚠️ Fila ${R+1}: No se encontró ingrediente '${codigoIngrediente}'`);
      }
      continue;
    }
    
    // Insertar en BD
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO escandallos (plato_id, ingrediente_id, cantidad, unidad, coste) VALUES (?, ?, ?, ?, 0)',
        [platoId, ingredienteId, cantidad, 'Kg'],
        (err) => {
          if (err) {
            errores++;
            if (errores <= 5) {
              console.log(`   ❌ Error insertando fila ${R+1}:`, err.message);
            }
            reject(err);
          } else {
            totalImportados++;
            if (totalImportados % 100 === 0) {
              console.log(`   ⏳ Importados ${totalImportados}...`);
            }
            resolve();
          }
        }
      );
    }).catch(() => {}); // Continuar aunque haya errores
  }
  
  console.log('\n✅ IMPORTACIÓN COMPLETADA');
  console.log(`   📊 Total importados: ${totalImportados}`);
  console.log(`   ⚠️ Errores: ${errores}`);
  
  process.exit(0);
});
