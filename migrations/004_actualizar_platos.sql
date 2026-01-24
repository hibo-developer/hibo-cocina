-- Migración: Actualizar tabla platos con campos del Excel
-- Fecha: 2024

-- Agregar columnas faltantes a platos
ALTER TABLE platos ADD COLUMN familia TEXT;
ALTER TABLE platos ADD COLUMN coste_racion REAL DEFAULT 0;
ALTER TABLE platos ADD COLUMN coste_escandallo REAL DEFAULT 0;
ALTER TABLE platos ADD COLUMN precio_venta REAL DEFAULT 0;
ALTER TABLE platos ADD COLUMN precio_menu REAL DEFAULT 0;
ALTER TABLE platos ADD COLUMN margen REAL DEFAULT 0;
ALTER TABLE platos ADD COLUMN escandallado INTEGER DEFAULT 0;
ALTER TABLE platos ADD COLUMN alergenos TEXT;
ALTER TABLE platos ADD COLUMN plato_venta INTEGER DEFAULT 1;
ALTER TABLE platos ADD COLUMN activo INTEGER DEFAULT 1;
