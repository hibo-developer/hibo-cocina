const XLSX = require('xlsx');
const path = require('path');
const Articulo = require('./src/models/Articulo');
const Escandallo = require('./src/models/Escandallo');
const Inventario = require('./src/models/Inventario');

async function importarDatos() {
  console.log('🔄 Iniciando importación de datos desde Excel...\n');

  try {
    // Leer archivo Excel
    const filePath = path.join(__dirname, 'fabricación.xlsb');
    const workbook = XLSX.readFile(filePath);
    
    // 1. Importar Artículos
    console.log('📦 Importando Artículos...');
    const hojArticulos = workbook.Sheets['Articulos'];
    if (hojArticulos) {
      const datos = XLSX.utils.sheet_to_json(hojArticulos);
      let conteo = 0;
      
      for (const row of datos) {
        try {
          await Articulo.crear({
            codigo: row.Código || row.codigo || '',
            nombre: row.Nombre || row.nombre || '',
            unidad: row.Unidad || row.unidad || 'kg',
            coste_kilo: parseFloat(row['Coste/kilo'] || row.coste_kilo || 0),
            tipo: row.Tipo || row.tipo || '',
            grupo_conservacion: row['Grupo Conservación'] || row.grupo_conservacion || 'Temperatura Ambiente'
          });
          conteo++;
        } catch (error) {
          // Ignorar errores de clave duplicada
          if (!error.message.includes('UNIQUE')) {
            console.error(`  Error importando artículo: ${row.Código}`, error.message);
          }
        }
      }
      console.log(`  ✅ ${conteo} artículos importados\n`);
    }

    // 2. Importar Escandallos
    console.log('🍽️  Importando Escandallos...');
    const hojEscandallos = workbook.Sheets['Escandallos'];
    if (hojEscandallos) {
      const datos = XLSX.utils.sheet_to_json(hojEscandallos);
      let conteo = 0;
      
      for (const row of datos) {
        try {
          // Primero obtener el ID del artículo por código
          const articulo = await Articulo.obtenerPorCodigo(
            row['Código Artículo'] || row.codigo_articulo || ''
          );
          
          if (articulo) {
            await Escandallo.crear({
              codigo_plato: row['Código Plato'] || row.codigo_plato || '',
              articulo_id: articulo.id,
              cantidad: parseFloat(row.Cantidad || 0),
              unidad: row.Unidad || row.unidad || 'kg',
              coste_total: parseFloat(row['Coste Total'] || row.coste_total || 0)
            });
            conteo++;
          }
        } catch (error) {
          if (!error.message.includes('UNIQUE')) {
            console.error(`  Error importando escandallo`, error.message);
          }
        }
      }
      console.log(`  ✅ ${conteo} escandallos importados\n`);
    }

    // 3. Importar Inventario
    console.log('📊 Importando Inventario...');
    const hojInventario = workbook.Sheets['Inventario'];
    if (hojInventario) {
      const datos = XLSX.utils.sheet_to_json(hojInventario);
      let conteo = 0;
      
      for (const row of datos) {
        try {
          // Obtener ID del artículo
          const articulo = await Articulo.obtenerPorCodigo(
            row['Código Artículo'] || row.codigo_articulo || ''
          );
          
          if (articulo) {
            await Inventario.crear({
              articulo_id: articulo.id,
              cantidad: parseFloat(row.Cantidad || row.cantidad || 0),
              fecha_registro: row['Fecha'] || row.fecha || new Date().toISOString().split('T')[0]
            });
            conteo++;
          }
        } catch (error) {
          console.error(`  Error importando inventario`, error.message);
        }
      }
      console.log(`  ✅ ${conteo} registros de inventario importados\n`);
    }

    console.log('✅ ¡Importación completada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    process.exit(1);
  }
}

// Ejecutar importación
importarDatos();
