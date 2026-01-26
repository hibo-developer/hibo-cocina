/**
 * Helper para emisión de eventos WebSocket desde rutas
 * Proporciona funciones para emitir eventos desde los controladores
 */

/**
 * Obtener la instancia de Socket.io desde la aplicación
 */
function getIO(app) {
  return app.locals.io;
}

/**
 * Emitir actualización de platos
 */
function emitPlatosUpdate(app, plato, action = 'updated') {
  try {
    const io = getIO(app);
    if (io) {
      const { emitPlatosUpdate } = require('../config/websocket');
      emitPlatosUpdate(io, plato, action);
    }
  } catch (err) {
    console.error('Error emitiendo actualización de platos:', err);
  }
}

/**
 * Emitir actualización de ingredientes
 */
function emitIngredientesUpdate(app, ingrediente, action = 'updated') {
  try {
    const io = getIO(app);
    if (io) {
      const { emitIngredientesUpdate } = require('../config/websocket');
      emitIngredientesUpdate(io, ingrediente, action);
    }
  } catch (err) {
    console.error('Error emitiendo actualización de ingredientes:', err);
  }
}

/**
 * Emitir actualización de inventario
 */
function emitInventarioUpdate(app, inventario, action = 'updated') {
  try {
    const io = getIO(app);
    if (io) {
      const { emitInventarioUpdate } = require('../config/websocket');
      emitInventarioUpdate(io, inventario, action);
    }
  } catch (err) {
    console.error('Error emitiendo actualización de inventario:', err);
  }
}

/**
 * Emitir actualización de pedidos
 */
function emitPedidosUpdate(app, pedido, action = 'updated', userId = null) {
  try {
    const io = getIO(app);
    if (io) {
      const { emitPedidosUpdate } = require('../config/websocket');
      emitPedidosUpdate(io, pedido, action, userId);
    }
  } catch (err) {
    console.error('Error emitiendo actualización de pedidos:', err);
  }
}

/**
 * Emitir notificación
 */
function emitNotification(app, userId, notification) {
  try {
    const io = getIO(app);
    if (io) {
      const { emitNotification } = require('../config/websocket');
      emitNotification(io, userId, notification);
    }
  } catch (err) {
    console.error('Error emitiendo notificación:', err);
  }
}

module.exports = {
  getIO,
  emitPlatosUpdate,
  emitIngredientesUpdate,
  emitInventarioUpdate,
  emitPedidosUpdate,
  emitNotification
};
