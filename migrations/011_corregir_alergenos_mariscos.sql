-- Migración: Eliminar columna "mariscos" redundante y asegurar 14 alérgenos UE
-- Los mariscos ya están cubiertos por "crustáceos" y "moluscos"
-- Alérgenos oficiales UE (14): gluten, crustáceos, moluscos, pescado, cacahuetes,
-- frutos_secos, soja, lacteos, ovoproductos, apio, mostaza, sesamo, sulfitos, altramuces

-- Nota: SQLite no soporta DROP COLUMN directamente, documentamos la redundancia
-- La columna "mariscos" existe pero no es un alérgeno oficial separado
-- Usar "crustáceos" para langostinos, gambas, cangrejos
-- Usar "moluscos" para almejas, mejillones, calamares, pulpos

-- Para nuevas instalaciones, actualizar el schema para no incluir "mariscos"
-- Para instalaciones existentes, la columna permanece por compatibilidad pero no se usa

-- Verificación: listar alérgenos oficiales
SELECT 'Alérgenos oficiales UE (14):' as info;
SELECT codigo, nombre FROM alergenos_oficiales ORDER BY orden;
