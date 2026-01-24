const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('\n📥 IMPORTACIÓN COMPLETA de datos desde fabricación.xlsx...\n');
console.log('=' + '='.repeat(79));

// Leer el archivo Excel
const workbook = XLSX.readFile('./fabricación.xlsx');

// Buscar la hoja de artículos
let sheetName = workbook.SheetNames.find(name => 
  name.toLowerCase().includes('articulo') || 
  name.toLowerCase().includes('artículo')
);

if (!sheetName) {
  console.error('❌ No se encontró hoja de artículos');
  process.exit(1);
}

console.log(`✅ Usando hoja: ${sheetName}\n`);

const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,
  defval: null,
  blankrows: false,
  raw: false
});

console.log(`📊 Total de filas: ${data.length}`);

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

console.log(`✅ Encabezados en fila ${headerRow}\n`);
const headers = data[headerRow];

// Función helper para buscar columna
const findCol = (keywords) => {
  return headers.findIndex(h => {
    if (!h) return false;
    const text = h.toString().toLowerCase();
    return keywords.every(k => text.includes(k.toLowerCase()));
  });
};

// Mapear todas las columnas importantes
const cols = {
  codigo: findCol(['codigo', 'interno']),
  nombre: findCol(['articulos']),
  familia: findCol(['familia']),
  grupoConserv: findCol(['grupo', 'conserv']),
  partidas: findCol(['partidas', 'almacen']),
  unidadEconomato: findCol(['unidad', 'economato']),
  unidadEscandallo: findCol(['unidad', 'escandallo']),
  formatoEnvases: findCol(['formato', 'envases']),
  pesoNeto: findCol(['peso', 'neto']),
  unidadFormatos: findCol(['unidad', 'formatos']),
  costeUnidad: findCol(['coste', 'unidad']),
  costeKilo: findCol(['coste', 'kilo']),
  costeEnvase: findCol(['coste', 'envase']),
  proveedor: findCol(['proveedores'])
};

console.log('🔍 Columnas detectadas:');
Object.entries(cols).forEach(([key, idx]) => {
  const status = idx >= 0 ? '✅' : '❌';
  const colName = idx >= 0 ? headers[idx] : 'NO ENCONTRADA';
  console.log(`   ${status} ${key.padEnd(20)} Col ${idx + 1}\t${colName}`);
});

if (cols.codigo === -1) {
  console.error('\n❌ No se encontró columna de código');
  db.close();
  process.exit(1);
}

// Helpers para parsear valores
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

