# 🧪 Guía de Pruebas - Sprint 2.8

## 📋 Configuración Inicial

### 1. Iniciar el Servidor
```bash
npm start
```

El servidor debe iniciar en `http://localhost:3000`

### 2. Abrir Navegador
```bash
# Windows
start http://localhost:3000

# O manualmente:
# Abrir navegador → http://localhost:3000
```

---

## 🧪 Suite de Pruebas

### TEST 1: WebSocket - Actualización de Ingredientes

**Objetivo**: Verificar que los cambios en ingredientes se propagan en tiempo real

**Pasos**:
1. Abrir **dos pestañas** del navegador en `http://localhost:3000`
2. En ambas pestañas:
   - Abrir **DevTools** (F12)
   - Ir a **Console**
   - Ejecutar: `window.ingredientesModule.cargar()`
3. En **Pestaña 1**:
   - Ir a sección **Ingredientes**
   - Crear un nuevo ingrediente (ej: "Tomate Cherry")
4. En **Pestaña 2**:
   - Verificar en Console: `📡 Actualización de ingredientes recibida`
   - La lista debe actualizarse automáticamente
   - Debe aparecer notificación visual

**Resultado Esperado**:
- ✅ Console muestra: `➕ Ingrediente creado: Tomate Cherry`
- ✅ Lista se actualiza sin refrescar
- ✅ Toast notification aparece

---

### TEST 2: WebSocket - Alertas de Stock Bajo

**Objetivo**: Verificar alertas automáticas cuando el stock cae bajo el mínimo

**Pasos**:
1. Ir a sección **Inventario**
2. Crear/editar un item con:
   - `cantidad_actual`: 5
   - `cantidad_minima`: 10
3. Guardar cambios

**En Console debe aparecer**:
```javascript
⚠️ Alerta de stock bajo: {
  alerta: true,
  mensaje: "Stock bajo: 5 < 10"
}
```

**Resultado Esperado**:
- ✅ Evento `alert:low-stock` recibido
- ✅ Notificación de advertencia amarilla
- ✅ Mensaje: "Stock Bajo" con detalles

---

### TEST 3: WebSocket - Notificaciones Personales de Pedidos

**Objetivo**: Verificar notificaciones personales al crear/actualizar pedidos

**Pasos**:
1. Ir a sección **Pedidos**
2. Crear un nuevo pedido:
   - Usuario ID: 1
   - Plato: (cualquiera)
   - Cantidad: 2
3. Observar notificaciones

**Resultado Esperado (Creación)**:
- ✅ Evento `pedidos:update` (broadcast general)
- ✅ Evento `pedidos:personal-update` (notificación personal)
- ✅ Toast: "Tu pedido ha sido creado exitosamente"

**Cambio de Estado**:
4. Editar el pedido y cambiar estado:
   - `pendiente` → `confirmado`
5. Guardar

**Resultado Esperado (Estado)**:
- ✅ Toast: "Tu pedido ha sido confirmado"
- ✅ Mensajes diferentes por estado:
  - `confirmado` → "ha sido confirmado"
  - `en_preparacion` → "está en preparación"
  - `listo` → "está listo para recoger"
  - `entregado` → "ha sido entregado"
  - `cancelado` → "ha sido cancelado"

---

### TEST 4: API REST - Obtener Notificaciones

**Endpoint**: `GET /api/notificaciones`

**Prueba con Postman/Thunder Client**:
```http
GET http://localhost:3000/api/notificaciones?usuario_id=1&leida=false&limite=10
```

**Resultado Esperado**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "usuario_id": 1,
      "tipo": "ingrediente",
      "titulo": "Ingrediente Actualizado",
      "mensaje": "Tomate Cherry ha sido actualizado",
      "leida": false,
      "datos": { ... },
      "fecha_creacion": "2026-01-26T17:30:00.000Z"
    }
  ],
  "total": 5
}
```

---

### TEST 5: API REST - Contador de No Leídas

```http
GET http://localhost:3000/api/notificaciones/contador?usuario_id=1
```

**Resultado Esperado**:
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### TEST 6: API REST - Estadísticas

```http
GET http://localhost:3000/api/notificaciones/estadisticas?usuario_id=1
```

**Resultado Esperado**:
```json
{
  "success": true,
  "data": {
    "total": 50,
    "noLeidas": 5,
    "porTipo": [
      { "tipo": "pedido", "total": 20, "noLeidas": 2 },
      { "tipo": "ingrediente", "total": 15, "noLeidas": 1 },
      { "tipo": "inventario", "total": 10, "noLeidas": 2 },
      { "tipo": "stock_bajo", "total": 5, "noLeidas": 0 }
    ]
  }
}
```

---

### TEST 7: API REST - Marcar como Leída

```http
PATCH http://localhost:3000/api/notificaciones/1/marcar-leida
```

**Resultado Esperado**:
```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

**Verificación**:
- Volver a GET contador → debe disminuir
- GET notificaciones → `leida: true` para ID 1

---

### TEST 8: API REST - Preferencias de Usuario

**Obtener Preferencias**:
```http
GET http://localhost:3000/api/notificaciones/preferencias?usuario_id=1
```

**Actualizar Preferencias**:
```http
PUT http://localhost:3000/api/notificaciones/preferencias
Content-Type: application/json

{
  "usuario_id": 1,
  "recibir_stock_bajo": false,
  "silencio_inicio": "22:00",
  "silencio_fin": "08:00"
}
```

