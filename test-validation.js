#!/usr/bin/env node

/**
 * Script de prueba de validación
 * Verifica que las validaciones funcionan correctamente
 */

const http = require('http');

const testCases = [
  {
    name: 'POST /api/platos - Falta nombre',
    method: 'POST',
    path: '/api/platos',
    data: { codigo: 'TEST001' },
    expectedStatus: 400
  },
  {
    name: 'POST /api/platos - Nombre muy corto',
    method: 'POST',
    path: '/api/platos',
    data: { codigo: 'TEST001', nombre: 'AB' },
    expectedStatus: 400
  },
  {
    name: 'POST /api/platos - Válido',
    method: 'POST',
    path: '/api/platos',
    data: { codigo: 'TEST001', nombre: 'Pasta al Dente', pvp: 12.50 },
    expectedStatus: 201
  },
  {
    name: 'GET /api/platos - Sin validación',
    method: 'GET',
    path: '/api/platos',
    expectedStatus: 200
  },
  {
    name: 'POST /api/ingredientes - Falta nombre',
    method: 'POST',
    path: '/api/ingredientes',
    data: {},
    expectedStatus: 400
  }
];

let passed = 0;
let failed = 0;

function makeRequest(testCase) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: testCase.path,
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const success = res.statusCode === testCase.expectedStatus;
        if (success) {
          passed++;
          console.log(`✅ ${testCase.name}`);
        } else {
          failed++;
          console.log(`❌ ${testCase.name} - esperado ${testCase.expectedStatus}, obtuve ${res.statusCode}`);
          console.log(`   Respuesta: ${body.substring(0, 200)}`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      failed++;
      console.log(`❌ ${testCase.name} - Error de conexión: ${err.message}`);
      console.log(`   Detalles: ${JSON.stringify(err)}`);
      resolve();
    });

    if (testCase.data) {
      req.write(JSON.stringify(testCase.data));
    }
    req.end();
    
    // Timeout de 5 segundos
    setTimeout(() => {
      req.destroy();
      resolve();
    }, 5000);
  });
}

async function runTests() {
  console.log('\n🧪 Iniciando pruebas de validación...\n');
  
  for (const testCase of testCases) {
    await makeRequest(testCase);
  }

  console.log(`\n📊 Resultados: ${passed} pasadas, ${failed} fallidas\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Esperar a que el servidor esté listo
setTimeout(runTests, 1000);
