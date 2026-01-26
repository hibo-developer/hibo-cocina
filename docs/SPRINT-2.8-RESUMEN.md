# 📋 Sprint 2.8 - Expansión WebSocket y Persistencia de Notificaciones

## 📅 Información del Sprint

- **Sprint**: 2.8
- **Objetivo**: Expandir sistema de notificaciones en tiempo real a todos los módulos + añadir persistencia en base de datos
- **Duración**: 1 día
- **Dependencias**: Sprint 2.7 (Sistema WebSocket base)

---

## 🎯 Objetivos Completados

### ✅ Backend - Integración WebSocket en Módulos

1. **Módulo Ingredientes**
   - POST/PUT/DELETE emit `ingredientes:update`
   - Notificaciones en tiempo real de cambios
   - Integrado en `src/routes/ingredientes.js`

2. **Módulo Inventario**
   - POST/PUT/DELETE emit `inventario:update`
   - Alertas automáticas de stock bajo
   - Detección inteligente: `cantidad_actual < cantidad_minima`
   - Evento especial `alert:low-stock` con mensaje personalizado
   - Integrado en `src/routes/inventario.js`

3. **Módulo Pedidos**
   - POST/PUT/DELETE emit `pedidos:update`
   - Notificaciones personales por usuario
   - Mensajes personalizados según estado:
     - ✅ Creado → "Tu pedido ha sido creado"
     - 📋 Confirmado → "ha sido confirmado"
     - 👨‍🍳 En preparación → "está en preparación"
     - ✅ Listo → "está listo para recoger"
     - 🚚 Entregado → "ha sido entregado"
     - ❌ Cancelado → "ha sido cancelado"
   - Integrado en `src/routes/pedidos.js`

### ✅ Backend - Persistencia de Notificaciones

4. **Schema de Base de Datos** (`migrations/011_notificaciones.sql`)
   ```sql
   CREATE TABLE notificaciones (
     id INTEGER PRIMARY KEY,
     usuario_id INTEGER NOT NULL,
     tipo VARCHAR(20) NOT NULL,
     titulo VARCHAR(100) NOT NULL,
     mensaje TEXT NOT NULL,
     leida BOOLEAN DEFAULT 0,
     datos JSON,
     fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
     fecha_lectura DATETIME,
     FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
   )

   CREATE TABLE notificaciones_preferencias (
     usuario_id INTEGER PRIMARY KEY,
     recibir_platos BOOLEAN DEFAULT 1,
     recibir_ingredientes BOOLEAN DEFAULT 1,
     recibir_inventario BOOLEAN DEFAULT 1,
     recibir_pedidos BOOLEAN DEFAULT 1,
     recibir_stock_bajo BOOLEAN DEFAULT 1,
     recibir_alertas BOOLEAN DEFAULT 1,
     silencio_inicio TIME,
     silencio_fin TIME
   )
   ```

5. **Modelo Notificacion** (`src/models/Notificacion.js` - 370+ líneas)
   - **CRUD Completo**:
     - `crear(notificacionData)`
     - `obtenerPorId(id)`
     - `obtenerPorUsuario(usuario_id, opciones)` con filtros
     - `eliminar(id)`
   
   - **Gestión de Estado**:
     - `contarNoLeidas(usuario_id)`
     - `marcarComoLeida(id)`
     - `marcarTodasComoLeidas(usuario_id)`
   
   - **Mantenimiento**:
     - `limpiarLeidas(usuario_id, diasAntiguedad)` - Elimina notificaciones antiguas
   
   - **Analytics**:
     - `obtenerEstadisticas(usuario_id)` - Totales por tipo
   
   - **Preferencias**:
     - `obtenerPreferencias(usuario_id)`
     - `crearPreferenciasDefault(usuario_id)`
     - `actualizarPreferencias(usuario_id, preferencias)`
     - `debeRecibirNotificacion(usuario_id, tipo)` - Verifica preferencias + horarios

6. **WebSocket Config Actualizado** (`src/config/websocket.js`)
   - `emitNotification()` → Ahora async, persiste en BD
   - `getPendingNotifications()` → Consulta BD en lugar de memoria
   - `markNotificationAsRead()` → Actualiza BD
   - Validación de preferencias antes de enviar
   - Respeto de horarios de silencio

### ✅ Backend - API REST de Notificaciones

7. **Controller** (`src/controllers/notificacionesController.js` - 330+ líneas)
   - 10 endpoints implementados
   - Manejo de errores completo
   - Validaciones de entrada
   - Respuestas consistentes

