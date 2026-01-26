CREATE TABLE platos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE NOT NULL,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          unidad TEXT,
          coste REAL,
          tipo TEXT,
          peso_raciones REAL,
          grupo_menu TEXT,
          cocina TEXT,
          stock_activo BOOLEAN DEFAULT 0,
          preparacion TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        , familia TEXT, coste_racion REAL DEFAULT 0, coste_escandallo REAL DEFAULT 0, precio_venta REAL DEFAULT 0, precio_menu REAL DEFAULT 0, margen REAL DEFAULT 0, escandallado INTEGER DEFAULT 0, alergenos TEXT, plato_venta INTEGER DEFAULT 1, activo INTEGER DEFAULT 1, sesamo INTEGER DEFAULT 0, pescado INTEGER DEFAULT 0, mariscos INTEGER DEFAULT 0, apio INTEGER DEFAULT 0, frutos_secos INTEGER DEFAULT 0, sulfitos INTEGER DEFAULT 0, lacteos INTEGER DEFAULT 0, altramuces INTEGER DEFAULT 0, gluten INTEGER DEFAULT 0, ovoproductos INTEGER DEFAULT 0, tipo_entidad TEXT DEFAULT "plato", cacahuetes INTEGER DEFAULT 0, soja INTEGER DEFAULT 0, mostaza INTEGER DEFAULT 0, moluscos INTEGER DEFAULT 0, crustaceos INTEGER DEFAULT 0);

CREATE TABLE ingredientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE NOT NULL,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          grupo_conservacion TEXT,
          proveedor TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        , familia TEXT, partidas_almacen TEXT, unidad_economato TEXT, unidad_escandallo TEXT, formato_envases TEXT, peso_neto_envase REAL DEFAULT 0, unidad_por_formatos REAL DEFAULT 1, coste_unidad REAL DEFAULT 0, coste_envase REAL DEFAULT 0, coste_kilo REAL DEFAULT 0, sesamo INTEGER DEFAULT 0, pescado INTEGER DEFAULT 0, mariscos INTEGER DEFAULT 0, apio INTEGER DEFAULT 0, frutos_secos INTEGER DEFAULT 0, sulfitos INTEGER DEFAULT 0, lacteos INTEGER DEFAULT 0, altramuces INTEGER DEFAULT 0, gluten INTEGER DEFAULT 0, ovoproductos INTEGER DEFAULT 0, activo INTEGER DEFAULT 1, tipo_entidad TEXT DEFAULT "ingrediente", cacahuetes INTEGER DEFAULT 0, soja INTEGER DEFAULT 0, mostaza INTEGER DEFAULT 0, moluscos INTEGER DEFAULT 0, crustaceos INTEGER DEFAULT 0);

CREATE TABLE escandallos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plato_id INTEGER NOT NULL,
          ingrediente_id INTEGER NOT NULL,
          cantidad REAL,
          unidad TEXT,
          coste REAL,
          FOREIGN KEY (plato_id) REFERENCES platos(id),
          FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id)
        );

CREATE TABLE pedidos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          numero TEXT UNIQUE NOT NULL,
          cliente_codigo TEXT,
          fecha_pedido DATETIME,
          fecha_entrega DATETIME,
          estado TEXT DEFAULT 'pendiente',
          total REAL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE lineas_pedido (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pedido_id INTEGER NOT NULL,
          plato_id INTEGER NOT NULL,
          cantidad INTEGER,
          precio_unitario REAL,
          subtotal REAL,
          FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
          FOREIGN KEY (plato_id) REFERENCES platos(id)
        );

CREATE TABLE produccion (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pedido_id INTEGER,
          plato_id INTEGER,
          cantidad_producida INTEGER,
          fecha_produccion DATETIME,
          estado TEXT DEFAULT 'pendiente',
          partida_cocina TEXT,
          envase_tipo TEXT,
          cantidad_envases INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
          FOREIGN KEY (plato_id) REFERENCES platos(id)
        );

CREATE TABLE envases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tipo TEXT UNIQUE NOT NULL,
          capacidad_raciones INTEGER,
          costo REAL,
          descripcion TEXT,
          activo BOOLEAN DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE etiquetas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ingrediente_id INTEGER NOT NULL,
          plato_id INTEGER NOT NULL,
          cantidad_neto REAL,
          cantidad_bruto REAL,
          porcentaje_perdidas REAL,
          numero_etiquetas INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id),
          FOREIGN KEY (plato_id) REFERENCES platos(id)
        );

