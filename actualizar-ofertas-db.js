const { initializeDatabase } = require('./src/utils/database');

(async () => {
  console.log('=== Actualizando tablas de ofertas y eventos ===\n');
  
  try {
    const db = await initializeDatabase();
    
    // Comandos SQL para agregar columnas faltantes y crear tablas
    const updates = [
      // Actualizar eventos
      `ALTER TABLE eventos ADD COLUMN descripcion TEXT`,
      `ALTER TABLE eventos ADD COLUMN estado TEXT CHECK(estado IN ('planificado', 'confirmado', 'en_progreso', 'completado', 'cancelado')) DEFAULT 'planificado'`,
      `ALTER TABLE eventos ADD COLUMN personas_confirmadas INTEGER DEFAULT 0`,
      `ALTER TABLE eventos ADD COLUMN personas_pendientes INTEGER DEFAULT 0`,
      `ALTER TABLE eventos ADD COLUMN precio_total DECIMAL(12, 2)`,
      `ALTER TABLE eventos ADD COLUMN menu_especial TEXT`,
      `ALTER TABLE eventos ADD COLUMN decoracion TEXT`,
      `ALTER TABLE eventos ADD COLUMN contacto_principal TEXT`,
      `ALTER TABLE eventos ADD COLUMN notas TEXT`,
      
      // Crear tabla evento_asistentes
      `CREATE TABLE IF NOT EXISTS evento_asistentes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        evento_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        email TEXT,
        telefono TEXT,
        estado_confirmacion TEXT CHECK(estado_confirmacion IN ('pendiente', 'confirmado', 'rechazado', 'no_confirmo')) DEFAULT 'pendiente',
        numero_acompanantes INTEGER DEFAULT 0,
        restricciones_dieteticas TEXT,
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
      )`,
      
      // Crear tabla oferta_aplicaciones
      `CREATE TABLE IF NOT EXISTS oferta_aplicaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        oferta_id INTEGER NOT NULL,
        pedido_id INTEGER,
        evento_id INTEGER,
        cliente_id INTEGER,
        monto_descuento DECIMAL(10, 2),
        monto_final DECIMAL(10, 2),
        tipo_aplicacion TEXT CHECK(tipo_aplicacion IN ('manual', 'automatica', 'codigo')) DEFAULT 'automatica',
        codigo_cupon TEXT,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (oferta_id) REFERENCES ofertas(id),
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
        FOREIGN KEY (evento_id) REFERENCES eventos(id),
        FOREIGN KEY (cliente_id) REFERENCES usuarios(id)
      )`,
      
      // Índices
      `CREATE INDEX IF NOT EXISTS idx_evento_asistentes_evento_id ON evento_asistentes(evento_id)`,
      `CREATE INDEX IF NOT EXISTS idx_oferta_aplicaciones_oferta_id ON oferta_aplicaciones(oferta_id)`,
      `CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(estado)`
    ];
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const sql of updates) {
      await new Promise((resolve) => {
        db.run(sql, (err) => {
          if (err) {
            if (err.message.includes('duplicate column') || err.message.includes('already exists')) {
              skipCount++;
              console.log(`⏭️  Ya existe: ${sql.substring(0, 50)}...`);
            } else {
              console.error(`❌ Error: ${err.message} en: ${sql.substring(0, 50)}...`);
            }
          } else {
            successCount++;
            console.log(`✅ Ejecutado: ${sql.substring(0, 60)}...`);
          }
          resolve();
        });
      });
    }
    
    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Exitosas: ${successCount}`);
    console.log(`   ⏭️  Omitidas: ${skipCount}`);
    
    // Verificar tablas finales
    db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name IN ('ofertas', 'eventos', 'evento_asistentes', 'oferta_aplicaciones')
    `, (err, tables) => {
      if (!err) {
        console.log(`\n✅ Tablas disponibles: ${tables.map(t => t.name).join(', ')}`);
      }
      db.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
