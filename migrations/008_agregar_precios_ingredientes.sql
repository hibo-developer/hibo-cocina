-- Agregar columnas de precio a la tabla ingredientes

-- Agregar columna coste_unidad (precio del envase/unidad)
ALTER TABLE ingredientes ADD COLUMN coste_unidad REAL DEFAULT 0;

-- Agregar columna coste_kilo (precio por kg/lt)
ALTER TABLE ingredientes ADD COLUMN coste_kilo REAL DEFAULT 0;

-- Agregar columna peso_neto_envase
ALTER TABLE ingredientes ADD COLUMN peso_neto_envase REAL DEFAULT 0;

-- Agregar columna unidad_escandallo
ALTER TABLE ingredientes ADD COLUMN unidad_escandallo TEXT DEFAULT '';

-- Crear índice para optimizar consultas por coste
CREATE INDEX idx_ingredientes_coste_kilo ON ingredientes(coste_kilo);
