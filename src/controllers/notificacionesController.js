/**
 * Controlador para gestión de notificaciones
 */
const Notificacion = require('../models/Notificacion');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const ServicioCalculos = require('../utils/servicioCalculos');
const logger = require('../utils/logger');

/**
 * Obtener todas las notificaciones de un usuario
 */
async function obtenerNotificaciones(req, res) {
  try {
    const userId = req.user?.id || req.query.usuario_id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no autenticado o ID no proporcionado'
      });
    }

    const opciones = {
      leida: req.query.leida !== undefined ? req.query.leida === 'true' : null,
      tipo: req.query.tipo || null,
      limite: parseInt(req.query.limite) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const notificaciones = await Notificacion.obtenerPorUsuario(userId, opciones);

    res.json({
      success: true,
      data: notificaciones,
      total: notificaciones.length
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo notificaciones',
      error: error.message
    });
  }
}

/**
 * Obtener notificaciones no leídas
 */
async function obtenerNoLeidas(req, res) {
  try {
    const userId = req.user?.id || req.query.usuario_id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const notificaciones = await Notificacion.obtenerNoLeidasPorUsuario(userId);
    const total = await Notificacion.contarNoLeidas(userId);

    res.json({
      success: true,
      data: notificaciones,
      total
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones no leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo notificaciones no leídas',
      error: error.message
    });
  }
}

/**
 * Contar notificaciones no leídas
 */
async function contarNoLeidas(req, res) {
  try {
    const userId = req.user?.id || req.query.usuario_id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const total = await Notificacion.contarNoLeidas(userId);

    res.json({
      success: true,
      total
    });
  } catch (error) {
    console.error('Error contando notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error contando notificaciones',
      error: error.message
    });
  }
}

/**
 * Marcar notificación como leída
 */
async function marcarComoLeida(req, res) {
  try {
    const { id } = req.params;
    const notificacion = await Notificacion.marcarComoLeida(id);

    if (!notificacion) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    res.json({
      success: true,
      data: notificacion,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error marcando notificación como leída',
      error: error.message
    });
  }
}

/**
 * Marcar todas las notificaciones como leídas
 */
async function marcarTodasComoLeidas(req, res) {
  try {
    const userId = req.user?.id || req.body.usuario_id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const totalMarcadas = await Notificacion.marcarTodasComoLeidas(userId);

    res.json({
      success: true,
      message: `${totalMarcadas} notificaciones marcadas como leídas`,
      totalMarcadas
    });
  } catch (error) {
    console.error('Error marcando todas como leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error marcando todas como leídas',
      error: error.message
    });
  }
}

/**
 * Eliminar notificación
 */
async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const eliminada = await Notificacion.eliminar(id);

    if (!eliminada) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificación eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando notificación',
      error: error.message
    });
  }
}

/**
 * Limpiar notificaciones leídas antiguas
 */
async function limpiarLeidas(req, res) {
  try {
    const userId = req.user?.id || req.body.usuario_id;
    const diasAntiguedad = parseInt(req.body.dias) || 30;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const totalEliminadas = await Notificacion.limpiarLeidas(userId, diasAntiguedad);

    res.json({
      success: true,
      message: `${totalEliminadas} notificaciones antiguas eliminadas`,
      totalEliminadas
    });
  } catch (error) {
    console.error('Error limpiando notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error limpiando notificaciones',
      error: error.message
    });
  }
}

/**
 * Obtener estadísticas de notificaciones
 */
async function obtenerEstadisticas(req, res) {
  try {
    const userId = req.user?.id || req.query.usuario_id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const estadisticas = await Notificacion.obtenerEstadisticas(userId);

    res.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message
    });
  }
}

/**
 * Obtener preferencias de notificación
 */
async function obtenerPreferencias(req, res) {
  try {
    const userId = req.user?.id || req.query.usuario_id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const preferencias = await Notificacion.obtenerPreferencias(userId);

    res.json({
      success: true,
      data: preferencias
    });
  } catch (error) {
    console.error('Error obteniendo preferencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo preferencias',
      error: error.message
    });
  }
}

/**
 * Actualizar preferencias de notificación
 */
async function actualizarPreferencias(req, res) {
  try {
    const userId = req.user?.id || req.body.usuario_id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const preferencias = await Notificacion.actualizarPreferencias(userId, req.body);

    res.json({
      success: true,
      data: preferencias,
      message: 'Preferencias actualizadas correctamente'
    });
  } catch (error) {
    console.error('Error actualizando preferencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando preferencias',
      error: error.message
    });
  }
}

module.exports = {
  obtenerNotificaciones,
  obtenerNoLeidas,
  contarNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminar,
  limpiarLeidas,
  obtenerEstadisticas,
  obtenerPreferencias,
  actualizarPreferencias
};
