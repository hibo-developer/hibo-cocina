const XLSX = require('xlsx');
const path = require('path');

// Importar modelos
const Plato = require('./src/models/Plato');
const Articulo = require('./src/models/Articulo');
const Escandallo = require('./src/models/Escandallo');
const Inventario = require('./src/models/Inventario');
const Ingrediente = require('./src/models/Ingrediente');
const PartidaCocina = require('./src/models/PartidaCocina');
const Cliente = require('./src/models/Cliente');
const Proveedor = require('./src/models/Proveedor');
const PedidoProveedor = require('./src/models/PedidoProveedor');
const ControlSanidad = require('./src/models/ControlSanidad');
const { crearTablas } = require('./src/db/schema');

async function importarDatos() {
  console.log('🔄 Iniciando importación de datos desde Excel...\n');

  try {
    // Primero crear las tablas
    console.log('📋 Creando estructura de base de datos...');
    await crearTablas();
    console.log('  ✅ Base de datos lista\n');
    
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
            codigo: row.Código || row.codigo || row['Código Artículo'] || '',
            nombre: row.Nombre || row.nombre || '',
            unidad: row.Unidad || row.unidad || 'kg',
            coste_kilo: parseFloat(row['Coste/kilo'] || row['Coste Kilo'] || row.coste_kilo || 0),
            tipo: row.Tipo || row.tipo || '',
            grupo_conservacion: row['Grupo Conservación'] || row['Conservación'] || row.grupo_conservacion || 'Temperatura Ambiente'
          });
          conteo++;
        } catch (error) {
          if (!error.message.includes('UNIQUE')) {
            console.error(`  ⚠️  Error importando artículo: ${row.Código}`, error.message.substring(0, 50));
          }
        }
      }
      console.log(`  ✅ ${conteo} artículos importados\n`);
    } else {
      console.log('  ℹ️  Hoja "Articulos" no encontrada\n');
    }

    // 2. Importar Ingredientes
    console.log('🥬 Importando Ingredientes...');
    const hojIngredientes = workbook.Sheets['Ingredientes'] || workbook.Sheets['ingredientes'];
    if (hojIngredientes) {
      const datos = XLSX.utils.sheet_to_json(hojIngredientes);
      let conteo = 0;
      
      for (const row of datos) {
        try {
          await Ingrediente.crear({
            codigo: row.Código || row.codigo || '',
            nombre: row.Nombre || row.nombre || '',
            descripcion: row.Descripción || row.descripcion || '',
            grupo_conservacion: row['Grupo Conservación'] || row.grupo_conservacion || 'Temperatura Ambiente',
            proveedor: row.Proveedor || row.proveedor || ''
          });
          conteo++;
        } catch (error) {
          if (!error.message.includes('UNIQUE')) {
            console.error(`  ⚠️  Error importando ingrediente`, error.message.substring(0, 50));
          }
        }
      }
      console.log(`  ✅ ${conteo} ingredientes importados\n`);
    } else {
      console.log('  ℹ️  Hoja "Ingredientes" no encontrada\n');
    }

    // 3. Importar Platos
    console.log('🍽️  Importando Platos...');
    const hojPlatos = workbook.Sheets['Platos Menu'] || workbook.Sheets['platos'];
    if (hojPlatos) {
      const datos = XLSX.utils.sheet_to_json(hojPlatos);
      let conteo = 0;
      
      for (const row of datos) {
        try {
          await Plato.crear({
            codigo: row.Código || row.codigo || '',
            nombre: row.Nombre || row.nombre || '',
            descripcion: row.Descripción || row.descripcion || '',
            unidad: row.Unidad || row.unidad || 'ración',
            coste: parseFloat(row.Coste || row.coste || 0),
            tipo: row.Tipo || row.tipo || '',
            peso_raciones: parseFloat(row['Peso Raciones'] || row.peso_raciones || 0),
            grupo_menu: row['Grupo Menú'] || row.grupo_menu || '',
            cocina: row.Cocina || row.cocina || '',
            stock_activo: (row['Stock Activo'] || row.stock_activo || 0) ? 1 : 0
          });
          conteo++;
        } catch (error) {
          if (!error.message.includes('UNIQUE')) {
            console.error(`  ⚠️  Error importando plato`, error.message.substring(0, 50));
          }
        }
      }
      console.log(`  ✅ ${conteo} platos importados\n`);
    } else {
      console.log('  ℹ️  Hoja "Platos Menu" no encontrada\n');
    }

    // 4. Importar Partidas de Cocina
    console.log('🍳 Importando Partidas de Cocina...');
    const hojPartidas = workbook.Sheets['Partidas'] || workbook.Sheets['partidas'];
    if (hojPartidas) {
      const datos = XLSX.utils.sheet_to_json(hojPartidas);
      let conteo = 0;
      
      for (const row of datos) {
        try {
          await PartidaCocina.crear({
            nombre: row.Nombre || row.nombre || '',
            responsable: row.Responsable || row.responsable || '',
            descripcion: row.Descripción || row.descripcion || ''
          });
          conteo++;
        } catch (error) {
          if (!error.message.includes('UNIQUE')) {
            console.error(`  ⚠️  Error importando partida`, error.message.substring(0, 50));
          }
        }
      }
      console.log(`  ✅ ${conteo} partidas de cocina importadas\n`);
    } else {
      console.log('  ℹ️  Hoja "Partidas" no encontrada\n');
    }

    // 5. Importar Proveedores
    console.log('🏢 Importando Proveedores...');
    const hojProveedores = workbook.Sheets['Proveedores'] || workbook.Sheets['proveedores'];
    if (hojProveedores) {
      const datos = XLSX.utils.sheet_to_json(hojProveedores);
      let conteo = 0;
      
      for (const row of datos) {
        try {
          await Proveedor.crear({
            codigo: row.Código || row.codigo || '',
            nombre: row.Nombre || row.nombre || '',
            email: row.Email || row.email || '',
            telefono: row.Teléfono || row.telefono || '',
            direccion: row.Dirección || row.direccion || ''
          });
          conteo++;
        } catch (error) {
          if (!error.message.includes('UNIQUE')) {
            console.error(`  ⚠️  Error importando proveedor`, error.message.substring(0, 50));
          }
        }
      }
      console.log(`  ✅ ${conteo} proveedores importados\n`);
    } else {
      console.log('  ℹ️  Hoja "Proveedores" no encontrada\n');
    }

    // 6. Importar Clientes
    console.log('👥 Importando Clientes...');
    const hojClientes = workbook.Sheets['Clientes'] || workbook.Sheets['clientes'];
    if (hojClientes) {
      const datos = XLSX.utils.sheet_to_json(hojClientes);
      let conteo = 0;
      
      for (const row of datos) {
        try {
          await Cliente.crear({
            codigo: row.Código || row.codigo || '',
            nombre: row.Nombre || row.nombre || '',
            email: row.Email || row.email || '',
            telefono: row.Teléfono || row.telefono || '',
            direccion: row.Dirección || row.direccion || ''
          });
          conteo++;
        } catch (error) {
          if (!error.message.includes('UNIQUE')) {
            console.error(`  ⚠️  Error importando cliente`, error.message.substring(0, 50));
          }
        }
      }
      console.log(`  ✅ ${conteo} clientes importados\n`);
    } else {
      console.log('  ℹ️  Hoja "Clientes" no encontrada\n');
    }

    // 7. Importar Inventario
    console.log('📊 Importando Inventario...');
    const hojInventario = workbook.Sheets['Inventario'] || workbook.Sheets['inventario'];
    if (hojInventario) {
      const datos = XLSX.utils.sheet_to_json(hojInventario);
      let conteo = 0;
      
      for (const row of datos) {
        try {
          const articulo = await Articulo.obtenerPorCodigo(
            row['Código Artículo'] || row.codigo_articulo || row['Código'] || row.codigo || ''
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
          // Silenciar errores de relaciones
        }
      }
      console.log(`  ✅ ${conteo} registros de inventario importados\n`);
    } else {
      console.log('  ℹ️  Hoja "Inventario" no encontrada\n');
    }

    // 8. Importar Escandallos
    console.log('📋 Importando Escandallos...');
    const hojEscandallos = workbook.Sheets['Escandallos'] || workbook.Sheets['escandallos'];
    if (hojEscandallos) {
      const datos = XLSX.utils.sheet_to_json(hojEscandallos);
      let conteo = 0;
      
      for (const row of datos) {
        try {
          const articulo = await Articulo.obtenerPorCodigo(
            row['Código Artículo'] || row.codigo_articulo || ''
          );
          
          if (articulo) {
            await Escandallo.crear({
              codigo_plato: row['Código Plato'] || row.codigo_plato || '',
              articulo_id: articulo.id,
              cantidad: parseFloat(row.Cantidad || 0),
              unidad: row.Unidad || row.unidad || 'kg'
            });
            conteo++;
          }
        } catch (error) {
          // Silenciar errores
        }
      }
      console.log(`  ✅ ${conteo} escandallos importados\n`);
    } else {
      console.log('  ℹ️  Hoja "Escandallos" no encontrada\n');
    }

    console.log('✅ ¡Importación completada exitosamente!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la importación:', error.message);
    process.exit(1);
  }
}

// Ejecutar importación
importarDatos();
