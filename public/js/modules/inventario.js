/**
 * ============================================================================
 * INVENTARIO MODULE
 * ============================================================================
 * 
 * Módulo para gestionar inventario (stock, movimientos, alertas)
 * 
 */

class InventarioModule {
  constructor() {
    this.apiService = window.apiService;
    this.stateManager = window.stateManager;
    this.endpoint = '/inventario';
    this.wsClient = null;
    this.wsInitialized = false;
  }

  /**
   * Conectar a WebSocket para recibir actualizaciones en tiempo real
   */
  connectWebSocket(wsClient) {
    if (this.wsInitialized) return;
    
    this.wsClient = wsClient;
    
    // Suscribirse a actualizaciones de inventario
    this.wsClient.on('inventario:update', (data) => {
      console.log('📡 Actualización de inventario recibida:', data);
      this.handleWebSocketUpdate(data);
    });
    
    // Suscribirse a alertas de stock bajo
    this.wsClient.on('alert:low-stock', (data) => {
      console.log('⚠️  Alerta de stock bajo:', data);
      this.handleLowStockAlert(data);
    });
    
    // Suscribirse al canal
    if (this.wsClient.isConnected) {
      this.wsClient.subscribeInventario();
    } else {
      this.wsClient.on('connected', () => {
        this.wsClient.subscribeInventario();
      });
    }
    
    this.wsInitialized = true;
    console.log('✅ WebSocket conectado para Inventario');
  }

  /**
   * Manejar actualizaciones desde WebSocket
   */
  async handleWebSocketUpdate(data) {
    const { action, item } = data;
    
    switch (action) {
      case 'created':
      case 'updated':
      case 'deleted':
        console.log(`📦 Inventario ${action}`);
        await this.cargar();
        break;
      
      case 'low-stock':
        await this.handleLowStockAlert(item);
        break;
    }
  }

  /**
   * Manejar alerta de stock bajo
   */
  async handleLowStockAlert(data) {
    console.warn('⚠️  Stock bajo detectado:', data);
    
    // Recargar inventario
    await this.cargar();
    
    // Si hay un gestor de notificaciones, mostrar alerta
    if (window.notificationManager) {
      window.notificationManager.addNotification({
        type: 'warning',
        title: 'Stock Bajo',
        message: data.mensaje || `Stock bajo en ${data.nombre || 'producto'}`,
        data: data
      });
    }
  }

  async cargar() {
    try {
      console.log('📥 Cargando inventario...');
      const inventario = await this.apiService.get(this.endpoint);
      this.stateManager.set('inventario', inventario);
      console.log(`✅ ${inventario.length} items de inventario cargados`);
      return inventario;
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      throw error;
    }
  }

  obtener(id) {
    const inventario = this.stateManager.get('inventario') || [];
    return inventario.find(i => i.id === id);
  }

  async crearMovimiento(datos) {
    try {
      console.log('📝 Registrando movimiento...', datos);
      const movimiento = await this.apiService.post(`${this.endpoint}/movimientos`, datos);
      await this.cargar();
      return movimiento;
    } catch (error) {
      console.error('Error al crear movimiento:', error);
      throw error;
    }
  }

  async ajustarStock(ingredienteId, cantidad, tipo = 'entrada') {
    return this.crearMovimiento({
      ingredienteId,
      cantidad,
      tipo,
      fecha: new Date().toISOString(),
      motivo: tipo === 'entrada' ? 'Compra' : 'Uso en producción'
    });
  }

  /**
   * Obtener stock disponible
   */
  obtenerStock(ingredienteId) {
    const item = this.obtener(ingredienteId);
    return item ? item.stockActual : 0;
  }

  /**
   * Obtener items con stock bajo
   */
  obtenerAlertasStock(umbral = null) {
    const inventario = this.stateManager.get('inventario') || [];
    return inventario.filter(item => {
      const limite = umbral || item.stockMinimo || 0;
      return item.stockActual <= limite;
    });
  }

  /**
   * Obtener items sin stock
   */
  obtenerAgotados() {
    const inventario = this.stateManager.get('inventario') || [];
    return inventario.filter(item => item.stockActual === 0);
  }

  /**
   * Calcular valor total del inventario
   */
  calcularValorTotal() {
    const inventario = this.stateManager.get('inventario') || [];
    let valorTotal = 0;

    inventario.forEach(item => {
      const ingrediente = this.obtenerIngrediente(item.ingredienteId);
      if (ingrediente) {
        valorTotal += ingrediente.precioUnitario * item.stockActual;
      }
    });

    return valorTotal;
  }

  /**
   * Obtener historial de movimientos
   */
  async obtenerHistorial(ingredienteId, dias = 30) {
    try {
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - dias);

      return await this.apiService.get(
        `${this.endpoint}/movimientos?ingredienteId=${ingredienteId}&desde=${fechaInicio.toISOString()}`
      );
    } catch (error) {
      console.error('Error al obtener historial:', error);
      throw error;
    }
  }

  /**
   * Generar reporte de consumo
   */
  generarReporteConsumo(fechaInicio, fechaFin) {
    // Este método requeriría la API de historial
    return {
      fechaInicio,
      fechaFin,
      // Datos por obtener de la API
    };
  }

  /**
   * Validar movimiento
   */
  validar(datos) {
    const errores = [];

    if (!datos.ingredienteId) {
      errores.push('Ingrediente requerido');
    }

    if (datos.cantidad <= 0) {
      errores.push('Cantidad debe ser mayor a 0');
    }

    if (!['entrada', 'salida'].includes(datos.tipo)) {
      errores.push('Tipo inválido');
    }

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
}

// ============================================================================
// INSTANCIA GLOBAL
// ============================================================================

const inventarioModule = new InventarioModule();

// Exponer globalmente
window.inventarioModule = inventarioModule;

console.log('✅ Módulo Inventario cargado y expuesto globalmente');
