/**
 * HIBO COCINA - Servidor Principal Refactorizado
 * 
 * Estructura:
 * - Inicialización limpia
 * - Middleware centralizado
 * - Rutas modularizadas en /src/routes
 * - Manejo de errores consistente
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Importar módulos del proyecto
const { initializeDatabase, closeDatabase } = require('./src/utils/database');
const { errorHandler, notFoundHandler, createResponse } = require('./src/middleware/errorHandler');

// Importar rutas
const platosRoutes = require('./src/routes/platos');
const ingredientesRoutes = require('./src/routes/ingredientes');
const escandallosRoutes = require('./src/routes/escandallos');
const inventarioRoutes = require('./src/routes/inventario');
const pedidosRoutes = require('./src/routes/pedidos');
const partidasRoutes = require('./src/routes/partidas');
const sanidadRoutes = require('./src/routes/sanidad');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// MIDDLEWARE GLOBAL
// ============================================================================

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Servir archivos estáticos
app.use(express.static('public'));

// Logging de requests (desarrollo)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// RUTAS API
// ============================================================================

// Rutas de negocio
app.use('/api/platos', platosRoutes);
app.use('/api/ingredientes', ingredientesRoutes);
app.use('/api/escandallos', escandallosRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/partidas-cocina', partidasRoutes);
app.use('/api/control-sanidad', sanidadRoutes);

// Alias de compatibilidad
app.use('/api/sanidad', sanidadRoutes);

// Rutas de utilidad
app.get('/api/health', (req, res) => {
  res.json(createResponse(true, {
    status: 'OK',
    environment: NODE_ENV,
    version: '2.0.0',
    timestamp: new Date().toISOString()
  }, null, 200));
});

// Ruta raíz - Servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================================
// MANEJO DE ERRORES Y 404
// ============================================================================

// 404 - Ruta no encontrada
app.use(notFoundHandler);

// Error handler global (debe ser el último middleware)
app.use(errorHandler);

// ============================================================================
// INICIALIZACIÓN Y ARRANQUE
// ============================================================================

async function startServer() {
  try {
    // Inicializar base de datos
    await initializeDatabase();

    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   HIBO COCINA - Gestor de Producción   ║
║           v2.0.0 REFACTORIZADO         ║
╚════════════════════════════════════════╝

🚀 Servidor iniciado en: http://localhost:${PORT}
📡 API disponible en: http://localhost:${PORT}/api
💾 Base de datos: data/hibo-cocina.db
🌍 Ambiente: ${NODE_ENV}

📚 Endpoints disponibles:
  • /api/platos
  • /api/ingredientes
  • /api/escandallos
  • /api/inventario
  • /api/pedidos
  • /api/partidas-cocina
  • /api/control-sanidad (o /api/sanidad)
  • /api/health

⏹️  Presiona CTRL+C para detener

`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n📛 Recibida señal ${signal}, cerrando gracefully...`);
      
      server.close(async () => {
        console.log('❌ Servidor HTTP cerrado');
        
        try {
          await closeDatabase();
          console.log('❌ Base de datos cerrada');
        } catch (err) {
          console.error('Error al cerrar base de datos:', err);
        }
        
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('❌ Forzando cierre del servidor');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar si se ejecuta directamente
if (require.main === module) {
  startServer();
}

module.exports = app;
