-- Migración: Actualizar tabla inventario para usar ingrediente_id en lugar de articulo_id

-- Crear tabla temporal con la nueva estructura
CREATE TABLE inventario_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingrediente_id INTEGER NOT NULL,
  cantidad REAL DEFAULT 0,
  unidad TEXT DEFAULT 'kg',
  lote TEXT,
  fecha DATE,
  fecha_caducidad DATE,
  fecha_registro DATE DEFAULT (date('now')),
  ubicacion TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE
);

-- Copiar datos existentes (si hay alguno con articulo_id, intentar mapearlo)
INSERT INTO inventario_new (id, ingrediente_id, cantidad, unidad, fecha_registro, created_at, updated_at)
SELECT id, articulo_id, cantidad, unidad, fecha_registro, created_at, updated_at
FROM inventario
WHERE articulo_id IS NOT NULL;

-- Eliminar tabla antigua
DROP TABLE inventario;

-- Renombrar tabla nueva
ALTER TABLE inventario_new RENAME TO inventario;

-- Recrear índices si es necesario
CREATE INDEX IF NOT EXISTS idx_inventario_ingrediente ON inventario(ingrediente_id);
CREATE INDEX IF NOT EXISTS idx_inventario_fecha ON inventario(fecha_registro);
