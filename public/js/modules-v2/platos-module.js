/**
 * Platos Module - Versión Refactorizada
 * ====================================
 * 
 * Módulo de gestión de Platos usando:
 * - Componentes base reutilizables
 * - Store centralizado
 * - HttpClient mejorado
 */

/**
 * Platos Module
 */
class PlatosModule {
  /**
   * @param {Store} store
   * @param {HttpClient} http
   */
  constructor(store, http) {
    this.store = store;
    this.http = http;
    this.notification = window.NotificationComponent ? new window.NotificationComponent() : null;
    
    this.init();
  }
  
  init() {
    // Crear tabla de platos
    this.createTable();
    
    // Crear modal de formulario
    this.createModal();
    
    // Crear botones de acción
    this.setupActions();
    
    // Subscribe a cambios en store
    this.setupSubscriptions();
    
    // Cargar datos iniciales
    this.loadPlatos();
  }
  
  /**
   * Crear tabla de platos
   */
  createTable() {
    this.table = new window.TableComponent({
      selector: '[data-section="platos"]',
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'descripcion', label: 'Descripción' },
        { key: 'precio_venta', label: 'Precio Venta', type: 'currency' },
        { key: 'costo_produccion', label: 'Costo', type: 'currency' },
        { key: 'activo', label: 'Estado' }
      ],
      data: [],
      
      onRowClick: (id) => {
        this.selectPlato(id);
      },
      
      onEdit: (id) => {
        this.editPlato(id);
      },
      
      onDelete: (id) => {
        this.deletePlato(id);
      }
    });
  }
  
  /**
   * Crear modal de formulario
   */
  createModal() {
    this.modal = new window.ModalComponent({
      selector: '[data-modal="platos-form"]'
    });
    
    this.form = new window.FormComponent({
      selector: '[data-form="platos"]',
      fields: [
        {
          name: 'nombre',
          label: 'Nombre del Plato',
          type: 'text',
          placeholder: 'Ej: Pizza Margherita',
          required: true
        },
        {
          name: 'descripcion',
          label: 'Descripción',
          type: 'textarea',
          placeholder: 'Descripción del plato',
          required: false
        },
        {
          name: 'precio_venta',
          label: 'Precio de Venta',
          type: 'number',
          placeholder: '0.00',
          required: true
        },
        {
          name: 'activo',
          label: 'Estado',
          type: 'select',
          options: [
            { value: 1, label: 'Activo' },
            { value: 0, label: 'Inactivo' }
          ],
          required: true
        }
      ],
      
      validation: {
        nombre: (value) => {
          if (value && value.length < 3) {
            return 'El nombre debe tener al menos 3 caracteres';
          }
          return null;
        },
        precio_venta: (value) => {
          if (value && value < 0) {
            return 'El precio debe ser mayor a 0';
          }
          return null;
        }
      },
      
      onSubmit: async (values) => {
        await this.savePlato(values);
      },
      
      onCancel: () => {
        this.modal.close();
      }
    });
  }
  
  /**
   * Setup action buttons
   */
  setupActions() {
    const createBtn = document.querySelector('[data-action="crear-plato"]');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showCreateModal());
    }
    
    const searchInput = document.querySelector('[data-action="buscar-platos"]');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterPlatos(e.target.value);
      });
    }
  }
  
  /**
   * Setup subscriptions
   */
  setupSubscriptions() {
    // Subscribe a cambios en platos
    this.store.subscribe('platos', (platos) => {
      this.table.setState({ data: platos });
    });
    
    // Subscribe a cargando
    this.store.subscribe('loading', (loading) => {
      if (loading) {
        // Mostrar spinner
      } else {
        // Ocultar spinner
      }
    });
  }
  
  /**
   * Cargar platos del servidor
   */
  async loadPlatos() {
    try {
      this.store.commit('setLoading', true);
      
      const response = await this.http.get('/platos');
      
      this.store.commit('setPlatos', response.data);
    } catch (error) {
      console.error('Error cargando platos:', error);
      this.notification.error('Error al cargar los platos');
    } finally {
      this.store.commit('setLoading', false);
    }
  }
  
  /**
   * Filtrar platos
   */
  filterPlatos(searchTerm) {
    const allPlatos = this.store.state.platos;
    
    if (!searchTerm) {
      this.table.setState({ data: allPlatos });
      return;
    }
    
    const filtered = allPlatos.filter(plato =>
      plato.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plato.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    this.table.setState({ data: filtered });
  }
  
  /**
   * Mostrar modal de crear
   */
  showCreateModal() {
    this.form.setState({
      values: {
        nombre: '',
        descripcion: '',
        precio_venta: '',
        activo: 1
      },
      errors: {}
    });
    
    this.modal.open({
      title: 'Crear Nuevo Plato'
    });
  }
  
  /**
   * Editar plato
   */
  editPlato(id) {
    const plato = this.store.state.platos.find(p => p.id === parseInt(id));
    
    if (!plato) {
      this.notification.error('Plato no encontrado');
      return;
    }
    
    this.form.setState({
      values: {
        id: plato.id,
        nombre: plato.nombre,
        descripcion: plato.descripcion,
        precio_venta: plato.precio_venta,
        activo: plato.activo ? 1 : 0
      },
      errors: {}
    });
    
    this.modal.open({
      title: `Editar: ${plato.nombre}`
    });
  }
  
  /**
   * Guardar plato
   */
  async savePlato(values) {
    try {
      this.store.commit('setLoading', true);
      
      const isNew = !values.id;
      const method = isNew ? 'post' : 'put';
      const url = isNew ? '/platos' : `/platos/${values.id}`;
      
      await this.http[method](url, values);
      
      // Recargar datos
      await this.loadPlatos();
      
      this.notification.success(
        isNew ? 'Plato creado exitosamente' : 'Plato actualizado exitosamente'
      );
      
      this.modal.close();
    } catch (error) {
      console.error('Error guardando plato:', error);
      this.notification.error('Error al guardar el plato');
    } finally {
      this.store.commit('setLoading', false);
    }
  }
  
  /**
   * Seleccionar plato
   */
  selectPlato(id) {
    const plato = this.store.state.platos.find(p => p.id === parseInt(id));
    
    if (plato) {
      this.store.commit('setSelectedPlato', plato);
      // Mostrar detalles en sidebar, etc.
    }
  }
  
  /**
   * Eliminar plato
   */
  async deletePlato(id) {
    try {
      this.store.commit('setLoading', true);
      
      await this.http.delete(`/platos/${id}`);
      
      // Recargar datos
      await this.loadPlatos();
      
      this.notification.success('Plato eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando plato:', error);
      this.notification.error('Error al eliminar el plato');
    } finally {
      this.store.commit('setLoading', false);
    }
  }
}

/**
 * Uso en app.js:
 * 
 * const store = new window.Store({
 *   state: { platos: [], loading: false, selectedPlato: null },
 *   mutations: {
 *     setPlatos(state, platos) { state.platos = platos; },
 *     setLoading(state, loading) { state.loading = loading; },
 *     setSelectedPlato(state, plato) { state.selectedPlato = plato; }
 *   }
 * });
 * 
 * const http = new window.HttpClient('http://localhost:3000/api');
 * 
 * const platosModule = new window.PlatosModule(store, http);
 */

// Exponer globalmente
window.PlatosModule = PlatosModule;

// También soportar módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PlatosModule };
}
