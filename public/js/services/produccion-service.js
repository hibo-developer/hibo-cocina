/**
 * Servicio de Producción
 * Gestión de órdenes, lotes y consumos
 */

const ProduccionService = (() => {
  const API_BASE = '/api/produccion';

  // ============================================================================
  // ÓRDENES DE PRODUCCIÓN
  // ============================================================================

  const obtenerOrdenes = async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);
      if (filtros.plato_id) params.append('plato_id', filtros.plato_id);

      const response = await fetch(`${API_BASE}/ordenes?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al obtener órdenes');
      return await response.json();
    } catch (error) {
      console.error('Error en obtenerOrdenes:', error);
      throw error;
    }
  };

  const obtenerOrdenPorId = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/ordenes/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Orden no encontrada');
      return await response.json();
    } catch (error) {
      console.error('Error en obtenerOrdenPorId:', error);
      throw error;
    }
  };

  const crearOrden = async (datos) => {
    try {
      const response = await fetch(`${API_BASE}/ordenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(datos)
      });

      if (!response.ok) throw new Error('Error al crear orden');
      return await response.json();
    } catch (error) {
      console.error('Error en crearOrden:', error);
      throw error;
    }
  };

  const actualizarOrden = async (id, datos) => {
    try {
      const response = await fetch(`${API_BASE}/ordenes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(datos)
      });

      if (!response.ok) throw new Error('Error al actualizar orden');
      return await response.json();
    } catch (error) {
      console.error('Error en actualizarOrden:', error);
      throw error;
    }
  };

  const iniciarProduccion = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/ordenes/${id}/iniciar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al iniciar producción');
      return await response.json();
    } catch (error) {
      console.error('Error en iniciarProduccion:', error);
      throw error;
    }
  };

  const finalizarProduccion = async (id, cantidadProducida) => {
    try {
      const response = await fetch(`${API_BASE}/ordenes/${id}/finalizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ cantidad_producida: cantidadProducida })
      });

      if (!response.ok) throw new Error('Error al finalizar producción');
      return await response.json();
    } catch (error) {
      console.error('Error en finalizarProduccion:', error);
      throw error;
    }
  };

  const cancelarOrden = async (id, motivo = '') => {
    try {
      const response = await fetch(`${API_BASE}/ordenes/${id}/cancelar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ motivo })
      });

      if (!response.ok) throw new Error('Error al cancelar orden');
      return await response.json();
    } catch (error) {
      console.error('Error en cancelarOrden:', error);
      throw error;
    }
  };

  const eliminarOrden = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/ordenes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar orden');
      return await response.json();
    } catch (error) {
      console.error('Error en eliminarOrden:', error);
      throw error;
    }
  };

  // ============================================================================
  // LOTES DE PRODUCCIÓN
  // ============================================================================

  const obtenerLotes = async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.orden_id) params.append('orden_id', filtros.orden_id);
      if (filtros.estado) params.append('estado', filtros.estado);

      const response = await fetch(`${API_BASE}/lotes?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al obtener lotes');
      return await response.json();
    } catch (error) {
      console.error('Error en obtenerLotes:', error);
      throw error;
    }
  };

  const obtenerLotePorId = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/lotes/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Lote no encontrado');
      return await response.json();
    } catch (error) {
      console.error('Error en obtenerLotePorId:', error);
      throw error;
    }
  };

  const crearLote = async (datos) => {
    try {
      const response = await fetch(`${API_BASE}/lotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(datos)
      });

      if (!response.ok) throw new Error('Error al crear lote');
      return await response.json();
    } catch (error) {
      console.error('Error en crearLote:', error);
      throw error;
    }
  };

  const actualizarLote = async (id, datos) => {
    try {
      const response = await fetch(`${API_BASE}/lotes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(datos)
      });

      if (!response.ok) throw new Error('Error al actualizar lote');
      return await response.json();
    } catch (error) {
      console.error('Error en actualizarLote:', error);
      throw error;
    }
  };

  const eliminarLote = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/lotes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar lote');
      return await response.json();
    } catch (error) {
      console.error('Error en eliminarLote:', error);
      throw error;
    }
  };

  // ============================================================================
  // CONSUMOS DE PRODUCCIÓN
  // ============================================================================

  const obtenerConsumos = async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.orden_id) params.append('orden_id', filtros.orden_id);

      const response = await fetch(`${API_BASE}/consumos?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al obtener consumos');
      return await response.json();
    } catch (error) {
      console.error('Error en obtenerConsumos:', error);
      throw error;
    }
  };

  const obtenerConsumoPorId = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/consumos/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Consumo no encontrado');
      return await response.json();
    } catch (error) {
      console.error('Error en obtenerConsumoPorId:', error);
      throw error;
    }
  };

  const crearConsumo = async (datos) => {
    try {
      const response = await fetch(`${API_BASE}/consumos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(datos)
      });

      if (!response.ok) throw new Error('Error al crear consumo');
      return await response.json();
    } catch (error) {
      console.error('Error en crearConsumo:', error);
      throw error;
    }
  };

  const actualizarConsumo = async (id, datos) => {
    try {
      const response = await fetch(`${API_BASE}/consumos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(datos)
      });

      if (!response.ok) throw new Error('Error al actualizar consumo');
      return await response.json();
    } catch (error) {
      console.error('Error en actualizarConsumo:', error);
      throw error;
    }
  };

  const eliminarConsumo = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/consumos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar consumo');
      return await response.json();
    } catch (error) {
      console.error('Error en eliminarConsumo:', error);
      throw error;
    }
  };

  // ============================================================================
  // REPORTES Y ESTADÍSTICAS
  // ============================================================================

  const obtenerRendimientos = async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);

      const response = await fetch(`${API_BASE}/rendimientos?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al obtener rendimientos');
      return await response.json();
    } catch (error) {
      console.error('Error en obtenerRendimientos:', error);
      throw error;
    }
  };

  const obtenerCostes = async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);

      const response = await fetch(`${API_BASE}/costes?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al obtener costes');
      return await response.json();
    } catch (error) {
      console.error('Error en obtenerCostes:', error);
      throw error;
    }
  };

  const obtenerEstadisticas = async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);

      const response = await fetch(`${API_BASE}/estadisticas?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al obtener estadísticas');
      return await response.json();
    } catch (error) {
      console.error('Error en obtenerEstadisticas:', error);
      throw error;
    }
  };

  // Retornar API pública
  return {
    // Órdenes
    obtenerOrdenes,
    obtenerOrdenPorId,
    crearOrden,
    actualizarOrden,
    iniciarProduccion,
    finalizarProduccion,
    cancelarOrden,
    eliminarOrden,
    // Lotes
    obtenerLotes,
    obtenerLotePorId,
    crearLote,
    actualizarLote,
    eliminarLote,
    // Consumos
    obtenerConsumos,
    obtenerConsumoPorId,
    crearConsumo,
    actualizarConsumo,
    eliminarConsumo,
    // Reportes
    obtenerRendimientos,
    obtenerCostes,
    obtenerEstadisticas
  };
})();
