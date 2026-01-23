# HIBO COCINA - Sistema de Gestión Integral de Cocina y Catering

Una aplicación completa con **Node.js + Express + SQLite + JavaScript** para gestionar la producción de comidas en cocinas profesionales.

## 📋 Características

### Módulos Principales

1. **Gestión de Platos** (1639+ artículos)
   - Catálogo completo de platos con costes
   - Clasificación por grupos menú
   - Control de stock activo
   - Información nutricional y de preparación

2. **Gestión de Pedidos**
   - Creación y seguimiento de pedidos
   - Estados: Pendiente, En Producción, Completado, Cancelado
   - Cálculo automático de costes
   - Historial completo

3. **Escandallos** (Recetas)
   - Detalles de ingredientes por plato
   - Cálculo de costes por ración
   - Control de porciones

4. **Producción**
   - Planificación por partidas de cocina
   - Asignación de envases
   - Trazabilidad de producción

5. **Envases** (5 tipos)
   - Cubetas
   - Barqueta GN 100, 60, 30
   - Mono
   - Gestión de costes y capacidades

6. **Etiquetas y Trazabilidad**
   - 2130+ registros de ingredientes
   - Control de pérdidas
   - Generación de etiquetas

7. **Estadísticas y Reportes**
   - Análisis por grupo de menú
   - Costes promedio
   - Seguimiento de pedidos
   - Métricas de producción

## 🚀 Instalación y Uso

### 1. Instalar dependencias
```bash
npm install
```

### 2. Inicializar base de datos con datos de ejemplo
```bash
npm run build
```

### 3. Iniciar servidor
```bash
npm start
```

O para desarrollo con reinicio automático:
```bash
npm run dev
```

### 4. Acceder a la aplicación
- **Interfaz web:** http://localhost:3000
- **API:** http://localhost:3000/api

## 📚 API Endpoints

### Platos
```
GET    /api/platos                 # Obtener todos los platos
GET    /api/platos/:codigo         # Obtener plato por código
GET    /api/platos/estadisticas    # Estadísticas por grupo
POST   /api/platos                 # Crear nuevo plato
PUT    /api/platos/:id             # Actualizar plato
DELETE /api/platos/:id             # Eliminar plato
```

### Pedidos
```
GET    /api/pedidos                # Obtener todos los pedidos
GET    /api/pedidos/:id            # Obtener pedido con detalles
GET    /api/pedidos/estadisticas   # Estadísticas de pedidos
POST   /api/pedidos                # Crear nuevo pedido
PUT    /api/pedidos/:id            # Actualizar pedido
DELETE /api/pedidos/:id            # Eliminar pedido
```

### Sistema
```
GET    /api/health                 # Verificar estado del servidor
```

## 📊 Estructura de Base de Datos

### Tablas Principales
- `platos` - Catálogo de platos
- `ingredientes` - Base de ingredientes
- `escandallos` - Relación plato-ingrediente
- `pedidos` - Gestión de pedidos
- `lineas_pedido` - Detalles de pedidos
- `produccion` - Seguimiento de producción
- `envases` - Tipos de empaque
- `etiquetas` - Trazabilidad
- `partidas_cocina` - Secciones de cocina
- `salida_mercancias` - Control de salidas

## 🎨 Interfaz de Usuario

### Secciones
1. **Dashboard** - Métricas principales y KPIs
2. **Platos** - Catálogo completo con búsqueda y filtros
3. **Pedidos** - Gestión de pedidos con estados
4. **Producción** - Planificación y seguimiento
5. **Estadísticas** - Reportes y análisis

### Características UI
- Diseño responsive (mobile-friendly)
- Búsqueda en tiempo real
- Filtros avanzados
- Modal para crear/editar
- Notificaciones de éxito/error
- Estados visuales con badges

## 📁 Estructura del Proyecto

```
hibo-cocina/
├── src/
│   ├── db/
│   │   ├── database.js          # Conexión SQLite
│   │   └── schema.js            # Creación de tablas
│   ├── models/
│   │   ├── Plato.js            # Modelo de platos
│   │   └── Pedido.js           # Modelo de pedidos
│   ├── controllers/
│   │   ├── platosController.js
│   │   └── pedidosController.js
│   ├── routes/
│   │   ├── platos.js
│   │   └── pedidos.js
│   └── utils/
│       └── importarDatos.js    # Importación desde Excel
├── public/
│   ├── index.html              # Interfaz principal
│   ├── app.js                  # Lógica de cliente
│   └── styles.css              # Estilos
├── scripts/
│   └── inicializar.js          # Script de inicialización
├── data/                        # Base de datos SQLite
├── server.js                    # Servidor principal
├── package.json
└── README.md
```

## 🔧 Tecnologías Utilizadas

- **Backend:** Node.js, Express.js
- **Base de Datos:** SQLite3
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Procesamiento:** XLSX (lectura de Excel)
- **Utilerías:** Moment.js (fechas), CORS

## 📈 Casos de Uso

### Para Gestores
- Ver KPIs principales en el dashboard
- Acceder a estadísticas por grupo
- Monitorear costes promedio

### Para Cocina
- Ver platos a producir
- Conocer ingredientes por plato
- Seguimiento de partidas

### Para Administración
- Crear y gestionar pedidos
- Asignar envases
- Generar etiquetas
- Exportar reportes

## 🔐 Características de Seguridad

- Validación de entrada en API
- Manejo de errores robusto
- Confirmación en operaciones críticas
- Logs de operaciones

## 📝 Próximas Mejoras

- [ ] Autenticación y roles de usuario
- [ ] Exportación a PDF/Excel
- [ ] Cálculo automático de costes
- [ ] Integración de proveedores
- [ ] Notificaciones en tiempo real
- [ ] Gráficos estadísticos avanzados
- [ ] API de mobile
- [ ] Backup automático

## 📞 Soporte

Para reportar problemas o sugerencias, contactar al equipo de desarrollo.

---

**HIBO COCINA v1.0.0** - 2026 | Sistema de gestión profesional para cocinas
