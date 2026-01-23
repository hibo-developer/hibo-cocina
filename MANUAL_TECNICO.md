# 🔧 MANUAL TÉCNICO - HIBO COCINA

## 📋 Tabla de Contenidos

1. [Instalación](#instalación)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Base de Datos](#base-de-datos)
4. [API Reference](#api-reference)
5. [Interfaz de Usuario](#interfaz-de-usuario)
6. [Datos Importados](#datos-importados)
7. [Desarrollo](#desarrollo)

---

## 🛠️ Instalación

### Requisitos
- Node.js 14+
- npm 6+
- Windows/Linux/Mac

### Pasos

```bash
# 1. Navegar a la carpeta
cd c:\hibo-cocina

# 2. Instalar dependencias
npm install

# 3. Inicializar base de datos
npm run build

# 4. Iniciar servidor
npm start
```

El servidor estará disponible en `http://localhost:3000`

---

## 📁 Estructura del Proyecto

```
hibo-cocina/
│
├── src/
│   ├── db/
│   │   ├── database.js          # Conexión SQLite
│   │   └── schema.js            # Creación de tablas
│   │
│   ├── models/
│   │   ├── Plato.js            # CRUD de platos
│   │   └── Pedido.js           # CRUD de pedidos
│   │
│   ├── controllers/
│   │   ├── platosController.js # Lógica de platos
│   │   └── pedidosController.js # Lógica de pedidos
│   │
│   ├── routes/
│   │   ├── platos.js            # Rutas /api/platos
│   │   └── pedidos.js           # Rutas /api/pedidos
│   │
│   └── utils/
│       └── importarDatos.js    # Lectura de Excel
│
├── public/
│   ├── index.html              # Interfaz principal
│   ├── app.js                  # Lógica del cliente
│   └── styles.css              # Estilos CSS
│
├── scripts/
│   └── inicializar.js          # Script de inicialización
│
├── data/
│   └── hibo-cocina.db          # Base de datos SQLite
│
├── server.js                    # Servidor Express
├── package.json                 # Dependencias
├── config.json                  # Configuración
├── README.md                    # Documentación
├── QUICK_START.md              # Guía rápida
└── analisis.json               # Análisis de Excel
```

---

## 💾 Base de Datos

### 9 Tablas Principales

#### 1. `platos`
```sql
CREATE TABLE platos (
  id INTEGER PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad TEXT,
  coste REAL,
  tipo TEXT,
  peso_raciones REAL,
  grupo_menu TEXT,
  cocina TEXT,
  stock_activo BOOLEAN,
  preparacion TEXT,
  created_at TIMESTAMP
);
```

#### 2. `ingredientes`
```sql
CREATE TABLE ingredientes (
  id INTEGER PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  grupo_conservacion TEXT,
  proveedor TEXT,
  created_at TIMESTAMP
);
```

#### 3. `escandallos` (Recetas)
```sql
CREATE TABLE escandallos (
  id INTEGER PRIMARY KEY,
  plato_id INTEGER,
  ingrediente_id INTEGER,
  cantidad REAL,
  unidad TEXT,
  coste REAL,
  FOREIGN KEY (plato_id) REFERENCES platos(id),
  FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id)
);
```

#### 4. `pedidos`
```sql
CREATE TABLE pedidos (
  id INTEGER PRIMARY KEY,
  numero TEXT UNIQUE NOT NULL,
  cliente_codigo TEXT,
  fecha_pedido DATETIME,
  fecha_entrega DATETIME,
  estado TEXT,
  total REAL,
  created_at TIMESTAMP
);
```

#### 5. `lineas_pedido`
```sql
CREATE TABLE lineas_pedido (
  id INTEGER PRIMARY KEY,
  pedido_id INTEGER,
  plato_id INTEGER,
  cantidad INTEGER,
  precio_unitario REAL,
  subtotal REAL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (plato_id) REFERENCES platos(id)
);
```

#### 6. `produccion`
```sql
CREATE TABLE produccion (
  id INTEGER PRIMARY KEY,
  pedido_id INTEGER,
  plato_id INTEGER,
  cantidad_producida INTEGER,
  fecha_produccion DATETIME,
  estado TEXT,
  partida_cocina TEXT,
  envase_tipo TEXT,
  cantidad_envases INTEGER
);
```

#### 7. `envases`
```sql
CREATE TABLE envases (
  id INTEGER PRIMARY KEY,
  tipo TEXT UNIQUE NOT NULL,
  capacidad_raciones INTEGER,
  costo REAL,
  descripcion TEXT,
  activo BOOLEAN
);
```

#### 8. `etiquetas`
```sql
CREATE TABLE etiquetas (
  id INTEGER PRIMARY KEY,
  ingrediente_id INTEGER,
  plato_id INTEGER,
  cantidad_neto REAL,
  cantidad_bruto REAL,
  porcentaje_perdidas REAL,
  numero_etiquetas INTEGER
);
```

#### 9. `partidas_cocina`
```sql
CREATE TABLE partidas_cocina (
  id INTEGER PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activa BOOLEAN,
  trazabilidad_activa BOOLEAN
);
```

---

## 🔌 API Reference

### Base URL
```
http://localhost:3000/api
```

### Autenticación
Actualmente sin autenticación (desarrollar en fase 2)

### Response Format
```json
{
  "success": true|false,
  "data": {},
  "error": "mensaje de error (si aplica)"
}
```

---

### PLATOS Endpoints

#### 1. Obtener todos los platos
```
GET /api/platos
```

**Parámetros Query:**
- `tipo`: string (opcional)
- `grupo_menu`: string (opcional)
- `stock_activo`: boolean (opcional)

**Ejemplo:**
```bash
GET /api/platos?grupo_menu=Arroces&stock_activo=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigo": "PL-1",
      "nombre": "Arroz caldoso",
      "grupo_menu": "Arroces",
      "coste": 12.02,
      ...
    }
  ],
  "total": 84
}
```

#### 2. Obtener plato por código
```
GET /api/platos/:codigo
```

**Ejemplo:**
```bash
GET /api/platos/PL-1
```

#### 3. Crear plato
```
POST /api/platos
Content-Type: application/json

{
  "codigo": "PL-100",
  "nombre": "Nuevo Plato",
  "grupo_menu": "Arroces",
  "unidad": "Ud",
  "coste": 15.50,
  "peso_raciones": 250,
  "cocina": "Arroces",
  "preparacion": "Caliente",
  "stock_activo": true
}
```

#### 4. Actualizar plato
```
PUT /api/platos/:id
Content-Type: application/json

{
  "nombre": "Nombre Actualizado",
  "coste": 16.00
}
```

#### 5. Eliminar plato
```
DELETE /api/platos/:id
```

#### 6. Estadísticas de platos
```
GET /api/platos/estadisticas
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "grupo_menu": "Arroces",
      "cantidad": 15,
      "coste_promedio": 12.50
    }
  ]
}
```

---

### PEDIDOS Endpoints

#### 1. Obtener todos los pedidos
```
GET /api/pedidos
```

**Parámetros Query:**
- `estado`: string (optional)
- `cliente`: string (optional)

#### 2. Obtener pedido con detalles
```
GET /api/pedidos/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "numero": "PED-001",
    "cliente_codigo": "CLI-001",
    "estado": "pendiente",
    "total": 250.00,
    "lineas": [
      {
        "id": 1,
        "plato_id": 1,
        "nombre": "Arroz caldoso",
        "cantidad": 10,
        "precio_unitario": 12.00,
        "subtotal": 120.00
      }
    ]
  }
}
```

#### 3. Crear pedido
```
POST /api/pedidos
Content-Type: application/json

{
  "numero": "PED-002",
  "cliente_codigo": "CLI-002",
  "fecha_entrega": "2026-01-30",
  "estado": "pendiente",
  "total": 350.00
}
```

#### 4. Actualizar pedido
```
PUT /api/pedidos/:id
Content-Type: application/json

{
  "estado": "produccion",
  "total": 375.00
}
```

#### 5. Eliminar pedido
```
DELETE /api/pedidos/:id
```

#### 6. Estadísticas de pedidos
```
GET /api/pedidos/estadisticas
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "estado": "pendiente",
      "cantidad": 5,
      "promedio_total": 250.00,
      "total_acumulado": 1250.00
    }
  ]
}
```

---

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-01-23T10:00:00.000Z",
  "version": "1.0.0"
}
```

---

## 🎨 Interfaz de Usuario

### Secciones

#### 1. Dashboard
- Contador de platos
- Pedidos pendientes
- Pedidos en producción
- Valor total acumulado
- Grupos populares

#### 2. Platos
- **Búsqueda:** En tiempo real
- **Filtros:** Por grupo de menú
- **CRUD:** Crear, leer, actualizar, eliminar
- **Modal:** Para edición
- **Tabla:** Responsive con 8 columnas

#### 3. Pedidos
- **Búsqueda:** Por cliente
- **Filtros:** Por estado
- **Estados:** pendiente, produccion, completado, cancelado
- **CRUD:** Completo
- **Detalles:** Ver líneas de pedido

#### 4. Producción
- **Planificación:** Por partidas
- **Envases:** Asignación automática
- **Seguimiento:** Estado en tiempo real

#### 5. Estadísticas
- **Gráficos:** Distribución y costes
- **Reportes:** Estado de pedidos
- **Análisis:** Tendencias

---

## 📊 Datos Importados

### Archivos Procesados

#### fabricación.xlsb
- **Platos Menu:** 84 platos activos
- **Articulos Escandallos:** 1,639 artículos
- **Produccion:** 681 registros
- **Envases:** 5 tipos
- **Partidas:** 7 partidas
- **Datos_Etiquetas:** 2,130 registros
- **Impreso:** 1,080 etiquetas

#### oferta_c.xlsb
- No procesado (error en lectura)

### Grupos de Menú
- Arroces
- Carnes
- Pescados
- Verduras
- Pastas
- Salsas
- Postres

---

## 👨‍💻 Desarrollo

### Agregar Nuevo Endpoint

1. **Crear modelo** en `src/models/`
2. **Crear controlador** en `src/controllers/`
3. **Crear rutas** en `src/routes/`
4. **Importar en** `server.js`

### Ejemplo: Nuevo modelo

```javascript
// src/models/Ingrediente.js
class Ingrediente {
  static crear(datos) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO ingredientes (...) VALUES (...)`;
      db.run(sql, [...], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...datos });
      });
    });
  }
}
module.exports = Ingrediente;
```

### Debugging

```bash
# Modo verbose
DEBUG=* npm start

# Con inspector de nodo
node --inspect server.js
```

### Testing

```bash
# Test de salud
curl http://localhost:3000/api/health

# Test de API
curl -X GET http://localhost:3000/api/platos
curl -X POST http://localhost:3000/api/platos -H "Content-Type: application/json" -d '{...}'
```

---

## 🐛 Solución de Problemas

### Base de datos corrupta
```bash
rm data/hibo-cocina.db
npm run build
```

### Puerto en uso
```bash
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

### Módulos no encontrados
```bash
npm install --force
npm audit fix
```

### Error de permisos
```bash
# Ejecutar como administrador
npm install
npm start
```

---

## 📈 Mejoras Futuras

- [ ] Autenticación JWT
- [ ] Roles y permisos
- [ ] WebSockets para tiempo real
- [ ] GraphQL API
- [ ] Caché con Redis
- [ ] Docker setup
- [ ] Pruebas automatizadas
- [ ] CI/CD pipeline

---

**Manual Técnico - HIBO COCINA v1.0.0**
*Última actualización: 23 de enero de 2026*
