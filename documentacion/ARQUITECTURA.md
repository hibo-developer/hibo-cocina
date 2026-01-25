# 📐 ARQUITECTURA DEL SISTEMA HIBO COCINA

## 🎯 Visión General

HIBO Cocina es una aplicación web de gestión de cocina profesional con arquitectura modular frontend-backend, testing automatizado y documentación completa.

## 🏗️ Estructura de Directorios

```
hibo-cocina/
├── public/                           # Frontend (interfaz de usuario)
│   ├── css/                          # Estilos CSS modulares
│   │   ├── variables.css             # Variables CSS globales
│   │   ├── base.css                  # Reset y estilos base
│   │   ├── buttons.css               # Estilos de botones
│   │   ├── forms.css                 # Estilos de formularios
│   │   ├── tables.css                # Estilos de tablas
│   │   ├── modals.css                # Estilos de modales
│   │   ├── cards.css                 # Estilos de tarjetas
│   │   ├── sections.css              # Estilos de secciones
│   │   ├── navbar.css                # Barra de navegación
│   │   └── footer.css                # Pie de página
│   │
│   ├── js/                           # JavaScript modular
│   │   ├── services/                 # Servicios core
│   │   │   ├── api.js                # Cliente HTTP (ApiService)
│   │   │   ├── state.js              # Gestor de estado (StateManager)
│   │   │   └── utils.js              # Funciones utilitarias
│   │   │
│   │   ├── modules/                  # Módulos de negocio
│   │   │   ├── platos.js             # Gestión de platos
│   │   │   ├── pedidos.js            # Gestión de pedidos
│   │   │   ├── ingredientes.js       # Gestión de ingredientes
│   │   │   ├── escandallos.js        # Cálculo de costes
│   │   │   ├── inventario.js         # Control de stock
│   │   │   ├── sanidad.js            # APPCC y alergenos
│   │   │   ├── produccion.js         # Órdenes de producción
│   │   │   └── navigation.js         # Navegación entre secciones
│   │   │
│   │   ├── ui/                       # Componentes de UI
│   │   │   ├── modals.js             # Gestor de modales (ModalManager)
│   │   │   ├── notifications.js      # Sistema de notificaciones
│   │   │   ├── forms.js              # Validación de formularios
│   │   │   └── crud-handlers.js      # Manejadores CRUD para UI
│   │   │
│   │   ├── app-refactored.js         # Aplicación principal refactorizada
│   │   ├── app-migrated.js           # Funciones migradas de app.js
│   │   ├── compatibility-layer.js    # Capa de compatibilidad
│   │   └── test-integracion.js       # Tests de integración manuales
│   │
│   ├── modules/                      # HTML de módulos
│   │   ├── platos.html               # Sección de platos
│   │   ├── sanidad.html              # Sección de sanidad
│   │   └── ...                       # Otros módulos
│   │
│   ├── components/                   # Componentes HTML reutilizables
│   ├── api-client.js                 # Cliente API para Flask (Fase 3)
│   ├── integracion-flask.js          # Integración con backend Flask
│   ├── app.js                        # Aplicación original (legacy)
│   ├── login.html                    # Página de login
│   └── index.html                    # Página principal
│
├── src/                              # Backend Node.js/Express
│   ├── controllers/                  # Controladores de rutas
│   │   ├── platosController.js
│   │   ├── pedidosController.js
│   │   ├── ingredientesController.js
│   │   ├── escandallosController.js
│   │   ├── inventarioController.js
│   │   ├── sanidadController.js
│   │   ├── produccionController.js
│   │   └── alergenosOficialesController.js
│   │
│   ├── models/                       # Modelos de datos (SQLite)
│   │   ├── Plato.js
│   │   ├── Pedido.js
│   │   ├── Ingrediente.js
│   │   ├── Escandallo.js
│   │   ├── Inventario.js
│   │   ├── Sanidad.js
│   │   ├── Produccion.js
│   │   └── AlergenoOficial.js
│   │
│   ├── routes/                       # Definición de rutas API
│   │   ├── platos.js
│   │   ├── pedidos.js
│   │   ├── ingredientes.js
│   │   ├── escandallos.js
│   │   ├── inventario.js
│   │   ├── sanidad.js
│   │   ├── produccion.js
│   │   ├── alergenosOficiales.js
│   │   └── ...
│   │
│   └── db/                           # Base de datos
│       └── database.js               # Conexión SQLite
│
├── __tests__/                        # Tests automatizados (Jest)
│   ├── server.integration.test.js   # Tests de integración del servidor
│   ├── platos.routes.test.js        # Tests de rutas de platos
│   ├── modules.structure.test.js    # Tests de estructura de módulos
│   └── code.validation.test.js      # Tests de validación de código
│
├── migrations/                       # Migraciones de base de datos
│   ├── 001_estructura_inicial.sql
│   ├── 002_alergenos.sql
│   ├── ...
│   └── 010_alergenos_oficiales.sql
│
├── server.js                         # Servidor Express
├── jest.config.js                    # Configuración de Jest
├── package.json                      # Dependencias y scripts
├── hibo-cocina.db                    # Base de datos SQLite
└── documentacion/                    # Documentación del proyecto
    ├── ARQUITECTURA.md               # Este archivo
    ├── MANUAL_TECNICO.md
    ├── GUIA_USO.txt
    └── ...
```

