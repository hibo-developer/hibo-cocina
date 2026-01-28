-- 014_modulo_produccion.sql
-- Crear tablas para el módulo de producción
-- Fecha: 27 Enero 2026

-- ============================================================================
-- TABLA: produccion_ordenes
-- Órdenes de producción planificadas y ejecutadas
-- ============================================================================
CREATE TABLE IF NOT EXISTS produccion_ordenes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  plato_id INTEGER NOT NULL,
  cantidad_planificada REAL NOT NULL,
  cantidad_producida REAL DEFAULT 0,
  unidad TEXT DEFAULT 'unidades',
  fecha_planificada DATE NOT NULL,
  fecha_inicio DATETIME,
  fecha_fin DATETIME,
  estado TEXT DEFAULT 'PENDIENTE',
  prioridad TEXT DEFAULT 'NORMAL',
  responsable TEXT,
  lote_base TEXT,
  coste_estimado REAL DEFAULT 0,
  coste_real REAL DEFAULT 0,
  rendimiento REAL,
  observaciones TEXT,
  motivo_cancelacion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(plato_id) REFERENCES platos(id) ON DELETE CASCADE
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_produccion_ordenes_estado ON produccion_ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_produccion_ordenes_fecha ON produccion_ordenes(fecha_planificada);
CREATE INDEX IF NOT EXISTS idx_produccion_ordenes_plato ON produccion_ordenes(plato_id);
CREATE INDEX IF NOT EXISTS idx_produccion_ordenes_codigo ON produccion_ordenes(codigo);

