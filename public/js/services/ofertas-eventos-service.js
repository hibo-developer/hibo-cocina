/**
 * Servicio para OFERTAS Y EVENTOS
 * Gestiona todas las llamadas a la API
 */

const OfertasEventosService = (() => {
  const API_BASE = '/api';
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // ==========================================================================
  // OFERTAS
  // ==========================================================================

  async function obtenerOfertas(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros);
      const response = await fetch(`${API_BASE}/ofertas?${params}`, { headers });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo ofertas:', error);
      return { success: false, message: error.message };
    }
  }

  async function obtenerOfertaPorId(id) {
    try {
      const response = await fetch(`${API_BASE}/ofertas/${id}`, { headers });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo oferta:', error);
      return { success: false, message: error.message };
    }
  }

  async function obtenerOfertasActivas() {
    try {
      const response = await fetch(`${API_BASE}/ofertas/activas`, { headers });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo ofertas activas:', error);
      return { success: false, message: error.message };
    }
  }

  async function crearOferta(datos) {
    try {
      const response = await fetch(`${API_BASE}/ofertas`, {
        method: 'POST',
        headers,
        body: JSON.stringify(datos)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creando oferta:', error);
      return { success: false, message: error.message };
    }
  }

  async function actualizarOferta(id, datos) {
    try {
      const response = await fetch(`${API_BASE}/ofertas/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(datos)
      });
      return await response.json();
    } catch (error) {
      console.error('Error actualizando oferta:', error);
      return { success: false, message: error.message };
    }
  }

  async function eliminarOferta(id) {
    try {
      const response = await fetch(`${API_BASE}/ofertas/${id}`, {
        method: 'DELETE',
        headers
      });
      return await response.json();
    } catch (error) {
      console.error('Error eliminando oferta:', error);
      return { success: false, message: error.message };
    }
  }

  async function aplicarOferta(datos) {
    try {
      const response = await fetch(`${API_BASE}/ofertas/aplicar`, {
        method: 'POST',
        headers,
        body: JSON.stringify(datos)
      });
      return await response.json();
    } catch (error) {
      console.error('Error aplicando oferta:', error);
      return { success: false, message: error.message };
    }
  }

  async function obtenerEstadisticasOfertas() {
    try {
      const response = await fetch(`${API_BASE}/ofertas/estadisticas`, { headers });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo estadísticas ofertas:', error);
      return { success: false, message: error.message };
    }
  }

  // ==========================================================================
  // EVENTOS
  // ==========================================================================

  async function obtenerEventos(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros);
      const response = await fetch(`${API_BASE}/eventos?${params}`, { headers });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo eventos:', error);
      return { success: false, message: error.message };
    }
  }

  async function obtenerEventoPorId(id) {
    try {
      const response = await fetch(`${API_BASE}/eventos/${id}`, { headers });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo evento:', error);
      return { success: false, message: error.message };
    }
  }

  async function obtenerEventosProximos(dias = 30) {
    try {
      const response = await fetch(`${API_BASE}/eventos/proximos?dias=${dias}`, { headers });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo eventos próximos:', error);
      return { success: false, message: error.message };
    }
  }

  async function crearEvento(datos) {
    try {
      const response = await fetch(`${API_BASE}/eventos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(datos)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creando evento:', error);
      return { success: false, message: error.message };
    }
  }

  async function actualizarEvento(id, datos) {
    try {
      const response = await fetch(`${API_BASE}/eventos/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(datos)
      });
      return await response.json();
    } catch (error) {
      console.error('Error actualizando evento:', error);
      return { success: false, message: error.message };
    }
  }

  async function eliminarEvento(id) {
    try {
      const response = await fetch(`${API_BASE}/eventos/${id}`, {
        method: 'DELETE',
        headers
      });
      return await response.json();
    } catch (error) {
      console.error('Error eliminando evento:', error);
      return { success: false, message: error.message };
    }
  }

  async function obtenerEstadisticasEventos() {
    try {
      const response = await fetch(`${API_BASE}/eventos/estadisticas`, { headers });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo estadísticas eventos:', error);
      return { success: false, message: error.message };
    }
  }

  // ==========================================================================
  // ASISTENTES
  // ==========================================================================

  async function obtenerAsistentes(eventoId) {
    try {
      const response = await fetch(`${API_BASE}/eventos/${eventoId}/asistentes`, { headers });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo asistentes:', error);
      return { success: false, message: error.message };
    }
  }

  async function agregarAsistente(eventoId, datos) {
    try {
      const response = await fetch(`${API_BASE}/eventos/${eventoId}/asistentes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(datos)
      });
      return await response.json();
    } catch (error) {
      console.error('Error agregando asistente:', error);
      return { success: false, message: error.message };
    }
  }

  async function actualizarConfirmacionAsistente(asistenteId, estado) {
    try {
      const response = await fetch(`${API_BASE}/asistentes/${asistenteId}/confirmar`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ estado_confirmacion: estado })
      });
      return await response.json();
    } catch (error) {
      console.error('Error actualizando confirmación:', error);
      return { success: false, message: error.message };
    }
  }

  async function eliminarAsistente(asistenteId) {
    try {
      const response = await fetch(`${API_BASE}/asistentes/${asistenteId}`, {
        method: 'DELETE',
        headers
      });
      return await response.json();
    } catch (error) {
      console.error('Error eliminando asistente:', error);
      return { success: false, message: error.message };
    }
  }

  // ==========================================================================
  // API PÚBLICA
  // ==========================================================================

  return {
    // Ofertas
    obtenerOfertas,
    obtenerOfertaPorId,
    obtenerOfertasActivas,
    crearOferta,
    actualizarOferta,
    eliminarOferta,
    aplicarOferta,
    obtenerEstadisticasOfertas,
    // Eventos
    obtenerEventos,
    obtenerEventoPorId,
    obtenerEventosProximos,
    crearEvento,
    actualizarEvento,
    eliminarEvento,
    obtenerEstadisticasEventos,
    // Asistentes
    obtenerAsistentes,
    agregarAsistente,
    actualizarConfirmacionAsistente,
    eliminarAsistente
  };
})();
