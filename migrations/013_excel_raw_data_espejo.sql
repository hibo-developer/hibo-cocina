-- Migración 013: Tabla espejo para datos crudos del Excel
-- Almacena una copia exacta y literal de todas las hojas del Excel
-- Permite auditoría, recuperación y análisis de datos originales

CREATE TABLE IF NOT EXISTS excel_raw_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archivo TEXT NOT NULL,                          -- Nombre del archivo: "fabricación.xlsx", "oferta_c.xlsx"
  hoja TEXT NOT NULL,                             -- Nombre de la hoja: "Platos", "Articulos", "Partidas", etc.
  fila_numero INTEGER NOT NULL,                   -- Número de fila en el Excel (1-indexed)
  datos JSON NOT NULL,                            -- Datos crudos de la fila en formato JSON
  mapeado_a TEXT,                                 -- Tabla destino: "platos", "ingredientes", "partidas_cocina", "escandallos", "eventos", etc.
  id_mapeado INTEGER,                             -- ID del registro en la tabla destino (null si hubo error)
  estado TEXT DEFAULT 'importado',                -- "importado", "error", "duplicado", "ignorado"
  error_mensaje TEXT,                             -- Mensaje de error si aplicable
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_excel_raw_archivo ON excel_raw_data(archivo);
CREATE INDEX IF NOT EXISTS idx_excel_raw_hoja ON excel_raw_data(hoja);
CREATE INDEX IF NOT EXISTS idx_excel_raw_mapeado ON excel_raw_data(mapeado_a, id_mapeado);
CREATE INDEX IF NOT EXISTS idx_excel_raw_estado ON excel_raw_data(estado);

-- Vista para auditoría: mostrar datos mapeados
CREATE VIEW IF NOT EXISTS vw_excel_importacion_resumen AS
SELECT 
  archivo,
  hoja,
  mapeado_a,
  estado,
  COUNT(*) as cantidad,
  SUM(CASE WHEN id_mapeado IS NOT NULL THEN 1 ELSE 0 END) as exitosos
FROM excel_raw_data
GROUP BY archivo, hoja, mapeado_a, estado
ORDER BY archivo, hoja, mapeado_a;
