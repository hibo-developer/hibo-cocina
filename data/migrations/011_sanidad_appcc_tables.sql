-- Migración: Tablas de Sanidad y Control APPCC
-- Descripción: Crea tablas para gestionar controles APPCC, puntos críticos y trazabilidad

-- Crear tabla control_sanidad si no existe (auditoría de controles)
CREATE TABLE IF NOT EXISTS control_sanidad (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plato_codigo TEXT NOT NULL,
  ingrediente_codigo TEXT,
  fecha_produccion DATETIME,
  punto_critico TEXT,
  corrector TEXT,
  responsable TEXT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plato_codigo) REFERENCES platos(codigo)
);

-- Crear tabla puntos_criticos (referencia de puntos críticos en APPCC)
CREATE TABLE IF NOT EXISTS puntos_criticos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  temperatura_min REAL,
  temperatura_max REAL,
  tipo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla trazabilidad (trazabilidad de ingredientes y platos)
CREATE TABLE IF NOT EXISTS trazabilidad (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plato_codigo TEXT,
  ingrediente_codigo TEXT,
  lote_numero TEXT,
  proveedor_id INTEGER,
  fecha_entrada DATETIME,
  fecha_vencimiento DATETIME,
  cantidad_entrada REAL,
  unidad TEXT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plato_codigo) REFERENCES platos(codigo),
  FOREIGN KEY (ingrediente_codigo) REFERENCES ingredientes(codigo),
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
);

-- Insertar puntos críticos predefinidos
INSERT OR IGNORE INTO puntos_criticos (nombre, descripcion, temperatura_min, temperatura_max, tipo) VALUES
('Refrigeración', 'Almacenamiento en refrigerador', 0, 8, 'temperatura'),
('Congelación', 'Almacenamiento en congelador', -25, -18, 'temperatura'),
('Cocción', 'Temperatura de cocción de carnes y aves', 65, 100, 'temperatura'),
('Enfriamiento', 'Enfriamiento rápido de comidas calientes', 20, 25, 'temperatura'),
('Manipulación', 'Higiene en la manipulación de alimentos', NULL, NULL, 'higiene'),
('Limpieza', 'Limpieza y desinfección de equipos', NULL, NULL, 'higiene'),
('Trazabilidad', 'Registro de trazabilidad de ingredientes', NULL, NULL, 'documentación'),
('Control de Plaga', 'Control y prevención de plagas', NULL, NULL, 'sanidad');

-- Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_control_sanidad_fecha ON control_sanidad(fecha_produccion);
CREATE INDEX IF NOT EXISTS idx_control_sanidad_plato ON control_sanidad(plato_codigo);
CREATE INDEX IF NOT EXISTS idx_trazabilidad_lote ON trazabilidad(lote_numero);
CREATE INDEX IF NOT EXISTS idx_trazabilidad_fecha ON trazabilidad(fecha_entrada);
