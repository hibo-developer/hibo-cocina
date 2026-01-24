-- Migración: Agregar alérgenos faltantes (5 de 14)
-- Fecha: 2026-01-24
-- Alérgenos: crustaceos, cacahuetes, soja, mostaza, moluscos

-- Tabla ingredientes
ALTER TABLE ingredientes ADD COLUMN crustaceos INTEGER DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN cacahuetes INTEGER DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN soja INTEGER DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN mostaza INTEGER DEFAULT 0;
ALTER TABLE ingredientes ADD COLUMN moluscos INTEGER DEFAULT 0;

-- Tabla platos
ALTER TABLE platos ADD COLUMN crustaceos INTEGER DEFAULT 0;
ALTER TABLE platos ADD COLUMN cacahuetes INTEGER DEFAULT 0;
ALTER TABLE platos ADD COLUMN soja INTEGER DEFAULT 0;
ALTER TABLE platos ADD COLUMN mostaza INTEGER DEFAULT 0;
ALTER TABLE platos ADD COLUMN moluscos INTEGER DEFAULT 0;