## 🔧 Componentes Principales

### 1. **Frontend (Navegador)**

#### Servicios Core (`public/js/services/`)

- **ApiService** ([api.js](../public/js/services/api.js))
  - Cliente HTTP centralizado
  - Métodos: `get()`, `post()`, `put()`, `delete()`
  - Manejo de errores
  - Base URL: `/api`

- **StateManager** ([state.js](../public/js/services/state.js))
  - Gestor de estado reactivo
  - Patrón Store (centralizado)
  - Suscripciones a cambios
  - Métodos: `get()`, `set()`, `subscribe()`

- **Utils** ([utils.js](../public/js/services/utils.js))
  - Funciones utilitarias globales
  - Formateo de números/moneda
  - Normalización de texto
  - Paginación
  - Debounce

#### Módulos de Negocio (`public/js/modules/`)

Cada módulo sigue el mismo patrón:

```javascript
class ModuloX {
  constructor() {
    this.apiService = window.apiService;
    this.stateManager = window.stateManager;
    this.endpoint = '/ruta';
  }

  async cargar() { /* Cargar datos desde API */ }
  obtener(id) { /* Obtener por ID del estado */ }
  async crear(datos) { /* Crear nuevo */ }
  async actualizar(id, datos) { /* Actualizar existente */ }
  async eliminar(id) { /* Eliminar */ }
  filtrar(filtros) { /* Filtrar localmente */ }
  validar(datos) { /* Validar datos */ }
}
```

**Módulos disponibles:**
- `platosModule` - Platos y menús
- `pedidosModule` - Pedidos y órdenes
- `ingredientesModule` - Ingredientes y materias primas
- `escandallosModule` - Cálculo de costes y recetas
- `inventarioModule` - Control de stock
- `sanidadModule` - APPCC y alergenos
- `produccionModule` - Órdenes de producción
- `navigationModule` - Navegación entre secciones

#### Componentes UI (`public/js/ui/`)

- **ModalManager** ([modals.js](../public/js/ui/modals.js))
  - Gestor centralizado de modales
  - Renderizado dinámico de formularios
  - Validación integrada
  - Callbacks configurables

- **NotificationManager** ([notifications.js](../public/js/ui/notifications.js))
  - Sistema de notificaciones toast
  - Tipos: success, error, warning, info
  - Auto-desaparición configurable
  - Animaciones CSS

- **Form** ([forms.js](../public/js/ui/forms.js))
  - Gestión de formularios
  - Validación client-side
  - Manejo de errores
  - Serialización de datos

- **CRUD Handlers** ([crud-handlers.js](../public/js/ui/crud-handlers.js))
  - Manejadores de botones de edición/eliminación
  - Conecta UI con módulos de negocio
  - Funciones: `editarPlato()`, `eliminarPlato()`, etc.

### 2. **Backend (Node.js/Express)**

#### Arquitectura MVC

```
Cliente HTTP → Router → Controller → Model → Database
                    ↓
                Response
```

#### Rutas API (`src/routes/`)

