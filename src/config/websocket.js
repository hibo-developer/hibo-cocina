/**
 * Configuración de WebSocket con Socket.io
 * Gestiona la comunicación en tiempo real
 */

const { Server } = require('socket.io');
const { getLogger } = require('../utils/logger');
const Notificacion = require('../models/Notificacion');

const log = getLogger();

/**
 * Inicializar servidor de WebSocket
 */
function initializeWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 60000,
    maxHttpBufferSize: 1e6 // 1MB
  });

  // Middleware de autenticación
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication failed: No token provided'));
    }

    // Verificación básica del token (puedes expandir esto)
    try {
      socket.userId = extractUserIdFromToken(token);
      socket.token = token;
      next();
    } catch (err) {
      next(new Error('Authentication failed: Invalid token'));
    }
  });

  // Eventos de conexión
  io.on('connection', (socket) => {
    log.info(`Cliente conectado: ${socket.id}`, { userId: socket.userId });

    // Unirse a sala del usuario
    socket.join(`user:${socket.userId}`);

    // Unirse a salas por defecto
    socket.join('updates:all');

    // ========== EVENTOS DE PLATOS ==========
    socket.on('subscribe:platos', () => {
      socket.join('updates:platos');
      log.debug(`Cliente ${socket.id} suscrito a platos`);
    });

    socket.on('unsubscribe:platos', () => {
      socket.leave('updates:platos');
    });

    // ========== EVENTOS DE INGREDIENTES ==========
    socket.on('subscribe:ingredientes', () => {
      socket.join('updates:ingredientes');
      log.debug(`Cliente ${socket.id} suscrito a ingredientes`);
    });

    socket.on('unsubscribe:ingredientes', () => {
      socket.leave('updates:ingredientes');
    });

    // ========== EVENTOS DE INVENTARIO ==========
    socket.on('subscribe:inventario', () => {
      socket.join('updates:inventario');
      log.debug(`Cliente ${socket.id} suscrito a inventario`);
    });

    socket.on('unsubscribe:inventario', () => {
      socket.leave('updates:inventario');
    });

    // ========== EVENTOS DE PEDIDOS ==========
    socket.on('subscribe:pedidos', () => {
      socket.join('updates:pedidos');
      socket.join(`user:pedidos:${socket.userId}`);
      log.debug(`Cliente ${socket.id} suscrito a pedidos`);
    });

    socket.on('unsubscribe:pedidos', () => {
      socket.leave('updates:pedidos');
      socket.leave(`user:pedidos:${socket.userId}`);
    });

    // ========== EVENTOS DE NOTIFICACIONES ==========
    socket.on('request:notifications', async (callback) => {
      // Obtener notificaciones pendientes
      const notifications = await getPendingNotifications(socket.userId);
      callback(notifications);
    });

    socket.on('mark:notification:read', async (notificationId) => {
      await markNotificationAsRead(socket.userId, notificationId);
      io.to(`user:${socket.userId}`).emit('notification:read', { notificationId });
    });

    // ========== EVENTOS DE SINCRONIZACIÓN ==========
    socket.on('sync:request', (data, callback) => {
      const { module, timestamp } = data;
      const updates = getUpdatedData(module, timestamp);
      callback(updates);
    });

    // ========== EVENTOS DE DESCONEXIÓN ==========
    socket.on('disconnect', () => {
      log.info(`Cliente desconectado: ${socket.id}`, { userId: socket.userId });
    });

    socket.on('error', (error) => {
      log.error(`Error en WebSocket ${socket.id}:`, error);
    });
  });

  return io;
}

/**
 * Emitir actualización de platos
 */
function emitPlatosUpdate(io, plato, action = 'updated') {
  io.to('updates:platos').emit('platos:update', {
    action,
    plato,
    timestamp: new Date()
  });

  // Invalidar caché relacionado
  io.to('updates:escandallos').emit('cache:invalidate', {
    routes: ['GET:/api/escandallos*']
  });
}

/**
 * Emitir actualización de ingredientes
 */
function emitIngredientesUpdate(io, ingrediente, action = 'updated') {
  io.to('updates:ingredientes').emit('ingredientes:update', {
    action,
    ingrediente,
    timestamp: new Date()
  });

  // Invalidar caches relacionados
  io.to('updates:inventario').emit('cache:invalidate', {
    routes: ['GET:/api/inventario*']
  });
  io.to('updates:escandallos').emit('cache:invalidate', {
    routes: ['GET:/api/escandallos*']
  });
}

