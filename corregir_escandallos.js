const XLSX = require('xlsx');
const path = require('path');
const db = require('./src/db/database');

async function limpiarYReimportar() {
  console.log('🧹 Limpiando datos incorrectos...\n');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Eliminar solo escandallos con plato_id = 0
      db.run('DELETE FROM escandallos WHERE plato_id = 0', (err) => {
        if (err) {
          console.error('Error eliminando escandallos:', err);
        } else {
          console.log('✅ Escandallos incorrectos eliminados\n');
        }
      });
      
      // Verificar estructura
      db.get('SELECT COUNT(*) as total FROM escandallos', (err, row) => {
        console.log('Escandallos restantes:', row?.total);
      });
      
      // Reimportar escandallos correctamente
      console.log('\n📋 Reimportando Escandallos...\n');
      
      const filePath = path.join(__dirname, 'fabricación.xlsb');
      const workbook = XLSX.readFile(filePath);
      const hojEscandallos = workbook.Sheets['Escandallos'];
      
      if (!hojEscandallos) {
        console.log('❌ Hoja Escandallos no encontrada');
        resolve();
        return;
      }
      
      const datos = XLSX.utils.sheet_to_json(hojEscandallos);
      let conteo = 0;
      let errores = 0;
      
      // Crear cache de platos e ingredientes
      db.all('SELECT id, codigo FROM platos', (err, platos) => {
        const platosMap = {};
        platos?.forEach(p => {
          if (p.codigo) platosMap[p.codigo.trim()] = p.id;
        });
        console.log(`📚 Cache de ${Object.keys(platosMap).length} platos creado`);
        
        db.all('SELECT id, codigo FROM ingredientes', (err, ingredientes) => {
          const ingredientesMap = {};
          ingredientes?.forEach(i => {
            if (i.codigo) ingredientesMap[i.codigo.trim()] = i.id;
          });
          console.log(`📚 Cache de ${Object.keys(ingredientesMap).length} ingredientes creado`);
          
          // Si no hay ingredientes, usar artículos
          if (Object.keys(ingredientesMap).length === 0) {
            db.all('SELECT id, codigo FROM articulos', (err, articulos) => {
              articulos?.forEach(a => {
                if (a.codigo) ingredientesMap[a.codigo.trim()] = a.id;
              });
              console.log(`📚 Cache de ${Object.keys(ingredientesMap).length} artículos creado como ingredientes\n`);
              
              procesarEscandallos();
            });
          } else {
            procesarEscandallos();
          }
          
          function procesarEscandallos() {
            let procesados = 0;
            
            datos.forEach((row, index) => {
              const codigoPlato = (row['Código Plato'] || row['Codigo Plato'] || row.codigo_plato || '').toString().trim();
              const codigoIngrediente = (row['Código Artículo'] || row['Codigo Articulo'] || row.codigo_articulo || '').toString().trim();
              const cantidad = parseFloat(row.Cantidad || row.cantidad || 0);
              const unidad = row.Unidad || row.unidad || 'kg';
              const coste = parseFloat(row['Coste'] || row['Coste Total'] || row.coste || 0);
              
              const plato_id = platosMap[codigoPlato];
              const ingrediente_id = ingredientesMap[codigoIngrediente];
              
              if (plato_id && ingrediente_id) {
                db.run(
                  'INSERT INTO escandallos (plato_id, ingrediente_id, cantidad, unidad, coste) VALUES (?, ?, ?, ?, ?)',
                  [plato_id, ingrediente_id, cantidad, unidad, coste],
                  (err) => {
                    procesados++;
                    
                    if (!err) {
                      conteo++;
                    } else {
                      if (!err.message.includes('UNIQUE')) {
                        errores++;
                      }
                    }
                    
                    // Cuando terminemos todos
                    if (procesados === datos.length) {
                      console.log(`\n✅ ${conteo} escandallos importados correctamente`);
                      console.log(`⚠️  ${errores} errores (excluye duplicados)`);
                      
                      // Verificar resultado
                      db.all(`
                        SELECT p.codigo as plato_codigo, i.nombre as ingrediente, COUNT(*) as cant
                        FROM escandallos e
                        JOIN platos p ON e.plato_id = p.id
                        LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
                        GROUP BY e.plato_id
                        LIMIT 5
                      `, (err, rows) => {
                        console.log('\n📊 Primeros 5 platos con escandallos:');
                        rows?.forEach(r => {
                          console.log(`  - ${r.plato_codigo}: ${r.cant} ingredientes`);
                        });
                        
                        setTimeout(() => {
                          resolve();
                          process.exit(0);
                        }, 500);
                      });
                    }
                  }
                );
              } else {
                procesados++;
                if (!plato_id && codigoPlato) errores++;
                if (!ingrediente_id && codigoIngrediente) errores++;
                
                if (procesados === datos.length) {
                  console.log(`\n✅ ${conteo} escandallos importados correctamente`);
                  console.log(`⚠️  ${errores} errores (códigos no encontrados)`);
                  setTimeout(() => {
                    resolve();
                    process.exit(0);
                  }, 500);
                }
              }
            });
          }
        });
      });
    });
  });
}

limpiarYReimportar().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
