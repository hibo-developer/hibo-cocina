-- Sprint 2.8: Tabla de notificaciones persistentes
-- Guarda historial completo de notificaciones por usuario

CREATE TABLE IF NOT EXISTS notificaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT 0,
  datos JSON,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_lectura DATETIME,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notif_fecha ON notificaciones(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_notif_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notif_usuario_leida ON notificaciones(usuario_id, leida);

-- Tabla de preferencias de notificación por usuario
CREATE TABLE IF NOT EXISTS notificaciones_preferencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER UNIQUE NOT NULL,
  recibir_platos BOOLEAN DEFAULT 1,
  recibir_ingredientes BOOLEAN DEFAULT 1,
  recibir_inventario BOOLEAN DEFAULT 1,
  recibir_pedidos BOOLEAN DEFAULT 1,
  recibir_stock_bajo BOOLEAN DEFAULT 1,
  recibir_alertas BOOLEAN DEFAULT 1,
  silencio_inicio TIME,
  silencio_fin TIME,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índice para preferencias
CREATE INDEX IF NOT EXISTS idx_preferencias_usuario ON notificaciones_preferencias(usuario_id);