8. **Routes** (`src/routes/notificaciones.js` - 265+ líneas)
   - **GET** `/api/notificaciones` - Lista con filtros (leida, tipo, limite, offset)
   - **GET** `/api/notificaciones/no-leidas` - Solo no leídas
   - **GET** `/api/notificaciones/contador` - Count de no leídas
   - **GET** `/api/notificaciones/estadisticas` - Analytics por tipo
   - **GET** `/api/notificaciones/preferencias` - Configuración del usuario
   - **PUT** `/api/notificaciones/preferencias` - Actualizar preferencias
   - **PATCH** `/api/notificaciones/:id/marcar-leida` - Marcar como leída
   - **POST** `/api/notificaciones/marcar-todas-leidas` - Batch update
   - **POST** `/api/notificaciones/limpiar` - Eliminar leídas antiguas
   - **DELETE** `/api/notificaciones/:id` - Eliminar una notificación
   - Documentación Swagger completa

### ✅ Frontend - Integración WebSocket

9. **Módulos Actualizados**
   - `public/js/modules/platos.js`
   - `public/js/modules/ingredientes.js`
   - `public/js/modules/inventario.js`
   - `public/js/modules/pedidos.js`

10. **Nuevos Métodos en Módulos**
    ```javascript
    connectWebSocket(wsClient) {
      // Conecta el módulo al WebSocket
      // Suscribe a eventos específicos
      // Maneja reconexión automática
    }

    handleWebSocketUpdate(data) {
      // Procesa actualizaciones en tiempo real
      // Recarga datos automáticamente
      // Actualiza UI
    }
    ```

11. **Eventos Específicos por Módulo**
    - **Platos**: `platos:update` (created/updated/deleted)
    - **Ingredientes**: `ingredientes:update` (created/updated/deleted)
    - **Inventario**: 
      - `inventario:update` (cambios generales)
      - `alert:low-stock` (alertas de stock bajo)
    - **Pedidos**:
      - `pedidos:update` (cambios generales)
      - `pedidos:personal-update` (notificaciones personales al usuario)

12. **Inicialización Automática** (`public/index.html`)
    ```javascript
    // Auto-conecta todos los módulos al WebSocket
    document.addEventListener('DOMContentLoaded', function() {
      window.wsClient = new WebSocketClient(token);
      window.notificationManager = new NotificationManager(wsClient);
      window.notificationPanel = new NotificationPanel(notificationManager);
      
      // Conectar módulos
      ingredientesModule.connectWebSocket(wsClient);
      inventarioModule.connectWebSocket(wsClient);
      pedidosModule.connectWebSocket(wsClient);
      platosModule.connectWebSocket(wsClient);
    });
    ```

---

## 🔧 Arquitectura

### Flujo de Notificaciones (Backend → Frontend)

```
1. Usuario hace cambio (POST/PUT/DELETE)
   ↓
2. Route handler procesa la request
   ↓
3. Se ejecuta acción en BD
   ↓
4. Route emite evento WebSocket
   emitIngredientesUpdate(app, data, 'created')
   ↓
5. websocket-helper.js obtiene io
   ↓
6. src/config/websocket.js valida preferencias
   ↓
7. Notificacion.debeRecibirNotificacion()
   - Verifica horario de silencio
   - Verifica preferencias del usuario
   ↓
8. Si permitido: Notificacion.crear()
   - Guarda en BD
   ↓
9. io.to('module:ingredientes').emit()
   - Broadcast a clientes suscritos
   ↓
10. Frontend WebSocketClient recibe evento
    ↓
11. Módulo.handleWebSocketUpdate() procesa
    ↓
12. Módulo.cargar() recarga datos
    ↓
13. NotificationManager muestra toast
    ↓
14. UI se actualiza automáticamente
```

### Estructura de Datos

**Notificación Base**:
```json
{
  "id": 1,
  "usuario_id": 5,
  "tipo": "ingrediente",
  "titulo": "Ingrediente Actualizado",
  "mensaje": "Tomate ha sido actualizado",
  "leida": false,
  "datos": {
    "action": "updated",
    "ingrediente": { "id": 10, "nombre": "Tomate" }
  },
  "fecha_creacion": "2025-01-15T10:30:00Z",
  "fecha_lectura": null
}
```

**Preferencias de Usuario**:
```json
{
  "usuario_id": 5,
  "recibir_platos": true,
  "recibir_ingredientes": true,
  "recibir_inventario": true,
  "recibir_pedidos": true,
  "recibir_stock_bajo": true,
  "recibir_alertas": true,
  "silencio_inicio": "22:00:00",
  "silencio_fin": "08:00:00"
}
```

---

## 📊 Estadísticas del Sprint

### Commits

1. **12ceb6a** - Sprint 2.8: Integración WebSocket en ingredientes/inventario/pedidos + Persistencia BD
   - 6 archivos modificados
   - 602 inserciones, 28 eliminaciones

2. **d9dd39e** - Sprint 2.8: API REST notificaciones completa + Swagger docs
   - 3 archivos modificados
   - 612 inserciones

3. **10b2dda** - Sprint 2.8: Frontend WebSocket integration completa
   - 5 archivos modificados
   - 276 inserciones

**Total**: 14 archivos modificados, ~1490 líneas de código

### Archivos Creados

