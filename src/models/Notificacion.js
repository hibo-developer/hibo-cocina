/**
 * Modelo para gestión de notificaciones persistentes
 */
const db = require('../utils/database');

class Notificacion {
  /**
   * Crear nueva notificación en BD
   */
  static async crear(notificacionData) {
    const {
      usuario_id,
      tipo,
      titulo,
      mensaje,
      datos = null
    } = notificacionData;

    const query = `
      INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, datos)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      const result = await db.run(query, [
        usuario_id || null,
        tipo,
        titulo,
        mensaje,
        datos ? JSON.stringify(datos) : null
      ]);

      return await this.obtenerPorId(result.lastID);
    } catch (error) {
      console.error('Error creando notificación:', error);
      throw error;
    }
  }

  /**
   * Obtener notificación por ID
   */
  static async obtenerPorId(id) {
    const query = 'SELECT * FROM notificaciones WHERE id = ?';
    
    try {
      const notif = await db.get(query, [id]);
      if (notif && notif.datos) {
        notif.datos = JSON.parse(notif.datos);
      }
      return notif;
    } catch (error) {
      console.error('Error obteniendo notificación:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  static async obtenerPorUsuario(usuario_id, opciones = {}) {
    const {
      leida = null,
      tipo = null,
      limite = 50,
      offset = 0
    } = opciones;

    let query = 'SELECT * FROM notificaciones WHERE usuario_id = ?';
    const params = [usuario_id];

    if (leida !== null) {
      query += ' AND leida = ?';
      params.push(leida ? 1 : 0);
    }

    if (tipo) {
      query += ' AND tipo = ?';
      params.push(tipo);
    }

    query += ' ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?';
    params.push(limite, offset);

    try {
      const notifs = await db.all(query, params);
      return notifs.map(n => {
        if (n.datos) {
          n.datos = JSON.parse(n.datos);
        }
        return n;
      });
    } catch (error) {
      console.error('Error obteniendo notificaciones de usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones no leídas de un usuario
   */
  static async obtenerNoLeidasPorUsuario(usuario_id) {
    return await this.obtenerPorUsuario(usuario_id, { leida: false });
  }

  /**
   * Contar notificaciones no leídas
   */
  static async contarNoLeidas(usuario_id) {
    const query = `
      SELECT COUNT(*) as total
      FROM notificaciones
      WHERE usuario_id = ? AND leida = 0
    `;

    try {
      const result = await db.get(query, [usuario_id]);
      return result.total;
    } catch (error) {
      console.error('Error contando notificaciones no leídas:', error);
      throw error;
    }
  }

  /**
   * Marcar notificación como leída
   */
  static async marcarComoLeida(id) {
    const query = `
      UPDATE notificaciones
      SET leida = 1, fecha_lectura = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      await db.run(query, [id]);
      return await this.obtenerPorId(id);
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   */
  static async marcarTodasComoLeidas(usuario_id) {
    const query = `
      UPDATE notificaciones
      SET leida = 1, fecha_lectura = CURRENT_TIMESTAMP
      WHERE usuario_id = ? AND leida = 0
    `;

    try {
      const result = await db.run(query, [usuario_id]);
      return result.changes;
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      throw error;
    }
  }

  /**
   * Eliminar notificación
   */
  static async eliminar(id) {
    const query = 'DELETE FROM notificaciones WHERE id = ?';
    
    try {
      const result = await db.run(query, [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      throw error;
    }
  }

  /**
   * Eliminar notificaciones leídas antiguas de un usuario
   */
  static async limpiarLeidas(usuario_id, diasAntiguedad = 30) {
    const query = `
      DELETE FROM notificaciones
      WHERE usuario_id = ?
      AND leida = 1
      AND fecha_lectura < datetime('now', '-' || ? || ' days')
    `;

    try {
      const result = await db.run(query, [usuario_id, diasAntiguedad]);
      return result.changes;
    } catch (error) {
      console.error('Error limpiando notificaciones leídas:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de notificaciones de un usuario
   */
  static async obtenerEstadisticas(usuario_id) {
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN leida = 0 THEN 1 ELSE 0 END) as no_leidas,
        SUM(CASE WHEN leida = 1 THEN 1 ELSE 0 END) as leidas,
        tipo,
        COUNT(*) as total_por_tipo
      FROM notificaciones
      WHERE usuario_id = ?
      GROUP BY tipo
    `;

    try {
      const stats = await db.all(query, [usuario_id]);
      
      // Totales generales
      const totalQuery = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN leida = 0 THEN 1 ELSE 0 END) as no_leidas,
          SUM(CASE WHEN leida = 1 THEN 1 ELSE 0 END) as leidas
        FROM notificaciones
        WHERE usuario_id = ?
      `;
      const totales = await db.get(totalQuery, [usuario_id]);

      return {
        totales,
        porTipo: stats
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Obtener preferencias de notificación de un usuario
   */
  static async obtenerPreferencias(usuario_id) {
    const query = 'SELECT * FROM notificaciones_preferencias WHERE usuario_id = ?';
    
    try {
      let prefs = await db.get(query, [usuario_id]);
      
      // Si no existen, crear preferencias por defecto
      if (!prefs) {
        prefs = await this.crearPreferenciasDefault(usuario_id);
      }
      
      return prefs;
    } catch (error) {
      console.error('Error obteniendo preferencias:', error);
      throw error;
    }
  }

  /**
   * Crear preferencias por defecto
   */
  static async crearPreferenciasDefault(usuario_id) {
    const query = `
      INSERT INTO notificaciones_preferencias (usuario_id)
      VALUES (?)
    `;

    try {
      await db.run(query, [usuario_id]);
      return await this.obtenerPreferencias(usuario_id);
    } catch (error) {
      console.error('Error creando preferencias default:', error);
      throw error;
    }
  }

  /**
   * Actualizar preferencias de notificación
   */
  static async actualizarPreferencias(usuario_id, preferencias) {
    const campos = [];
    const valores = [];

    const camposPermitidos = [
      'recibir_platos',
      'recibir_ingredientes',
      'recibir_inventario',
      'recibir_pedidos',
      'recibir_stock_bajo',
      'recibir_alertas',
      'silencio_inicio',
      'silencio_fin'
    ];

    camposPermitidos.forEach(campo => {
      if (preferencias[campo] !== undefined) {
        campos.push(`${campo} = ?`);
        valores.push(preferencias[campo]);
      }
    });

    if (campos.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    valores.push(usuario_id);

    const query = `
      UPDATE notificaciones_preferencias
      SET ${campos.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE usuario_id = ?
    `;

    try {
      await db.run(query, valores);
      return await this.obtenerPreferencias(usuario_id);
    } catch (error) {
      console.error('Error actualizando preferencias:', error);
      throw error;
    }
  }

  /**
   * Verificar si el usuario debe recibir una notificación según sus preferencias
   */
  static async debeRecibirNotificacion(usuario_id, tipo) {
    const prefs = await this.obtenerPreferencias(usuario_id);
    
    // Verificar horario de silencio
    if (prefs.silencio_inicio && prefs.silencio_fin) {
      const ahora = new Date();
      const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
      const [inicioH, inicioM] = prefs.silencio_inicio.split(':').map(Number);
      const [finH, finM] = prefs.silencio_fin.split(':').map(Number);
      const inicioMinutos = inicioH * 60 + inicioM;
      const finMinutos = finH * 60 + finM;

      if (horaActual >= inicioMinutos && horaActual <= finMinutos) {
        return false; // En horario de silencio
      }
    }

    // Verificar preferencia por tipo
    const mapaTipos = {
      'platos': 'recibir_platos',
      'ingredientes': 'recibir_ingredientes',
      'inventario': 'recibir_inventario',
      'pedidos': 'recibir_pedidos',
      'stock': 'recibir_stock_bajo',
      'alerta': 'recibir_alertas'
    };

    const campoPref = mapaTipos[tipo];
    if (campoPref) {
      return prefs[campoPref] === 1;
    }

    return true; // Por defecto, enviar
  }
}

module.exports = Notificacion;
