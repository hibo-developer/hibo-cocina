/**
 * ============================================================================
 * ESCANDALLOS MODULE
 * ============================================================================
 * 
 * Módulo para gestionar escandallos (cálculo de costes de producción)
 * 
 * USO:
 *   const escandallosModule = new EscandallosModule();
 *   await escandallosModule.cargar();
 *   const costo = escandallosModule.calcularCosto(platillo);
 * 
 */

class EscandallosModule {
  constructor() {
    this.apiService = window.apiService;
    this.stateManager = window.stateManager;
    this.endpoint = '/escandallos';
  }

  // ========================================================================
  // OPERACIONES BÁSICAS
  // ========================================================================

  async cargar() {
    try {
      console.log('📥 Cargando escandallos...');
      const escandallos = await this.apiService.get(this.endpoint);
      this.stateManager.set('escandallos', escandallos);
      console.log(`✅ ${escandallos.length} escandallos cargados`);
      return escandallos;
    } catch (error) {
      console.error('Error al cargar escandallos:', error);
      throw error;
    }
  }

  obtener(id) {
    const escandallos = this.stateManager.get('escandallos') || [];
    return escandallos.find(e => e.id === id);
  }

  async crear(datos) {
    try {
      console.log('➕ Creando escandallo...', datos);
      const nuevoEscandallo = await this.apiService.post(this.endpoint, datos);
      await this.cargar();
      return nuevoEscandallo;
    } catch (error) {
      console.error('Error al crear escandallo:', error);
      throw error;
    }
  }

  async actualizar(id, datos) {
    try {
      console.log(`✏️  Actualizando escandallo ${id}...`);
      const actualizado = await this.apiService.put(`${this.endpoint}/${id}`, datos);
      await this.cargar();
      return actualizado;
    } catch (error) {
      console.error('Error al actualizar escandallo:', error);
      throw error;
    }
  }

  async eliminar(id) {
    try {
      console.log(`🗑️  Eliminando escandallo ${id}...`);
      await this.apiService.delete(`${this.endpoint}/${id}`);
      await this.cargar();
      console.log('✅ Escandallo eliminado');
    } catch (error) {
      console.error('Error al eliminar escandallo:', error);
      throw error;
    }
  }

  // ========================================================================
  // OPERACIONES DE CÁLCULO
  // ========================================================================

  /**
   * Calcular costo total de un plato
   */
  calcularCosto(platoId) {
    const escandallo = this.obtener(platoId);
    if (!escandallo) return 0;

    let costoTotal = 0;
    (escandallo.ingredientes || []).forEach(item => {
      const ingrediente = this.obtenerIngrediente(item.ingredienteId);
      if (ingrediente) {
        costoTotal += ingrediente.precioUnitario * item.cantidad;
      }
    });

    return costoTotal;
  }

  /**
   * Calcular margen de beneficio
   */
  calcularMargen(platoPrecio, costoProduccion) {
    if (costoProduccion === 0) return 0;
    return ((platoPrecio - costoProduccion) / platoPrecio) * 100;
  }

  /**
   * Sugerir precio de venta basado en costo
   */
  sugerirPrecio(costoProduccion, margenDeseado = 40) {
    // margen = (precio - costo) / precio * 100
    // precio = costo / (1 - margen/100)
    return costoProduccion / (1 - margenDeseado / 100);
  }

  /**
   * Generar reporte de costos
   */
  generarReporte() {
    const platos = this.stateManager.get('platos') || [];
    const escandallos = this.stateManager.get('escandallos') || [];

    return platos.map(plato => {
      const costo = this.calcularCosto(plato.id);
      const margen = this.calcularMargen(plato.precio, costo);
      const precioSugerido = this.sugerirPrecio(costo);

      return {
        platoId: plato.id,
        platoNombre: plato.nombre,
        costoProduccion: costo,
        precioVenta: plato.precio,
        margen: margen.toFixed(2),
        precioSugerido: precioSugerido.toFixed(2)
      };
    });
  }

  /**
   * Buscar platos con margen bajo (rentabilidad baja)
   */
  obtenerPlatosMargenBajo(threshold = 20) {
    const reporte = this.generarReporte();
    return reporte.filter(r => parseFloat(r.margen) < threshold);
  }

  // ========================================================================
  // VALIDACIÓN
  // ========================================================================

  validar(datos) {
    const errores = [];

    if (!datos.platoId) {
      errores.push('El plato es obligatorio');
    }

    if (!Array.isArray(datos.ingredientes) || datos.ingredientes.length === 0) {
      errores.push('Debe incluir al menos un ingrediente');
    }

    datos.ingredientes?.forEach((item, index) => {
      if (!item.ingredienteId) {
        errores.push(`Ingrediente ${index + 1}: ID requerido`);
      }
      if (item.cantidad <= 0) {
        errores.push(`Ingrediente ${index + 1}: cantidad debe ser mayor a 0`);
      }
    });

    return {
      valido: errores.length === 0,
      errores
    };
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  obtenerIngrediente(ingredienteId) {
    const ingredientes = this.stateManager.get('ingredientes') || [];
    return ingredientes.find(i => i.id === ingredienteId);
  }

  obtenerPlato(platoId) {
    const platos = this.stateManager.get('platos') || [];
    return platos.find(p => p.id === platoId);
  }
}

// ============================================================================
// INSTANCIA GLOBAL
// ============================================================================

const escandallosModule = new EscandallosModule();

// Exponer globalmente
window.escandallosModule = escandallosModule;

console.log('✅ Módulo Escandallos cargado y expuesto globalmente');