CREATE TABLE articulos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE NOT NULL,
          nombre TEXT NOT NULL,
          unidad TEXT NOT NULL,
          coste_kilo REAL DEFAULT 0,
          tipo TEXT,
          grupo_conservacion TEXT DEFAULT 'Temperatura Ambiente',
          activo BOOLEAN DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE partidas_cocina (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          responsable TEXT,
          descripcion TEXT,
          activo BOOLEAN DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE trazabilidad (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo_plato TEXT NOT NULL,
          lote_produccion TEXT,
          fecha_produccion DATETIME DEFAULT CURRENT_TIMESTAMP,
          partida_cocina TEXT,
          cantidad_producida REAL,
          responsable TEXT,
          observaciones TEXT,
          estado TEXT DEFAULT 'activo',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (codigo_plato) REFERENCES platos(codigo)
        );

CREATE TABLE salida_mercancias (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE NOT NULL,
          grupo_conservacion TEXT,
          fecha DATETIME,
          trazabilidad TEXT,
          estado TEXT DEFAULT 'pendiente',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE clientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE,
          nombre TEXT NOT NULL,
          email TEXT,
          telefono TEXT,
          direccion TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE proveedores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE,
          nombre TEXT NOT NULL,
          email TEXT,
          telefono TEXT,
          direccion TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE control_sanidad (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plato_codigo TEXT NOT NULL,
          ingrediente_codigo TEXT,
          fecha_produccion DATETIME,
          punto_critico TEXT,
          corrector TEXT,
          responsable TEXT,
          observaciones TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (plato_codigo) REFERENCES platos(codigo)
        );

CREATE TABLE pedidos_proveedor (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          numero_pedido TEXT UNIQUE NOT NULL,
          proveedor_id INTEGER NOT NULL,
          fecha_pedido DATETIME,
          estado TEXT DEFAULT 'pendiente',
          total REAL DEFAULT 0,
          grupo_conservacion TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
        );

CREATE TABLE lineas_pedido_proveedor (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pedido_proveedor_id INTEGER NOT NULL,
          articulo_id INTEGER NOT NULL,
          cantidad REAL,
          precio_unitario REAL,
          subtotal REAL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pedido_proveedor_id) REFERENCES pedidos_proveedor(id),
          FOREIGN KEY (articulo_id) REFERENCES articulos(id)
        );

CREATE TABLE necesidades_mercancia (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          semana INTEGER,
          año INTEGER,
          articulo_id INTEGER NOT NULL,
          cantidad_necesaria REAL,
          grupo_conservacion TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (articulo_id) REFERENCES articulos(id)
        );

CREATE TABLE planificacion_produccion (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          semana INTEGER,
          año INTEGER,
          plato_id INTEGER NOT NULL,
          cantidad INTEGER,
          estado TEXT DEFAULT 'planificado',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (plato_id) REFERENCES platos(id)
        );

CREATE TABLE movimientos_stock (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          articulo_codigo TEXT NOT NULL,
          tipo TEXT CHECK(tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'PRODUCCION')) NOT NULL,
          cantidad REAL NOT NULL,
          motivo TEXT,
          stock_resultante REAL,
          usuario TEXT,
          documento_ref TEXT
        );

CREATE TABLE eventos_clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        menu_evento TEXT,
        nombre_evento TEXT,
        opciones TEXT,
        fecha TEXT,
        num_clientes INTEGER DEFAULT 0,
        coste_estimado REAL DEFAULT 0,
        precio_venta REAL DEFAULT 0,
        servicios TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE "inventario" (
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

CREATE INDEX idx_inventario_ingrediente ON inventario(ingrediente_id);

CREATE INDEX idx_inventario_fecha ON inventario(fecha_registro);

CREATE TABLE alergenos_personalizados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  icono TEXT,
  activo INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, palabras_clave TEXT);

CREATE TABLE ingredientes_alergenos_personalizados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingrediente_id INTEGER NOT NULL,
  alergeno_id INTEGER NOT NULL,
  FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE,
  FOREIGN KEY (alergeno_id) REFERENCES alergenos_personalizados(id) ON DELETE CASCADE,
  UNIQUE(ingrediente_id, alergeno_id)
);

CREATE TABLE platos_alergenos_personalizados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plato_id INTEGER NOT NULL,
  alergeno_id INTEGER NOT NULL,
  FOREIGN KEY (plato_id) REFERENCES platos(id) ON DELETE CASCADE,
  FOREIGN KEY (alergeno_id) REFERENCES alergenos_personalizados(id) ON DELETE CASCADE,
  UNIQUE(plato_id, alergeno_id)
);

CREATE INDEX idx_ingredientes_alergenos_ingrediente ON ingredientes_alergenos_personalizados(ingrediente_id);

CREATE INDEX idx_ingredientes_alergenos_alergeno ON ingredientes_alergenos_personalizados(alergeno_id);

CREATE INDEX idx_platos_alergenos_plato ON platos_alergenos_personalizados(plato_id);

CREATE INDEX idx_platos_alergenos_alergeno ON platos_alergenos_personalizados(alergeno_id);

CREATE TABLE alergenos_oficiales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT,
  palabras_clave TEXT,
  orden INTEGER DEFAULT 0,
  activo INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);