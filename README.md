# 🍳 HIBO Cocina

Sistema de Gestión Integral de Producción y Pedidos para Restaurantes

## 📋 Descripción

HIBO Cocina es una aplicación web completa para la gestión de restaurantes que incluye:

- **Platos**: Gestión del menú y carta del restaurante
- **Ingredientes**: Control de materias primas y productos
- **Escandallos**: Cálculo automático de costes de producción
- **Inventario**: Control de stock y almacén
- **Pedidos**: Gestión de pedidos a proveedores
- **Producción**: Partidas de cocina y trazabilidad
- **Sanidad (APPCC)**: Control de sanidad alimentaria
- **Estadísticas**: Dashboard con métricas y gráficos

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 16+ 
- npm
- (Opcional) Docker y Docker Compose

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/hibo-developer/hibo-cocina.git
cd hibo-cocina

# Instalar dependencias
npm install

# Iniciar el servidor
npm start
```

La aplicación estará disponible en `http://localhost:3000`

### 🐳 Instalación con Docker

#### Opción 1: Desde GHCR (recomendado)
```bash
# Autenticarse en GHCR
echo $GHCR_PAT | docker login ghcr.io -u hibo-developer --password-stdin

# Pull y run
docker pull ghcr.io/hibo-developer/hibo-cocina:latest
docker run -d -p 3000:3000 --name hibo-cocina ghcr.io/hibo-developer/hibo-cocina:latest
```

#### Opción 2: Con Docker Compose (build local)
```bash
# Levantar servicios (app + Redis)
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Parar servicios
docker-compose down
```

## 📁 Estructura del Proyecto

```
hibo-cocina/
├── server.js                 # Servidor Express
├── hibo-cocina.db           # Base de datos SQLite
├── public/                   # Frontend
│   ├── index.html           # HTML principal
│   ├── css/                 # Estilos
│   ├── js/
│   │   ├── services/        # ApiService, StateManager, etc.
│   │   ├── modules/         # Módulos de negocio
│   │   └── app-migrated.js  # Lógica principal refactorizada
│   └── modules/             # Componentes HTML
├── migrations/              # Migraciones de base de datos
└── __tests__/              # Tests unitarios
```

## 🏗️ Arquitectura

### Backend
- **Express.js**: Servidor HTTP
- **SQLite**: Base de datos
- **API RESTful**: Endpoints bajo `/api/*`

### Frontend
- **Vanilla JavaScript**: Sin frameworks
- **Arquitectura Modular**: Separación de responsabilidades
- **SPA**: Single Page Application con navegación dinámica
- **State Management**: Sistema centralizado de estado

### Módulos Principales

1. **ApiService**: Gestión de llamadas HTTP
2. **StateManager**: Estado global de la aplicación
3. **ModalManager**: Gestión de modales dinámicos
4. **NotificationManager**: Sistema de notificaciones
5. **NavigationModule**: Navegación entre secciones
6. **Módulos de Negocio**: platos, ingredientes, escandallos, etc.

## 🔧 Desarrollo

### Variables de Entorno

El servidor admite las siguientes variables de entorno:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor | `3000` |
| `CORS_ORIGIN` | Origen permitido para CORS | `*` |
| `REDIS_ENABLED` | Activar caché Redis | `false` |
| `REDIS_HOST` | Host de Redis | `localhost` |
| `REDIS_PORT` | Puerto de Redis | `6379` |
| `DB_PATH` | Ruta de la base de datos SQLite | `data/hibo-cocina.db` |

**Ejemplo de archivo `.env`:**
```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://midominio.com
REDIS_ENABLED=true
REDIS_HOST=redis
REDIS_PORT=6379
```

### Scripts Disponibles

```bash
npm start          # Iniciar servidor en modo producción
npm run dev        # Iniciar con nodemon (auto-reload)
npm test           # Ejecutar tests
```

### API Endpoints

- `GET /api/platos` - Obtener todos los platos
- `POST /api/platos` - Crear nuevo plato
- `PUT /api/platos/:id` - Actualizar plato
- `DELETE /api/platos/:id` - Eliminar plato

(Similar para ingredientes, escandallos, inventario, pedidos, etc.)

## 🎨 Características

- ✅ Interfaz moderna y responsive
- ✅ Modales dinámicos para CRUD
- ✅ Búsqueda y filtrado en tiempo real
- ✅ Cálculo automático de costes
- ✅ Sistema de notificaciones
- ✅ Validación de formularios
- ✅ Gestión de alérgenos
- ✅ Control de trazabilidad
- ✅ Dashboard con estadísticas

## 📊 Base de Datos

SQLite con las siguientes tablas principales:

- `platos` - Platos del menú
- `ingredientes` - Ingredientes y materias primas
- `escandallos` - Relación ingredientes-platos con cantidades
- `inventario` - Stock de productos
- `pedidos` - Pedidos a proveedores
- `partidas_cocina` - Órdenes de producción
- `sanidad_registros` - Registros de control APPCC

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Propietario - © 2026 HIBO Cocina

## 👨‍💻 Autor

Desarrollado por el equipo de HIBO
