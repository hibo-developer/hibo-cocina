#!/usr/bin/env node

/**
 * Script rápido para aplicar migraciones
 */
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/hibo-cocina.db');
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error al conectar a base de datos:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a base de datos');
  applyMigrations();
});

async function applyMigrations() {
  try {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📦 Encontradas ${files.length} migraciones\n`);

    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await new Promise((resolve) => {
        db.exec(sql, (err) => {
          if (err) {
            if (err.message.includes('already exists') || 
                err.message.includes('duplicate') ||
                err.message.includes('no such table') ||
                err.message.includes('no such column')) {
              console.log(`⚠️  ${file} - Advertencia: ${err.message.substring(0, 60)}...`);
            } else {
              console.error(`❌ ${file} - Error: ${err.message}`);
            }
          } else {
            console.log(`✅ ${file} - Ejecutada`);
          }
          resolve();
        });
      });
    }

    console.log('\n✅ Migraciones completadas');
    db.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    db.close();
    process.exit(1);
  }
}
