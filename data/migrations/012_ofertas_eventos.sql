-- Migración: Tablas de Ofertas y Eventos
-- Descripción: Crea tablas para gestionar ofertas, eventos y promociones

CREATE TABLE IF NOT EXISTS ofertas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT DEFAULT 'oferta',
  estado TEXT DEFAULT 'activa',
  precio_regular REAL,
  precio_oferta REAL,
  descuento_porcentaje REAL,
  fecha_inicio DATETIME,
  fecha_fin DATETIME,
  platos TEXT,
  ingredientes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo_evento TEXT,
  fecha_evento DATETIME,
  lugar TEXT,
  capacidad INTEGER,
  personas_confirmadas INTEGER DEFAULT 0,
  precio_entrada REAL,
  estado TEXT DEFAULT 'planificacion',
  menu_especial TEXT,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menus_evento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evento_id INTEGER NOT NULL,
  plato_codigo TEXT NOT NULL,
  cantidad_estimada INTEGER,
  precio_unitario REAL,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evento_id) REFERENCES eventos(id),
  FOREIGN KEY (plato_codigo) REFERENCES platos(codigo)
);

CREATE TABLE IF NOT EXISTS asistentes_evento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evento_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  confirmado INTEGER DEFAULT 0,
  numero_acompanantes INTEGER DEFAULT 0,
  alergenos_especiales TEXT,
  comentarios TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evento_id) REFERENCES eventos(id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_ofertas_estado ON ofertas(estado);
CREATE INDEX IF NOT EXISTS idx_ofertas_fechas ON ofertas(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha_evento);
