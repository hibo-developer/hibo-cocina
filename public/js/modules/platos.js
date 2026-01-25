/**
 * ============================================================================
 * PLATOS.JS - Módulo de gestión de platos
 * ============================================================================
 * 
 * Contiene toda la lógica de negocio para platos
 * Se separa del app.js principal para mejor mantenibilidad
 * 
 */

class PlatosModule {
  constructor() {
    this.api = apiService;
    this.state = stateManager;
  }

  /**
   * Cargar lista de platos
   */
  async cargar() {
    try {
      const platos = await this.api.get('/platos');
      this.state.set('platos', platos);
      return platos;
    } catch (error) {
      console.error('Error cargando platos:', error);
      notify.error('Error al cargar platos');
      return [];
    }
  }

  /**
   * Obtener plato por ID
   */
  async obtener(id) {
    try {
      const response = await this.api.get(`/platos/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Error cargando plato ${id}:`, error);
      notify.error('Error al cargar plato');
      return null;
    }
  }

  /**
   * Crear nuevo plato
   */
  async crear(datos) {
    try {
      const response = await this.api.post('/platos', datos);
      notify.success('Plato creado correctamente');
      await this.cargar(); // Recargar lista
      return response;
    } catch (error) {
      console.error('Error creando plato:', error);
      notify.error('Error al crear plato');
      throw error;
    }
  }

  /**
   * Actualizar plato
   */
  async actualizar(id, datos) {
    try {
      const response = await this.api.put(`/platos/${id}`, datos);
      notify.success('Plato actualizado correctamente');
      await this.cargar(); // Recargar lista
      return response;
    } catch (error) {
      console.error('Error actualizando plato:', error);
      notify.error('Error al actualizar plato');
      throw error;
    }
  }

  /**
   * Eliminar plato
   */
  async eliminar(id) {
    try {
      await this.api.delete(`/platos/${id}`);
      notify.success('Plato eliminado correctamente');
      await this.cargar(); // Recargar lista
    } catch (error) {
      console.error('Error eliminando plato:', error);
      notify.error('Error al eliminar plato');
      throw error;
    }
  }

  /**
   * Filtrar platos localmente
   */
  filtrar(filtros = {}) {
    let platos = this.state.get('platos');

    if (filtros.search) {
      const search = normalizarTexto(filtros.search);
      platos = platos.filter(p =>
        normalizarTexto(p.nombre).includes(search) ||
        normalizarTexto(p.codigo).includes(search)
      );
    }

    if (filtros.grupo) {
      platos = platos.filter(p => p.grupo_menu === filtros.grupo);
    }

    return platos;
  }

  /**
   * Obtener estadísticas de platos
   */
  async obtenerEstadisticas() {
    try {
      const response = await this.api.get('/platos/estadisticas');
      return response.data || [];
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      return [];
    }
  }
}

// Instancia global
const platosModule = new PlatosModule();

// Exponer globalmente
window.platosModule = platosModule;

console.log('✅ Módulo Platos cargado y expuesto globalmente');
