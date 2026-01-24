const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('🔍 ANÁLISIS DE DUPLICADOS EN INGREDIENTES\n');
console.log('=' + '='.repeat(79));

// Encontrar duplicados (códigos que solo difieren en mayúsculas)
db.all(`
  SELECT 
    LOWER(codigo) as codigo_lower,
    GROUP_CONCAT(id) as ids,
    GROUP_CONCAT(codigo) as codigos,
    COUNT(*) as cantidad
  FROM ingredientes
  WHERE tipo_entidad = 'ingrediente'
  GROUP BY LOWER(codigo)
  HAVING COUNT(*) > 1
  ORDER BY cantidad DESC, codigo_lower
`, [], (err, duplicados) => {
  
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  if (duplicados.length === 0) {
    console.log('✅ No se encontraron duplicados\n');
    db.close();
    return;
  }
  
  console.log(`\n⚠️  Encontrados ${duplicados.length} grupos de duplicados:\n`);
  
  duplicados.forEach((dup, idx) => {
    const ids = dup.ids.split(',');
    const codigos = dup.codigos.split(',');
    console.log(`${idx + 1}. Código base: ${dup.codigo_lower} (${dup.cantidad} registros)`);
    codigos.forEach((cod, i) => {
      console.log(`   - ID ${ids[i]}: "${cod}"`);
    });
    console.log();
  });
  
  console.log('=' + '='.repeat(79));
  console.log('🔧 LIMPIEZA DE DUPLICADOS\n');
  
  let procesados = 0;
  let eliminados = 0;
  let errores = 0;
  
  const procesarDuplicado = (index) => {
    if (index >= duplicados.length) {
      console.log('\n' + '='.repeat(80));
      console.log('📊 RESUMEN:');
      console.log(`   ✅ Grupos procesados: ${procesados}`);
      console.log(`   🗑️  Registros eliminados: ${eliminados}`);
      console.log(`   ❌ Errores: ${errores}`);
      console.log('='.repeat(80) + '\n');
      db.close();
      return;
    }
    
    const dup = duplicados[index];
    const ids = dup.ids.split(',').map(id => parseInt(id));
    const codigos = dup.codigos.split(',');
    
    // Obtener información completa de cada duplicado
    const placeholders = ids.map(() => '?').join(',');
    db.all(`
      SELECT id, codigo, nombre, familia, proveedor, coste_kilo, 
             grupo_conservacion, unidad_economato, formato_envases,
             peso_neto_envase, coste_unidad, created_at
      FROM ingredientes
      WHERE id IN (${placeholders})
      ORDER BY 
        CASE WHEN proveedor IS NOT NULL AND proveedor != '' THEN 0 ELSE 1 END,
        CASE WHEN coste_kilo > 0 THEN 0 ELSE 1 END,
        created_at DESC
    `, ids, (err, registros) => {
      
      if (err) {
        console.error(`❌ Error al procesar ${dup.codigo_lower}:`, err.message);
        errores++;
        procesarDuplicado(index + 1);
        return;
      }
      
      // El primero es el más completo, los demás se eliminan
      const mantener = registros[0];
      const eliminar = registros.slice(1);
      
      // Normalizar el código al formato "Ar-XX" (solo primera letra mayúscula)
      const codigoNormalizado = mantener.codigo.charAt(0).toUpperCase() + 
                                mantener.codigo.slice(1).toLowerCase();
      
      console.log(`\n📝 ${dup.codigo_lower}:`);
      console.log(`   ✅ MANTENER: ID ${mantener.id} - "${mantener.codigo}" → "${codigoNormalizado}"`);
      console.log(`      Proveedor: ${mantener.proveedor || 'NULL'}, Coste: ${mantener.coste_kilo}€/kg`);
      
      // Actualizar el código normalizado
      db.run(`UPDATE ingredientes SET codigo = ? WHERE id = ?`, 
        [codigoNormalizado, mantener.id], (err) => {
        
        if (err) {
          console.error(`   ❌ Error al normalizar: ${err.message}`);
          errores++;
        }
        
        // Eliminar duplicados
        let eliminadosEnGrupo = 0;
        const eliminarRegistro = (elimIdx) => {
          if (elimIdx >= eliminar.length) {
            eliminados += eliminadosEnGrupo;
            procesados++;
            procesarDuplicado(index + 1);
            return;
          }
          
          const reg = eliminar[elimIdx];
          console.log(`   🗑️  ELIMINAR: ID ${reg.id} - "${reg.codigo}"`);
          
          db.run(`DELETE FROM ingredientes WHERE id = ?`, [reg.id], (err) => {
            if (err) {
              console.error(`      ❌ Error: ${err.message}`);
              errores++;
            } else {
              eliminadosEnGrupo++;
            }
            eliminarRegistro(elimIdx + 1);
          });
        };
        
        eliminarRegistro(0);
      });
    });
  };
  
  procesarDuplicado(0);
});
