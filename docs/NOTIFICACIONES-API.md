# 📡 API REST de Notificaciones

Documentación completa de los endpoints para gestionar notificaciones en tiempo real.

---

## 🔗 Base URL

```
http://localhost:3001/api/notificaciones
```

---

## 📋 Endpoints

### 1. Obtener Notificaciones

Obtiene notificaciones del usuario con filtros opcionales.

**Endpoint**: `GET /api/notificaciones`

**Query Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `usuario_id` | integer | ✅ Sí | ID del usuario |
| `leida` | boolean | ❌ No | Filtrar por estado leído (true/false) |
| `tipo` | string | ❌ No | Tipo de notificación (plato, ingrediente, pedido, etc.) |
| `limite` | integer | ❌ No | Cantidad máxima de resultados (default: 50) |
| `offset` | integer | ❌ No | Desplazamiento para paginación (default: 0) |

**Ejemplo Request**:
```bash
GET /api/notificaciones?usuario_id=1&leida=false&limite=10
```

**Ejemplo Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "usuario_id": 1,
      "tipo": "ingrediente",
      "titulo": "Ingrediente Actualizado",
      "mensaje": "Tomate ha sido actualizado",
      "leida": false,
      "datos": {
        "action": "updated",
        "ingrediente": {
          "id": 10,
          "nombre": "Tomate"
        }
      },
      "fecha_creacion": "2025-01-15T10:30:00.000Z",
      "fecha_lectura": null
    }
  ],
  "total": 15
}
```

---

### 2. Obtener Notificaciones No Leídas

Obtiene solo las notificaciones no leídas del usuario.

**Endpoint**: `GET /api/notificaciones/no-leidas`

**Query Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `usuario_id` | integer | ✅ Sí | ID del usuario |

**Ejemplo Request**:
```bash
GET /api/notificaciones/no-leidas?usuario_id=1
```

**Ejemplo Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 20,
      "tipo": "pedido",
      "titulo": "Pedido Confirmado",
      "mensaje": "Tu pedido #45 ha sido confirmado",
      "leida": false,
      "fecha_creacion": "2025-01-15T11:00:00.000Z"
    }
  ],
  "total": 5
}
```

---

### 3. Contar Notificaciones No Leídas

Obtiene el contador de notificaciones no leídas del usuario.

**Endpoint**: `GET /api/notificaciones/contador`

**Query Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `usuario_id` | integer | ✅ Sí | ID del usuario |

**Ejemplo Request**:
```bash
GET /api/notificaciones/contador?usuario_id=1
```

**Ejemplo Response**:
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### 4. Marcar Notificación como Leída

Marca una notificación específica como leída.

**Endpoint**: `PATCH /api/notificaciones/:id/marcar-leida`

**Path Parameters**:
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID de la notificación |

**Ejemplo Request**:
```bash
PATCH /api/notificaciones/15/marcar-leida
```

