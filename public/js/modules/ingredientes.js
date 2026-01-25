/**
 * ============================================================================
 * INGREDIENTES MODULE
 * ============================================================================
 * 
 * Módulo para gestionar ingredientes (CRUD, búsqueda, filtros)
 * 
 * USO:
 *   const ingredientesModule = new IngredientesModule();
 *   await ingredientesModule.cargar();
 *   const items = stateManager.get('ingredientes');
 * 
 */

class IngredientesModule {
  constructor() {
    this.apiService = window.apiService;
    this.stateManager = window.stateManager;
    this.endpoint = '/ingredientes';
  }

  // ========================================================================
  // OPERACIONES BÁSICAS (CRUD)
  // ========================================================================

  /**
   * Cargar todos los ingredientes desde la API
   */
  async cargar() {
    try {
      console.log('📥 Cargando ingredientes...');
      const ingredientes = await this.apiService.get(this.endpoint);
      this.stateManager.set('ingredientes', ingredientes);
      console.log(`✅ ${ingredientes.length} ingredientes cargados`);
      return ingredientes;
    } catch (error) {
      console.error('Error al cargar ingredientes:', error);
      throw error;
    }
  }

  /**
   * Obtener un ingrediente por ID
   */
  obtener(id) {
    const ingredientes = this.stateManager.get('ingredientes') || [];
    return ingredientes.find(i => i.id === id);
  }

  /**
   * Crear nuevo ingrediente
   */
  async crear(datos) {
    try {
      console.log('➕ Creando ingrediente...', datos);
      const nuevoIngrediente = await this.apiService.post(this.endpoint, datos);
      await this.cargar(); // Recargar lista
      return nuevoIngrediente;
    } catch (error) {
      console.error('Error al crear ingrediente:', error);
      throw error;
    }
  }

  /**
   * Actualizar ingrediente existente
   */
  async actualizar(id, datos) {
    try {
      console.log(`✏️  Actualizando ingrediente ${id}...`, datos);
      const actualizado = await this.apiService.put(`${this.endpoint}/${id}`, datos);
      await this.cargar(); // Recargar lista
      return actualizado;
    } catch (error) {
      console.error('Error al actualizar ingrediente:', error);
      throw error;
    }
  }

  /**
   * Eliminar ingrediente
   */
  async eliminar(id) {
    try {
      console.log(`🗑️  Eliminando ingrediente ${id}...`);
      await this.apiService.delete(`${this.endpoint}/${id}`);
      await this.cargar(); // Recargar lista
      console.log('✅ Ingrediente eliminado');
    } catch (error) {
      console.error('Error al eliminar ingrediente:', error);
      throw error;
    }
  }

  // ========================================================================
  // OPERACIONES AVANZADAS
  // ========================================================================

  /**
   * Filtrar ingredientes por criterios
   */
  filtrar(filtros) {
    const ingredientes = this.stateManager.get('ingredientes') || [];
    let resultados = ingredientes;

    if (filtros.nombre) {
      resultados = resultados.filter(i =>
        i.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())
      );
    }

    if (filtros.tipo) {
      resultados = resultados.filter(i => i.tipo === filtros.tipo);
    }

    if (filtros.unidad) {
      resultados = resultados.filter(i => i.unidad === filtros.unidad);
    }

    if (filtros.precioMin !== undefined && filtros.precioMax !== undefined) {
      resultados = resultados.filter(i =>
        i.precioUnitario >= filtros.precioMin && i.precioUnitario <= filtros.precioMax
      );
    }

    return resultados;
  }

  /**
   * Buscar ingredientes por texto
   */
  buscar(texto) {
    const ingredientes = this.stateManager.get('ingredientes') || [];
    return ingredientes.filter(i =>
      i.nombre.toLowerCase().includes(texto.toLowerCase()) ||
      (i.codigo && i.codigo.toLowerCase().includes(texto.toLowerCase()))
    );
  }

  /**
   * Obtener ingredientes por tipo
   */
  porTipo(tipo) {
    const ingredientes = this.stateManager.get('ingredientes') || [];
    return ingredientes.filter(i => i.tipo === tipo);
  }

  /**
   * Obtener tipos únicos de ingredientes
   */
  obtenerTipos() {
    const ingredientes = this.stateManager.get('ingredientes') || [];
    return [...new Set(ingredientes.map(i => i.tipo))];
  }

  /**
   * Calcular costo total de una lista de ingredientes
   */
  calcularCosto(ingredientesUsados) {
    let costoTotal = 0;
    ingredientesUsados.forEach(item => {
      const ingrediente = this.obtener(item.ingredienteId);
      if (ingrediente) {
        costoTotal += ingrediente.precioUnitario * item.cantidad;
      }
    });
    return costoTotal;
  }

  /**
   * Validar ingrediente antes de guardar
   */
  validar(datos) {
    const errores = [];

    if (!datos.nombre || datos.nombre.trim() === '') {
      errores.push('El nombre es obligatorio');
    }

    if (!datos.tipo) {
      errores.push('El tipo es obligatorio');
    }

    if (!datos.unidad) {
      errores.push('La unidad es obligatoria');
    }

    if (datos.precioUnitario === undefined || datos.precioUnitario < 0) {
      errores.push('El precio debe ser mayor a 0');
    }

    if (datos.stock === undefined || datos.stock < 0) {
      errores.push('El stock no puede ser negativo');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Paginar ingredientes
   */
  paginar(pagina = 1, itemsPorPagina = 10) {
    const ingredientes = this.stateManager.get('ingredientes') || [];
    const inicio = (pagina - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;

    return {
      datos: ingredientes.slice(inicio, fin),
      total: ingredientes.length,
      paginas: Math.ceil(ingredientes.length / itemsPorPagina),
      paginaActual: pagina
    };
  }
}

// ============================================================================
// INSTANCIA GLOBAL
// ============================================================================

const ingredientesModule = new IngredientesModule();

// Exponer globalmente
window.ingredientesModule = ingredientesModule;

console.log('✅ Módulo Ingredientes cargado y expuesto globalmente');