Todas las rutas están bajo el prefijo `/api`:

```
GET    /api/platos              # Listar platos
GET    /api/platos/:id          # Obtener plato por ID
POST   /api/platos              # Crear plato
PUT    /api/platos/:id          # Actualizar plato
DELETE /api/platos/:id          # Eliminar plato
GET    /api/platos/estadisticas # Estadísticas

# Similar para: pedidos, ingredientes, escandallos, etc.
```

#### Controladores (`src/controllers/`)

Ejemplo de estructura:

```javascript
// platosController.js
exports.obtenerTodos = async (req, res) => {
  try {
    const platos = await Plato.obtenerTodos();
    res.json({ success: true, data: platos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

#### Modelos (`src/models/`)

Acceso a la base de datos SQLite usando Promises:

```javascript
// Plato.js
class Plato {
  static async obtenerTodos() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM platos', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}
```

### 3. **Base de Datos (SQLite)**

Archivo: `hibo-cocina.db`

#### Tablas Principales

```
platos
├─ id (PRIMARY KEY)
├─ codigo (UNIQUE)
├─ nombre
├─ grupo_menu
├─ coste
├─ peso_raciones
└─ ...

ingredientes
├─ id (PRIMARY KEY)
├─ codigo (UNIQUE)
├─ nombre
├─ familia
├─ coste_unitario
└─ ...

escandallos
├─ id (PRIMARY KEY)
├─ plato_id (FK → platos)
├─ ingrediente_id (FK → ingredientes)
├─ cantidad
├─ unidad
└─ ...

pedidos
├─ id (PRIMARY KEY)
├─ cliente
├─ estado
├─ fecha
└─ ...

inventario
├─ id (PRIMARY KEY)
├─ ingrediente_id (FK → ingredientes)
├─ cantidad_actual
├─ stock_minimo
└─ ...

control_sanidad
├─ id (PRIMARY KEY)
├─ fecha
├─ tipo_control
├─ resultado
└─ ...

partidas_cocina
├─ id (PRIMARY KEY)
├─ nombre
├─ plato_id (FK → platos)
├─ cantidad
├─ estado
└─ ...

alergenos_oficiales
├─ id (PRIMARY KEY)
├─ codigo (UNIQUE)
├─ nombre
├─ icono
├─ palabras_clave
└─ activo
```

## 🔄 Flujo de Datos

### Flujo de Carga de Datos

```
1. Usuario accede a sección "Platos"
   ↓
2. navigationModule.navigate('platos')
   ↓
3. platosModule.cargar()
   ↓
4. apiService.get('/platos')
   ↓
5. Backend: GET /api/platos
   ↓
6. platosController.obtenerTodos()
   ↓
7. Plato.obtenerTodos() → SQLite
   ↓
8. Response JSON → Frontend
   ↓
9. stateManager.set('platos', datos)
   ↓
10. mostrarPlatos() → Renderizar tabla
```

### Flujo de Edición

```
1. Usuario hace clic en "Editar" (botón en tabla)
   ↓
2. editarPlato(id)
   ↓
3. platosModule.obtener(id) → Obtener del estado local
   ↓
4. modalManager.open() → Abrir modal con datos
   ↓
5. Usuario modifica campos y envía
   ↓
6. modalManager.setCallback() → Callback de guardado
   ↓
7. platosModule.actualizar(id, datos)
   ↓
8. apiService.put(`/platos/${id}`, datos)
   ↓
9. Backend: PUT /api/platos/:id
   ↓
10. platosController.actualizar()
   ↓
11. Plato.actualizar() → SQLite UPDATE
   ↓
12. Response JSON → Frontend
   ↓
13. notify.success() → Notificación
   ↓
14. platosModule.cargar() → Recargar datos
   ↓
15. mostrarPlatos() → Actualizar tabla
```

## 🧪 Testing

### Framework: Jest

Configuración en `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: ['**/__tests__/**/*.test.js']
};
```

### Tipos de Tests

1. **Tests de Integración** (`server.integration.test.js`)
   - Verifica que el servidor inicia correctamente
   - Verifica que todos los endpoints están registrados
   - Verifica conexión a base de datos

2. **Tests de Rutas** (`platos.routes.test.js`)
   - Tests de endpoints específicos
   - Verifica GET, POST, PUT, DELETE
   - Verifica respuestas JSON

3. **Tests de Estructura** (`modules.structure.test.js`)
   - Verifica que los módulos JavaScript existen
   - Verifica que exponen métodos requeridos
   - Verifica arquitectura modular

4. **Tests de Validación** (`code.validation.test.js`)
   - Verifica sintaxis JavaScript
   - Verifica que no hay errores obvios

### Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar en modo watch
npm run test:watch
```

