/**
 * ============================================================================
 * PEDIDOS MODULE
 * ============================================================================
 * 
 * Módulo para gestionar pedidos (CRUD, estado, seguimiento)
 * 
 */

class PedidosModule {
  constructor() {
    this.apiService = window.apiService;
    this.stateManager = window.stateManager;
    this.endpoint = '/pedidos';
    this.wsClient = null;
    this.wsInitialized = false;
  }

  /**
   * Conectar a WebSocket para recibir actualizaciones en tiempo real
   */
  connectWebSocket(wsClient) {
    if (this.wsInitialized) return;
    
    this.wsClient = wsClient;
    
    // Suscribirse a actualizaciones generales de pedidos
    this.wsClient.on('pedidos:update', (data) => {
      console.log('📡 Actualización de pedidos recibida:', data);
      this.handleWebSocketUpdate(data);
    });
    
    // Suscribirse a notificaciones personales
    this.wsClient.on('pedidos:personal-update', (data) => {
      console.log('📬 Notificación personal de pedido:', data);
      this.handlePersonalUpdate(data);
    });
    
    // Suscribirse al canal
    if (this.wsClient.isConnected) {
      this.wsClient.subscribePedidos();
    } else {
      this.wsClient.on('connected', () => {
        this.wsClient.subscribePedidos();
      });
    }
    
    this.wsInitialized = true;
    console.log('✅ WebSocket conectado para Pedidos');
  }

  /**
   * Manejar actualizaciones desde WebSocket
   */
  async handleWebSocketUpdate(data) {
    const { action, pedido } = data;
    
    switch (action) {
      case 'created':
        console.log('➕ Pedido creado:', pedido.id);
        await this.cargar();
        break;
        
      case 'updated':
        console.log('✏️  Pedido actualizado:', pedido.id);
        await this.cargar();
        break;
        
      case 'deleted':
        console.log('🗑️  Pedido eliminado:', pedido.id);
        await this.cargar();
        break;
    }
  }

  /**
   * Manejar notificación personal de pedido
   */
  handlePersonalUpdate(data) {
    console.log('📬 Notificación personal:', data);
    
    // Si hay gestor de notificaciones, mostrar
    if (window.notificationManager) {
      window.notificationManager.addNotification({
        type: data.type || 'info',
        title: data.title || 'Actualización de Pedido',
        message: data.message,
        data: data.pedido
      });
    }
  }

  async cargar() {
    try {
      console.log('📥 Cargando pedidos...');
      const pedidos = await this.apiService.get(this.endpoint);
      this.stateManager.set('pedidos', pedidos);
      console.log(`✅ ${pedidos.length} pedidos cargados`);
      return pedidos;
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      throw error;
    }
  }

  obtener(id) {
    const pedidos = this.stateManager.get('pedidos') || [];
    return pedidos.find(p => p.id === id);
  }

  async crear(datos) {
    try {
      console.log('➕ Creando pedido...', datos);
      const nuevoPedido = await this.apiService.post(this.endpoint, datos);
      await this.cargar();
      return nuevoPedido;
    } catch (error) {
      console.error('Error al crear pedido:', error);
      throw error;
    }
  }

  async actualizar(id, datos) {
    try {
      console.log(`✏️  Actualizando pedido ${id}...`);
      const actualizado = await this.apiService.put(`${this.endpoint}/${id}`, datos);
      await this.cargar();
      return actualizado;
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      throw error;
    }
  }

  async eliminar(id) {
    try {
      console.log(`🗑️  Eliminando pedido ${id}...`);
      await this.apiService.delete(`${this.endpoint}/${id}`);
      await this.cargar();
      console.log('✅ Pedido eliminado');
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      throw error;
    }
  }

  // ========================================================================
  // OPERACIONES DE PEDIDOS
  // ========================================================================

  /**
   * Cambiar estado del pedido
   */
  async cambiarEstado(id, nuevoEstado) {
    const estadosValidos = ['pendiente', 'confirmado', 'preparacion', 'listo', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`Estado inválido: ${nuevoEstado}`);
    }
    return this.actualizar(id, { estado: nuevoEstado });
  }

  /**
   * Filtrar pedidos por estado
   */
  porEstado(estado) {
    const pedidos = this.stateManager.get('pedidos') || [];
    return pedidos.filter(p => p.estado === estado);
  }

  /**
   * Obtener pedidos pendientes
   */
  obtenerPendientes() {
    return this.porEstado('pendiente');
  }

  /**
   * Obtener pedidos en preparación
   */
  obtenerEnPreparacion() {
    return this.porEstado('preparacion');
  }

  /**
   * Filtrar pedidos por rango de fechas
   */
  porFecha(fechaInicio, fechaFin) {
    const pedidos = this.stateManager.get('pedidos') || [];
    return pedidos.filter(p => {
      const fecha = new Date(p.fecha);
      return fecha >= new Date(fechaInicio) && fecha <= new Date(fechaFin);
    });
  }

  /**
   * Calcular total de un pedido
   */
  calcularTotal(id) {
    const pedido = this.obtener(id);
    if (!pedido) return 0;

    let total = 0;
    (pedido.items || []).forEach(item => {
      total += item.precio * item.cantidad;
    });

    return total;
  }

  /**
   * Obtener reporte de ingresos
   */
  obtenerReporteIngresos(fechaInicio, fechaFin) {
    const pedidosEnRango = this.porFecha(fechaInicio, fechaFin);
    const pedidosEntregados = pedidosEnRango.filter(p => p.estado === 'entregado');

    let ingresoTotal = 0;
    pedidosEntregados.forEach(p => {
      ingresoTotal += this.calcularTotal(p.id);
    });

    return {
      totalPedidos: pedidosEnRango.length,
      pedidosEntregados: pedidosEntregados.length,
      ingresoTotal,
      promedioSinDelivery: pedidosEntregados.length > 0 ? ingresoTotal / pedidosEntregados.length : 0
    };
  }

  /**
   * Buscar pedidos por cliente
   */
  porCliente(clienteId) {
    const pedidos = this.stateManager.get('pedidos') || [];
    return pedidos.filter(p => p.clienteId === clienteId);
  }

  /**
   * Validar pedido
   */
  validar(datos) {
    const errores = [];

    if (!datos.clienteId) {
      errores.push('Cliente requerido');
    }

    if (!Array.isArray(datos.items) || datos.items.length === 0) {
      errores.push('Debe incluir al menos un item');
    }

    datos.items?.forEach((item, i) => {
      if (!item.platoId) {
        errores.push(`Item ${i + 1}: plato requerido`);
      }
      if (item.cantidad <= 0) {
        errores.push(`Item ${i + 1}: cantidad inválida`);
      }
    });

    return {
      valido: errores.length === 0,
      errores
    };
  }
}

// ============================================================================
// INSTANCIA GLOBAL
// ============================================================================

const pedidosModule = new PedidosModule();

// Exponer globalmente
window.pedidosModule = pedidosModule;

console.log('✅ Módulo Pedidos cargado y expuesto globalmente');
