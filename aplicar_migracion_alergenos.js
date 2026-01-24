const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('./data/hibo-cocina.db');

console.log('🔄 APLICANDO MIGRACIÓN: Agregar alérgenos faltantes\n');
console.log('=' + '='.repeat(79));

const migracionSQL = fs.readFileSync('./migrations/007_agregar_alergenos_faltantes.sql', 'utf-8');

// Separar por líneas y filtrar comentarios y líneas vacías
const comandos = migracionSQL
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd && !cmd.startsWith('--'));

console.log(`\n📋 Ejecutando ${comandos.length} comandos SQL...\n`);

let ejecutados = 0;
let errores = 0;

const ejecutarComando = (index) => {
  if (index >= comandos.length) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Comandos ejecutados: ${ejecutados}`);
    console.log(`   ❌ Errores: ${errores}`);
    
    if (errores === 0) {
      console.log('\n✅ Migración completada exitosamente\n');
      
      // Verificar columnas agregadas
      db.all('PRAGMA table_info(ingredientes)', [], (err, cols) => {
        if (!err) {
          const nuevosAlergenos = cols.filter(c => 
            ['crustaceos', 'cacahuetes', 'soja', 'mostaza', 'moluscos'].includes(c.name)
          );
          console.log('📋 Columnas agregadas en ingredientes:');
          nuevosAlergenos.forEach(c => console.log(`   ✅ ${c.name}`));
        }
        
        db.all('PRAGMA table_info(platos)', [], (err2, cols2) => {
          if (!err2) {
            const nuevosAlergenosPlatos = cols2.filter(c => 
              ['crustaceos', 'cacahuetes', 'soja', 'mostaza', 'moluscos'].includes(c.name)
            );
            console.log('\n📋 Columnas agregadas en platos:');
            nuevosAlergenosPlatos.forEach(c => console.log(`   ✅ ${c.name}`));
          }
          console.log('\n' + '='.repeat(80) + '\n');
          db.close();
        });
      });
    } else {
      console.log('\n⚠️  Migración completada con errores\n');
      db.close();
    }
    return;
  }
  
  const comando = comandos[index];
  const nombreColumna = comando.match(/ADD COLUMN (\w+)/)?.[1] || 'desconocida';
  const tabla = comando.match(/ALTER TABLE (\w+)/)?.[1] || 'desconocida';
  
  process.stdout.write(`   ${tabla}.${nombreColumna}... `);
  
  db.run(comando + ';', (err) => {
    if (err) {
      if (err.message.includes('duplicate column')) {
        console.log('⚠️  Ya existe');
      } else {
        console.log(`❌ Error: ${err.message}`);
        errores++;
      }
    } else {
      console.log('✅');
      ejecutados++;
    }
    ejecutarComando(index + 1);
  });
};

ejecutarComando(0);
