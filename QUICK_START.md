## GUÍA DE INICIO RÁPIDO - HIBO COCINA

### 🚀 Cómo empezar

1. **Navega a la carpeta del proyecto:**
   ```
   cd c:\hibo-cocina
   ```

2. **Instala las dependencias (si aún no lo hiciste):**
   ```
   npm install
   ```

3. **Inicializa la base de datos:**
   ```
   npm run build
   ```

4. **Inicia el servidor:**
   ```
   npm start
   ```

5. **Abre en tu navegador:**
   - Interfaz web: http://localhost:3000
   - API: http://localhost:3000/api
   - Health check: http://localhost:3000/api/health

### 📱 Secciones principales

#### 1. Dashboard
- Resumen de métricas principales
- Platos disponibles
- Pedidos pendientes y en producción
- Grupos de menú más populares

#### 2. Gestión de Platos
- Catálogo de 1600+ artículos
- Búsqueda y filtrado por grupo
- Crear, editar y eliminar platos
- Información de costes y preparación

#### 3. Gestión de Pedidos
- Crear nuevos pedidos
- Filtrar por estado o cliente
- Seguimiento completo
- Control de costes totales

#### 4. Producción
- Planificación de producción
- Asignación de partidas de cocina
- Control de envases
- Trazabilidad

#### 5. Estadísticas
- Distribución de platos por grupo
- Análisis de costes
- Estado de pedidos
- Reportes de producción

### 📊 Datos importados del archivo fabricación.xlsb

**Hojas procesadas:**
- ✓ Platos Menu (84 platos activos)
- ✓ Articulos Escandallos (1639 artículos)
- ✓ Produccion (681 registros)
- ✓ Envases (5 tipos configurados)
- ✓ Partidas (7 partidas de cocina)
- ✓ Datos_Etiquetas (2130 registros)
- ✓ Impreso (1080 etiquetas)

### 🔧 Comandos útiles

```bash
# Iniciar en modo desarrollo (con reinicio automático)
npm run dev

# Crear datos de ejemplo
npm run build

# Ver estado del servidor
curl http://localhost:3000/api/health
```

### 📡 Ejemplos de API

**Obtener todos los platos:**
```
GET http://localhost:3000/api/platos
```

**Obtener estadísticas de platos:**
```
GET http://localhost:3000/api/platos/estadisticas
```

**Crear un nuevo plato:**
```
POST http://localhost:3000/api/platos
Content-Type: application/json

{
  "codigo": "PL-100",
  "nombre": "Mi Nuevo Plato",
  "grupo_menu": "Arroces",
  "unidad": "Ud",
  "coste": 15.50,
  "peso_raciones": 250,
  "cocina": "Arroces",
  "preparacion": "Caliente",
  "stock_activo": true
}
```

**Obtener todos los pedidos:**
```
GET http://localhost:3000/api/pedidos
```

**Crear un nuevo pedido:**
```
POST http://localhost:3000/api/pedidos
Content-Type: application/json

{
  "numero": "PED-001",
  "cliente_codigo": "CLI-001",
  "fecha_entrega": "2026-01-30",
  "estado": "pendiente",
  "total": 250.00
}
```

### 🎨 Personalización

**Modificar colores (en public/styles.css):**
```css
:root {
  --primary-color: #e74c3c;    /* Color principal (rojo) */
  --secondary-color: #3498db;   /* Azul */
  --success-color: #27ae60;     /* Verde */
  --danger-color: #e74c3c;      /* Rojo de peligro */
}
```

### 📁 Estructura de directorios importantes

```
c:\hibo-cocina\
├── data/                    ← Base de datos SQLite
│   └── hibo-cocina.db      
├── public/                  ← Interfaz web
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── src/
│   ├── db/                  ← Base de datos
│   ├── models/              ← Modelos de datos
│   ├── controllers/         ← Lógica de negocio
│   ├── routes/              ← Rutas API
│   └── utils/               ← Utilidades
├── scripts/
│   └── inicializar.js       ← Inicialización
└── server.js                ← Servidor principal
```

### 🐛 Solución de problemas

**Puerto 3000 en uso:**
```bash
# Termina cualquier proceso en el puerto 3000
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

**Base de datos corrupta:**
```bash
# Elimina la base de datos y reinicializa
rmdir data /s
mkdir data
npm run build
npm start
```

**Errores de módulos:**
```bash
# Reinstala las dependencias
npm install --force
```

### 💡 Consejos

1. **Hacer respaldo de datos:** Copia `data/hibo-cocina.db` regularmente
2. **Exportar datos:** Usa las funciones de estadísticas para reportes
3. **Buscar eficientemente:** Usa los filtros en lugar de scroll
4. **Validación:** Revisa que los platos tengan código único
5. **Costes:** Actualiza costes regularmente desde proveedores

### 📞 Soporte

- Documentación: Ver README.md
- API Health: http://localhost:3000/api/health
- Logs: Ver consola del servidor

---

**¡Disfruta gestionar tu cocina con HIBO COCINA!** 🍳
