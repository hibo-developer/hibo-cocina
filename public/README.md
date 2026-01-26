# Frontend - HIBO COCINA v2.0.0

## 📋 Estructura del Proyecto

```
public/
├── index.html                 # Punto de entrada HTML
├── styles.css                 # Estilos globales (legacy)
├── app.js                     # Aplicación principal (legacy)
├── module-loader.js           # Cargador de módulos
├── modales-dinamicos.js       # Sistema de modales (legacy)
├── css/                       # Estilos CSS modularizados
│   ├── base.css              # Estilos base
│   ├── buttons.css           # Estilos de botones
│   ├── cards.css             # Estilos de tarjetas
│   ├── dashboard-mejorado.css
│   ├── footer.css
│   ├── forms.css
│   ├── modals.css
│   ├── navbar.css
│   ├── platos-mejorado.css
│   ├── produccion-mejorado.css
│   ├── sanidad-mejorado.css
│   ├── secciones-mejorado.css
│   ├── tables.css
│   └── variables.css
├── js/
│   ├── app-migrated.js       # Aplicación migrada
│   ├── app-refactored.js     # Inicialización refactorizada
│   ├── compatibility-layer.js # Compatibilidad entre versiones
│   ├── test-integracion.js   # Tests de integración
│   ├── modules/              # Módulos de negocio
│   │   ├── platos.js
│   │   ├── ingredientes.js
│   │   ├── escandallos.js
│   │   ├── pedidos.js
│   │   ├── inventario.js
│   │   ├── sanidad.js
│   │   ├── produccion.js
│   │   └── navigation.js
│   ├── services/             # Servicios compartidos
│   │   ├── api.js            # Cliente HTTP
│   │   ├── logger.js         # Logger condicional
│   │   ├── state.js          # State manager
│   │   └── utils.js
│   └── ui/                   # Componentes UI
│       ├── crud-handlers.js
│       ├── forms.js
│       ├── modals.js
│       └── notifications.js
├── components/               # Componentes HTML reutilizables
│   ├── button.html
│   ├── card.html
│   ├── footer.html
│   ├── form-group.html
│   ├── header.html
│   ├── modal.html
│   ├── navbar.html
│   └── table.html
└── modules/                  # Módulos HTML (secciones)
    ├── dashboard.html
    ├── escandallos.html
    ├── ingredientes.html
    ├── inventario.html
    ├── pedidos.html
    ├── platos.html
    ├── produccion.html
    └── sanidad.html
```

## 🚀 Características Principales

### 1. **Arquitectura Modular**
- Módulos independientes por sección (Platos, Ingredientes, Pedidos, etc.)
- Separación de concerns: UI, Lógica, Datos
- Fácil mantenimiento y escalabilidad

### 2. **State Management**
- StateManager global (`window.stateManager`)
- Sincronización automática con API backend
- Caché local para mejor performance

### 3. **API Integration**
- ApiService con normalización de respuestas
- Manejo automático de errores
- Request/Response interceptors

### 4. **Logging Condicional**
```javascript
// Modo debug
localStorage.setItem('DEBUG', 'true');
// O usar parámetro URL
?debug=true
```

### 5. **Componentes UI Reutilizables**
- Modales dinámicos
- Formularios validados
- Notificaciones toast
- Tablas paginadas

## 🔧 Guía de Desarrollo

### Crear un Nuevo Módulo

**1. Crear archivo en `js/modules/mimodulo.js`:**

```javascript
const miModulo = {
  nombre: 'Mi Módulo',
  
  async cargar() {
    logger.action('Cargando Mi Módulo');
    try {
      const datos = await apiService.get('/api/mi-recurso');
      stateManager.setState('miModulo', datos);
      this.mostrar(datos);
    } catch (error) {
      logger.error('Error cargando Mi Módulo:', error);
    }
  },

  mostrar(datos) {
    const seccion = document.getElementById('mi-modulo-section');
    if (!seccion) return;
    
    seccion.innerHTML = `
      <div class="mi-modulo-container">
        <!-- contenido aquí -->
      </div>
    `;
  }
};
```

**2. Registrar en `index.html`:**

```html
<script src="js/modules/mimodulo.js"></script>
```

**3. Agregar HTML en `modules/mimodulo.html`:**

