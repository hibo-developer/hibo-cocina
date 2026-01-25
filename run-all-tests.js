#!/usr/bin/env node

/**
 * Script para ejecutar todos los tests con reporte de cobertura
 * Ejecutar con: npm test -- --coverage o node run-all-tests.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║          HIBO COCINA - TEST SUITE COMPLETO                    ║
║                  Sprint 2.3 - Test Coverage                   ║
╚════════════════════════════════════════════════════════════════╝
`);

const tests = [
  {
    name: 'Validator Middleware Tests',
    file: '__tests__/coverage/validator.test.js'
  },
  {
    name: 'Error Handler Middleware Tests',
    file: '__tests__/coverage/errorHandler.test.js'
  },
  {
    name: 'Auth Middleware Tests',
    file: '__tests__/coverage/authMiddleware.test.js'
  },
  {
    name: 'Auth Controller Tests (con servidor)',
    file: '__tests__/coverage/authController.test.js',
    skipIfNoServer: true
  },
  {
    name: 'Platos Controller Tests (con servidor)',
    file: '__tests__/coverage/platosController.test.js',
    skipIfNoServer: true
  }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  console.log(`\n📋 Ejecutando: ${test.name}`);
  console.log(`   Archivo: ${test.file}`);
  console.log(`   ${'─'.repeat(50)}`);

  try {
    const result = execSync(`npm test -- ${test.file} 2>&1`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    if (result.includes('PASS')) {
      const match = result.match(/Tests:\s+(\d+)\s+passed/);
      const testCount = match ? match[1] : '?';
      console.log(`   ✅ Pasados: ${testCount} tests`);
      passed++;
    } else if (result.includes('FAIL')) {
      console.log(`   ❌ FALLÓ`);
      failed++;
      if (test.skipIfNoServer) {
        console.log(`   (Requiere servidor ejecutándose)`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message.split('\n')[0]}`);
    if (test.skipIfNoServer) {
      console.log(`   (Intenta con: npm start en otra terminal)`);
    }
    failed++;
  }
}

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                      RESUMEN DE RESULTADOS                    ║
╚════════════════════════════════════════════════════════════════╝

Tests Ejecutados: ${passed + failed}
  ✅ Exitosos: ${passed}
  ❌ Fallidos: ${failed}

`);

if (failed === 0) {
  console.log(`🎉 ¡TODOS LOS TESTS PASARON!`);
  console.log(`\n📊 Próximo paso: Ejecutar con cobertura`);
  console.log(`   npm test -- --coverage`);
} else {
  console.log(`⚠️  Algunos tests no pasaron.`);
  console.log(`   Para tests que requieren servidor:`);
  console.log(`   1. Terminal 1: npm start`);
  console.log(`   2. Terminal 2: npm test`);
}

console.log(`
`);

process.exit(failed > 0 ? 1 : 0);