-- ============================================================================
-- TABLA: produccion_lotes
-- Lotes generados en cada orden de producción
-- ============================================================================
CREATE TABLE IF NOT EXISTS produccion_lotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  codigo_lote TEXT UNIQUE NOT NULL,
  cantidad REAL NOT NULL,
  unidad TEXT DEFAULT 'unidades',
  fecha_produccion DATETIME NOT NULL,
  fecha_caducidad DATE,
  fecha_vencimiento DATE,
  rendimiento REAL,
  coste_unitario REAL,
  coste_total REAL,
  estado TEXT DEFAULT 'ACTIVO',
  ubicacion TEXT,
  temperatura_almacenamiento REAL,
  humedad_almacenamiento REAL,
  observaciones TEXT,
  calidad TEXT DEFAULT 'APTA',
  certificado_calidad TEXT,
  usuario_registro TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(orden_id) REFERENCES produccion_ordenes(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_produccion_lotes_orden ON produccion_lotes(orden_id);
CREATE INDEX IF NOT EXISTS idx_produccion_lotes_codigo ON produccion_lotes(codigo_lote);
CREATE INDEX IF NOT EXISTS idx_produccion_lotes_fecha ON produccion_lotes(fecha_produccion);
CREATE INDEX IF NOT EXISTS idx_produccion_lotes_estado ON produccion_lotes(estado);

-- ============================================================================
-- TABLA: produccion_consumos
-- Registro de ingredientes consumidos en cada orden
-- ============================================================================
CREATE TABLE IF NOT EXISTS produccion_consumos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  ingrediente_id INTEGER NOT NULL,
  cantidad_planificada REAL NOT NULL,
  cantidad_consumida REAL,
  cantidad_desperdicio REAL DEFAULT 0,
  unidad TEXT,
  coste_unitario REAL,
  coste_total REAL,
  lote_ingrediente TEXT,
  fecha_consumo DATETIME,
  usuario_registro TEXT,
  observaciones TEXT,
  tipo_consumo TEXT DEFAULT 'NORMAL',
  justificacion_desperdicio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(orden_id) REFERENCES produccion_ordenes(id) ON DELETE CASCADE,
  FOREIGN KEY(ingrediente_id) REFERENCES ingredientes(id) ON DELETE RESTRICT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_produccion_consumos_orden ON produccion_consumos(orden_id);
CREATE INDEX IF NOT EXISTS idx_produccion_consumos_ingrediente ON produccion_consumos(ingrediente_id);
CREATE INDEX IF NOT EXISTS idx_produccion_consumos_fecha ON produccion_consumos(fecha_consumo);

-- ============================================================================
-- TABLA: produccion_tiempos
-- Tracking de tiempos de producción para análisis
-- ============================================================================
CREATE TABLE IF NOT EXISTS produccion_tiempos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  etapa TEXT NOT NULL,
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME,
  duracion_minutos REAL,
  responsable TEXT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(orden_id) REFERENCES produccion_ordenes(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_produccion_tiempos_orden ON produccion_tiempos(orden_id);

-- ============================================================================
-- TABLA: produccion_incidencias
-- Registro de incidencias durante la producción
-- ============================================================================
CREATE TABLE IF NOT EXISTS produccion_incidencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER,
  lote_id INTEGER,
  tipo TEXT NOT NULL,
  severidad TEXT DEFAULT 'MEDIA',
  descripcion TEXT NOT NULL,
  fecha_incidencia DATETIME NOT NULL,
  fecha_resolucion DATETIME,
  responsable TEXT,
  accion_tomada TEXT,
  estado TEXT DEFAULT 'ABIERTA',
  impacto_produccion TEXT,
  impacto_calidad TEXT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(orden_id) REFERENCES produccion_ordenes(id) ON DELETE SET NULL,
  FOREIGN KEY(lote_id) REFERENCES produccion_lotes(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_produccion_incidencias_orden ON produccion_incidencias(orden_id);
CREATE INDEX IF NOT EXISTS idx_produccion_incidencias_lote ON produccion_incidencias(lote_id);
CREATE INDEX IF NOT EXISTS idx_produccion_incidencias_estado ON produccion_incidencias(estado);

-- ============================================================================
-- VISTA: produccion_resumen
-- Vista consolidada de órdenes con información relacionada
-- ============================================================================
CREATE VIEW IF NOT EXISTS produccion_resumen AS
SELECT 
  po.id,
  po.codigo,
  po.fecha_planificada,
  po.fecha_inicio,
  po.fecha_fin,
  po.estado,
  po.prioridad,
  po.cantidad_planificada,
  po.cantidad_producida,
  po.rendimiento,
  po.responsable,
  p.nombre AS plato_nombre,
  p.codigo AS plato_codigo,
  COUNT(DISTINCT pl.id) AS num_lotes,
  COUNT(DISTINCT pc.id) AS num_consumos,
  COUNT(DISTINCT pi.id) AS num_incidencias,
  SUM(pc.coste_total) AS coste_total_consumos,
  po.coste_real
FROM produccion_ordenes po
LEFT JOIN platos p ON po.plato_id = p.id
LEFT JOIN produccion_lotes pl ON po.id = pl.orden_id
LEFT JOIN produccion_consumos pc ON po.id = pc.orden_id
LEFT JOIN produccion_incidencias pi ON po.id = pi.orden_id
GROUP BY po.id;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Actualizar fecha de modificación en produccion_ordenes
CREATE TRIGGER IF NOT EXISTS update_produccion_ordenes_timestamp 
AFTER UPDATE ON produccion_ordenes
BEGIN
  UPDATE produccion_ordenes 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- Trigger: Actualizar fecha de modificación en produccion_lotes
CREATE TRIGGER IF NOT EXISTS update_produccion_lotes_timestamp 
AFTER UPDATE ON produccion_lotes
BEGIN
  UPDATE produccion_lotes 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- Trigger: Calcular coste total en produccion_consumos
CREATE TRIGGER IF NOT EXISTS calculate_coste_total_consumo
AFTER INSERT ON produccion_consumos
WHEN NEW.coste_total IS NULL AND NEW.cantidad_consumida IS NOT NULL
BEGIN
  UPDATE produccion_consumos 
  SET coste_total = NEW.cantidad_consumida * NEW.coste_unitario
  WHERE id = NEW.id;
END;

-- Trigger: Calcular rendimiento en produccion_ordenes
CREATE TRIGGER IF NOT EXISTS calculate_rendimiento_orden
AFTER UPDATE OF cantidad_producida ON produccion_ordenes
WHEN NEW.cantidad_producida > 0 AND NEW.cantidad_planificada > 0
BEGIN
  UPDATE produccion_ordenes 
  SET rendimiento = (NEW.cantidad_producida * 100.0 / NEW.cantidad_planificada)
  WHERE id = NEW.id;
END;

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Estados válidos para órdenes
-- PENDIENTE: Orden creada, sin iniciar
-- EN_PROCESO: Producción en curso
-- PAUSADA: Producción pausada temporalmente
-- COMPLETADA: Producción finalizada exitosamente
-- CANCELADA: Orden cancelada
-- RECHAZADA: Producción rechazada por calidad

-- Prioridades válidas
-- BAJA: Puede esperar
-- NORMAL: Prioridad estándar
-- ALTA: Requiere atención prioritaria
-- URGENTE: Máxima prioridad

-- Tipos de consumo
-- NORMAL: Consumo planificado
-- EXTRA: Consumo adicional no planificado
-- DESPERDICIO: Material desperdiciado
-- MUESTRA: Usado para muestras/degustación
-- MERMA: Pérdida natural del proceso

-- Calidad de lotes
-- APTA: Calidad óptima para venta
-- ACEPTABLE: Calidad aceptable con observaciones
-- NO_APTA: No cumple estándares de calidad
-- EN_REVISION: Pendiente de validación

-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

-- Este módulo permite:
-- 1. Planificar órdenes de producción
-- 2. Registrar consumos reales vs planificados
-- 3. Generar lotes trazables
-- 4. Calcular rendimientos y costes
-- 5. Tracking de tiempos por etapa
-- 6. Gestión de incidencias
-- 7. Análisis de eficiencia productiva

-- Flujo típico:
-- 1. Crear orden (PENDIENTE)
-- 2. Iniciar producción (EN_PROCESO)
-- 3. Registrar consumos de ingredientes
-- 4. Registrar tiempos por etapa
-- 5. Generar lotes con trazabilidad
-- 6. Finalizar orden (COMPLETADA)
-- 7. Análisis de rendimiento y costes

-- ============================================================================