const parseTexto = (val) => {
  if (!val) return null;
  return val.toString().trim() || null;
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
    
    // Mostrar estadísticas finales
    db.get(`SELECT 
              COUNT(*) as total,
              COUNT(proveedor) as con_proveedor,
              COUNT(unidad_economato) as con_unidad_eco,
              COUNT(formato_envases) as con_formato,
              COUNT(coste_kilo) as con_coste_kilo
            FROM ingredientes 
            WHERE tipo_entidad = 'ingrediente'`, [], (err, stats) => {
      if (!err) {
        console.log('📈 ESTADO FINAL DE LA TABLA:');
        console.log(`   Total ingredientes: ${stats.total}`);
        console.log(`   Con proveedor: ${stats.con_proveedor} (${(stats.con_proveedor/stats.total*100).toFixed(1)}%)`);
        console.log(`   Con unidad_economato: ${stats.con_unidad_eco} (${(stats.con_unidad_eco/stats.total*100).toFixed(1)}%)`);
        console.log(`   Con formato_envases: ${stats.con_formato} (${(stats.con_formato/stats.total*100).toFixed(1)}%)`);
        console.log(`   Con coste_kilo: ${stats.con_coste_kilo} (${(stats.con_coste_kilo/stats.total*100).toFixed(1)}%)`);
      }
      db.close();
    });
    return;
  }

  const row = data[index];
  if (!row || !row[cols.codigo]) {
    procesarFila(index + 1);
    return;
  }

  const codigo = parseTexto(row[cols.codigo]);
  if (!codigo) {
    procesarFila(index + 1);
    return;
  }

  // Extraer todos los campos
  const valores = {
    nombre: cols.nombre >= 0 ? parseTexto(row[cols.nombre]) : null,
    familia: cols.familia >= 0 ? parseTexto(row[cols.familia]) : null,
    grupoConserv: cols.grupoConserv >= 0 ? parseTexto(row[cols.grupoConserv]) : null,
    partidas: cols.partidas >= 0 ? parseTexto(row[cols.partidas]) : null,
    unidadEconomato: cols.unidadEconomato >= 0 ? parseTexto(row[cols.unidadEconomato]) : null,
    unidadEscandallo: cols.unidadEscandallo >= 0 ? parseTexto(row[cols.unidadEscandallo]) : null,
    formatoEnvases: cols.formatoEnvases >= 0 ? parseTexto(row[cols.formatoEnvases]) : null,
    pesoNeto: cols.pesoNeto >= 0 ? parsePeso(row[cols.pesoNeto]) : null,
    unidadFormatos: cols.unidadFormatos >= 0 ? parseValor(row[cols.unidadFormatos]) : null,
    costeUnidad: cols.costeUnidad >= 0 ? parseValor(row[cols.costeUnidad]) : null,
    costeKilo: cols.costeKilo >= 0 ? parseValor(row[cols.costeKilo]) : null,
    costeEnvase: cols.costeEnvase >= 0 ? parseValor(row[cols.costeEnvase]) : null,
    proveedor: cols.proveedor >= 0 ? parseTexto(row[cols.proveedor]) : null
  };

  // Actualizar en la base de datos (solo los campos que tienen valor)
  const campos = [];
  const params = [];
  
  if (valores.familia) { campos.push('familia = ?'); params.push(valores.familia); }
  if (valores.grupoConserv) { campos.push('grupo_conservacion = ?'); params.push(valores.grupoConserv); }
  if (valores.partidas) { campos.push('partidas_almacen = ?'); params.push(valores.partidas); }
  if (valores.unidadEconomato) { campos.push('unidad_economato = ?'); params.push(valores.unidadEconomato); }
  if (valores.unidadEscandallo) { campos.push('unidad_escandallo = ?'); params.push(valores.unidadEscandallo); }
  if (valores.formatoEnvases) { campos.push('formato_envases = ?'); params.push(valores.formatoEnvases); }
  if (valores.pesoNeto !== null) { campos.push('peso_neto_envase = ?'); params.push(valores.pesoNeto); }
  if (valores.unidadFormatos !== null) { campos.push('unidad_por_formatos = ?'); params.push(valores.unidadFormatos); }
  if (valores.costeUnidad !== null) { campos.push('coste_unidad = ?'); params.push(valores.costeUnidad); }
  if (valores.costeKilo !== null) { campos.push('coste_kilo = ?'); params.push(valores.costeKilo); }
  if (valores.costeEnvase !== null) { campos.push('coste_envase = ?'); params.push(valores.costeEnvase); }
  if (valores.proveedor) { campos.push('proveedor = ?'); params.push(valores.proveedor); }

  if (campos.length === 0) {
    procesarFila(index + 1);
    return;
  }

  params.push(codigo); // WHERE codigo = ?

  const sql = `UPDATE ingredientes SET ${campos.join(', ')} WHERE codigo = ?`;

  db.run(sql, params, function(err) {
    if (err) {
      console.error(`❌ ${codigo}: ${err.message}`);
      errores++;
    } else if (this.changes === 0) {
      noEncontrados++;
    } else {
      const info = [];
      if (valores.proveedor) info.push(`proveedor="${valores.proveedor}"`);
      if (valores.costeKilo) info.push(`${valores.costeKilo.toFixed(3)}€/kg`);
      if (valores.unidadEconomato) info.push(`${valores.unidadEconomato}`);
      console.log(`✅ ${codigo}: ${info.join(', ')}`);
      actualizados++;
    }
    procesarFila(index + 1);
  });
};

// Iniciar procesamiento
procesarFila(headerRow + 1);
