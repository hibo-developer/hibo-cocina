-- Migración: Sistema de alérgenos personalizados
-- Fecha: 2026-01-24

-- Tabla para almacenar alérgenos personalizados además de los 14 oficiales
CREATE TABLE IF NOT EXISTS alergenos_personalizados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  icono TEXT,
  activo INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla intermedia: alérgenos personalizados de ingredientes
CREATE TABLE IF NOT EXISTS ingredientes_alergenos_personalizados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingrediente_id INTEGER NOT NULL,
  alergeno_id INTEGER NOT NULL,
  FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE,
  FOREIGN KEY (alergeno_id) REFERENCES alergenos_personalizados(id) ON DELETE CASCADE,
  UNIQUE(ingrediente_id, alergeno_id)
);

-- Tabla intermedia: alérgenos personalizados de platos
CREATE TABLE IF NOT EXISTS platos_alergenos_personalizados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plato_id INTEGER NOT NULL,
  alergeno_id INTEGER NOT NULL,
  FOREIGN KEY (plato_id) REFERENCES platos(id) ON DELETE CASCADE,
  FOREIGN KEY (alergeno_id) REFERENCES alergenos_personalizados(id) ON DELETE CASCADE,
  UNIQUE(plato_id, alergeno_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_ingredientes_alergenos_ingrediente ON ingredientes_alergenos_personalizados(ingrediente_id);
CREATE INDEX IF NOT EXISTS idx_ingredientes_alergenos_alergeno ON ingredientes_alergenos_personalizados(alergeno_id);
CREATE INDEX IF NOT EXISTS idx_platos_alergenos_plato ON platos_alergenos_personalizados(plato_id);
CREATE INDEX IF NOT EXISTS idx_platos_alergenos_alergeno ON platos_alergenos_personalizados(alergeno_id);