**Ejemplo Response**:
```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

---

### 5. Marcar Todas como Leídas

Marca todas las notificaciones del usuario como leídas.

**Endpoint**: `POST /api/notificaciones/marcar-todas-leidas`

**Body**:
```json
{
  "usuario_id": 1
}
```

**Ejemplo Response**:
```json
{
  "success": true,
  "message": "Todas las notificaciones marcadas como leídas"
}
```

---

### 6. Eliminar Notificación

Elimina una notificación específica.

**Endpoint**: `DELETE /api/notificaciones/:id`

**Path Parameters**:
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID de la notificación |

**Ejemplo Request**:
```bash
DELETE /api/notificaciones/15
```

**Ejemplo Response**:
```json
{
  "success": true,
  "message": "Notificación eliminada correctamente"
}
```

---

### 7. Limpiar Notificaciones Leídas

Elimina las notificaciones leídas antiguas del usuario.

**Endpoint**: `POST /api/notificaciones/limpiar`

**Body**:
```json
{
  "usuario_id": 1,
  "dias": 30
}
```

**Parámetros**:
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `usuario_id` | integer | ✅ Sí | ID del usuario |
| `dias` | integer | ❌ No | Días de antigüedad (default: 30) |

**Ejemplo Response**:
```json
{
  "success": true,
  "message": "Notificaciones leídas eliminadas correctamente",
  "eliminadas": 15
}
```

---

### 8. Obtener Estadísticas

Obtiene estadísticas de notificaciones por tipo.

**Endpoint**: `GET /api/notificaciones/estadisticas`

**Query Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `usuario_id` | integer | ✅ Sí | ID del usuario |

**Ejemplo Request**:
```bash
GET /api/notificaciones/estadisticas?usuario_id=1
```

**Ejemplo Response**:
```json
{
  "success": true,
  "data": {
    "total": 50,
    "noLeidas": 5,
    "porTipo": [
      {
        "tipo": "pedido",
        "total": 20,
        "noLeidas": 2
      },
      {
        "tipo": "ingrediente",
        "total": 15,
        "noLeidas": 1
      },
      {
        "tipo": "inventario",
        "total": 10,
        "noLeidas": 2
      },
      {
        "tipo": "stock_bajo",
        "total": 5,
        "noLeidas": 0
      }
    ]
  }
}
```

---

### 9. Obtener Preferencias

Obtiene las preferencias de notificaciones del usuario.

**Endpoint**: `GET /api/notificaciones/preferencias`

**Query Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `usuario_id` | integer | ✅ Sí | ID del usuario |

**Ejemplo Request**:
```bash
GET /api/notificaciones/preferencias?usuario_id=1
```

**Ejemplo Response**:
```json
{
  "success": true,
  "data": {
    "usuario_id": 1,
    "recibir_platos": true,
    "recibir_ingredientes": true,
    "recibir_inventario": true,
    "recibir_pedidos": true,
    "recibir_stock_bajo": true,
    "recibir_alertas": true,
    "silencio_inicio": "22:00:00",
    "silencio_fin": "08:00:00"
  }
}
```

---

### 10. Actualizar Preferencias

Actualiza las preferencias de notificaciones del usuario.

**Endpoint**: `PUT /api/notificaciones/preferencias`

**Body**:
```json
{
  "usuario_id": 1,
  "recibir_platos": true,
  "recibir_ingredientes": true,
  "recibir_inventario": true,
  "recibir_pedidos": true,
  "recibir_stock_bajo": false,
  "recibir_alertas": true,
  "silencio_inicio": "22:00",
  "silencio_fin": "08:00"
}
```

**Campos Permitidos**:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `usuario_id` | integer | ✅ ID del usuario (requerido) |
| `recibir_platos` | boolean | Notificaciones de platos |
| `recibir_ingredientes` | boolean | Notificaciones de ingredientes |
| `recibir_inventario` | boolean | Notificaciones de inventario |
| `recibir_pedidos` | boolean | Notificaciones de pedidos |
| `recibir_stock_bajo` | boolean | Alertas de stock bajo |
| `recibir_alertas` | boolean | Alertas generales |
| `silencio_inicio` | time | Hora inicio modo silencio (HH:MM) |
| `silencio_fin` | time | Hora fin modo silencio (HH:MM) |

**Ejemplo Response**:
```json
{
  "success": true,
  "message": "Preferencias actualizadas correctamente",
  "data": {
    "usuario_id": 1,
    "recibir_platos": true,
    "recibir_stock_bajo": false,
    "silencio_inicio": "22:00:00",
    "silencio_fin": "08:00:00"
  }
}
```

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT (implementación pendiente).

**Header**:
```
Authorization: Bearer <token>
```

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | ✅ Éxito |
| 400 | ❌ Error de validación |
| 401 | 🔒 No autenticado |
| 403 | 🚫 No autorizado |
| 404 | 🔍 No encontrado |
| 500 | 💥 Error del servidor |

**Ejemplo Error Response**:
```json
{
  "success": false,
  "error": "Usuario no proporcionado"
}
```

---

## 📊 Tipos de Notificaciones

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `plato` | Cambios en platos | "Plato actualizado: Paella" |
| `ingrediente` | Cambios en ingredientes | "Ingrediente creado: Tomate" |
| `inventario` | Cambios en inventario | "Stock actualizado" |
| `pedido` | Cambios en pedidos | "Tu pedido ha sido confirmado" |
| `stock_bajo` | Alertas de stock bajo | "Stock bajo: Arroz (5 < 10)" |
| `alerta` | Alertas generales | "Sistema reiniciado" |
| `info` | Información general | "Nueva funcionalidad disponible" |

---

## 🔄 Flujo de Trabajo Completo

### Ejemplo: Crear Ingrediente → Recibir Notificación

1. **Backend**: Usuario crea ingrediente
   ```javascript
   POST /api/ingredientes
   Body: { nombre: "Tomate", unidad: "kg" }
   ```

2. **Backend**: Route emite WebSocket
   ```javascript
   emitIngredientesUpdate(req.app, nuevoIngrediente, 'created')
   ```

3. **Backend**: WebSocket valida y persiste
   ```javascript
   // Verifica preferencias
   const debeRecibir = await Notificacion.debeRecibirNotificacion(userId, 'ingrediente')
   
   // Guarda en BD
   await Notificacion.crear({
     usuario_id: userId,
     tipo: 'ingrediente',
     titulo: 'Ingrediente Creado',
     mensaje: 'Tomate ha sido creado'
   })
   
   // Emite via WebSocket
   io.to('module:ingredientes').emit('ingredientes:update', data)
   ```

4. **Frontend**: WebSocket recibe evento
   ```javascript
   wsClient.on('ingredientes:update', (data) => {
     ingredientesModule.handleWebSocketUpdate(data)
   })
   ```

5. **Frontend**: Módulo recarga datos
   ```javascript
   await ingredientesModule.cargar()
   ```

6. **Frontend**: Muestra notificación
   ```javascript
   notificationManager.addNotification({
     type: 'success',
     title: 'Ingrediente Creado',
     message: 'Tomate ha sido creado'
   })
   ```

7. **Usuario**: Puede consultar historial
   ```javascript
   GET /api/notificaciones?usuario_id=1&tipo=ingrediente
   ```

---

## 💡 Mejores Prácticas

### 1. Paginación
```javascript
// Cargar notificaciones con paginación
const page = 1
const limit = 20
GET /api/notificaciones?usuario_id=1&limite=${limit}&offset=${(page-1)*limit}
```

### 2. Filtrado Eficiente
```javascript
// Solo notificaciones importantes
GET /api/notificaciones?usuario_id=1&tipo=stock_bajo&leida=false
```

### 3. Limpieza Periódica
```javascript
// Eliminar notificaciones leídas antiguas cada semana
POST /api/notificaciones/limpiar
Body: { usuario_id: 1, dias: 7 }
```

### 4. Preferencias por Contexto
```javascript
// Desactivar notificaciones de stock durante inventario
PUT /api/notificaciones/preferencias
Body: {
  usuario_id: 1,
  recibir_stock_bajo: false
}
```

---

## 🧪 Ejemplos con cURL

### Obtener notificaciones no leídas
```bash
curl -X GET "http://localhost:3001/api/notificaciones/no-leidas?usuario_id=1" \
  -H "Content-Type: application/json"
```

### Marcar como leída
```bash
curl -X PATCH "http://localhost:3001/api/notificaciones/15/marcar-leida" \
  -H "Content-Type: application/json"
```

### Actualizar preferencias
```bash
curl -X PUT "http://localhost:3001/api/notificaciones/preferencias" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "recibir_stock_bajo": false,
    "silencio_inicio": "22:00",
    "silencio_fin": "08:00"
  }'
```

### Obtener estadísticas
```bash
curl -X GET "http://localhost:3001/api/notificaciones/estadisticas?usuario_id=1" \
  -H "Content-Type: application/json"
```

---

## 📖 Documentación Relacionada

- [Sprint 2.8 Resumen](./SPRINT-2.8-RESUMEN.md)
- [Sistema WebSocket](./NOTIFICACIONES-INTEGRATION.md)
- [Guía de Preferencias](./NOTIFICACIONES-PREFERENCIAS.md)

---

**API REST Notificaciones - v1.0**
