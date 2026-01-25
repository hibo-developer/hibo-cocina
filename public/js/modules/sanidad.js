/**
 * ============================================================================
 * SANIDAD (APPCC) MODULE
 * ============================================================================
 * 
 * Módulo para gestionar APPCC y trazabilidad (sanidad, alergenos, etc)
 * 
 */

class SanidadModule {
  constructor() {
    this.apiService = window.apiService;
    this.stateManager = window.stateManager;
    this.endpoint = '/sanidad';
  }

  async cargar() {
    try {
      console.log('📥 Cargando datos de sanidad...');
      const sanidad = await this.apiService.get(this.endpoint);
      this.stateManager.set('sanidad', sanidad);
      console.log(`✅ Datos de sanidad cargados`);
      return sanidad;
    } catch (error) {
      console.error('Error al cargar datos de sanidad:', error);
      throw error;
    }
  }

  // ========================================================================
  // ALERGENOS
  // ========================================================================

  async obtenerAlergenos() {
    try {
      return await this.apiService.get(`${this.endpoint}/alergenos`);
    } catch (error) {
      console.error('Error al obtener alergenos:', error);
      throw error;
    }
  }

  async agregarAlergeno(platoId, alergeno) {
    try {
      return await this.apiService.post(`${this.endpoint}/alergenos`, {
        platoId,
        alergeno
      });
    } catch (error) {
      console.error('Error al agregar alergeno:', error);
      throw error;
    }
  }

  async eliminarAlergeno(platoId, alergeno) {
    try {
      return await this.apiService.delete(`${this.endpoint}/alergenos/${platoId}/${alergeno}`);
    } catch (error) {
      console.error('Error al eliminar alergeno:', error);
      throw error;
    }
  }

  /**
   * Obtener alergenos de un plato
   */
  obtenerAlergenesPorPlato(platoId) {
    const sanidad = this.stateManager.get('sanidad') || { alergenos: [] };
    return sanidad.alergenos.filter(a => a.platoId === platoId);
  }

  /**
   * Verificar si un plato contiene un alergeno específico
   */
  contieneAlergeno(platoId, alergeno) {
    const alergenos = this.obtenerAlergenesPorPlato(platoId);
    return alergenos.some(a => a.alergeno === alergeno);
  }

  /**
   * Obtener platos seguros para alergenia específica
   */
  platosLibresDeAlergeno(alergeno) {
    const platos = this.stateManager.get('platos') || [];
    return platos.filter(p => !this.contieneAlergeno(p.id, alergeno));
  }

  // ========================================================================
  // CONTROL APPCC
  // ========================================================================

  async registrarControl(datos) {
    try {
      console.log('📋 Registrando control APPCC...', datos);
      return await this.apiService.post(`${this.endpoint}/controles`, datos);
    } catch (error) {
      console.error('Error al registrar control:', error);
      throw error;
    }
  }

  async obtenerControles(filtros = {}) {
    try {
      const query = new URLSearchParams(filtros).toString();
      return await this.apiService.get(`${this.endpoint}/controles?${query}`);
    } catch (error) {
      console.error('Error al obtener controles:', error);
      throw error;
    }
  }

  /**
   * Obtener controles por fecha
   */
  async obtenerControlesPorFecha(fecha) {
    return this.obtenerControles({ fecha });
  }

  /**
   * Obtener controles fuera de rango
   */
  async obtenerAlertasTemperatura() {
    const controles = await this.obtenerControles();
    return controles.filter(c => {
      if (c.tipo === 'temperatura') {
        return c.valor < 2 || c.valor > 8; // Rango seguro: 2-8°C
      }
      return false;
    });
  }

  // ========================================================================
  // TRAZABILIDAD
  // ========================================================================

  async registrarTrazabilidad(datos) {
    try {
      console.log('🔍 Registrando trazabilidad...', datos);
      return await this.apiService.post(`${this.endpoint}/trazabilidad`, datos);
    } catch (error) {
      console.error('Error al registrar trazabilidad:', error);
      throw error;
    }
  }

  async obtenerTrazabilidadPorPlato(platoId) {
    try {
      return await this.apiService.get(`${this.endpoint}/trazabilidad/plato/${platoId}`);
    } catch (error) {
      console.error('Error al obtener trazabilidad:', error);
      throw error;
    }
  }

  async obtenerTrazabilidadPorIngrediente(ingredienteId) {
    try {
      return await this.apiService.get(`${this.endpoint}/trazabilidad/ingrediente/${ingredienteId}`);
    } catch (error) {
      console.error('Error al obtener trazabilidad:', error);
      throw error;
    }
  }

  // ========================================================================
  // VALIDACIÓN Y SEGURIDAD
  // ========================================================================

  /**
   * Validar plato antes de servir
   */
  validarPlatoSanitario(platoId, alergiaCliente = null) {
    const alergenes = this.obtenerAlergenesPorPlato(platoId);

    if (alergiaCliente && alergenes.some(a => a.alergeno === alergiaCliente)) {
      return {
        seguro: false,
        mensaje: `⚠️ Este plato contiene ${alergiaCliente}`,
        alergenos: alergenes
      };
    }

    return {
      seguro: true,
      mensaje: '✅ Plato seguro para servir',
      alergenos: alergenes
    };
  }

  /**
   * Generar reporte de cumplimiento
   */
  async generarReporteCumplimiento(fechaInicio, fechaFin) {
    try {
      const controles = await this.obtenerControles({
        desde: fechaInicio,
        hasta: fechaFin
      });

      const totalControles = controles.length;
      const controlesOk = controles.filter(c => c.cumple).length;
      const cumplimiento = totalControles > 0 ? (controlesOk / totalControles) * 100 : 0;

      return {
        periodo: `${fechaInicio} - ${fechaFin}`,
        totalControles,
        controlesOk,
        cumplimiento: cumplimiento.toFixed(2),
        alertas: controles.filter(c => !c.cumple)
      };
    } catch (error) {
      console.error('Error al generar reporte:', error);
      throw error;
    }
  }

  /**
   * Validar datos de control
   */
  validarControl(datos) {
    const errores = [];

    if (!datos.tipo) {
      errores.push('Tipo de control requerido');
    }

    if (datos.valor === undefined) {
      errores.push('Valor requerido');
    }

    if (!datos.punto) {
      errores.push('Punto de control requerido');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }
}

// ============================================================================
// INSTANCIA GLOBAL
// ============================================================================

const sanidadModule = new SanidadModule();

// Exponer globalmente
window.sanidadModule = sanidadModule;

console.log('✅ Módulo Sanidad (APPCC) cargado y expuesto globalmente');