**Verificación**:
1. Crear un item con stock bajo
2. NO debe recibir notificación (preferencia desactivada)
3. Reactivar: `"recibir_stock_bajo": true`
4. Crear otro item con stock bajo
5. Debe recibir notificación

---

### TEST 9: Horarios de Silencio

**Configuración**:
```json
{
  "silencio_inicio": "22:00",
  "silencio_fin": "08:00"
}
```

**Prueba**:
1. Cambiar hora del sistema a 23:00 (o simular en código)
2. Crear ingrediente
3. NO debe recibir notificación (horario de silencio)
4. Cambiar hora a 10:00
5. Crear ingrediente
6. Debe recibir notificación

---

### TEST 10: Limpieza de Notificaciones

```http
POST http://localhost:3000/api/notificaciones/limpiar
Content-Type: application/json

{
  "usuario_id": 1,
  "dias": 30
}
```

**Resultado Esperado**:
```json
{
  "success": true,
  "message": "Notificaciones leídas eliminadas correctamente",
  "eliminadas": 15
}
```

---

## 📊 Checklist de Verificación

### Backend WebSocket
- [ ] ✅ Ingredientes emiten `ingredientes:update`
- [ ] ✅ Inventario emite `inventario:update`
- [ ] ✅ Inventario emite `alert:low-stock` cuando stock < mínimo
- [ ] ✅ Pedidos emiten `pedidos:update`
- [ ] ✅ Pedidos emiten `pedidos:personal-update` con mensaje personalizado

### Backend Persistencia
- [ ] ✅ Notificaciones se guardan en BD
- [ ] ✅ Preferencias se guardan en BD
- [ ] ✅ `debeRecibirNotificacion()` valida preferencias
- [ ] ✅ `debeRecibirNotificacion()` valida horarios de silencio

### API REST
- [ ] ✅ GET /api/notificaciones funciona con filtros
- [ ] ✅ GET /api/notificaciones/no-leidas funciona
- [ ] ✅ GET /api/notificaciones/contador funciona
- [ ] ✅ GET /api/notificaciones/estadisticas funciona
- [ ] ✅ PATCH /api/notificaciones/:id/marcar-leida funciona
- [ ] ✅ POST /api/notificaciones/marcar-todas-leidas funciona
- [ ] ✅ DELETE /api/notificaciones/:id funciona
- [ ] ✅ POST /api/notificaciones/limpiar funciona
- [ ] ✅ GET /api/notificaciones/preferencias funciona
- [ ] ✅ PUT /api/notificaciones/preferencias funciona

### Frontend
- [ ] ✅ ingredientesModule.connectWebSocket() funciona
- [ ] ✅ inventarioModule.connectWebSocket() funciona
- [ ] ✅ pedidosModule.connectWebSocket() funciona
- [ ] ✅ platosModule.connectWebSocket() funciona
- [ ] ✅ Eventos WebSocket recibidos en console
- [ ] ✅ Datos se recargan automáticamente
- [ ] ✅ Notificaciones toast aparecen
- [ ] ✅ NotificationPanel funciona

---

## 🐛 Troubleshooting

### Problema: No se reciben eventos WebSocket

**Solución**:
1. Verificar console: `window.wsClient.isConnected` debe ser `true`
2. Verificar suscripciones:
   ```javascript
   window.wsClient.subscribePlatos()
   window.wsClient.subscribeIngredientes()
   window.wsClient.subscribeInventario()
   window.wsClient.subscribePedidos()
   ```

### Problema: Notificaciones no persisten

**Solución**:
1. Verificar tabla existe: 
   ```bash
   sqlite3 data/hibo-cocina.db "SELECT * FROM notificaciones LIMIT 1"
   ```
2. Ejecutar migración si falta:
   ```bash
   sqlite3 data/hibo-cocina.db < migrations/011_notificaciones.sql
   ```

### Problema: Preferencias no se guardan

**Solución**:
1. Verificar tabla:
   ```bash
   sqlite3 data/hibo-cocina.db "SELECT * FROM notificaciones_preferencias"
   ```
2. Verificar usuario_id existe en tabla usuarios

---

## 📝 Notas de Implementación

### Redis Errors (No Críticos)
```
[error] Redis connection error
```
**Causa**: Redis no está instalado/corriendo
**Impacto**: El sistema de caché está deshabilitado, pero la app funciona
**Solución (opcional)**: Instalar y ejecutar Redis server

### Puerto del Servidor
- **Producción**: `http://localhost:3000`
- Verificar en `server.js` o variable de entorno `PORT`

---

## ✅ Criterios de Éxito

El Sprint 2.8 se considera exitoso si:

1. **WebSocket funciona en todos los módulos**
   - Cambios en platos/ingredientes/inventario/pedidos se propagan en tiempo real
   - Alertas de stock bajo se muestran automáticamente
   - Notificaciones personales de pedidos funcionan

2. **Persistencia funciona**
   - Notificaciones se guardan en BD
   - Historial es consultable vía API
   - Preferencias se respetan

3. **API REST funciona**
   - Todos los 10 endpoints responden correctamente
   - Filtros funcionan
   - Documentación Swagger disponible

4. **Frontend integrado**
   - Módulos reciben eventos
   - UI se actualiza automáticamente
   - Notificaciones visuales aparecen

---

**Sprint 2.8 - Guía de Pruebas Completa** ✅
