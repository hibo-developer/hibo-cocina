/**
 * ============================================================================
 * PRODUCCION MODULE
 * ============================================================================
 * 
 * Módulo para gestionar órdenes de producción, planificación y fabricación
 * 
 */

class ProduccionModule {
  constructor() {
    this.apiService = window.apiService;
    this.stateManager = window.stateManager;
    this.endpoint = '/produccion';
  }

  async cargar() {
    try {
      console.log('📥 Cargando órdenes de producción...');
      const produccion = await this.apiService.get(this.endpoint);
      this.stateManager.set('produccion', produccion);
      console.log(`✅ ${produccion.length} órdenes cargadas`);
      return produccion;
    } catch (error) {
      console.error('Error al cargar producción:', error);
      throw error;
    }
  }

  obtener(id) {
    const produccion = this.stateManager.get('produccion') || [];
    return produccion.find(p => p.id === id);
  }

  // ========================================================================
  // ÓRDENES DE PRODUCCIÓN
  // ========================================================================

  async crearOrden(datos) {
    try {
      console.log('📋 Creando orden de producción...', datos);
      const nuevaOrden = await this.apiService.post(this.endpoint, datos);
      await this.cargar();
      return nuevaOrden;
    } catch (error) {
      console.error('Error al crear orden:', error);
      throw error;
    }
  }

  async actualizarOrden(id, datos) {
    try {
      console.log(`✏️  Actualizando orden ${id}...`);
      const actualizada = await this.apiService.put(`${this.endpoint}/${id}`, datos);
      await this.cargar();
      return actualizada;
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      throw error;
    }
  }

  async cambiarEstado(id, nuevoEstado) {
    const estadosValidos = ['planificada', 'en-preparacion', 'completada', 'verificada', 'cancelada'];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`Estado inválido: ${nuevoEstado}`);
    }
    return this.actualizarOrden(id, { estado: nuevoEstado });
  }

  // ========================================================================
  // PLANIFICACIÓN
  // ========================================================================

  /**
   * Obtener órdenes por estado
   */
  obtenerPorEstado(estado) {
    const produccion = this.stateManager.get('produccion') || [];
    return produccion.filter(p => p.estado === estado);
  }

  /**
   * Obtener órdenes pendientes de fabricar
   */
  obtenerPendientes() {
    return this.obtenerPorEstado('planificada');
  }

  /**
   * Obtener órdenes en fabricación
   */
  obtenerEnPreparacion() {
    return this.obtenerPorEstado('en-preparacion');
  }

  /**
   * Obtener órdenes completadas hoy
   */
  obtenerCompletadasHoy() {
    const completadas = this.obtenerPorEstado('completada');
    const hoy = new Date().toISOString().split('T')[0];
    return completadas.filter(o => o.fechaCompletada?.startsWith(hoy));
  }

  /**
   * Calcular tiempo de fabricación promedio
   */
  calcularTiempoPromedio() {
    const completadas = this.obtenerPorEstado('completada');
    if (completadas.length === 0) return 0;

    let tiempoTotal = 0;
    completadas.forEach(o => {
      if (o.fechaCreacion && o.fechaCompletada) {
        const inicio = new Date(o.fechaCreacion);
        const fin = new Date(o.fechaCompletada);
        tiempoTotal += (fin - inicio) / 1000 / 60; // en minutos
      }
    });

    return (tiempoTotal / completadas.length).toFixed(2);
  }

  /**
   * Obtener rendimiento por turno
   */
  obtenerRendimientoTurno(turno = 'mañana') {
    const completadas = this.obtenerCompletadasHoy();
    const delTurno = completadas.filter(o => o.turno === turno);
    return {
      turno,
      ordenesCompletadas: delTurno.length,
      platosProducidos: delTurno.reduce((sum, o) => sum + (o.cantidad || 0), 0)
    };
  }

  // ========================================================================
  // ASIGNACIÓN DE RECURSOS
  // ========================================================================

  async asignarPersonal(ordenId, personalId) {
    try {
      return await this.apiService.post(`${this.endpoint}/${ordenId}/personal`, {
        personalId
      });
    } catch (error) {
      console.error('Error al asignar personal:', error);
      throw error;
    }
  }

  async asignarEquipo(ordenId, equipoId) {
    try {
      return await this.apiService.post(`${this.endpoint}/${ordenId}/equipo`, {
        equipoId
      });
    } catch (error) {
      console.error('Error al asignar equipo:', error);
      throw error;
    }
  }

  /**
   * Obtener carga de trabajo por persona
   */
  obtenerCargaPorPersona(personalId) {
    const produccion = this.stateManager.get('produccion') || [];
    return produccion.filter(o => 
      o.estado !== 'completada' && 
      o.personalAsignado?.includes(personalId)
    );
  }

  /**
   * Obtener disponibilidad de equipos
   */
  obtenerEquiposDisponibles() {
    const produccion = this.stateManager.get('produccion') || [];
    const enUso = new Set();

    produccion.forEach(o => {
      if (o.estado !== 'completada' && o.equipoAsignado) {
        o.equipoAsignado.forEach(e => enUso.add(e));
      }
    });

    return {
      enUso: Array.from(enUso),
      disponibles: this.obtenerTodosEquipos().filter(e => !enUso.has(e.id))
    };
  }

  // ========================================================================
  // CONTROL DE CALIDAD
  // ========================================================================

  async registrarInspeccion(ordenId, datos) {
    try {
      console.log('🔍 Registrando inspección...', datos);
      return await this.apiService.post(`${this.endpoint}/${ordenId}/inspeccion`, datos);
    } catch (error) {
      console.error('Error al registrar inspección:', error);
      throw error;
    }
  }

  async aprobarOrden(ordenId) {
    return this.cambiarEstado(ordenId, 'verificada');
  }

  async rechazarOrden(ordenId, motivo) {
    return this.actualizarOrden(ordenId, {
      estado: 'cancelada',
      motivoRechazo: motivo
    });
  }

  // ========================================================================
  // VALIDACIÓN
  // ========================================================================

  validar(datos) {
    const errores = [];

    if (!datos.platoId) {
      errores.push('Plato requerido');
    }

    if (datos.cantidad <= 0) {
      errores.push('Cantidad debe ser mayor a 0');
    }

    if (!datos.turno || !['mañana', 'tarde', 'noche'].includes(datos.turno)) {
      errores.push('Turno inválido');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  obtenerTodosEquipos() {
    // Esto requeriría una API de equipos
    return this.stateManager.get('equipos') || [];
  }

  obtenerTodoPersonal() {
    // Esto requeriría una API de personal
    return this.stateManager.get('personal') || [];
  }
}

// ============================================================================
// INSTANCIA GLOBAL
// ============================================================================

const produccionModule = new ProduccionModule();

// Exponer globalmente
window.produccionModule = produccionModule;

console.log('✅ Módulo Producción cargado y expuesto globalmente');
