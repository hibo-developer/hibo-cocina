/**
 * Gestor de Alertas de Inventario
 * Monitorea inventario y emite notificaciones en tiempo real
 */

const { getDatabase } = require('./database');
const logger = require('./logger');

class GestorAlertasInventario {
  constructor(io) {
    this.io = io;
    this.alertasActivas = new Map();
    this.intervaloVerificacion = 60000; // 1 minuto
  }

  /**
   * Iniciar verificación periódica de alertas
   */
  iniciar() {
    logger.info('Iniciando gestor de alertas de inventario');
    
    // Verificar alertas cada minuto
    this.intervaloID = setInterval(() => {
      this.verificarAlertas();
    }, this.intervaloVerificacion);

    // Verificar inmediatamente al iniciar
    this.verificarAlertas();
  }

  /**
   * Detener verificación de alertas
   */
  detener() {
    if (this.intervaloID) {
      clearInterval(this.intervaloID);
      logger.info('Gestor de alertas detenido');
    }
  }

  /**
   * Verificar alertas pendientes
   */
  verificarAlertas() {
    const db = getDatabase();

    // 1. ALERTAS DE STOCK CRÍTICO
    db.all(`
      SELECT 
        i.id,
        i.ingrediente_id,
        ing.nombre,
        i.cantidad,
        ing.stock_minimo,
        'CRÍTICO' as tipo
      FROM inventario i
      LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
      WHERE i.cantidad <= (ing.stock_minimo * 0.5)
    `, (err, criticas) => {
      if (!err && criticas && criticas.length > 0) {
        criticas.forEach(alerta => {
          this.emitirAlerta({
            id: `critico_${alerta.id}`,
            tipo: 'STOCK_CRÍTICO',
            severidad: 'CRÍTICA',
            ingrediente: alerta.nombre,
            cantidad_actual: alerta.cantidad,
            stock_minimo: alerta.stock_minimo,
            falta: alerta.stock_minimo - alerta.cantidad,
            timestamp: new Date().toISOString(),
            accion: 'Solicitar compra inmediata',
            icono: '🔴'
          });
        });
      }
    });

    // 2. ALERTAS DE STOCK BAJO
    db.all(`
      SELECT 
        i.id,
        i.ingrediente_id,
        ing.nombre,
        i.cantidad,
        ing.stock_minimo,
        'BAJO' as tipo
      FROM inventario i
      LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
      WHERE i.cantidad <= ing.stock_minimo 
        AND i.cantidad > (ing.stock_minimo * 0.5)
    `, (err, bajos) => {
      if (!err && bajos && bajos.length > 0) {
        bajos.forEach(alerta => {
          this.emitirAlerta({
            id: `bajo_${alerta.id}`,
            tipo: 'STOCK_BAJO',
            severidad: 'MEDIA',
            ingrediente: alerta.nombre,
            cantidad_actual: alerta.cantidad,
            stock_minimo: alerta.stock_minimo,
            falta: alerta.stock_minimo - alerta.cantidad,
            timestamp: new Date().toISOString(),
            accion: 'Revisar stock disponible',
            icono: '🟡'
          });
        });
      }
    });

    // 3. ALERTAS DE CADUCIDAD VENCIDA
    db.all(`
      SELECT 
        i.id,
        i.ingrediente_id,
        ing.nombre,
        i.cantidad,
        i.fecha_caducidad,
        i.lote,
        'VENCIDO' as tipo
      FROM inventario i
      LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
      WHERE DATE(i.fecha_caducidad) <= DATE('now') 
        AND i.fecha_caducidad IS NOT NULL
    `, (err, vencidos) => {
      if (!err && vencidos && vencidos.length > 0) {
        vencidos.forEach(alerta => {
          this.emitirAlerta({
            id: `vencido_${alerta.id}`,
            tipo: 'PRODUCTO_VENCIDO',
            severidad: 'CRÍTICA',
            ingrediente: alerta.nombre,
            cantidad: alerta.cantidad,
            fecha_caducidad: alerta.fecha_caducidad,
            lote: alerta.lote,
            timestamp: new Date().toISOString(),
            accion: 'Descartar inmediatamente',
            icono: '❌'
          });
        });
      }
    });

    // 4. ALERTAS DE CADUCIDAD PRÓXIMA (7 días)
    db.all(`
      SELECT 
        i.id,
        i.ingrediente_id,
        ing.nombre,
        i.cantidad,
        i.fecha_caducidad,
        i.lote,
        CAST((JULIANDAY(i.fecha_caducidad) - JULIANDAY('now')) AS INTEGER) as dias_restantes,
        'PRÓXIMO_VENCER' as tipo
      FROM inventario i
      LEFT JOIN ingredientes ing ON i.ingrediente_id = ing.id
      WHERE DATE(i.fecha_caducidad) > DATE('now')
        AND DATE(i.fecha_caducidad) <= DATE('now', '+7 days')
        AND i.fecha_caducidad IS NOT NULL
    `, (err, proximosVencer) => {
      if (!err && proximosVencer && proximosVencer.length > 0) {
        proximosVencer.forEach(alerta => {
          this.emitirAlerta({
            id: `proximo_${alerta.id}`,
            tipo: 'PRÓXIMO_VENCER',
            severidad: 'MEDIA',
            ingrediente: alerta.nombre,
            cantidad: alerta.cantidad,
            fecha_caducidad: alerta.fecha_caducidad,
            lote: alerta.lote,
            dias_restantes: alerta.dias_restantes,
            timestamp: new Date().toISOString(),
            accion: `Usar en los próximos ${alerta.dias_restantes} días`,
            icono: '⚠️'
          });
        });
      }
    });

    logger.debug('Verificación de alertas completada');
  }

  /**
   * Emitir alerta a todos los clientes conectados
   */
  emitirAlerta(alerta) {
    const alertaID = alerta.id;
    const ahora = new Date().getTime();

    // Evitar duplicados: solo emitir si no se emitió en los últimos 5 minutos
    if (this.alertasActivas.has(alertaID)) {
      const ultimaEmision = this.alertasActivas.get(alertaID);
      if (ahora - ultimaEmision < 300000) { // 5 minutos
        return;
      }
    }

    this.alertasActivas.set(alertaID, ahora);

    // Emitir a todos los clientes en el namespace /alerts
    this.io.to('inventario-alerts').emit('alerta-inventario', alerta);

    // Emitir también a dashboard
    this.io.to('dashboard').emit('alerta-inventario', alerta);

    logger.warn(`Alerta emitida: ${alerta.tipo} - ${alerta.ingrediente}`);
  }

  /**
   * Obtener resumen de alertas activas
   */
  obtenerResumen() {
    const alertasArray = Array.from(this.alertasActivas.entries());
    return {
      total_alertas: alertasArray.length,
      ultimas_alertas: alertasArray.slice(-5),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Limpiar alertas resueltas (más antiguas de 24 horas)
   */
  limpiarAlertasAntiguas() {
    const ahora = new Date().getTime();
    let eliminadas = 0;

    for (const [id, timestamp] of this.alertasActivas.entries()) {
      if (ahora - timestamp > 86400000) { // 24 horas
        this.alertasActivas.delete(id);
        eliminadas++;
      }
    }

    if (eliminadas > 0) {
      logger.info(`Limpias ${eliminadas} alertas antiguas`);
    }
  }
}

module.exports = GestorAlertasInventario;
