-- Migración: Agregar campo palabras_clave a alérgenos personalizados
-- Fecha: 2026-01-25

-- Agregar columna palabras_clave para detección automática
ALTER TABLE alergenos_personalizados ADD COLUMN palabras_clave TEXT;