- `migrations/011_notificaciones.sql` (45 líneas)
- `src/models/Notificacion.js` (370+ líneas)
- `src/controllers/notificacionesController.js` (330+ líneas)
- `src/routes/notificaciones.js` (265+ líneas)

### Archivos Modificados

- `src/routes/ingredientes.js` (+30 líneas)
- `src/routes/inventario.js` (+35 líneas)
- `src/routes/pedidos.js` (+50 líneas)
- `src/config/websocket.js` (+60 líneas)
- `server.js` (+2 líneas)
- `public/js/modules/platos.js` (+60 líneas)
- `public/js/modules/ingredientes.js` (+60 líneas)
- `public/js/modules/inventario.js` (+75 líneas)
- `public/js/modules/pedidos.js` (+75 líneas)
- `public/index.html` (+15 líneas)

---

## 🧪 Testing

### Tests Manuales Recomendados

1. **Test WebSocket Ingredientes**
   ```bash
   # Terminal 1: Iniciar servidor
   npm start
   
   # Browser 1: Abrir aplicación
   # Browser 2: Abrir aplicación en otra pestaña
   # Browser 1: Crear/editar/eliminar ingrediente
   # Browser 2: Verificar actualización automática
   ```

2. **Test Alertas de Stock**
   ```bash
   # 1. Crear ingrediente con stock mínimo 10
   # 2. Actualizar cantidad actual a 5
   # 3. Verificar notificación de stock bajo
   # 4. Verificar mensaje: "Stock bajo: 5 < 10"
   ```

3. **Test Notificaciones Personales**
   ```bash
   # 1. Crear pedido
   # 2. Verificar notificación "Tu pedido ha sido creado"
   # 3. Cambiar estado a "confirmado"
   # 4. Verificar notificación "ha sido confirmado"
   ```

4. **Test API REST**
   ```bash
   # Obtener notificaciones
   GET http://localhost:3001/api/notificaciones?usuario_id=1&leida=false
   
   # Obtener contador
   GET http://localhost:3001/api/notificaciones/contador?usuario_id=1
   
   # Marcar como leída
   PATCH http://localhost:3001/api/notificaciones/1/marcar-leida
   
   # Obtener estadísticas
   GET http://localhost:3001/api/notificaciones/estadisticas?usuario_id=1
   
   # Actualizar preferencias
   PUT http://localhost:3001/api/notificaciones/preferencias
   Body: {
     "usuario_id": 1,
     "recibir_stock_bajo": false,
     "silencio_inicio": "22:00",
     "silencio_fin": "08:00"
   }
   ```

### Tests Automatizados (Pendiente)

- [ ] Test unitario: `Notificacion.crear()`
- [ ] Test unitario: `Notificacion.debeRecibirNotificacion()`
- [ ] Test integración: POST ingrediente → WebSocket → BD
- [ ] Test integración: Alerta stock bajo
- [ ] Test E2E: Frontend recibe y muestra notificación

---

## 📚 Documentación Adicional

- [Sistema de Notificaciones WebSocket](./NOTIFICACIONES-INTEGRATION.md)
- [API REST Notificaciones](./NOTIFICACIONES-API.md)
- [Guía de Preferencias de Usuario](./NOTIFICACIONES-PREFERENCIAS.md)

---

## 🔜 Próximos Pasos (Sprint 2.9)

1. **Tests Automatizados**
   - Tests unitarios para modelo Notificacion
   - Tests de integración WebSocket
   - Tests E2E frontend

2. **Mejoras de Performance**
   - Paginación en notificaciones
   - Caché de preferencias en Redis
   - Batch updates para múltiples notificaciones

3. **Nuevas Funcionalidades**
   - Notificaciones push (Web Push API)
   - Notificaciones por email
   - Templates de notificaciones
   - Historial de notificaciones con búsqueda

4. **Monitoreo**
   - Métricas de notificaciones enviadas
   - Dashboard de actividad WebSocket
   - Alertas de errores en notificaciones

---

## ✅ Criterios de Aceptación

- [x] WebSocket integrado en ingredientes con emit de eventos
- [x] WebSocket integrado en inventario con alertas de stock
- [x] WebSocket integrado en pedidos con notificaciones personales
- [x] Base de datos con tabla notificaciones y preferencias
- [x] Modelo Notificacion con CRUD completo
- [x] API REST con 10 endpoints funcionales
- [x] Documentación Swagger para API
- [x] Frontend conectado a WebSocket
- [x] Módulos frontend reaccionan a eventos en tiempo real
- [x] Sistema de preferencias implementado
- [x] Horarios de silencio implementados
- [x] Commits con mensajes descriptivos
- [x] Pre-commit hooks pasando

---

## 👥 Equipo

- **Desarrollador Backend**: Integración WebSocket, API REST, Base de datos
- **Desarrollador Frontend**: Integración módulos, eventos WebSocket
- **QA**: Testing manual (pendiente automatización)

---

**Sprint 2.8 - Completado ✅**
