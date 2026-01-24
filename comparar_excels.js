const XLSX = require('xlsx');

console.log('📋 COMPARACIÓN: fabricación.xlsx vs fabricación.xlsb\n');
console.log('='.repeat(60));

// Leer ambos archivos
const wbXlsx = XLSX.readFile('fabricación.xlsx');
const wbXlsb = XLSX.readFile('fabricación.xlsb');

console.log('\n📊 HOJAS EN fabricación.xlsx:');
wbXlsx.SheetNames.forEach((name, i) => console.log(`  ${i+1}. ${name}`));

console.log('\n📊 HOJAS EN fabricación.xlsb:');
wbXlsb.SheetNames.forEach((name, i) => console.log(`  ${i+1}. ${name}`));

// Comparar hojas importantes
console.log('\n' + '='.repeat(60));
console.log('COMPARACIÓN DE DATOS:');
console.log('='.repeat(60));

const hojasImportantes = ['Articulos', 'Platos', 'Escandallos', 'Inventario', 'Partidas'];

hojasImportantes.forEach(nombreHoja => {
  console.log(`\n📋 ${nombreHoja}:`);
  
  const sheetXlsx = wbXlsx.Sheets[nombreHoja];
  const sheetXlsb = wbXlsb.Sheets[nombreHoja];

  if (!sheetXlsx && !sheetXlsb) {
    console.log('  ❌ No existe en ninguno');
    return;
  }

  if (!sheetXlsx) {
    console.log('  ⚠️  Solo en .xlsb');
    return;
  }

  if (!sheetXlsb) {
    console.log('  ⚠️  Solo en .xlsx');
    return;
  }

  // Ambos existen, comparar
  const dataXlsx = XLSX.utils.sheet_to_json(sheetXlsx);
  const dataXlsb = XLSX.utils.sheet_to_json(sheetXlsb);

  console.log(`  .xlsx: ${dataXlsx.length} registros`);
  console.log(`  .xlsb: ${dataXlsb.length} registros`);
  
  if (dataXlsx.length !== dataXlsb.length) {
    console.log(`  ⚠️  DIFERENCIA: ${Math.abs(dataXlsx.length - dataXlsb.length)} registros`);
  } else {
    console.log(`  ✅ Mismo número de registros`);
  }

  // Mostrar primeras columnas de .xlsx
  if (dataXlsx.length > 0) {
    const columnas = Object.keys(dataXlsx[0]).slice(0, 5);
    console.log(`  Columnas .xlsx: ${columnas.join(', ')}`);
  }
});

// Hojas únicas en .xlsx
console.log('\n' + '='.repeat(60));
console.log('HOJAS ÚNICAS EN .xlsx:');
const hojasUnicasXlsx = wbXlsx.SheetNames.filter(h => !wbXlsb.SheetNames.includes(h));
if (hojasUnicasXlsx.length > 0) {
  hojasUnicasXlsx.forEach(h => console.log(`  - ${h}`));
} else {
  console.log('  Ninguna');
}

// Hojas únicas en .xlsb
console.log('\nHOJAS ÚNICAS EN .xlsb:');
const hojasUnicasXlsb = wbXlsb.SheetNames.filter(h => !wbXlsx.SheetNames.includes(h));
if (hojasUnicasXlsb.length > 0) {
  hojasUnicasXlsb.forEach(h => console.log(`  - ${h}`));
} else {
  console.log('  Ninguna');
}

console.log('\n' + '='.repeat(60));
console.log('✅ Análisis completado\n');
