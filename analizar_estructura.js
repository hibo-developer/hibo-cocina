const XLSX = require('xlsx');
const path = require('path');

console.log('📖 Analizando estructura de fabricación.xlsb...\n');

const filePath = path.join(__dirname, 'fabricación.xlsb');
const workbook = XLSX.readFile(filePath);

console.log('📋 Hojas disponibles:');
workbook.SheetNames.forEach((name, i) => {
  console.log(`  ${i+1}. ${name}`);
});

console.log('\n📊 Analizando hojas principales...\n');

// Analizar Platos Menu
const hojPlatos = workbook.Sheets['Platos Menu'];
if (hojPlatos) {
  const datos = XLSX.utils.sheet_to_json(hojPlatos, { defval: '' });
  console.log(`🍽️  PLATOS MENU: ${datos.length} registros`);
  if (datos.length > 0) {
    console.log('   Columnas:', Object.keys(datos[0]).slice(0, 10).join(', '));
    console.log('   Ejemplo:', JSON.stringify(datos[0], null, 2).substring(0, 300));
  }
}

// Analizar Articulos
const hojArticulos = workbook.Sheets['Articulos'];
if (hojArticulos) {
  const datos = XLSX.utils.sheet_to_json(hojArticulos, { defval: '' });
  console.log(`\n📦 ARTICULOS: ${datos.length} registros`);
  if (datos.length > 0) {
    console.log('   Columnas:', Object.keys(datos[0]).slice(0, 10).join(', '));
    console.log('   Ejemplo:', JSON.stringify(datos[0], null, 2).substring(0, 300));
  }
}

// Analizar Escandallos
const hojEscandallos = workbook.Sheets['Escandallos'];
if (hojEscandallos) {
  const datos = XLSX.utils.sheet_to_json(hojEscandallos, { defval: '' });
  console.log(`\n📋 ESCANDALLOS: ${datos.length} registros`);
  if (datos.length > 0) {
    console.log('   Columnas:', Object.keys(datos[0]).slice(0, 15).join(', '));
    console.log('   Ejemplo:', JSON.stringify(datos[0], null, 2).substring(0, 400));
  }
}

// Analizar Inventario
const hojInventario = workbook.Sheets['Inventario'];
if (hojInventario) {
  const datos = XLSX.utils.sheet_to_json(hojInventario, { defval: '' });
  console.log(`\n📊 INVENTARIO: ${datos.length} registros`);
  if (datos.length > 0) {
    console.log('   Columnas:', Object.keys(datos[0]).join(', '));
    console.log('   Ejemplo:', JSON.stringify(datos[0], null, 2).substring(0, 300));
  }
}
