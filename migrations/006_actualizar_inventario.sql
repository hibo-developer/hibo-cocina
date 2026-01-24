-- Migración 006: Actualizar tabla inventario con nuevas columnas
-- Fecha: 2026-01-24

-- Agregar nuevas columnas a la tabla inventario
ALTER TABLE inventario ADD COLUMN ingrediente_id INTEGER;
ALTER TABLE inventario ADD COLUMN unidad TEXT;
ALTER TABLE inventario ADD COLUMN lote TEXT;
ALTER TABLE inventario ADD COLUMN fecha DATE;
ALTER TABLE inventario ADD COLUMN fecha_caducidad DATE;
ALTER TABLE inventario ADD COLUMN ubicacion TEXT;

-- Crear índice para búsqueda por ingrediente
CREATE INDEX IF NOT EXISTS idx_inventario_ingrediente ON inventario(ingrediente_id);

-- Copiar datos de articulo_id a ingrediente_id (si hay datos)
UPDATE inventario SET ingrediente_id = articulo_id WHERE ingrediente_id IS NULL;

-- Copiar fecha_registro a fecha (si hay datos)
UPDATE inventario SET fecha = fecha_registro WHERE fecha IS NULL;
