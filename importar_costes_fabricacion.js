const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('\n📥 Importando costes de ingredientes desde fabricación.xlsx...\n');

// Leer el archivo Excel
const workbook = XLSX.readFile('./fabricación.xlsx');

console.log('📑 Hojas disponibles:', workbook.SheetNames.join(', '));

// Buscar la hoja que contiene los ingredientes/artículos
let sheetName = workbook.SheetNames.find(name => 
  name.toLowerCase().includes('articulo') || 
  name.toLowerCase().includes('ingrediente') ||
  name.toLowerCase().includes('inv_esc')
);

if (!sheetName) {
  sheetName = workbook.SheetNames[0];
  console.log(`⚠️  No se encontró hoja de artículos, usando: ${sheetName}\n`);
} else {
  console.log(`✅ Usando hoja: ${sheetName}\n`);
}

const worksheet = workbook.Sheets[sheetName];

// Convertir a JSON
const data = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,
  defval: null,
  blankrows: false,
  raw: false
});

console.log('📊 Total de filas:', data.length);
console.log('🔍 Primeras 10 filas para inspección:\n');
data.slice(0, 10).forEach((row, i) => {
  console.log(`Fila ${i}:`, row.slice(0, 8).join(' | '));
});

// Buscar fila de encabezados (normalmente fila 1)
let headerRow = -1;
for (let i = 0; i < Math.min(10, data.length); i++) {
  const row = data[i];
  const hasCodigoInterno = row.some(cell => 
    cell && cell.toString().toLowerCase().includes('codigo') && 
    cell.toString().toLowerCase().includes('interno')
  );
  if (hasCodigoInterno) {
    headerRow = i;
    break;
  }
}

if (headerRow === -1) {
  console.log('\n❌ No se encontró fila de encabezados con "codigo articulo"');
  console.log('💡 Intentando con estructura alternativa...\n');
  
  // Buscar columnas manualmente
  for (let i = 0; i < Math.min(10, data.length); i++) {
    console.log(`\nFila ${i}:`, data[i].slice(0, 12));
  }
  
  db.close();
  process.exit(0);
}

console.log(`\n✅ Encabezados encontrados en fila ${headerRow}`);
const headers = data[headerRow];
console.log('📋 Encabezados:', headers.slice(0, 15));

// Encontrar columnas importantes
const colCodigo = headers.findIndex(h => h && h.toString().toLowerCase().includes('codigo') && h.toString().toLowerCase().includes('interno'));
const colCosteUnidad = headers.findIndex(h => h && h.toString().toLowerCase().includes('coste') && h.toString().toLowerCase().includes('unidad'));
const colCosteKilo = headers.findIndex(h => h && (
  (h.toString().toLowerCase().includes('coste') && (h.toString().toLowerCase().includes('kilo') || h.toString().toLowerCase().includes('kg')))
));
const colCosteEnvase = headers.findIndex(h => h && h.toString().toLowerCase().includes('coste') && h.toString().toLowerCase().includes('envase'));
const colPesoNeto = headers.findIndex(h => h && h.toString().toLowerCase().includes('peso') && h.toString().toLowerCase().includes('neto'));

console.log(`\n🔍 Columnas detectadas:`);
console.log(`   Código articulo: ${colCodigo} ${colCodigo >= 0 ? `(${headers[colCodigo]})` : '❌'}`);
console.log(`   Coste unidad: ${colCosteUnidad} ${colCosteUnidad >= 0 ? `(${headers[colCosteUnidad]})` : '❌'}`);
console.log(`   Coste kilo: ${colCosteKilo} ${colCosteKilo >= 0 ? `(${headers[colCosteKilo]})` : '❌'}`);
console.log(`   Coste envase: ${colCosteEnvase} ${colCosteEnvase >= 0 ? `(${headers[colCosteEnvase]})` : '❌'}`);
console.log(`   Peso neto: ${colPesoNeto} ${colPesoNeto >= 0 ? `(${headers[colPesoNeto]})` : '❌'}`);

if (colCodigo === -1) {
  console.log('\n❌ No se encontró columna de código de artículo');
  db.close();
  process.exit(1);
}

let actualizados = 0;
let noEncontrados = 0;
let errores = 0;

console.log('\n🔄 Procesando filas...\n');

// Procesar filas de datos (después de los encabezados)
const procesarFila = (index) => {
  if (index >= data.length) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ Actualizados: ${actualizados}`);
    console.log(`⚠️  No encontrados en BD: ${noEncontrados}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`${'='.repeat(80)}\n`);
    db.close();
    return;
  }

  const row = data[index];
  if (!row || !row[colCodigo]) {
    procesarFila(index + 1);
    return;
  }

  const codigo = row[colCodigo]?.toString().trim();
  
  // Parsear valores quitando formato de moneda y unidades
  const parseValor = (val) => {
    if (!val) return null;
    const str = val.toString().replace(/[€\s]/g, '').replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  };
  
  const parsePeso = (val) => {
    if (!val) return null;
    const str = val.toString().replace(/kg|lt/gi, '').replace(',', '.').trim();
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  };
  
  const costeUnidad = colCosteUnidad >= 0 ? parseValor(row[colCosteUnidad]) : null;
  const costeKilo = colCosteKilo >= 0 ? parseValor(row[colCosteKilo]) : null;
  const costeEnvase = colCosteEnvase >= 0 ? parseValor(row[colCosteEnvase]) : null;
  const pesoNeto = colPesoNeto >= 0 ? parsePeso(row[colPesoNeto]) : null;

  // Solo actualizar si al menos uno de los costes existe
  if (!costeUnidad && !costeKilo && !costeEnvase) {
    procesarFila(index + 1);
    return;
  }

  db.run(
    `UPDATE ingredientes 
     SET coste_unidad = COALESCE(?, coste_unidad),
         coste_kilo = COALESCE(?, coste_kilo),
         coste_envase = COALESCE(?, coste_envase),
         peso_neto_envase = COALESCE(?, peso_neto_envase)
     WHERE codigo = ?`,
    [costeUnidad, costeKilo, costeEnvase, pesoNeto, codigo],
    function(err) {
      if (err) {
        console.error(`❌ ${codigo}: ${err.message}`);
        errores++;
      } else if (this.changes === 0) {
        noEncontrados++;
      } else {
        console.log(`✅ ${codigo}: coste_kilo=${costeKilo?.toFixed(3) || 'N/A'}€/kg, coste_unidad=${costeUnidad?.toFixed(3) || 'N/A'}€`);
        actualizados++;
      }
      procesarFila(index + 1);
    }
  );
};

// Iniciar procesamiento desde la fila después de los encabezados
procesarFila(headerRow + 1);
