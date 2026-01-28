-- 001_tablas_base.sql
-- Crear tablas base del sistema

CREATE TABLE IF NOT EXISTS platos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT,
  precio_venta REAL,
  coste_racion REAL,
  activo BOOLEAN DEFAULT 1,
  descripcion TEXT,
  familia TEXT,
  pvp REAL,
  coste_produccion REAL,
  grupo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingredientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  unidad TEXT,
  precio REAL,
  stock_actual REAL DEFAULT 0,
  precio_unitario REAL,
  coste_unidad REAL,
  coste_kilo REAL,
  activo BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS escandallos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plato_id INTEGER NOT NULL,
  ingrediente_id INTEGER NOT NULL,
  cantidad REAL NOT NULL,
  FOREIGN KEY(plato_id) REFERENCES platos(id) ON DELETE CASCADE,
  FOREIGN KEY(ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE,
  UNIQUE(plato_id, ingrediente_id)
);

CREATE TABLE IF NOT EXISTS partidas_cocina (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  responsable TEXT,
  descripcion TEXT,
  activo BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  tipo_evento TEXT,
  fecha_evento DATE,
  lugar TEXT,
  capacidad INTEGER,
  precio_entrada REAL,
  activo BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingrediente_id INTEGER NOT NULL,
  cantidad REAL DEFAULT 0,
  fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tipo_movimiento TEXT,
  referencia TEXT,
  FOREIGN KEY(ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_platos_codigo ON platos(codigo);
CREATE INDEX IF NOT EXISTS idx_platos_nombre ON platos(nombre);
CREATE INDEX IF NOT EXISTS idx_ingredientes_codigo ON ingredientes(codigo);
CREATE INDEX IF NOT EXISTS idx_ingredientes_nombre ON ingredientes(nombre);
CREATE INDEX IF NOT EXISTS idx_escandallos_plato ON escandallos(plato_id);
CREATE INDEX IF NOT EXISTS idx_escandallos_ingrediente ON escandallos(ingrediente_id);
CREATE INDEX IF NOT EXISTS idx_eventos_codigo ON eventos(codigo);
CREATE INDEX IF NOT EXISTS idx_inventario_ingrediente ON inventario(ingrediente_id);
