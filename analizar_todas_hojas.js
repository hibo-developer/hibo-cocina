const XLSX = require('xlsx');

const wb = XLSX.readFile('fabricación.xlsb');

console.log('📊 ANÁLISIS COMPLETO DE TODAS LAS HOJAS\n');

// Platos Menu
console.log('🍽️  PLATOS MENU');
const wsPlatos = wb.Sheets['Platos Menu'];
if (wsPlatos) {
  const data = XLSX.utils.sheet_to_json(wsPlatos);
  if (data.length > 0) {
    console.log('Campos:', Object.keys(data[0]).join(', '));
    console.log('Ejemplo:', JSON.stringify(data.find(r => r['Codigo Platos']), null, 2));
  }
}

// Articulos
console.log('\n\n📦 ARTICULOS');
const wsArticulos = wb.Sheets['Articulos'];
if (wsArticulos) {
  const data = XLSX.utils.sheet_to_json(wsArticulos, {range: 5});
  if (data.length > 0) {
    console.log('Campos:', Object.keys(data[0]).slice(0, 20).join(', '));
    console.log('Ejemplo:', JSON.stringify(data[0], null, 2));
  }
}

// Inventario
console.log('\n\n📊 INVENTARIO');
const wsInventario = wb.Sheets['Inventario'];
if (wsInventario) {
  const data = XLSX.utils.sheet_to_json(wsInventario, {range: 5});
  if (data.length > 0) {
    console.log('Campos:', Object.keys(data[0]).join(', '));
    console.log('Ejemplo:', JSON.stringify(data[0], null, 2));
  }
}

// Partidas
console.log('\n\n🔧 PARTIDAS');
const wsPartidas = wb.Sheets['Partidas'];
if (wsPartidas) {
  const raw = XLSX.utils.sheet_to_json(wsPartidas, {header: 1, range: 0});
  console.log('Primeras 20 filas:');
  raw.slice(0, 20).forEach((row, i) => {
    const filled = row.filter(c => c !== '');
    if (filled.length > 0) console.log(`${i}: ${filled.join(' | ')}`);
  });
}

// Trazabilidad
console.log('\n\n🔍 TRAZABILIDAD FECHA');
const wsTraz = wb.Sheets['Trazabilidad Fecha'];
if (wsTraz) {
  const data = XLSX.utils.sheet_to_json(wsTraz, {header: 1, range: 0});
  console.log('Primeras 10 filas:');
  data.slice(0, 10).forEach((row, i) => {
    const filled = row.filter(c => c !== '');
    if (filled.length > 0) console.log(`${i}: ${filled.slice(0, 15).join(' | ')}`);
  });
}

// Pedidos
console.log('\n\n📋 BASE_PEDIDOS');
const wsPedidos = wb.Sheets['Base_Pedidos'];
if (wsPedidos) {
  const data = XLSX.utils.sheet_to_json(wsPedidos);
  if (data.length > 0) {
    console.log('Campos:', Object.keys(data[0]).join(', '));
    console.log('Ejemplo:', JSON.stringify(data[0], null, 2));
  }
}
