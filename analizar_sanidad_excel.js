const XLSX = require('xlsx');

console.log('\n📊 ANÁLISIS DE HOJA SANIDAD en fabricación.xlsx\n');

const wb = XLSX.readFile('fabricación.xlsx');
const ws = wb.Sheets['Sanidad'];

console.log('Rango de la hoja:', ws['!ref']);

// Leer sin procesar, toda la hoja
const dataRaw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

console.log('\nTotal de filas:', dataRaw.length);
console.log('\n📋 PRIMERAS 15 FILAS (raw):');
dataRaw.slice(0, 15).forEach((row, i) => {
  console.log(`Fila ${i}:`, row.slice(0, 7));
});

// Intentar leer desde diferentes rangos
console.log('\n\n🔍 INTENTANDO LEER DESDE FILA 0:');
const data0 = XLSX.utils.sheet_to_json(ws, { defval: '' });
console.log('Registros:', data0.length);
if (data0.length > 0) {
  console.log('Primer registro:', data0[0]);
}

console.log('\n\n🔍 INTENTANDO LEER DESDE FILA 3:');
const data = XLSX.utils.sheet_to_json(ws, { range: 3, defval: '' });
console.log('Registros:', data.length);
if (data.length > 0) {
  console.log('Primer registro:', data[0]);
  console.log('Columnas:', Object.keys(data[0]));
}

