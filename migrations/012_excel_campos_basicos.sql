-- Migración 012: Añadir columnas básicas para reflejar Excel
-- Fecha: 2026-01-26

-- Platos: agregar columna 'grupo' para categoría/partida del Excel
ALTER TABLE platos ADD COLUMN grupo TEXT;

-- Ingredientes: columnas usadas por la app y el importador
ALTER TABLE ingredientes ADD COLUMN unidad TEXT;
ALTER TABLE ingredientes ADD COLUMN precio REAL DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN stock_actual REAL DEFAULT 0;
