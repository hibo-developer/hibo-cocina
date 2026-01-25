/**
 * ============================================================================
 * APP-REFACTORED.JS - Nueva versión simplificada y modular
 * ============================================================================
 * 
 * Este archivo solo gestiona la inicialización de la aplicación.
 * La lógica se ha movido a módulos independientes.
 * 
 * ANTES: app.js con 4729 líneas
 * AHORA: app-refactored.js (base) + módulos especializados
 * 
 * RESULTADO:
 * - Mayor mantenibilidad
 * - Fácil de testear
 * - Mejor rendimiento
 * - Escalable
 * 
 */

class Application {
  constructor() {
    this.initialized = false;
  }

  /**
   * Inicializar aplicación
   */
  async init() {
    console.log('🚀 Inicializando HIBO Cocina...');

    try {
      // 1. Esperar a que el DOM esté listo
      if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
      }

      // 2. Inicializar servicios
      console.log('📦 Inicializando servicios...');
      this.initServices();

      // 3. Inicializar módulos
      console.log('⚙️  Inicializando módulos...');
      this.initModules();

      // 4. Cargar datos iniciales
      console.log('📥 Cargando datos iniciales...');
      await this.loadInitialData();

      // 5. Configurar UI
      console.log('🎨 Configurando interfaz...');
      this.setupUI();

      // 6. Navegar a sección inicial
      navigationModule.navigate('dashboard');

      this.initialized = true;
      console.log('✅ Aplicación inicializada correctamente');

    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
      notify.error('Error al inicializar la aplicación');
    }
  }

  /**
   * Inicializar servicios
   */
  initServices() {
    // Los servicios ya están creados globalmente:
    // - apiService
    // - stateManager
    // - Funciones utilitarias (formatDecimal, etc.)
  }

  /**
   * Inicializar módulos
   */
  initModules() {
    // Inicializar cada módulo
    navigationModule.init();
    
    // Se pueden agregar más módulos según sea necesario:
    // - ingredientesModule.init()
    // - escandallosModule.init()
    // - pedidosModule.init()
  }

  /**
   * Cargar datos iniciales
   */
  async loadInitialData() {
    try {
      // Cargar datos que necesita la app
      await platosModule.cargar();
      notify.success('Datos cargados correctamente');
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  }

  /**
   * Configurar UI
   */
  setupUI() {
    // Manejar modales
    document.querySelectorAll('button[data-action="new"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const entity = btn.dataset.entity;
        this.openNewEntityModal(entity);
      });
    });

    // Listeners globales
    this.setupGlobalListeners();
  }

  /**
   * Abrir modal para nueva entidad
   */
  openNewEntityModal(entity) {
    console.log(`📝 Abriendo modal para crear nuevo ${entity}`);
    
    const campos = this.getCamposPorEntidad(entity);
    modalManager.open(`Nuevo ${entity}`, campos);

    modalManager.setCallback(async (data) => {
      // El callback se ejecutará al enviar el formulario
      console.log(`Guardando ${entity}:`, data);
    });
  }

  /**
   * Obtener campos según tipo de entidad
   */
  getCamposPorEntidad(entity) {
    const campos = {
      plato: [
        { id: 'codigo', nombre: 'codigo', label: 'Código', tipo: 'texto', requerido: true },
        { id: 'nombre', nombre: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true },
        { id: 'grupo_menu', nombre: 'grupo_menu', label: 'Grupo Menú', tipo: 'select', requerido: false,
          opciones: [
            { valor: 'Entrante caliente', label: 'Entrante caliente' },
            { valor: 'Postre', label: 'Postre' },
            { valor: 'Carne', label: 'Carne' }
          ]
        },
        { id: 'coste', nombre: 'coste', label: 'Coste (€)', tipo: 'numero', requerido: false }
      ],
      // ... más entidades
    };

    return campos[entity] || [];
  }

  /**
   * Configurar listeners globales
   */
  setupGlobalListeners() {
    // Cerrar modal al presionar Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modalManager.close();
      }
    });

    // Agregar otros listeners globales necesarios
  }

  /**
   * Obtener estado de la aplicación
   */
  getState() {
    return stateManager.getState();
  }
}

// Instancia global de la aplicación
const app = new Application();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
