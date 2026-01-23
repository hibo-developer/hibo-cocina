const db = require('./src/db/database');

console.log('🍳 Creando partidas de cocina estándar...\n');

const partidas = [
  { nombre: 'Cocina Fría', responsable: 'Chef', descripcion: 'Preparación de ensaladas, carpaccios, ceviches y platos fríos' },
  { nombre: 'Cocina Caliente', responsable: 'Chef', descripcion: 'Preparación de guisos, arroces, carnes y pescados al calor' },
  { nombre: 'Parrilla', responsable: 'Parrillero', descripcion: 'Asados, carnes a la parrilla' },
  { nombre: 'Pastelería', responsable: 'Pastelero', descripcion: 'Postres, pasteles y repostería' },
  { nombre: 'Garde Manger', responsable: 'Chef', descripcion: 'Preparación de entrantes fríos y montaje de platos' },
  { nombre: 'Salsero', responsable: 'Chef', descripcion: 'Elaboración de salsas y fondos' },
  { nombre: 'Entremetier', responsable: 'Chef', descripcion: 'Verduras, sopas y guarniciones' },
  { nombre: 'Pescadero', responsable: 'Chef', descripcion: 'Limpieza y preparación de pescados' }
];

db.serialize(() => {
  let creadas = 0;
  
  partidas.forEach((p, index) => {
    db.run(
      'INSERT INTO partidas_cocina (nombre, responsable, descripcion, activo) VALUES (?, ?, ?, 1)',
      [p.nombre, p.responsable, p.descripcion],
      function(err) {
        if (err) {
          console.log(`❌ Error creando ${p.nombre}:`, err.message);
        } else {
          creadas++;
          console.log(`✅ ${p.nombre} creada`);
        }
        
        if (index === partidas.length - 1) {
          setTimeout(() => {
            console.log(`\n✅ ${creadas} partidas de cocina creadas correctamente\n`);
            
            // Verificar
            db.get('SELECT COUNT(*) as total FROM partidas_cocina', (err, row) => {
              console.log(`Total partidas en BD: ${row?.total}`);
              process.exit(0);
            });
          }, 200);
        }
      }
    );
  });
});
