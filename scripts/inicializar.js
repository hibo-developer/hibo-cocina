const fs = require('fs');
const path = require('path');
const { importarPlatos, importarIngredientes, importarEnvases, importarPartidas } = require('../src/utils/importarDatos');

// Crear carpeta data si no existe
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function inicializar() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Inicializando HIBO COCINA            ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    const rutaFabricacion = path.join(__dirname, '../fabricación.xlsb');
    
    console.log('1. Importando platos...');
    const platosImportados = await importarPlatos(rutaFabricacion);
    console.log(`   ✓ ${platosImportados} platos importados`);

    console.log('2. Importando ingredientes...');
    const ingredientesImportados = await importarIngredientes(rutaFabricacion);
    console.log(`   ✓ ${ingredientesImportados} ingredientes importados`);

    console.log('3. Configurando envases...');
    const envasesImportados = await importarEnvases(rutaFabricacion);
    console.log(`   ✓ ${envasesImportados} tipos de envases configurados`);

    console.log('4. Configurando partidas de cocina...');
    const partidasImportadas = await importarPartidas(rutaFabricacion);
    console.log(`   ✓ ${partidasImportadas} partidas de cocina configuradas`);

    console.log('\n✓ Inicialización completada exitosamente\n');
    console.log('Puedes iniciar el servidor con: npm start\n');

  } catch (error) {
    console.error('\n✗ Error durante la inicialización:', error.message, '\n');
    process.exit(1);
  }
}

inicializar();
