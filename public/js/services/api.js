/**
 * ============================================================================
 * API.JS - Servicio centralizado para llamadas HTTP
 * ============================================================================
 * 
 * Este módulo centraliza todas las llamadas a la API, evitando duplicación
 * y haciendo más fácil el mantenimiento.
 * 
 * Uso:
 * const platos = await apiService.get('/platos');
 * await apiService.post('/platos', { nombre: 'Pizza' });
 * await apiService.put('/platos/1', { nombre: 'Pizza Margherita' });
 * await apiService.delete('/platos/1');
 * 
 */

class ApiService {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * GET - Obtener datos
   */
  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Error GET ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * POST - Crear datos
   */
  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Error POST ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * PUT - Actualizar datos
   */
  async put(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Error PUT ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * DELETE - Eliminar datos
   */
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Error DELETE ${endpoint}:`, error);
      throw error;
    }
  }
}

// Instancia global del servicio
const apiService = new ApiService('/api');

// Exponer globalmente
window.apiService = apiService;

console.log('✅ ApiService cargado y expuesto globalmente');
