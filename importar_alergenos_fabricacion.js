const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('\n📥 IMPORTANDO ALÉRGENOS desde fabricación.xlsx...\n');
console.log('=' + '='.repeat(79));

const workbook = XLSX.readFile('./fabricación.xlsx');
const sheetName = workbook.SheetNames.find(name => 
  name.toLowerCase().includes('articulo') || 
  name.toLowerCase().includes('artículo')
);

if (!sheetName) {
  console.error('❌ No se encontró hoja de artículos');
  process.exit(1);
}

const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,
  defval: null,
  raw: false
});

// Buscar fila de encabezados
let headerRow = -1;
for (let i = 0; i < Math.min(10, data.length); i++) {
  const row = data[i];
  if (row.some(cell => cell && cell.toString().toLowerCase().includes('codigo interno'))) {
    headerRow = i;
    break;
  }
}

if (headerRow === -1) {
  console.error('❌ No se encontró fila de encabezados');
  process.exit(1);
}

const headers = data[headerRow];

// Mapear alérgenos (columnas 23-38 según análisis anterior)
const alergenosMap = {
  'Sesamo': 'sesamo',
  'Pescado': 'pescado',
  'Mariscos': 'crustaceos',  // Mariscos incluye crustáceos
  'Apio': 'apio',
  'Frutos secos': 'frutos_secos',
  'Sulfitos': 'sulfitos',
  'Lacteos': 'lacteos',
  'Altramuces': 'altramuces',
  'Gluten': 'gluten',
  'Ovoproductos': 'ovoproductos',
  'Cacahuetes': 'cacahuetes',
  'Soja': 'soja',
  'Mostaza': 'Mostaza',
  'Moluscos': 'Moluscos'
};

const colCodigo = headers.findIndex(h => h && h.toString().toLowerCase().includes('codigo interno'));
const alergenosColumnas = {};

Object.keys(alergenosMap).forEach(nombre => {
  const idx = headers.findIndex(h => h && h.toString().toLowerCase() === nombre.toLowerCase());
  if (idx >= 0) {
    alergenosColumnas[alergenosMap[nombre]] = idx;
  }
});

console.log('✅ Código en columna:', colCodigo + 1);
console.log('📋 Alérgenos detectados:', Object.keys(alergenosColumnas).length);
Object.entries(alergenosColumnas).forEach(([nombre, col]) => {
  console.log(`   - ${nombre}: columna ${col + 1} (${headers[col]})`);
});

const parseAlergeno = (val) => {
  if (!val) return 0;
  const str = val.toString().toUpperCase().trim();
  return (str === 'X' || str === '1' || str === 'SI' || str === 'SÍ') ? 1 : 0;
};

console.log('\n🔄 Procesando ingredientes...\n');

let actualizados = 0;
let noEncontrados = 0;
let errores = 0;

const procesarFila = (index) => {
  if (index >= data.length) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Actualizados: ${actualizados}`);
    console.log(`   ⚠️  No encontrados en BD: ${noEncontrados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log('='.repeat(80) + '\n');
    db.close();
    return;
  }

  const row = data[index];
  if (!row || !row[colCodigo]) {
    procesarFila(index + 1);
    return;
  }

  const codigo = row[colCodigo]?.toString().trim();
  
  // Extraer valores de alérgenos
  const campos = [];
  const valores = [];
  
  Object.entries(alergenosColumnas).forEach(([alergeno, colIdx]) => {
    const valor = parseAlergeno(row[colIdx]);
    campos.push(`${alergeno} = ?`);
    valores.push(valor);
  });
  
  if (campos.length === 0) {
    procesarFila(index + 1);
    return;
  }
  
  valores.push(codigo);
  
  const sql = `UPDATE ingredientes SET ${campos.join(', ')} WHERE codigo = ?`;
  
  db.run(sql, valores, function(err) {
    if (err) {
      console.error(`❌ ${codigo}: ${err.message}`);
      errores++;
    } else if (this.changes === 0) {
      noEncontrados++;
    } else {
      const alergenosActivos = [];
      Object.entries(alergenosColumnas).forEach(([alergeno, colIdx]) => {
        if (parseAlergeno(row[colIdx]) === 1) {
          alergenosActivos.push(alergeno);
        }
      });
      
      if (alergenosActivos.length > 0) {
        console.log(`✅ ${codigo}: ${alergenosActivos.join(', ')}`);
      }
      actualizados++;
    }
    procesarFila(index + 1);
  });
};

procesarFila(headerRow + 1);
