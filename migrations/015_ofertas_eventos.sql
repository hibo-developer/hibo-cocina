-- Migración 015: Módulo de Ofertas y Eventos
-- Crea las tablas y funcionalidades para gestionar ofertas y eventos

-- ============================================================================
-- TABLA: OFERTAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS ofertas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT CHECK(tipo IN ('oferta', 'promocion', 'descuento')) DEFAULT 'oferta',
  estado TEXT CHECK(estado IN ('activa', 'inactiva', 'pausada', 'finalizada')) DEFAULT 'activa',
  precio_regular DECIMAL(10, 2),
  precio_oferta DECIMAL(10, 2),
  descuento_porcentaje DECIMAL(5, 2),
  fecha_inicio DATE,
  fecha_fin DATE,
  platos TEXT, -- JSON: lista de IDs de platos aplicables
  ingredientes TEXT, -- JSON: lista de IDs de ingredientes con descuento
  audiencia TEXT, -- JSON: criterios de audiencia (edad, región, etc.)
  terminos_condiciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para ofertas
CREATE INDEX IF NOT EXISTS idx_ofertas_codigo ON ofertas(codigo);
CREATE INDEX IF NOT EXISTS idx_ofertas_estado ON ofertas(estado);
CREATE INDEX IF NOT EXISTS idx_ofertas_fecha ON ofertas(fecha_inicio, fecha_fin);

-- Triggers para ofertas
CREATE TRIGGER IF NOT EXISTS ofertas_updated_at AFTER UPDATE ON ofertas
BEGIN
  UPDATE ofertas SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- TABLA: EVENTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo_evento TEXT CHECK(tipo_evento IN ('cumpleaños', 'corporativo', 'boda', 'catering', 'otro')) DEFAULT 'otro',
  estado TEXT CHECK(estado IN ('planificado', 'confirmado', 'en_progreso', 'completado', 'cancelado')) DEFAULT 'planificado',
  fecha_evento DATETIME NOT NULL,
  lugar TEXT,
  capacidad INTEGER DEFAULT 0,
  personas_confirmadas INTEGER DEFAULT 0,
  personas_pendientes INTEGER DEFAULT 0,
  precio_entrada DECIMAL(10, 2),
  precio_total DECIMAL(12, 2),
  menu_especial TEXT, -- JSON: detalles del menú
  decoracion TEXT,
  contacto_principal TEXT, -- JSON: {nombre, email, telefono, empresa}
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para eventos
CREATE INDEX IF NOT EXISTS idx_eventos_codigo ON eventos(codigo);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos(tipo_evento);

-- Triggers para eventos
CREATE TRIGGER IF NOT EXISTS eventos_updated_at AFTER UPDATE ON eventos
BEGIN
  UPDATE eventos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- TABLA: ASISTENTES A EVENTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS evento_asistentes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evento_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  estado_confirmacion TEXT CHECK(estado_confirmacion IN ('pendiente', 'confirmado', 'rechazado', 'no_confirmo')) DEFAULT 'pendiente',
  numero_acompanantes INTEGER DEFAULT 0,
  restricciones_dieteticas TEXT, -- JSON: array de restricciones
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
);

-- Índices para asistentes
CREATE INDEX IF NOT EXISTS idx_evento_asistentes_evento_id ON evento_asistentes(evento_id);
CREATE INDEX IF NOT EXISTS idx_evento_asistentes_email ON evento_asistentes(email);

-- ============================================================================
-- TABLA: APLICACIONES DE OFERTAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS oferta_aplicaciones (
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
);

-- Índices para aplicaciones
CREATE INDEX IF NOT EXISTS idx_oferta_aplicaciones_oferta_id ON oferta_aplicaciones(oferta_id);
CREATE INDEX IF NOT EXISTS idx_oferta_aplicaciones_codigo ON oferta_aplicaciones(codigo_cupon);
CREATE INDEX IF NOT EXISTS idx_oferta_aplicaciones_fecha ON oferta_aplicaciones(applied_at);

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista: Ofertas activas
CREATE VIEW IF NOT EXISTS vw_ofertas_activas AS
SELECT 
  id, codigo, nombre, tipo, estado,
  precio_regular, precio_oferta, descuento_porcentaje,
  fecha_inicio, fecha_fin,
  CASE 
    WHEN fecha_fin < DATE('now') THEN 'vencida'
    WHEN fecha_inicio > DATE('now') THEN 'proxima'
    ELSE 'activa'
  END AS vigencia
FROM ofertas
WHERE estado = 'activa';

-- Vista: Eventos próximos
CREATE VIEW IF NOT EXISTS vw_eventos_proximos AS
SELECT 
  id, codigo, nombre, tipo_evento, estado,
  fecha_evento, lugar, capacidad, personas_confirmadas,
  (capacidad - personas_confirmadas) AS lugares_disponibles,
  precio_entrada, precio_total,
  CASE 
    WHEN fecha_evento < DATETIME('now') THEN 'pasado'
    WHEN fecha_evento < DATETIME('now', '+7 days') THEN 'esta_semana'
    WHEN fecha_evento < DATETIME('now', '+30 days') THEN 'este_mes'
    ELSE 'futuro'
  END AS proximidad
FROM eventos
WHERE estado IN ('planificado', 'confirmado', 'en_progreso')
ORDER BY fecha_evento ASC;

-- Vista: Estadísticas de ofertas
CREATE VIEW IF NOT EXISTS vw_ofertas_estadisticas AS
SELECT 
  o.id, o.codigo, o.nombre,
  COUNT(DISTINCT oa.id) AS veces_aplicada,
  COALESCE(SUM(oa.monto_descuento), 0) AS descuento_total,
  COUNT(DISTINCT oa.cliente_id) AS clientes_beneficiados,
  o.fecha_inicio, o.fecha_fin,
  o.descuento_porcentaje
FROM ofertas o
LEFT JOIN oferta_aplicaciones oa ON o.id = oa.oferta_id
GROUP BY o.id;

-- Vista: Estadísticas de eventos
CREATE VIEW IF NOT EXISTS vw_eventos_estadisticas AS
SELECT 
  e.id, e.codigo, e.nombre,
  COUNT(DISTINCT ea.id) AS total_asistentes,
  SUM(CASE WHEN ea.estado_confirmacion = 'confirmado' THEN 1 ELSE 0 END) AS confirmados,
  SUM(CASE WHEN ea.estado_confirmacion = 'rechazado' THEN 1 ELSE 0 END) AS rechazados,
  SUM(CASE WHEN ea.estado_confirmacion = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
  e.precio_total, e.estado, e.fecha_evento
FROM eventos e
LEFT JOIN evento_asistentes ea ON e.id = ea.evento_id
GROUP BY e.id;