## 📦 Dependencias

### Backend (package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",      // Servidor web
    "cors": "^2.8.5",          // CORS
    "sqlite3": "^5.1.6"        // Base de datos
  },
  "devDependencies": {
    "jest": "^29.7.0",         // Testing
    "supertest": "^6.3.3"      // Testing HTTP
  }
}
```

### Frontend

- Vanilla JavaScript (ES6+)
- CSS3 con variables CSS
- Sin frameworks externos (React, Vue, Angular)
- Arquitectura modular propia

## 🚀 Ejecución

### Modo Desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor
npm start
# o
node server.js

# 3. Abrir navegador
http://localhost:3000
```

### Modo Producción

```bash
# 1. Ejecutar tests
npm test

# 2. Configurar puerto (opcional)
PORT=8080 node server.js

# 3. Usar PM2 para producción
pm2 start server.js --name hibo-cocina
pm2 logs hibo-cocina
pm2 restart hibo-cocina
```

## 🔐 Seguridad

### Actualmente Implementado

- Validación de datos en backend
- Sanitización de inputs SQL (uso de parámetros)
- CORS configurado
- Headers de seguridad básicos

### Pendiente (Fase 3 - Flask)

- Autenticación JWT
- Roles y permisos
- Rate limiting
- Logging de auditoría
- Encriptación de datos sensibles

## 📊 Métricas del Proyecto

### Código

- **Líneas de código total:** ~15,000
- **Archivos JavaScript:** 30+
- **Archivos CSS:** 13
- **Componentes HTML:** 8
- **Rutas API:** 60+
- **Tests automatizados:** 11

### Cobertura de Tests

```
Statements   : 65%
Branches     : 55%
Functions    : 60%
Lines        : 65%
```

## 🔧 Herramientas de Desarrollo

- **Editor:** Visual Studio Code
- **Control de versiones:** Git
- **Testing:** Jest + Supertest
- **Debugging:** Chrome DevTools
- **Base de datos:** DB Browser for SQLite
- **API Testing:** Thunder Client / Postman

## 📚 Documentación Adicional

- [MANUAL_TECNICO.md](MANUAL_TECNICO.md) - Documentación técnica detallada
- [GUIA_USO.txt](../GUIA_USO.txt) - Guía de usuario
- [GUIA_FASE3.md](../GUIA_FASE3.md) - Integración con Flask
- [COMPLETADO_EXITOSAMENTE.md](../COMPLETADO_EXITOSAMENTE.md) - Resumen de logros
- [INDICE_DOCUMENTACION.md](../INDICE_DOCUMENTACION.md) - Índice completo

## 🎯 Próximos Pasos

### Fase 3 - Integración Flask

1. Backend Flask con autenticación
2. API REST con JWT
3. Base de datos PostgreSQL
4. Deploy en servidor de producción
5. Documentación Swagger/OpenAPI

### Mejoras Futuras

- [ ] Progressive Web App (PWA)
- [ ] Modo offline con Service Workers
- [ ] Exportación a Excel/PDF
- [ ] Gráficos y dashboards avanzados
- [ ] Notificaciones push
- [ ] Multi-idioma (i18n)
- [ ] Tema oscuro

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Convenciones de Commits

Seguimos Conventional Commits:

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formateo de código
refactor: refactorización
test: agregar/modificar tests
chore: tareas de mantenimiento
```

## 📞 Soporte

Para dudas o problemas:
- Crear un Issue en GitHub
- Consultar la documentación
- Revisar los tests como ejemplos

---

**Última actualización:** 2026-01-25
**Versión:** 1.0.0
**Autor:** Equipo HIBO Cocina
