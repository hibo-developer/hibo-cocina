const db = require('./database');

function crearTablas() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabla de Platos
      db.run(`
        CREATE TABLE IF NOT EXISTS platos (
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
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Ingredientes
      db.run(`
        CREATE TABLE IF NOT EXISTS ingredientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE NOT NULL,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          grupo_conservacion TEXT,
          proveedor TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Escandallos (relación plato-ingrediente)
      db.run(`
        CREATE TABLE IF NOT EXISTS escandallos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plato_id INTEGER NOT NULL,
          ingrediente_id INTEGER NOT NULL,
          cantidad REAL,
          unidad TEXT,
          coste REAL,
          FOREIGN KEY (plato_id) REFERENCES platos(id),
          FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id)
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Pedidos
      db.run(`
        CREATE TABLE IF NOT EXISTS pedidos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          numero TEXT UNIQUE NOT NULL,
          cliente_codigo TEXT,
          fecha_pedido DATETIME,
          fecha_entrega DATETIME,
          estado TEXT DEFAULT 'pendiente',
          total REAL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Líneas de Pedido
      db.run(`
        CREATE TABLE IF NOT EXISTS lineas_pedido (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pedido_id INTEGER NOT NULL,
          plato_id INTEGER NOT NULL,
          cantidad INTEGER,
          precio_unitario REAL,
          subtotal REAL,
          FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
          FOREIGN KEY (plato_id) REFERENCES platos(id)
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Producción
      db.run(`
        CREATE TABLE IF NOT EXISTS produccion (
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
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Envases
      db.run(`
        CREATE TABLE IF NOT EXISTS envases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tipo TEXT UNIQUE NOT NULL,
          capacidad_raciones INTEGER,
          costo REAL,
          descripcion TEXT,
          activo BOOLEAN DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Artículos (Ingredientes mejorada)
      db.run(`
        CREATE TABLE IF NOT EXISTS articulos (
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
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Partidas de Cocina (mejorada)
      db.run(`
        CREATE TABLE IF NOT EXISTS partidas_cocina (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          responsable TEXT,
          descripcion TEXT,
          activo BOOLEAN DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Inventario (Stock por artículo)
      db.run(`
        CREATE TABLE IF NOT EXISTS inventario (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          articulo_id INTEGER NOT NULL,
          cantidad REAL NOT NULL,
          fecha_registro DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (articulo_id) REFERENCES articulos(id)
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Trazabilidad (Producción y seguimiento)
      db.run(`
        CREATE TABLE IF NOT EXISTS trazabilidad (
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
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Etiquetas
      db.run(`
        CREATE TABLE IF NOT EXISTS etiquetas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo_plato TEXT NOT NULL,
          descripcion TEXT,
          informacion_nutricional TEXT,
          ingredientes TEXT,
          alergenos TEXT,
          instrucciones_preparacion TEXT,
          modo_conservacion TEXT,
          durabilidad_dias INTEGER,
          lote_impresion TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (codigo_plato) REFERENCES platos(codigo)
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Salida de Mercancías
      db.run(`
        CREATE TABLE IF NOT EXISTS salida_mercancias (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE NOT NULL,
          grupo_conservacion TEXT,
          fecha DATETIME,
          trazabilidad TEXT,
          estado TEXT DEFAULT 'pendiente',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Clientes
      db.run(`
        CREATE TABLE IF NOT EXISTS clientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE,
          nombre TEXT NOT NULL,
          email TEXT,
          telefono TEXT,
          direccion TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Proveedores
      db.run(`
        CREATE TABLE IF NOT EXISTS proveedores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE,
          nombre TEXT NOT NULL,
          email TEXT,
          telefono TEXT,
          direccion TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Control Sanidad (APPCC)
      db.run(`
        CREATE TABLE IF NOT EXISTS control_sanidad (
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
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Pedidos a Proveedor
      db.run(`
        CREATE TABLE IF NOT EXISTS pedidos_proveedor (
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
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Líneas de Pedido Proveedor
      db.run(`
        CREATE TABLE IF NOT EXISTS lineas_pedido_proveedor (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pedido_proveedor_id INTEGER NOT NULL,
          articulo_id INTEGER NOT NULL,
          cantidad REAL,
          precio_unitario REAL,
          subtotal REAL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pedido_proveedor_id) REFERENCES pedidos_proveedor(id),
          FOREIGN KEY (articulo_id) REFERENCES articulos(id)
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Necesidades de Mercancía
      db.run(`
        CREATE TABLE IF NOT EXISTS necesidades_mercancia (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          semana INTEGER,
          año INTEGER,
          articulo_id INTEGER NOT NULL,
          cantidad_necesaria REAL,
          grupo_conservacion TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (articulo_id) REFERENCES articulos(id)
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Tabla de Planificación Producción
      db.run(`
        CREATE TABLE IF NOT EXISTS planificacion_produccion (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          semana INTEGER,
          año INTEGER,
          plato_id INTEGER NOT NULL,
          cantidad INTEGER,
          estado TEXT DEFAULT 'planificado',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (plato_id) REFERENCES platos(id)
        )
      `, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  });
}

module.exports = { crearTablas };
