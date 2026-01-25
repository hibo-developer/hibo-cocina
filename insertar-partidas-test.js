// Script para insertar partidas de cocina de prueba
const db = require('./src/db/database');

const partidasDeTest = [
  {
    nombre: 'Arroz con Verduras',
    responsable: 'Chef María',
    descripcion: 'Arroz blanco con verduras variadas',
    activo: 1
  },
  {
    nombre: 'Pollo al Ajillo',
    responsable: 'Chef Juan',
    descripcion: 'Pechuga de pollo con salsa de ajo',
    activo: 1
  },
  {
    nombre: 'Pasta Carbonara',
    responsable: 'Chef Marco',
    descripcion: 'Pasta tradicional italiana',
    activo: 1
  },
  {
    nombre: 'Ensalada César',
    responsable: 'Chef Ana',
    descripcion: 'Ensalada con pollo y croutons',
    activo: 1
  },
  {
    nombre: 'Salmón a la Mantequilla',
    responsable: 'Chef Carlos',
    descripcion: 'Filete de salmón fresco',
    activo: 1
  }
];

function insertarPartidas() {
  const sql = `
    INSERT INTO partidas_cocina 
    (nombre, responsable, descripcion, activo)
    VALUES (?, ?, ?, ?)
  `;

  let insertados = 0;

  partidasDeTest.forEach((partida) => {
    db.run(sql, [partida.nombre, partida.responsable, partida.descripcion, partida.activo], function(err) {
      if (err) {
        console.error(`❌ Error insertando "${partida.nombre}":`, err.message);
      } else {
        insertados++;
        console.log(`✅ Insertada: ${partida.nombre} (ID: ${this.lastID})`);
      }
    });
  });

  // Cerrar DB después de inserciones
  setTimeout(() => {
    db.close();
    console.log(`\n✅ Total insertadas: ${insertados}/${partidasDeTest.length} partidas`);
    process.exit(0);
  }, 500);
}

console.log('🔼 Insertando partidas de prueba...\n');
insertarPartidas();
