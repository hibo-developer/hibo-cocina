// Módulo para cargar secciones HTML dinámicamente
const ModuleLoader = {
  cache: {},
  
  async loadModule(moduleName) {
    // Si ya está en caché, retornar de inmediato
    if (this.cache[moduleName]) {
      return this.cache[moduleName];
    }
    
    try {
      const response = await fetch(`/modules/${moduleName}.html`);
      if (!response.ok) throw new Error(`No se pudo cargar el módulo ${moduleName}`);
      
      const html = await response.text();
      this.cache[moduleName] = html;
      return html;
    } catch (error) {
      console.error(`Error cargando módulo ${moduleName}:`, error);
      return `<div class="error">Error al cargar ${moduleName}</div>`;
    }
  },
  
  async loadAndInsert(moduleName, containerId) {
    const html = await this.loadModule(moduleName);
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = html;
    }
  },
  
  async loadAllModules() {
    const modules = [
      'dashboard',
      'platos',
      'ingredientes',
      'escandallos',
      'inventario',
      'pedidos',
      'produccion'
    ];
    
    const container = document.getElementById('sections-container');
    if (!container) return;
    
    // Cargar todos los módulos en paralelo
    const htmlPromises = modules.map(mod => this.loadModule(mod));
    const htmlResults = await Promise.all(htmlPromises);
    
    // Insertar todos los módulos
    container.innerHTML = htmlResults.join('');
    
    console.log('✅ Todos los módulos cargados');
  }
};

// Auto-cargar módulos al cargar la página
window.addEventListener('DOMContentLoaded', async () => {
  await ModuleLoader.loadAllModules();
  // Inicializar la aplicación después de cargar los módulos
  if (typeof inicializarApp === 'function') {
    inicializarApp();
  }
});
