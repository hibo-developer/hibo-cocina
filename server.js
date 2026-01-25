const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Importar rutas y modelos
const platosRoutes = require('./src/routes/platos');
const pedidosRoutes = require('./src/routes/pedidos');
const articulosRoutes = require('./src/routes/articulos');
const escandallosRoutes = require('./src/routes/escandallos');
const inventarioRoutes = require('./src/routes/inventario');
const trazabilidadRoutes = require('./src/routes/trazabilidad');
const etiquetasRoutes = require('./src/routes/etiquetas');
const partidasCocinaRoutes = require('./src/routes/partidasCocina');
const clientesRoutes = require('./src/routes/clientes');
const ingredientesRoutes = require('./src/routes/ingredientes');
const controlSanidadRoutes = require('./src/routes/controlSanidad');
const proveedoresRoutes = require('./src/routes/proveedores');
const pedidosProveedorRoutes = require('./src/routes/pedidosProveedor');
const stockRoutes = require('./src/routes/stock');
const alergenosPersonalizadosRoutes = require('./src/routes/alergenosPersonalizados');
const alergenosOficialesRoutes = require('./src/routes/alergenosOficiales');
const { crearTablas } = require('./src/db/schema');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static('public'));

// Inicializar base de datos
async function inicializar() {
  try {
    await crearTablas();
    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
  }
}

inicializar();

// Rutas API
app.use('/api/platos', platosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/articulos', articulosRoutes);
app.use('/api/escandallos', escandallosRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/trazabilidad', trazabilidadRoutes);
app.use('/api/etiquetas', etiquetasRoutes);
app.use('/api/partidas-cocina', partidasCocinaRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ingredientes', ingredientesRoutes);
app.use('/api/control-sanidad', controlSanidadRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/pedidos-proveedor', pedidosProveedorRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/alergenos-personalizados', alergenosPersonalizadosRoutes);
app.use('/api/alergenos-oficiales', alergenosOficialesRoutes);

// Alias para compatibilidad con módulos frontend
app.use('/api/sanidad', controlSanidadRoutes); // Alias de control-sanidad
app.use('/api/produccion', partidasCocinaRoutes); // Alias de partidas-cocina

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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
  Servidor escuchando en: http://localhost:${PORT}
  API disponible en: http://localhost:${PORT}/api
  
  Endpoints:
  - GET  /api/platos               (obtener todos)
  - GET  /api/platos/:codigo       (obtener por código)
  - POST /api/platos               (crear nuevo)
  - PUT  /api/platos/:id           (actualizar)
  - DELETE /api/platos/:id         (eliminar)
  
  - GET  /api/pedidos              (obtener todos)
  - GET  /api/pedidos/:id          (obtener por ID)
  - POST /api/pedidos              (crear nuevo)
  - PUT  /api/pedidos/:id          (actualizar)
  - DELETE /api/pedidos/:id        (eliminar)

  - GET  /api/health               (verificar estado)
  
  Presiona CTRL+C para detener
  `);
});

module.exports = app;
