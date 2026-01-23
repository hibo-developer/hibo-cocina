const XLSX = require('xlsx');

const wb = XLSX.readFile('fabricación.xlsb');
const ws = wb.Sheets['Articulos Escandallos'];

if (ws) {
  const data = XLSX.utils.sheet_to_json(ws);
  
  console.log('📋 ANÁLISIS DE ESCANDALLOS\n');
  console.log('Total registros:', data.length);
  
  // Ver todos los campos únicos
  const allKeys = new Set();
  data.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
  
  console.log('\n📝 CAMPOS DISPONIBLES:');
  Array.from(allKeys).forEach(k => console.log('  -', k));
  
  // Ver ejemplos de cada tipo
  console.log('\n🍽️  EJEMPLO PLATO:');
  const plato = data.find(r => r.Tipo === 'Platos');
  if (plato) console.log(JSON.stringify(plato, null, 2));
  
  console.log('\n🥕 EJEMPLO INGREDIENTE:');
  const ingrediente = data.find(r => r.Tipo === 'Ingredientes');
  if (ingrediente) console.log(JSON.stringify(ingrediente, null, 2));
  
  // Ver estructura de relación
  console.log('\n🔗 PRIMEROS 10 REGISTROS:');
  data.slice(0, 10).forEach((r, i) => {
    console.log(`${i+1}. ${r['Codigo Platos']} | ${r.Ingredientes} | ${r.Tipo}`);
  });
}
