const XLSX = require('xlsx');
const path = require('path');

console.log('📖 Analizando hoja Partidas...\n');

const filePath = path.join(__dirname, 'fabricación.xlsb');
const workbook = XLSX.readFile(filePath);

const hojPartidas = workbook.Sheets['Partidas'];
if (hojPartidas) {
  const datos = XLSX.utils.sheet_to_json(hojPartidas, { defval: '' });
  console.log(`Total filas: ${datos.length}`);
  
  if (datos.length > 0) {
    console.log('\nColumnas disponibles:', Object.keys(datos[0]));
    console.log('\nPrimeras 5 filas completas:');
    datos.slice(0, 5).forEach((row, i) => {
      console.log(`\n--- Fila ${i+1} ---`);
      console.log(JSON.stringify(row, null, 2));
    });
  }
}
