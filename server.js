const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a la base de datos
const db = new sqlite3.Database('./data/hibo-cocina.db', (err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static('public'));

// ============================================================================
// RUTAS API - PLATOS
// ============================================================================
app.get('/api/platos', (req, res) => {
  db.all('SELECT * FROM platos ORDER BY codigo', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/platos/:id', (req, res) => {
  db.get('SELECT * FROM platos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

app.post('/api/platos', (req, res) => {
  const { codigo, nombre, categoria, pvp, coste_produccion, activo, descripcion } = req.body;
  db.run(
    'INSERT INTO platos (codigo, nombre, categoria, pvp, coste_produccion, activo, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [codigo, nombre, categoria, pvp || 0, coste_produccion || 0, activo !== false ? 1 : 0, descripcion],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    }
  );
});

app.put('/api/platos/:id', (req, res) => {
  const { codigo, nombre, categoria, pvp, coste_produccion, activo, descripcion } = req.body;
  db.run(
    'UPDATE platos SET codigo = ?, nombre = ?, categoria = ?, pvp = ?, coste_produccion = ?, activo = ?, descripcion = ? WHERE id = ?',
    [codigo, nombre, categoria, pvp, coste_produccion, activo ? 1 : 0, descripcion, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/platos/:id', (req, res) => {
  db.run('DELETE FROM platos WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============================================================================
// RUTAS API - INGREDIENTES
// ============================================================================
app.get('/api/ingredientes', (req, res) => {
  db.all('SELECT * FROM ingredientes ORDER BY nombre', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/ingredientes', (req, res) => {
  const { nombre, unidad, precio, stock_actual, activo } = req.body;
  db.run(
    'INSERT INTO ingredientes (nombre, unidad, precio, stock_actual, activo) VALUES (?, ?, ?, ?, ?)',
    [nombre, unidad, precio || 0, stock_actual || 0, activo !== false ? 1 : 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    }
  );
});

app.put('/api/ingredientes/:id', (req, res) => {
  const { nombre, unidad, precio, stock_actual, activo } = req.body;
  db.run(
    'UPDATE ingredientes SET nombre = ?, unidad = ?, precio = ?, stock_actual = ?, activo = ? WHERE id = ?',
    [nombre, unidad, precio, stock_actual, activo ? 1 : 0, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/ingredientes/:id', (req, res) => {
  db.run('DELETE FROM ingredientes WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============================================================================
// RUTAS API - ESCANDALLOS
// ============================================================================
app.get('/api/escandallos', (req, res) => {
  db.all(`
    SELECT e.*, i.nombre as ingrediente_nombre, p.nombre as plato_nombre
    FROM escandallos e
    LEFT JOIN ingredientes i ON e.ingrediente_id = i.id
    LEFT JOIN platos p ON e.plato_id = p.id
    ORDER BY e.plato_id, e.ingrediente_id
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/escandallos', (req, res) => {
  const { plato_id, ingrediente_id, cantidad } = req.body;
  db.run(
    'INSERT INTO escandallos (plato_id, ingrediente_id, cantidad) VALUES (?, ?, ?)',
    [plato_id, ingrediente_id, cantidad || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    }
  );
});

app.delete('/api/escandallos/:id', (req, res) => {
  db.run('DELETE FROM escandallos WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============================================================================
// RUTAS API - INVENTARIO
// ============================================================================
app.get('/api/inventario', (req, res) => {
  db.all(`
    SELECT i.*, ing.nombre as ingrediente_nombre
    FROM inventario i
    LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
    ORDER BY i.fecha_registro DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/inventario', (req, res) => {
  const { ingrediente_id, cantidad, unidad, lote, fecha, fecha_caducidad, ubicacion } = req.body;
  db.run(
    'INSERT INTO inventario (ingrediente_id, cantidad, unidad, lote, fecha, fecha_caducidad, ubicacion) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [ingrediente_id, cantidad || 0, unidad || 'kg', lote, fecha, fecha_caducidad, ubicacion],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    }
  );
});

app.put('/api/inventario/:id', (req, res) => {
  const { ingrediente_id, cantidad, unidad, lote, fecha, fecha_caducidad, ubicacion } = req.body;
  db.run(
    'UPDATE inventario SET ingrediente_id = ?, cantidad = ?, unidad = ?, lote = ?, fecha = ?, fecha_caducidad = ?, ubicacion = ? WHERE id = ?',
    [ingrediente_id, cantidad, unidad, lote, fecha, fecha_caducidad, ubicacion, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/inventario/:id', (req, res) => {
  db.run('DELETE FROM inventario WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============================================================================
// RUTAS API - PEDIDOS
// ============================================================================
app.get('/api/pedidos', (req, res) => {
  db.all('SELECT * FROM pedidos ORDER BY fecha_pedido DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/pedidos', (req, res) => {
  const { numero, cliente_codigo, fecha_pedido, fecha_entrega, estado, total } = req.body;
  db.run(
    'INSERT INTO pedidos (numero, cliente_codigo, fecha_pedido, fecha_entrega, estado, total) VALUES (?, ?, ?, ?, ?, ?)',
    [numero, cliente_codigo, fecha_pedido || new Date().toISOString(), fecha_entrega, estado || 'pendiente', total || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    }
  );
});

app.put('/api/pedidos/:id', (req, res) => {
  const { numero, cliente_codigo, fecha_pedido, fecha_entrega, estado, total } = req.body;
  db.run(
    'UPDATE pedidos SET numero = ?, cliente_codigo = ?, fecha_pedido = ?, fecha_entrega = ?, estado = ?, total = ? WHERE id = ?',
    [numero, cliente_codigo, fecha_pedido, fecha_entrega, estado, total, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/pedidos/:id', (req, res) => {
  db.run('DELETE FROM pedidos WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============================================================================
// RUTAS API - PARTIDAS DE COCINA (PRODUCCIÓN)
// ============================================================================
app.get('/api/partidas-cocina', (req, res) => {
  db.all('SELECT * FROM partidas_cocina ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/partidas-cocina', (req, res) => {
  const { nombre, responsable, descripcion, activo } = req.body;
  db.run(
    'INSERT INTO partidas_cocina (nombre, responsable, descripcion, activo) VALUES (?, ?, ?, ?)',
    [nombre, responsable, descripcion, activo !== false ? 1 : 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    }
  );
});

app.put('/api/partidas-cocina/:id', (req, res) => {
  const { nombre, responsable, descripcion, activo } = req.body;
  db.run(
    'UPDATE partidas_cocina SET nombre = ?, responsable = ?, descripcion = ?, activo = ? WHERE id = ?',
    [nombre, responsable, descripcion, activo ? 1 : 0, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/partidas-cocina/:id', (req, res) => {
  db.run('DELETE FROM partidas_cocina WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============================================================================
// RUTAS API - SANIDAD (APPCC)
// ============================================================================
app.get('/api/control-sanidad', (req, res) => {
  db.all('SELECT * FROM control_sanidad ORDER BY fecha_produccion DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/control-sanidad', (req, res) => {
  const { plato_codigo, ingrediente_codigo, fecha_produccion, punto_critico, corrector, responsable, observaciones } = req.body;
  db.run(
    'INSERT INTO control_sanidad (plato_codigo, ingrediente_codigo, fecha_produccion, punto_critico, corrector, responsable, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [plato_codigo, ingrediente_codigo, fecha_produccion, punto_critico, corrector, responsable, observaciones],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    }
  );
});

app.delete('/api/control-sanidad/:id', (req, res) => {
  db.run('DELETE FROM control_sanidad WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Alias para compatibilidad con módulos frontend
app.get('/api/sanidad', (req, res) => {
  db.all('SELECT * FROM control_sanidad ORDER BY fecha_produccion DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// ============================================================================
// RUTAS RAÍZ
// ============================================================================

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   HIBO COCINA - Gestor de Producción   ║
╚════════════════════════════════════════╝
  
  🚀 Servidor: http://localhost:${PORT}
  📡 API: http://localhost:${PORT}/api
  💾 Base de datos: data/hibo-cocina.db
  
  Endpoints disponibles:
  - /api/platos
  - /api/ingredientes
  - /api/escandallos
  - /api/inventario
  - /api/pedidos
  - /api/partidas-cocina
  - /api/control-sanidad
  - /api/health
  
  Presiona CTRL+C para detener
  `);
});

module.exports = app;
