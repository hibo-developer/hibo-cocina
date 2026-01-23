const XLSX = require('xlsx');

const wb = XLSX.readFile('fabricación.xlsb');

console.log('🔍 ANÁLISIS DE LÓGICA Y FÓRMULAS DEL EXCEL\n');

// Analizar Escandallos para ver cálculos de costes
console.log('=' .repeat(80));
console.log('📖 ESCANDALLOS - Cálculo de Costes y Recetas');
console.log('=' .repeat(80));
const wsEsc = wb.Sheets['Escandallos'];
if (wsEsc) {
  const ref = XLSX.utils.decode_range(wsEsc['!ref']);
  console.log('Rango de datos:', wsEsc['!ref']);
  
  // Buscar fórmulas en las primeras filas
  console.log('\nFórmulas encontradas:');
  for (let R = 0; R < Math.min(20, ref.e.r); ++R) {
    for (let C = 0; C < ref.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({r: R, c: C});
      const cell = wsEsc[cell_address];
      if (cell && cell.f) {
        console.log(`  ${cell_address}: ${cell.f} = ${cell.v}`);
      }
    }
  }
  
  // Leer algunos registros para entender la estructura
  const dataEsc = XLSX.utils.sheet_to_json(wsEsc, {header: 1});
  console.log('\nEstructura de datos (primeras 3 filas):');
  dataEsc.slice(0, 3).forEach((row, i) => {
    console.log(`Fila ${i}:`, row.slice(0, 15).filter(x => x).join(' | '));
  });
}

// Analizar Platos Menu para ver cálculos
console.log('\n' + '=' .repeat(80));
console.log('🍽️  PLATOS MENU - Cálculo de Costes de Raciones');
console.log('=' .repeat(80));
const wsPlatos = wb.Sheets['Platos Menu'];
if (wsPlatos) {
  console.log('Rango de datos:', wsPlatos['!ref']);
  
  console.log('\nFórmulas encontradas:');
  const ref = XLSX.utils.decode_range(wsPlatos['!ref']);
  for (let R = 0; R < Math.min(20, ref.e.r); ++R) {
    for (let C = 0; C < ref.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({r: R, c: C});
      const cell = wsPlatos[cell_address];
      if (cell && cell.f) {
        console.log(`  ${cell_address}: ${cell.f}`);
      }
    }
  }
}

// Analizar Trazabilidad para ver cálculos de stock
console.log('\n' + '=' .repeat(80));
console.log('📋 TRAZABILIDAD - Control de Stock Semanal');
console.log('=' .repeat(80));
const wsTraz = wb.Sheets['Trazabilidad Fecha'];
if (wsTraz) {
  console.log('Rango de datos:', wsTraz['!ref']);
  
  console.log('\nFórmulas encontradas (primeras 10):');
  const ref = XLSX.utils.decode_range(wsTraz['!ref']);
  let count = 0;
  for (let R = 0; R < Math.min(50, ref.e.r) && count < 10; ++R) {
    for (let C = 0; C < ref.e.c && count < 10; ++C) {
      const cell_address = XLSX.utils.encode_cell({r: R, c: C});
      const cell = wsTraz[cell_address];
      if (cell && cell.f) {
        console.log(`  ${cell_address}: ${cell.f}`);
        count++;
      }
    }
  }
}

// Analizar Inventario para ver control de stock
console.log('\n' + '=' .repeat(80));
console.log('📦 INVENTARIO - Control de Stock y Necesidades');
console.log('=' .repeat(80));
const wsInv = wb.Sheets['Inventario'];
if (wsInv) {
  console.log('Rango de datos:', wsInv['!ref']);
  
  const dataInv = XLSX.utils.sheet_to_json(wsInv, {header: 1, range: 0});
  console.log('\nPrimeras filas:', JSON.stringify(dataInv.slice(0, 5), null, 2));
}

// Analizar Base_Pedidos para ver lógica de pedidos
console.log('\n' + '=' .repeat(80));
console.log('📋 BASE PEDIDOS - Cálculo de Necesidades');
console.log('=' .repeat(80));
const wsPed = wb.Sheets['Base_Pedidos'];
if (wsPed) {
  console.log('Rango de datos:', wsPed['!ref']);
  
  console.log('\nFórmulas encontradas (primeras 10):');
  const ref = XLSX.utils.decode_range(wsPed['!ref']);
  let count = 0;
  for (let R = 0; R < Math.min(50, ref.e.r) && count < 10; ++R) {
    for (let C = 0; C < ref.e.c && count < 10; ++C) {
      const cell_address = XLSX.utils.encode_cell({r: R, c: C});
      const cell = wsPed[cell_address];
      if (cell && cell.f) {
        console.log(`  ${cell_address}: ${cell.f}`);
        count++;
      }
    }
  }
}

console.log('\n' + '=' .repeat(80));
console.log('✅ Análisis completado');
console.log('=' .repeat(80));
