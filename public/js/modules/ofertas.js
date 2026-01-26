/**
 * ============================================================================
 * OFERTAS Y EVENTOS MODULE
 * ============================================================================
 * 
 * Módulo para gestionar ofertas comerciales y eventos especiales
 * 
 */

class OfertasModule {
  constructor() {
    this.apiService = window.apiService;
    this.stateManager = window.stateManager;
    this.endpointOfertas = '/ofertas';
    this.endpointEventos = '/eventos';
  }

  // ========================================================================
  // OFERTAS
  // ========================================================================

  async obtenerOfertas() {
    try {
      const response = await this.apiService.get(this.endpointOfertas);
      const ofertas = response.data || response || [];
      this.stateManager.set('ofertas', ofertas);
      return ofertas;
    } catch (error) {
      console.error('Error al obtener ofertas:', error);
      return [];
    }
  }

  async crearOferta(datos) {
    try {
      return await this.apiService.post(this.endpointOfertas, datos);
    } catch (error) {
      console.error('Error al crear oferta:', error);
      throw error;
    }
  }

  async actualizarOferta(id, datos) {
    try {
      return await this.apiService.put(`${this.endpointOfertas}/${id}`, datos);
    } catch (error) {
      console.error('Error al actualizar oferta:', error);
      throw error;
    }
  }

  async eliminarOferta(id) {
    try {
      return await this.apiService.delete(`${this.endpointOfertas}/${id}`);
    } catch (error) {
      console.error('Error al eliminar oferta:', error);
      throw error;
    }
  }

  // ========================================================================
  // EVENTOS
  // ========================================================================

  async obtenerEventos() {
    try {
      const response = await this.apiService.get(this.endpointEventos);
      const eventos = response.data || response || [];
      this.stateManager.set('eventos', eventos);
      return eventos;
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      return [];
    }
  }

  async crearEvento(datos) {
    try {
      return await this.apiService.post(this.endpointEventos, datos);
    } catch (error) {
      console.error('Error al crear evento:', error);
      throw error;
    }
  }

  async actualizarEvento(id, datos) {
    try {
      return await this.apiService.put(`${this.endpointEventos}/${id}`, datos);
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      throw error;
    }
  }

  async eliminarEvento(id) {
    try {
      return await this.apiService.delete(`${this.endpointEventos}/${id}`);
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      throw error;
    }
  }

  /**
   * Calcular descuento total
   */
  calcularDescuento(precioRegular, precioOferta) {
    if (!precioRegular || !precioOferta) return 0;
    const descuento = precioRegular - precioOferta;
    const porcentaje = (descuento / precioRegular) * 100;
    return Math.round(porcentaje);
  }

  /**
   * Obtener ofertas activas
   */
  obtenerOfertasActivas(ofertas = []) {
    const ahora = new Date();
    return ofertas.filter(o => {
      const inicio = new Date(o.fecha_inicio);
      const fin = new Date(o.fecha_fin);
      return inicio <= ahora && ahora <= fin && o.estado === 'activa';
    });
  }
}

// Instanciar módulo globalmente
if (typeof window !== 'undefined') {
  window.ofertasModule = new OfertasModule();
}
