/**
 * Redis Configuration
 * ===================
 */

const RedisCache = require('../middleware/redisCache');

/**
 * Configuración de caché por ruta
 * TTL en segundos
 */
const CACHE_CONFIG = {
  // Endpoints con caché
  cacheable: [
    '/api/platos',
    '/api/ingredientes',
    '/api/inventario',
    '/api/escandallos',
    '/api/pedidos'
  ],
  
  // TTL por ruta específica
  ttlByRoute: {
    '/api/platos': 1800,           // 30 minutos - datos relativamente estables
    '/api/platos/estadisticas': 600, // 10 minutos - estadísticas
    '/api/ingredientes': 3600,     // 1 hora
    '/api/inventario': 300,         // 5 minutos - datos frecuentemente cambiantes
    '/api/inventario/estadisticas': 300,
    '/api/escandallos': 1800,      // 30 minutos
    '/api/pedidos': 60,             // 1 minuto - muy variable
    '/api/pedidos/estadisticas': 60
  },
  
  // Mapa de invalidación: cuando se modifica una ruta, invalida estas
  invalidationMap: {
    '/api/platos': [
      'GET:/api/platos*',
      'GET:/api/escandallos*'
    ],
    '/api/ingredientes': [
      'GET:/api/ingredientes*',
      'GET:/api/inventario*',
      'GET:/api/escandallos*'
    ],
    '/api/inventario': [
      'GET:/api/inventario*',
      'GET:/api/pedidos*'
    ],
    '/api/pedidos': [
      'GET:/api/pedidos*'
    ],
    '/api/escandallos': [
      'GET:/api/escandallos*'
    ]
  }
};

/**
 * Inicializar Redis cache
 */
function initializeRedis(options = {}) {
  const redisCache = new RedisCache({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    db: process.env.REDIS_DB || 0,
    password: process.env.REDIS_PASSWORD,
    ...options
  });
  
  return redisCache;
}

module.exports = {
  CACHE_CONFIG,
  initializeRedis
};
