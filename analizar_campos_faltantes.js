const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');
const XLSX = require('xlsx');

console.log('🔍 ANÁLISIS DE CAMPOS FALTANTES\n');
console.log('=' + '='.repeat(79));

// 1. Ver qué columnas tiene el Excel
console.log('\n📊 COLUMNAS EN fabricación.xlsx:\n');

const workbook = XLSX.readFile('fabricación.xlsx');
const sheetName = workbook.SheetNames.find(name => 
  name.toLowerCase().includes('articulo') || 
  name.toLowerCase().includes('artículo')
);

if (!sheetName) {
  console.error('❌ No se encontró hoja "Articulos"');
  process.exit(1);
}

const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

// Encontrar fila de encabezados
let headerRow = null;
let headerRowIndex = -1;

for (let i = 0; i < Math.min(data.length, 10); i++) {
  const row = data[i];
  if (row.some(cell => cell && cell.toString().toLowerCase().includes('codigo'))) {
    headerRow = row;
    headerRowIndex = i;
    break;
  }
}

if (!headerRow) {
  console.error('❌ No se encontró fila de encabezados');
  process.exit(1);
}

headerRow.forEach((col, idx) => {
  if (col) {
    console.log(`   Col ${idx + 1}: ${col}`);
  }
});

// 2. Ver qué campos de ingredientes están vacíos
console.log('\n\n📋 CAMPOS EN TABLA INGREDIENTES Y SU ESTADO:\n');

db.all(`SELECT 
          COUNT(*) as total,
          COUNT(unidad_economato) as con_unidad_economato,
          COUNT(formato_envases) as con_formato_envases,
          COUNT(peso_neto_envase) as con_peso_envase,
          COUNT(unidad_por_formatos) as con_unidad_formatos,
          COUNT(coste_kilo) as con_coste_kilo,
          COUNT(coste_unidad) as con_coste_unidad,
          COUNT(coste_envase) as con_coste_envase,
          COUNT(familia) as con_familia,
          COUNT(proveedor) as con_proveedor,
          COUNT(grupo_conservacion) as con_grupo_conservacion
        FROM ingredientes 
        WHERE tipo_entidad = 'ingrediente'`, [], (err, rows) => {
  
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  const stats = rows[0];
  const total = stats.total;
  
  console.log(`Total ingredientes: ${total}\n`);
  
  const campos = [
    { nombre: 'unidad_economato', count: stats.con_unidad_economato },
    { nombre: 'formato_envases', count: stats.con_formato_envases },
    { nombre: 'peso_neto_envase', count: stats.con_peso_envase },
    { nombre: 'unidad_por_formatos', count: stats.con_unidad_formatos },
    { nombre: 'coste_kilo', count: stats.con_coste_kilo },
    { nombre: 'coste_unidad', count: stats.con_coste_unidad },
    { nombre: 'coste_envase', count: stats.con_coste_envase },
    { nombre: 'familia', count: stats.con_familia },
    { nombre: 'proveedor', count: stats.con_proveedor },
    { nombre: 'grupo_conservacion', count: stats.con_grupo_conservacion }
  ];
  
  campos.forEach(campo => {
    const porcentaje = (campo.count / total * 100).toFixed(1);
    const barra = '█'.repeat(Math.round(porcentaje / 5));
    const estado = campo.count === 0 ? '❌ VACÍO' : 
                   campo.count < total / 2 ? '⚠️  PARCIAL' : '✅ OK';
    
    console.log(`${estado} ${campo.nombre.padEnd(25)} ${campo.count.toString().padStart(4)} / ${total} (${porcentaje}%) ${barra}`);
  });
  
  // 3. Mostrar algunos ejemplos de registros
  console.log('\n\n📋 EJEMPLOS DE INGREDIENTES (primeros 5):\n');
  
  db.all(`SELECT codigo, nombre, unidad_economato, formato_envases, 
                 peso_neto_envase, coste_kilo, coste_unidad, familia, proveedor
          FROM ingredientes 
          WHERE tipo_entidad = 'ingrediente' 
          LIMIT 5`, [], (err2, ejemplos) => {
    
    ejemplos.forEach((ing, idx) => {
      console.log(`${idx + 1}. ${ing.codigo}: ${ing.nombre}`);
      console.log(`   Unidad economato: ${ing.unidad_economato || '❌ NULL'}`);
      console.log(`   Formato envases: ${ing.formato_envases || '❌ NULL'}`);
      console.log(`   Peso envase: ${ing.peso_neto_envase || '❌ NULL'}`);
      console.log(`   Coste kilo: ${ing.coste_kilo || '❌ NULL'}€`);
      console.log(`   Coste unidad: ${ing.coste_unidad || '❌ NULL'}€`);
      console.log(`   Familia: ${ing.familia || '❌ NULL'}`);
      console.log(`   Proveedor: ${ing.proveedor || '❌ NULL'}`);
      console.log();
    });
    
    db.close();
  });
});
