-- Migración: Agregar campo tipo_entidad a platos e ingredientes
-- Fecha: 2026-01-24

-- 1. Agregar columna tipo_entidad a platos (renombrado para evitar conflicto)
ALTER TABLE platos ADD COLUMN tipo_entidad TEXT DEFAULT 'plato';

-- 2. Agregar columna tipo_entidad a ingredientes  
ALTER TABLE ingredientes ADD COLUMN tipo_entidad TEXT DEFAULT 'ingrediente';

-- 3. Clasificar ingredientes con código PL-* como elaborados
-- Los que contienen "BASE" son elaborados/preelaborados
UPDATE ingredientes 
SET tipo_entidad = CASE 
  WHEN nombre LIKE '%BASE%' OR nombre LIKE '%Base%' THEN 'elaborado'
  WHEN codigo LIKE 'PL-%' THEN 'elaborado'
  ELSE 'ingrediente'
END
WHERE codigo LIKE 'PL-%' OR codigo LIKE 'AR-%';

-- 4. Los platos que son para venta mantienen tipo 'plato'
-- Los que se usan como ingredientes en otros platos se marcan como elaborados
UPDATE platos
SET tipo_entidad = CASE
  WHEN nombre LIKE '%BASE%' OR nombre LIKE '%Base%' THEN 'elaborado'
  WHEN plato_venta = 1 THEN 'plato'
  ELSE 'elaborado'
END;
