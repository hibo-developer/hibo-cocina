/**
 * ============================================================================
 * NAVIGATION.JS - Módulo de navegación y secciones
 * ============================================================================
 * 
 * Gestiona la navegación entre secciones de la aplicación
 * 
 */

class NavigationModule {
  constructor() {
    this.state = stateManager;
    this.currentSection = 'dashboard';
  }

  /**
   * Inicializar navegación
   */
  init() {
    this.setupListeners();
  }

  /**
   * Configurar event listeners
   */
  setupListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        this.navigate(section);
      });
    });
  }

  /**
   * Navegar a sección
   */
  navigate(section) {
    console.log(`🔗 Navegando a: ${section}`);
    this.currentSection = section;
    this.state.set('ui.currentSection', section);

    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(s => {
      s.style.display = 'none';
      s.classList.remove('active');
    });

    // Mostrar sección seleccionada
    const sectionElement = document.getElementById(section);
    if (sectionElement) {
      sectionElement.style.display = 'block';
      sectionElement.classList.add('active');
    }

    // Actualizar botones de navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.section === section) {
        btn.classList.add('active');
      }
    });

    // Cargar datos de la sección
    this.cargarSeccion(section);
  }

  /**
   * Cargar datos de la sección
   */
  async cargarSeccion(section) {
    try {
      switch(section) {
        case 'dashboard':
          await this.cargarDashboard();
          break;
        case 'platos':
          await platosModule.cargar();
          this.renderizarPlatos();
          break;
        case 'ingredientes':
          // await ingredientesModule.cargar();
          break;
        case 'escandallos':
          // await escandallosModule.cargar();
          break;
        case 'sanidad':
          if (typeof cargarSanidad === 'function') {
            await cargarSanidad();
          }
          break;
        case 'produccion':
          if (typeof cargarProduccion === 'function') {
            await cargarProduccion();
          }
          break;
        // ... más secciones
      }
    } catch (error) {
      console.error(`Error cargando sección ${section}:`, error);
      notify.error(`Error al cargar ${section}`);
    }
  }

  /**
   * Cargar dashboard
   */
  async cargarDashboard() {
    try {
      const stats = await apiService.get('/platos/estadisticas');
      // Actualizar elementos del dashboard
      console.log('📊 Dashboard cargado', stats);
    } catch (error) {
      console.error('Error en dashboard:', error);
    }
  }

  /**
   * Renderizar tabla de platos
   */
  renderizarPlatos() {
    const platos = stateManager.get('platos');
    const tbody = document.getElementById('platosTableBody');

    if (!tbody) return;

    if (!platos || platos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay platos</td></tr>';
      return;
    }

    tbody.innerHTML = platos.map(plato => `
      <tr>
        <td>${plato.codigo}</td>
        <td>${plato.nombre}</td>
        <td>${plato.grupo_menu || '-'}</td>
        <td>${formatCurrency(plato.coste || 0)}</td>
        <td>
          <button class="btn-icon" onclick="platosModule.obtener(${plato.id})">✏️</button>
          <button class="btn-icon" onclick="platosModule.eliminar(${plato.id})">🗑️</button>
        </td>
      </tr>
    `).join('');
  }
}

// Instancia global
const navigationModule = new NavigationModule();

// Exponer globalmente
window.navigationModule = navigationModule;

console.log('✅ Módulo Navigation cargado y expuesto globalmente');
