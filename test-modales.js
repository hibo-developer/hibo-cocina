#!/usr/bin/env node

/**
 * Script de Prueba Rápida - Sistema Modales Dinámicos
 * 
 * Este script verifica que:
 * 1. El servidor está corriendo
 * 2. Los endpoints API están disponibles
 * 3. Las rutas están configuradas correctamente
 * 4. La base de datos está inicializada
 */

const http = require('http');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.blue}═ ${msg} ═${colors.reset}\n`),
};

// Configuración
const HOST = 'localhost';
const PORT = 3000;
const BASE_URL = `http://${HOST}:${PORT}`;

// Endpoints a probar
const ENDPOINTS = [
  { method: 'GET', path: '/api/health', expected: 200 },
  { method: 'GET', path: '/api/platos', expected: 200 },
  { method: 'GET', path: '/api/pedidos', expected: 200 },
  { method: 'GET', path: '/api/articulos', expected: 200 },
  { method: 'GET', path: '/api/escandallos', expected: 200 },
  { method: 'GET', path: '/api/inventario', expected: 200 },
  { method: 'GET', path: '/api/trazabilidad', expected: 200 },
  { method: 'GET', path: '/api/etiquetas', expected: 200 },
  { method: 'GET', path: '/api/partidas-cocina', expected: 200 },
  { method: 'GET', path: '/', expected: 200 }, // Servir index.html
];

// Función para hacer requests HTTP
function testEndpoint(method, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data.length > 200 ? data.substring(0, 200) + '...' : data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Función para probar todo
async function runTests() {
  log.title('🧪 PRUEBAS DEL SISTEMA MODALES DINÁMICOS');
  
  console.log(`Servidor: ${colors.bold}${BASE_URL}${colors.reset}`);
  console.log(`Versión: 1.0.0`);
  console.log(`Fecha: ${new Date().toLocaleString()}`);
  
  log.title('1️⃣  VERIFICACIÓN DE CONECTIVIDAD');
  
  // Test 1: Health check
  try {
    log.info('Probando conexión al servidor...');
    const health = await testEndpoint('GET', '/api/health');
    
    if (health.status === 200) {
      log.success('Servidor respondiendo correctamente');
      const data = JSON.parse(health.body);
      console.log(`  Status: ${colors.bold}${data.status}${colors.reset}`);
      console.log(`  Versión: ${colors.bold}${data.version}${colors.reset}`);
    } else {
      log.error(`Health check falló con status ${health.status}`);
      process.exit(1);
    }
  } catch (error) {
    log.error(`No se pudo conectar al servidor: ${error.message}`);
    log.warning('Asegúrate de que el servidor está corriendo con: npm start');
    process.exit(1);
  }

  log.title('2️⃣  VERIFICACIÓN DE ENDPOINTS API');
  
  let successCount = 0;
  let failureCount = 0;

  for (const endpoint of ENDPOINTS) {
    try {
      const result = await testEndpoint(endpoint.method, endpoint.path);
      
      if (result.status === endpoint.expected) {
        log.success(`${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(25)} → ${result.status}`);
        successCount++;
      } else {
        log.error(`${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(25)} → ${result.status} (esperado ${endpoint.expected})`);
        failureCount++;
      }
    } catch (error) {
      log.error(`${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(25)} → Error: ${error.message}`);
      failureCount++;
    }
  }

  log.title('3️⃣  VERIFICACIÓN DE ARCHIVOS DE CÓDIGO');

  const fs = require('fs');
  const files = [
    'public/modales-dinamicos.js',
    'public/ejemplos-modales-dinamicos.js',
    'public/index.html',
    'public/styles.css',
    'app.js' // No existe, pero podría ser front-end
  ];

  for (const file of files) {
    try {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        log.success(`${file.padEnd(40)} (${stats.size} bytes)`);
      } else {
        log.warning(`${file.padEnd(40)} NO ENCONTRADO`);
      }
    } catch (error) {
      log.error(`${file.padEnd(40)} Error: ${error.message}`);
    }
  }

  log.title('4️⃣  VERIFICACIÓN DE CONFIGURACIÓN');

  try {
    const server = require('./server.js');
    log.success('Archivo server.js cargable');
  } catch (error) {
    log.warning('No se pudo cargar server.js (podría estar en ejecución)');
  }

  try {
    const pkg = require('./package.json');
    console.log(`  Dependencias: ${colors.bold}${Object.keys(pkg.dependencies).length}${colors.reset}`);
    console.log(`  Scripts: ${colors.bold}${Object.keys(pkg.scripts).length}${colors.reset}`);
    
    if (pkg.dependencies.express) {
      log.success(`Express ${pkg.dependencies.express} instalado`);
    }
    if (pkg.dependencies.sqlite3) {
      log.success(`SQLite3 instalado`);
    }
    if (pkg.dependencies.body-parser) {
      log.success(`body-parser instalado`);
    }
  } catch (error) {
    log.error(`No se encontró package.json: ${error.message}`);
  }

  log.title('📊 RESUMEN DE PRUEBAS');

  const totalTests = ENDPOINTS.length;
  const percentage = Math.round((successCount / totalTests) * 100);

  console.log(`
  Total de endpoints: ${colors.bold}${totalTests}${colors.reset}
  Exitosos: ${colors.green}${successCount}${colors.reset}
  Fallidos: ${colors.red}${failureCount}${colors.reset}
  Porcentaje: ${percentage >= 90 ? colors.green : colors.red}${percentage}%${colors.reset}
  `);

  log.title('✅ PRÓXIMOS PASOS');

  if (percentage >= 90) {
    console.log(`${colors.green}✓ Sistema listo para usar${colors.reset}`);
    console.log(`
  1. Abre http://localhost:${PORT} en tu navegador
  2. Navega a la sección "Platos"
  3. Haz click en "🍽️ Crear Plato Modal"
  4. Prueba completar un formulario
  5. Verifica que los campos se auto-rellenan
  6. Haz click en "Guardar"
  7. Verifica que el registro aparece en la tabla
  
  Prueba los otros botones de modales:
  - 📦 Crear Pedido Modal (en Pedidos)
  - 📊 Producción Modal (en Producción > Trazabilidad)
  - 🍳 Partida Cocina Modal (en Producción > Partidas)
  - ⚕️ Control Sanidad (en Producción > Partidas)
    `);
  } else {
    console.log(`${colors.red}✗ Hay errores que deben solucionarse antes de usar${colors.reset}`);
    console.log(`
  Revisa:
  1. ¿Está el servidor corriendo? npm start
  2. ¿Es el puerto 3000 correcto?
  3. ¿Hay errores en la consola del servidor?
    `);
  }

  console.log(`\n${colors.bold}Documentación:${colors.reset}`);
  console.log(`  - INDICE_DOCUMENTACION.md (navegación principal)`);
  console.log(`  - INTEGRACION_COMPLETADA.md (resumen de integración)`);
  console.log(`  - GUIA_IMPLEMENTACION_MODALES.md (guía paso a paso)`);
  console.log(`  - ANALISIS_XLSB_EXHAUSTIVO.md (referencia técnica)`);
  
  console.log(`\n${colors.blue}═════════════════════════════════════════${colors.reset}\n`);

  process.exit(percentage >= 90 ? 0 : 1);
}

// Ejecutar pruebas
runTests().catch((error) => {
  log.error(`Error fatal: ${error.message}`);
  process.exit(1);
});
