// Script de prueba para verificar el endpoint /api/partidas-cocina
const http = require('http');

function probarEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/partidas-cocina',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('✅ Endpoint /api/partidas-cocina respondió correctamente');
      console.log(`   Status: ${res.statusCode}`);
      try {
        const parsed = JSON.parse(data);
        console.log(`   Data type: ${Array.isArray(parsed) ? 'Array' : typeof parsed}`);
        if (Array.isArray(parsed)) {
          console.log(`   Items: ${parsed.length}`);
          if (parsed.length > 0) {
            console.log(`   First item:`, JSON.stringify(parsed[0], null, 2));
          } else {
            console.log('   (Array vacío)');
          }
        } else {
          console.log(`   Response:`, JSON.stringify(parsed, null, 2));
        }
      } catch (e) {
        console.log(`   Raw response: ${data}`);
      }
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error al conectar:', error.message);
    process.exit(1);
  });

  req.end();
}

// Esperar un poco para asegurar que el servidor está listo
setTimeout(probarEndpoint, 500);