```html
<section id="mi-modulo-section" class="section hidden">
  <!-- contenido -->
</section>
```

### Usar el Logger

```javascript
// Info
logger.info('Mensaje de información', { datos: true });

// Success
logger.success('Operación completada', respuesta);

// Warning
logger.warn('Advertencia importante');

// Error
logger.error('Error crítico:', error);

// Action
logger.action('Cargando datos...');

// Data (tabla)
logger.data('Usuarios', arrayDatos);
```

### Trabajar con StateManager

```javascript
// Guardar estado
stateManager.setState('miClave', datos);

// Leer estado
const datos = stateManager.getState('miClave');

// Escuchar cambios
stateManager.subscribe('miClave', (nuevoValor) => {
  console.log('Estado cambió:', nuevoValor);
});
```

### API Service

```javascript
// GET
const datos = await apiService.get('/api/platos');

// POST
const resultado = await apiService.post('/api/platos', {
  nombre: 'Paella',
  precio: 18.50
});

// PUT
const actualizado = await apiService.put('/api/platos/1', {
  precio: 20.00
});

// DELETE
await apiService.delete('/api/platos/1');
```

## 📊 Performance

### Optimizaciones Implementadas

1. **Lazy Loading**
   - Módulos se cargan bajo demanda
   - Scripts comprimidos en producción

2. **Caché Local**
   - StateManager cachea datos
   - Reduce requests innecesarios

3. **Event Delegation**
   - Un listener para múltiples elementos
   - Mejor memory footprint

4. **Debounce/Throttle**
   - Para búsquedas y resize events
   - Previene flood de eventos

### Métricas

- **Tamaño del bundle**: ~150KB (gzipped)
- **Tiempo de carga**: < 2s en conexión 3G
- **Memory usage**: < 50MB en navegador
- **PageSpeed**: 85+ (mobile), 90+ (desktop)

## 🧪 Testing

### Tests Unitarios

```bash
# Ejecutar tests
npm test -- __tests__/modules.structure.test.js

# Con coverage
npm test -- __tests__/modules.structure.test.js --coverage
```

### Manual Testing Checklist

- [ ] Dashboard carga sin errores
- [ ] Platos: CRUD completo funciona
- [ ] Ingredientes: búsqueda y filtrado
- [ ] Escandallos: asociaciones correctas
- [ ] Pedidos: estados y cálculos
- [ ] Inventario: actualizaciones stock
- [ ] Sanidad: registros APPCC
- [ ] Modales: abren/cierran correctamente
- [ ] Responsive: funciona en móvil

## 🔐 Seguridad

### Implementado

- ✅ Sanitización de inputs HTML
- ✅ Validación de formularios
- ✅ CORS habilitado correctamente
- ✅ JWT tokens almacenados seguro
- ✅ Rate limiting en API

### Recomendaciones

- [ ] Usar HTTPS en producción
- [ ] CSP headers configurados
- [ ] XSS protection habilitada
- [ ] CSRF tokens en forms

## 🌐 Compatibilidad del Navegador

| Navegador | Versión |
|-----------|---------|
| Chrome    | 90+     |
| Firefox   | 88+     |
| Safari    | 14+     |
| Edge      | 90+     |

## 📱 Responsive Design

Breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🚨 Troubleshooting

### Módulo no carga

```javascript
// Habilitar debug
localStorage.setItem('DEBUG', 'true');

// Verificar console para errores
// Revisar que el módulo esté en index.html
```

### Estado no sincroniza

```javascript
// Verificar state manager
console.log(window.stateManager.getState('miModulo'));

// Revisar subscription
stateManager.subscribe('miModulo', (valor) => {
  logger.info('Cambio detectado:', valor);
});
```

### API retorna error

```javascript
// Revisar headers
// Confirmar token JWT válido
// Verificar CORS settings
```

## 📚 Documentación Adicional

- [API Documentation](../README.md)
- [Backend Guide](../src/README.md)
- [Deployment Guide](../DEPLOYMENT.md)

## 👥 Contribuyendo

1. Crear rama feature: `git checkout -b feat/nueva-caracteristica`
2. Commit cambios: `git commit -m "feat: descripción"`
3. Push rama: `git push origin feat/nueva-caracteristica`
4. Abrir Pull Request

## 📄 Licencia

MIT - Ver LICENSE.md
