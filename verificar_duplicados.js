const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('🔍 VERIFICACIÓN DE CÓDIGOS DUPLICADOS\n');

// Buscar AR-70 y Ar-70 específicamente
db.all(`
  SELECT id, codigo, nombre, tipo_entidad, familia, proveedor, coste_kilo
  FROM ingredientes
  WHERE LOWER(codigo) = 'ar-70'
  ORDER BY codigo, id
`, [], (err, rows) => {
  
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }
  
  console.log('📋 Resultados para "ar-70":\n');
  
  if (rows.length === 0) {
    console.log('⚠️  No se encontraron registros\n');
  } else {
    rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ID: ${row.id}`);
      console.log(`   Código: "${row.codigo}"`);
      console.log(`   Nombre: ${row.nombre}`);
      console.log(`   Tipo: ${row.tipo_entidad}`);
      console.log(`   Familia: ${row.familia || 'NULL'}`);
      console.log(`   Proveedor: ${row.proveedor || 'NULL'}`);
      console.log(`   Coste/kg: ${row.coste_kilo}€`);
      console.log();
    });
  }
  
  // Ahora buscar TODOS los duplicados sin filtro de tipo_entidad
  console.log('=' + '='.repeat(79));
  console.log('🔍 BUSCANDO TODOS LOS DUPLICADOS (incluye elaborados):\n');
  
  db.all(`
    SELECT 
      LOWER(codigo) as codigo_lower,
      GROUP_CONCAT(id) as ids,
      GROUP_CONCAT(codigo) as codigos,
      GROUP_CONCAT(tipo_entidad) as tipos,
      COUNT(*) as cantidad
    FROM ingredientes
    GROUP BY LOWER(codigo)
    HAVING COUNT(*) > 1
    ORDER BY cantidad DESC, codigo_lower
    LIMIT 20
  `, [], (err2, dups) => {
    
    if (err2) {
      console.error('❌ Error:', err2);
      db.close();
      return;
    }
    
    if (dups.length === 0) {
      console.log('✅ No se encontraron duplicados\n');
    } else {
      console.log(`⚠️  Encontrados ${dups.length} grupos de duplicados:\n`);
      
      dups.forEach((dup, idx) => {
        const ids = dup.ids.split(',');
        const codigos = dup.codigos.split(',');
        const tipos = dup.tipos.split(',');
        
        console.log(`${idx + 1}. "${dup.codigo_lower}" (${dup.cantidad} registros):`);
        codigos.forEach((cod, i) => {
          console.log(`   - ID ${ids[i]}: "${cod}" [${tipos[i]}]`);
        });
        console.log();
      });
    }
    
    db.close();
  });
});