/**
 * Emitir actualización de inventario
 */
function emitInventarioUpdate(io, inventario, action = 'updated') {
  io.to('updates:inventario').emit('inventario:update', {
    action,
    inventario,
    timestamp: new Date()
  });

  // Notificar si hay falta de stock
  if (inventario.cantidad < inventario.cantidad_minima) {
    io.to('updates:all').emit('alert:low-stock', {
      ingredienteId: inventario.ingrediente_id,
      cantidad: inventario.cantidad,
      minima: inventario.cantidad_minima,
      timestamp: new Date()
    });
  }
}

/**
 * Emitir actualización de pedidos
 */
function emitPedidosUpdate(io, pedido, action = 'updated', userId = null) {
  // Broadcast a todos suscriptores
  io.to('updates:pedidos').emit('pedidos:update', {
    action,
    pedido,
    timestamp: new Date()
  });

  // Notificar al usuario propietario
  if (userId) {
    io.to(`user:pedidos:${userId}`).emit('pedidos:personal-update', {
      action,
      pedido,
      timestamp: new Date()
    });
  }

  // Notificar cambios de estado
  if (action === 'status-changed') {
    const statusMessages = {
      'pendiente': '⏳ Pedido recibido',
      'preparacion': '👨‍🍳 Preparación iniciada',
      'completado': '✅ Pedido completado',
      'entregado': '📦 Pedido entregado',
      'cancelado': '❌ Pedido cancelado'
    };

    io.to(`user:pedidos:${userId}`).emit('notification:new', {
      type: 'pedido',
      title: 'Cambio de estado de pedido',
      message: statusMessages[pedido.estado] || 'Estado actualizado',
      pedidoId: pedido.id,
      estado: pedido.estado
    });
  }
}

/**
 * Emitir notificación y guardar en BD
 */
async function emitNotification(io, userId, notification) {
  try {
    // Verificar preferencias del usuario
    const debeRecibir = await Notificacion.debeRecibirNotificacion(userId, notification.type);
    
    if (!debeRecibir) {
      log.info(`Notificación bloqueada por preferencias del usuario ${userId}`);
      return;
    }

    // Guardar en BD
    const notifGuardada = await Notificacion.crear({
      usuario_id: userId,
      tipo: notification.type,
      titulo: notification.title,
      mensaje: notification.message,
      datos: notification.data
    });

    // Emitir a WebSocket
    io.to(`user:${userId}`).emit('notification:new', {
      id: notifGuardada.id,
      type: notifGuardada.tipo,
      title: notifGuardada.titulo,
      message: notifGuardada.mensaje,
      timestamp: notifGuardada.fecha_creacion,
      read: false,
      data: notifGuardada.datos
    });

    log.info(`Notificación enviada y guardada para usuario ${userId}`);
  } catch (error) {
    log.error('Error emitiendo notificación:', error);
  }
}

/**
 * Obtener notificaciones pendientes del usuario
 */
async function getPendingNotifications(userId) {
  try {
    const notificaciones = await Notificacion.obtenerNoLeidasPorUsuario(userId);
    return notificaciones.map(n => ({
      id: n.id,
      type: n.tipo,
      title: n.titulo,
      message: n.mensaje,
      timestamp: n.fecha_creacion,
      read: n.leida,
      data: n.datos
    }));
  } catch (error) {
    log.error('Error obteniendo notificaciones pendientes:', error);
    return [];
  }
}

/**
 * Marcar notificación como leída
 */
async function markNotificationAsRead(userId, notificationId) {
  try {
    await Notificacion.marcarComoLeida(notificationId);
    log.info(`Notificación ${notificationId} marcada como leída por usuario ${userId}`);
  } catch (error) {
    log.error('Error marcando notificación como leída:', error);
  }
}

/**
 * Obtener datos actualizados desde timestamp
 */
function getUpdatedData(module, timestamp) {
  // TODO: Implementar sincronización de datos
  return {
    module,
    updates: [],
    lastSync: new Date()
  };
}

/**
 * Extraer userId del token (implementación básica)
 */
function extractUserIdFromToken(token) {
  // TODO: Implementar decodificación JWT real
  // Por ahora retorna un hash del token
  return Buffer.from(token).toString('base64').substring(0, 10);
}

module.exports = {
  initializeWebSocket,
  emitPlatosUpdate,
  emitIngredientesUpdate,
  emitInventarioUpdate,
  emitPedidosUpdate,
  emitNotification
};
