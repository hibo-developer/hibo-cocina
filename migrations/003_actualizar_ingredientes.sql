-- Migración: Actualizar tabla ingredientes con campos del Excel
-- Fecha: 2024

-- Agregar columnas faltantes a ingredientes
ALTER TABLE ingredientes ADD COLUMN familia TEXT;
ALTER TABLE ingredientes ADD COLUMN partidas_almacen TEXT;
ALTER TABLE ingredientes ADD COLUMN unidad_economato TEXT;
ALTER TABLE ingredientes ADD COLUMN unidad_escandallo TEXT;
ALTER TABLE ingredientes ADD COLUMN formato_envases TEXT;
ALTER TABLE ingredientes ADD COLUMN peso_neto_envase REAL DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN unidad_por_formatos REAL DEFAULT 1;
ALTER TABLE ingredientes ADD COLUMN coste_unidad REAL DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN coste_envase REAL DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN coste_kilo REAL DEFAULT 0;

-- Alérgenos (de las 14 columnas del Excel)
ALTER TABLE ingredientes ADD COLUMN sesamo INTEGER DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN pescado INTEGER DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN mariscos INTEGER DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN apio INTEGER DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN frutos_secos INTEGER DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN sulfitos INTEGER DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN lacteos INTEGER DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN altramuces INTEGER DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN gluten INTEGER DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN ovoproductos INTEGER DEFAULT 0;

-- Estado
ALTER TABLE ingredientes ADD COLUMN activo INTEGER DEFAULT 1;
