const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const EXCEL_FILE = 'fabricación.xlsx';
const DB_PATH = path.join(__dirname, 'data', 'hibo-cocina.db');

console.log('\n📥 IMPORTANDO CONTROLES APPCC desde fabricación.xlsx\n');
console.log('Base de datos:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la BD:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a la base de datos\n');
});

// Leer Excel
const wb = XLSX.readFile(EXCEL_FILE);
const ws = wb.Sheets['Sanidad'];
const dataRaw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

// Las cabeceras están en fila 0, datos desde fila 1
const headers = dataRaw[0];
console.log('📋 Columnas encontradas:', headers);

const registros = [];
for (let i = 1; i < dataRaw.length; i++) {
  const row = dataRaw[i];
  
  // Filtrar registros válidos
  const plato = row[0];
  const seccion = row[1];
  const ingrediente = row[2];
  const procedimiento = row[3];
  const puntoCritico = row[4];
  const puntoCorrector = row[5];
  
  // Solo importar registros con datos útiles
  if (plato && plato !== '0-0,00-0' && plato !== '0-0,00-Kg' && 
      (ingrediente || procedimiento || puntoCritico || puntoCorrector)) {
    
    // Limpiar valores genéricos
    const puntoCriticoFinal = (puntoCritico && puntoCritico !== 'punto critico') ? puntoCritico : null;
    const puntoCorrectorFinal = (puntoCorrector && puntoCorrector !== 'punto corector') ? puntoCorrector : null;
    
    registros.push({
      plato: plato,
      seccion: seccion || '',
      ingrediente: ingrediente || '',
      procedimiento: procedimiento || '',
      punto_critico: puntoCriticoFinal,
      punto_corrector: puntoCorrectorFinal
    });
  }
}

console.log(`\n✅ Registros válidos encontrados: ${registros.length}`);
console.log('\n📊 Ejemplos de registros a importar:');
registros.slice(0, 5).forEach((r, i) => {
  console.log(`\n[${i+1}] ${r.plato} - ${r.ingrediente}`);
  console.log(`    Procedimiento: ${r.procedimiento.substring(0, 60)}...`);
  console.log(`    Punto Crítico: ${r.punto_critico || 'N/A'}`);
});

// Limpiar tabla antes de importar
db.run('DELETE FROM control_sanidad', (err) => {
  if (err) {
    console.error('❌ Error al limpiar tabla:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('\n🗑️  Tabla limpiada');
  console.log('💾 Insertando registros...\n');
  
  // Preparar insert
  const stmt = db.prepare(`
    INSERT INTO control_sanidad 
    (plato_codigo, ingrediente_codigo, fecha_produccion, punto_critico, 
     corrector, observaciones, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  
  let insertados = 0;
  let errores = 0;
  
  registros.forEach((r, index) => {
    stmt.run(
      r.plato,
      r.ingrediente,
      r.procedimiento, // Procedimiento como descripción
      r.punto_critico,
      r.punto_corrector,
      `Sección: ${r.seccion}`, // Sección en observaciones
      (err) => {
        if (err) {
          errores++;
          if (errores <= 5) {
            console.error(`❌ Error en registro ${index + 1}:`, err.message);
          }
        } else {
          insertados++;
          if (insertados % 500 === 0) {
            console.log(`   ⏳ Procesados ${insertados} registros...`);
          }
        }
      }
    );
  });
  
  stmt.finalize((err) => {
    if (err) {
      console.error('❌ Error al finalizar:', err.message);
    }
    
    // Verificar resultados
    db.get('SELECT COUNT(*) as total FROM control_sanidad', (err, row) => {
      if (err) {
        console.error('❌ Error al contar:', err.message);
      } else {
        console.log(`\n✅ IMPORTACIÓN COMPLETADA`);
        console.log(`   📊 Registros insertados: ${row.total}`);
        console.log(`   ❌ Errores: ${errores}`);
      }
      
      // Mostrar estadísticas
      db.all(`
        SELECT plato_codigo, COUNT(*) as controles 
        FROM control_sanidad 
        GROUP BY plato_codigo 
        ORDER BY controles DESC 
        LIMIT 10
      `, (err, rows) => {
        if (!err && rows) {
          console.log('\n📊 Top 10 platos con más controles APPCC:');
          rows.forEach(r => {
            console.log(`   ${r.plato_codigo}: ${r.controles} controles`);
          });
        }
        
        db.close();
      });
    });
  });
});
