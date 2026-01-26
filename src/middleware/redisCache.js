/**
 * Redis Caching Middleware
 * ======================
 * 
 * Middleware de caching con Redis para:
 * - Cachear endpoints GET
 * - Invalidar automáticamente en mutaciones
 * - Control granular por ruta
 * - TTL configurable
 * - Estadísticas de caché
 */

const redis = require('ioredis');
const logger = require('../config/logger');

/**
 * Redis Cache Manager
 */
class RedisCache {
  constructor(options = {}) {
    this.enabled = process.env.REDIS_ENABLED !== 'false';
    
    if (!this.enabled) {
      logger.warn('Redis caching disabled');
      return;
    }
    
    try {
      this.client = new redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        db: process.env.REDIS_DB || 0,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        enableOfflineQueue: false,
        ...options
      });
      
      this.client.on('error', (err) => {
        logger.error('Redis connection error:', err);
        this.enabled = false;
      });
      
      this.client.on('connect', () => {
        logger.info('Redis connected');
      });
      
      // Estadísticas
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0
      };
      
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.enabled = false;
    }
  }
  
  /**
   * Generador de claves
   * @param {string} key
   * @returns {string}
   */
  generateKey(key) {
    return `app:${key}`;
  }
  
  /**
   * Obtener valor del caché
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    if (!this.enabled) return null;
    
    try {
      const value = await this.client.get(this.generateKey(key));
      
      if (value) {
        this.stats.hits++;
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(value);
      }
      
      this.stats.misses++;
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Guardar en caché
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live en segundos
   * @returns {Promise<void>}
   */
  async set(key, value, ttl = 3600) {
    if (!this.enabled) return;
    
    try {
      const serialized = JSON.stringify(value);
      const redisKey = this.generateKey(key);
      
      if (ttl > 0) {
        await this.client.setex(redisKey, ttl, serialized);
      } else {
        await this.client.set(redisKey, serialized);
      }
      
      this.stats.sets++;
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(`Cache set error for ${key}:`, error);
    }
  }
  
  /**
   * Eliminar del caché
   * @param {string} key
   * @returns {Promise<void>}
   */
  async del(key) {
    if (!this.enabled) return;
    
    try {
      await this.client.del(this.generateKey(key));
      this.stats.deletes++;
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`Cache delete error for ${key}:`, error);
    }
  }
  
  /**
   * Invalidar por patrón
   * @param {string} pattern
   * @returns {Promise<number>}
   */
  async delPattern(pattern) {
    if (!this.enabled) return 0;
    
    try {
      const keys = await this.client.keys(this.generateKey(pattern));
      
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug(`Invalidated ${keys.length} cache entries matching ${pattern}`);
      }
      
      return keys.length;
    } catch (error) {
      logger.error(`Cache pattern delete error for ${pattern}:`, error);
      return 0;
    }
  }
  
  /**
   * Limpiar todo el caché
   */
  async clear() {
    if (!this.enabled) return;
    
    try {
      const keys = await this.client.keys('app:*');
      
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.info(`Cleared ${keys.length} cache entries`);
      }
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }
  
  /**
   * Obtener estadísticas
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0;
    
    return {
      enabled: this.enabled,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      sets: this.stats.sets,
      deletes: this.stats.deletes
    };
  }
  
  /**
   * Cerrar conexión
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis connection closed');
    }
  }
}

/**
 * Express middleware para caching
 */
function createCacheMiddleware(redisCache, options = {}) {
  const defaultTTL = options.ttl || 3600; // 1 hora
  const cacheable = options.cacheable || ['/api/platos', '/api/ingredientes', '/api/inventario'];
  
  return async (req, res, next) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Verificar si la ruta es cacheable
    const isCacheable = cacheable.some(route => req.path.startsWith(route));
    
    if (!isCacheable || !redisCache.enabled) {
      return next();
    }
    
    // Generar clave de caché
    const cacheKey = `${req.method}:${req.originalUrl}`;
    
    // Intentar obtener del caché
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Interceptar el método json de response
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Cachear la respuesta
      if (res.statusCode === 200) {
        const ttl = options.ttlByRoute?.[req.path] || defaultTTL;
        redisCache.set(cacheKey, data, ttl);
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Middleware para invalidar caché en mutaciones
 */
function createInvalidationMiddleware(redisCache, options = {}) {
  const invalidationMap = options.invalidationMap || {
    '/api/platos': [
      'GET:/api/platos',
      'GET:/api/platos/estadisticas',
      'GET:/api/escandallos'
    ],
    '/api/ingredientes': [
      'GET:/api/ingredientes',
      'GET:/api/inventario',
      'GET:/api/escandallos'
    ],
    '/api/inventario': [
      'GET:/api/inventario'
    ],
    '/api/pedidos': [
      'GET:/api/pedidos',
      'GET:/api/pedidos/estadisticas'
    ]
  };
  
  return async (req, res, next) => {
    // Solo para mutaciones
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return next();
    }
    
    // Interceptar response
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Si la operación fue exitosa, invalidar caché relacionado
      if (res.statusCode < 400 && data.success !== false) {
        const relatedKeys = invalidationMap[req.baseUrl];
        
        if (relatedKeys && Array.isArray(relatedKeys)) {
          relatedKeys.forEach(key => {
            redisCache.delPattern(key);
          });
          
          logger.debug(`Invalidated cache for ${req.baseUrl}`);
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

module.exports = {
  RedisCache,
  createCacheMiddleware,
  createInvalidationMiddleware
};
