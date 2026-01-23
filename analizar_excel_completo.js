const XLSX = require('xlsx');
const fs = require('fs');

console.log('═══════════════════════════════════════════════════════════');
console.log('📊 ANÁLISIS COMPLETO DE ARCHIVOS EXCEL');
console.log('═══════════════════════════════════════════════════════════\n');

// Analizar fabricación.xlsb
console.log('📋 ARCHIVO: fabricación.xlsb');
console.log('───────────────────────────────────────────────────────────');

const wb1 = XLSX.readFile('fabricación.xlsb');
console.log('Total de hojas:', wb1.SheetNames.length);

wb1.SheetNames.forEach((sheet, idx) => {
  const ws = XLSX.utils.sheet_to_json(wb1.Sheets[sheet], { defval: '' });
  console.log(`\n${idx + 1}. [${sheet}]`);
  console.log(`   Registros: ${ws.length}`);
  if (ws.length > 0) {
    const cols = Object.keys(ws[0]);
    console.log(`   Columnas: ${cols.join(', ')}`);
    if (ws.length > 0) {
      console.log(`   Primer registro:`, JSON.stringify(ws[0], null, 2).substring(0, 300));
    }
  }
});

// Analizar oferta_c.xlsb
console.log('\n\n📋 ARCHIVO: oferta_c.xlsb');
console.log('───────────────────────────────────────────────────────────');

const wb2 = XLSX.readFile('oferta_c.xlsb');
console.log('Total de hojas:', wb2.SheetNames.length);

wb2.SheetNames.forEach((sheet, idx) => {
  const ws = XLSX.utils.sheet_to_json(wb2.Sheets[sheet], { defval: '' });
  console.log(`\n${idx + 1}. [${sheet}]`);
  console.log(`   Registros: ${ws.length}`);
  if (ws.length > 0) {
    const cols = Object.keys(ws[0]);
    console.log(`   Columnas: ${cols.join(', ')}`);
    if (ws.length > 0) {
      console.log(`   Primer registro:`, JSON.stringify(ws[0], null, 2).substring(0, 300));
    }
  }
});

console.log('\n═══════════════════════════════════════════════════════════');
