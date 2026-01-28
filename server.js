/**
 * HIBO COCINA - Servidor Principal Refactorizado
 * 
 * Estructura:
 * - Inicialización limpia
 * - Middleware centralizado
 * - Rutas modularizadas en /src/routes
 * - Manejo de errores consistente
 * - Redis caching integrado
 * - WebSocket en tiempo real
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const http = require('http');

// Importar módulos del proyecto
const { initializeDatabase, closeDatabase } = require('./src/utils/database');
const { runMigrations } = require('./src/utils/migrations');
const { errorHandler, notFoundHandler, createResponse } = require('./src/middleware/errorHandler');
const { getLogger } = require('./src/utils/logger');
const { loggerMiddleware } = require('./src/middleware/loggerMiddleware');
const { 
  generalLimiter, 
  authLimiter, 
  createLimiter, 
  updateLimiter, 
  deleteLimiter 
} = require('./src/middleware/rateLimiter');

// Importar Redis
const { RedisCache, createCacheMiddleware, createInvalidationMiddleware } = require('./src/middleware/redisCache');
const { CACHE_CONFIG, initializeRedis } = require('./src/config/redis');

// Importar WebSocket
const { initializeWebSocket } = require('./src/config/websocket');

// Importar rutas
const authRoutes = require('./src/routes/auth');
const platosRoutes = require('./src/routes/platos');
const ingredientesRoutes = require('./src/routes/ingredientes');
const escandallosRoutes = require('./src/routes/escandallos');
const inventarioRoutes = require('./src/routes/inventario');
const pedidosRoutes = require('./src/routes/pedidos');
const partidasRoutes = require('./src/routes/partidas');
const sanidadRoutes = require('./src/routes/sanidad');
const notificacionesRoutes = require('./src/routes/notificaciones');
const exportRoutes = require('./src/routes/export');
const alergenosRoutes = require('./src/routes/alergenos');
const ofertasRoutes = require('./src/routes/ofertas');
const importRoutes = require('./src/routes/import');
const produccionRoutes = require('./src/routes/produccion');

const app = express();
const log = getLogger();
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

// Rate Limiting (aplica a todas las rutas de API)
app.use('/api', generalLimiter);

// Logging de requests
app.use(loggerMiddleware);

// Logging de requests (desarrollo)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    log.debug(`Procesando: ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// REDIS CACHING (OPCIONAL - Se puede deshabilitar si Redis no está disponible)
// ============================================================================

const redisCache = process.env.DISABLE_REDIS === 'true' ? null : initializeRedis();

// Middleware de caché para GET requests (solo si Redis está disponible)
if (redisCache) {
  app.use('/api', createCacheMiddleware(redisCache, {
    ttl: 3600,
    cacheable: CACHE_CONFIG.cacheable,
    ttlByRoute: CACHE_CONFIG.ttlByRoute
  }));

  // Middleware de invalidación para mutaciones
  app.use('/api', createInvalidationMiddleware(redisCache, {
    invalidationMap: CACHE_CONFIG.invalidationMap
  }));

  // Endpoint de estadísticas de caché
  app.get('/api/cache-stats', (req, res) => {
    const stats = redisCache.getStats();
    res.json(createResponse(true, stats, 'Cache statistics'));
  });

  // Endpoint para limpiar caché
  app.post('/api/cache-clear', (req, res) => {
    redisCache.clear();
    res.json(createResponse(true, null, 'Cache cleared'));
  });
} else {
  log.warn('Redis deshabilitado o no disponible - caché desactivado');
}

// ============================================================================
// DOCUMENTACIÓN API
// ============================================================================

// Swagger UI
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    url: '/api-docs.json'
  }
}));

// JSON de especificación de Swagger
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ============================================================================
// RUTAS API
// ============================================================================

// Rutas de autenticación (públicas)
app.use('/api/auth', authRoutes);

// Rutas de negocio
app.use('/api/platos', platosRoutes);
app.use('/api/ingredientes', ingredientesRoutes);
app.use('/api/escandallos', escandallosRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/partidas-cocina', partidasRoutes);
app.use('/api/control-sanidad', sanidadRoutes);

// Rutas de producción
app.use('/api/produccion', produccionRoutes);

// Rutas de notificaciones
app.use('/api/notificaciones', notificacionesRoutes);

// Rutas de alérgenos
app.use('/api/alergenos', alergenosRoutes);

// Rutas de ofertas y eventos
app.use('/api', ofertasRoutes);

// Alias de compatibilidad
app.use('/api/sanidad', sanidadRoutes);

// Rutas de exportación (descargas masivas)
app.use('/api/export', exportRoutes);

// Rutas de importación (cargas masivas)
app.use('/api/importar', importRoutes);

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
    log.info('Base de datos inicializada correctamente');

    // Ejecutar migraciones
    await runMigrations();
    log.info('Migraciones ejecutadas correctamente');

    // Crear servidor HTTP (para Express + WebSocket)
    const server = http.createServer(app);

    // Inicializar WebSocket
    const io = initializeWebSocket(server);
    log.info('WebSocket inicializado');

    // Hacer io global para acceso desde rutas
    app.locals.io = io;

    // Inicializar Gestor de Alertas de Inventario
    try {
      const GestorAlertasInventario = require('./src/utils/gestorAlertasInventario');
      const gestorAlertas = new GestorAlertasInventario(io);
      gestorAlertas.iniciar();
      app.locals.gestorAlertas = gestorAlertas;
      log.info('✅ Gestor de Alertas de Inventario iniciado');
    } catch (error) {
      log.warn('⚠️ No se pudo iniciar el Gestor de Alertas:', error.message);
    }

    // Iniciar servidor
    server.listen(PORT, () => {
      log.info(`Servidor HIBO COCINA iniciado`, {
        port: PORT,
        environment: NODE_ENV,
        version: '2.0.0'
      });

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
    const gracefulShutdown = (signal) => {
      log.info(`Recibida señal ${signal}, iniciando cierre graceful...`);
      
      server.close(async () => {
        log.info('Servidor HTTP cerrado');
        
        try {
          // Detener gestor de alertas
          if (app.locals.gestorAlertas) {
            app.locals.gestorAlertas.detener();
            log.info('Gestor de Alertas detenido');
          }
        } catch (err) {
          log.error('Error al detener Gestor de Alertas', err);
        }
        
        try {
          // Cerrar WebSocket
          if (io) {
            io.close();
            log.info('WebSocket cerrado');
          }
        } catch (err) {
          log.error('Error al cerrar WebSocket', err);
        }
        
        try {
          // Cerrar Redis (si está habilitado)
          if (redisCache) {
            await redisCache.close();
            log.info('Redis cerrado');
          }
        } catch (err) {
          log.error('Error al cerrar Redis', err);
        }
        
        try {
          await closeDatabase();
          log.info('Base de datos cerrada');
        } catch (err) {
          log.error('Error al cerrar base de datos', err);
        }
        
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        log.error('Forzando cierre del servidor después de timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    log.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar si se ejecuta directamente
if (require.main === module) {
  startServer();
}

module.exports = app;
