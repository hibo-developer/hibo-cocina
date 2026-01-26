#!/usr/bin/env node

/**
 * Script de prueba para demostrar el manejo mejorado de errores
 * Ejecutar con: node test-error-handling.js
 */

const http = require('http');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TESTS = [
  {
    name: '❌ Validación: Campo requerido ausente',
    method: 'POST',
    path: '/api/platos',
    body: { nombre: 'Test' }, // Falta 'codigo'
    expectedStatus: 400,
    expectedCode: 'VALIDATION_ERROR'
  },
  {
    name: '❌ Autenticación: Token no proporcionado',
    method: 'GET',
    path: '/api/auth/me',
    headers: {}, // Sin header Authorization
    expectedStatus: 401,
    expectedCode: 'AUTHENTICATION_ERROR'
  },
  {
    name: '❌ No encontrado: Plato inexistente',
    method: 'GET',
    path: '/api/platos/99999',
    token: null,
    expectedStatus: 404,
    expectedCode: 'NOT_FOUND_ERROR'
  },
  {
    name: '❌ Validación: Valor inválido',
    method: 'POST',
    path: '/api/platos',
    body: { 
      codigo: 'PL001',
      nombre: 'Test',
      pvp: 'abc' // No es número
    },
    expectedStatus: 400,
    expectedCode: 'VALIDATION_ERROR'
  },
  {
    name: '✅ Ruta no encontrada',
    method: 'GET',
    path: '/api/ruta-inexistente',
    expectedStatus: 404
  }
];

/**
 * Hacer solicitud HTTP
 */
function makeRequest(test) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + test.path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        ...test.headers
      }
    };

    // Agregar token si existe
    if (test.token) {
      options.headers['Authorization'] = `Bearer ${test.token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (test.body) {
      req.write(JSON.stringify(test.body));
    }
    
    req.end();
  });
}

/**
 * Ejecutar todas las pruebas
 */
async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('PRUEBAS DE MANEJO DE ERRORES MEJORADO - Sprint 2.2');
  console.log('='.repeat(70) + '\n');

  let passed = 0;
  let failed = 0;

  for (const test of TESTS) {
    try {
      console.log(`📋 ${test.name}`);
      console.log(`   ${test.method} ${test.path}`);
      
      const result = await makeRequest(test);
      
      console.log(`   Status: ${result.status} (esperado: ${test.expectedStatus})`);
      
      // Verificar status code
      if (result.status !== test.expectedStatus) {
        console.log(`   ❌ Status incorrecto`);
        failed++;
      } else {
        console.log(`   ✅ Status correcto`);
        
        // Verificar estructura de respuesta
        if (result.body && result.body.error) {
          console.log(`   Error: ${result.body.error}`);
          
          if (test.expectedCode && result.body.code !== test.expectedCode) {
            console.log(`   ⚠️  Código de error: ${result.body.code} (esperado: ${test.expectedCode})`);
          }
          
          // Mostrar detalles si existen (errores de validación)
          if (result.body.details && result.body.details.length > 0) {
            console.log(`   Detalles de validación:`);
            result.body.details.forEach(detail => {
              console.log(`     - ${detail.field}: ${detail.message}`);
            });
          }
        }
        
        passed++;
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }
    
    console.log();
  }

  // Resumen
  console.log('='.repeat(70));
  console.log(`RESULTADO: ${passed} exitosas, ${failed} fallidas`);
  console.log('='.repeat(70) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Esperar a que el servidor esté disponible
function waitForServer(maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function check() {
      attempts++;
      const url = new URL(BASE_URL);
      const req = http.request({
        hostname: url.hostname,
        port: url.port,
        path: '/',
        method: 'HEAD'
      }, () => {
        resolve();
      });
      
      req.on('error', () => {
        if (attempts < maxAttempts) {
          console.log(`⏳ Esperando servidor (intento ${attempts}/${maxAttempts})...`);
          setTimeout(check, 500);
        } else {
          reject(new Error('No se puede conectar al servidor'));
        }
      });
      
      req.end();
    }
    
    check();
  });
}

// Ejecutar
(async () => {
  try {
    console.log('\n⏳ Conectando al servidor...');
    await waitForServer();
    console.log('✅ Servidor disponible\n');
    
    await runTests();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
})();
