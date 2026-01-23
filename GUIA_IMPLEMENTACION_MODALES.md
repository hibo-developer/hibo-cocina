# 🎯 GUÍA DE IMPLEMENTACIÓN: MODALES DINÁMICOS CON AUTO-RELLENO

**Fecha:** 23 de enero de 2026  
**Versión:** 1.0 - Sistema Completo  
**Autor:** Análisis Exhaustivo XLSB  

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Guía de Implementación Paso a Paso](#guía-de-implementación-paso-a-paso)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Validaciones y Relaciones](#validaciones-y-relaciones)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen Ejecutivo

### ¿Qué se ha implementado?

Se ha creado un **sistema dinámico y reutilizable de modales** que:

✅ **Se generan automáticamente** basados en una configuración JSON  
✅ **Mapean directamente con las hojas XLSB** (Fabricación + Oferta)  
✅ **Auto-rellenan campos** mediante lookups dinámicos a la API  
✅ **Calculan valores** automáticamente (costes, cantidades, etc.)  
✅ **Validan datos** antes de guardar  
✅ **Se personalizan** sin escribir HTML nuevo  

### Archivos Creados

```
📦 SISTEMA MODALES DINÁMICOS
├── 📄 modales-dinamicos.js (Sistema principal - 600+ líneas)
├── 📄 ejemplos-modales-dinamicos.js (Ejemplos de integración)
├── 📄 ANALISIS_XLSB_EXHAUSTIVO.md (Documentación completa)
├── 🎨 styles.css (+ 200 líneas de estilos para modales)
└── 📝 GUIA_IMPLEMENTACION_MODALES.md (Este archivo)
```

---

## 🏗️ Arquitectura del Sistema

### 1. CONFIGURACIÓN CENTRALIZADA (MODAL_CONFIGS)

Cada modal se define en `MODAL_CONFIGS` con:

```javascript
MODAL_CONFIGS.produccion = {
  titulo: '📦 Registrar Producción',
  hoja_origen: 'Trazabilidad Fecha + Produccion',
  campos: [
    {
      nombre: 'codigo_plato',
      etiqueta: 'Código Plato',
      tipo: 'select',
      lookup: 'platos',  // API endpoint
      onChange: 'autoFillPlato'  // Función auto-relleno
    },
    // ... más campos
  ],
  validaciones: [
    // Reglas de validación
  ]
};
```

### 2. GENERADOR DE MODAL (Clase ModalDinamico)

```javascript
const modal = new ModalDinamico('produccion');
const html = await modal.render();  // Genera todo el HTML
document.body.appendChild(html);
```

### 3. AUTO-RELLENO Y CÁLCULOS

Cuando el usuario selecciona un valor:
```
Usuario selecciona Plato (PL-1)
    ↓
Se dispara evento 'onChange'
    ↓
Función autoFillPlato() es llamada
    ↓
Fetch a /api/platos/PL-1
    ↓
Rellena automáticamente:
- Nombre Plato
- Coste Racion
- Preparación
- Escandallo (ingredientes)
```

### 4. VALIDACIÓN

Antes de enviar:
```javascript
{
  campo: 'codigo_plato',
  regla: 'existe_en_platos',
  error: 'Plato no existe'
}
```

### 5. ALMACENAMIENTO

```
Modal → Formulario → Validación → POST /api/[tabla] → BD
```

---

## 📝 Guía de Implementación Paso a Paso

### PASO 1: Incluir Scripts en HTML

```html
<!-- En index.html, antes de </body> -->
<script src="modales-dinamicos.js"></script>
<script src="ejemplos-modales-dinamicos.js"></script>
<script src="app.js"></script>
```

### PASO 2: Crear un Modal Nuevo

**Opción A: Usar uno existente**
```html
<button onclick="abrirModalDinamico('produccion')">
  📦 Registrar Producción
</button>
```

**Opción B: Crear uno nuevo**
```javascript
// En MODAL_CONFIGS, agregue:
MODAL_CONFIGS.miNuevoModal = {
  titulo: '🎯 Mi Nuevo Modal',
  hoja_origen: 'Nombre de Hoja XLSB',
  campos: [
    {
      nombre: 'campo1',
      etiqueta: 'Etiqueta del Campo',
      tipo: 'text',
      required: true
    },
    {
      nombre: 'campo2',
      etiqueta: 'Otro Campo',
      tipo: 'select',
      lookup: 'tabla_api'
    }
  ],
  validaciones: [
    { campo: 'campo1', regla: 'no_vacio', error: 'Campo obligatorio' }
  ]
};

// Luego abrirlo:
abrirModalDinamico('miNuevoModal');
```

### PASO 3: Configurar Auto-relleno

```javascript
// 1. Crear función en modales-dinamicos.js
async function autoFillMiDato(valor) {
  const dato = await fetch(`/api/mi_tabla/${valor}`).then(r => r.json());
  
  // Rellenar otros campos
  document.querySelector('[name="otro_campo"]').value = dato.propiedad;
}

// 2. Referenciar en la configuración del modal
campos: [
  {
    nombre: 'selector',
    tipo: 'select',
    onChange: 'autoFillMiDato'  // ← Aquí
  },
  {
    nombre: 'otro_campo',
    tipo: 'text',
    readonly: true,
    dependsOn: 'selector'
  }
]
```

### PASO 4: Agregar Validaciones

```javascript
// En MODAL_CONFIGS[miModal].validaciones
validaciones: [
  {
    campo: 'email',
    regla: 'email',
    error: 'Email no válido'
  },
  {
    campo: 'codigo',
    regla: 'unico_en_tabla',
    tabla: 'mi_tabla',
    error: 'Código ya existe'
  },
  {
    campo: 'cantidad',
    regla: 'numero_positivo',
    error: 'Debe ser un número positivo'
  }
]
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Registrar Producción

**Hoja XLSB:** Trazabilidad Fecha + Produccion  
**Modal:** `produccion`  
**URL:** `/api/trazabilidad` (POST)

```html
<button onclick="abrirModalDinamico('produccion')">
  📦 Registrar Producción
</button>
```

**Flujo:**
1. Usuario abre modal
2. Selecciona Código Plato (PL-1)
3. Se auto-rellena:
   - Nombre: "Arroz caldoso de bogavante - 2 pax"
   - Coste Racion: €9.08
   - Ingredientes necesarios
4. Introduce Cantidad
5. Se calcula Coste Total
6. Clic en Guardar → POST a `/api/trazabilidad`

### Ejemplo 2: Crear Receta (Escandallo)

**Hoja XLSB:** Escandallo  
**Modal:** `escandallo`  
**URL:** `/api/escandallo` (POST)

```html
<button onclick="crearRecetaParaPlato('PL-1')">
  📖 Nueva Receta para Arroz Caldoso
</button>
```

**Características Dinámicas:**
- Array de ingredientes (+ botón para agregar más)
- Cada ingrediente:
  - Seleccionar Artículo
  - Auto-rellena Unidad
  - Introduce Cantidad
  - Calcula Coste Total
- Total Receta = Σ Costes

### Ejemplo 3: Control Sanidad (APPCC)

**Hoja XLSB:** Sanidad  
**Modal:** `sanidad`  
**URL:** `/api/sanidad` (POST)

```html
<button onclick="registrarControlSanidad('20260123-001')">
  🧪 Registrar Control Sanidad
</button>
```

**Auto-relleno Inteligente:**
```javascript
Usuario selecciona Lote: 20260123-001
    ↓
Auto-rellena:
- Plato: PL-1 (Arroz caldoso)
- Fecha Producción: 2026-01-23
- Preparación: Caliente
    ↓
Carga puntos críticos según preparación:
- Si Caliente: Temperatura, Tiempo, Contaminación
- Si Frio: pH, Humedad, Contaminación
    ↓
Usuario selecciona Punto Crítico: Temperatura
    ↓
Muestra rangos esperados: 65°C - 85°C
    ↓
Usuario introduce valor medido: 72°C
    ↓
Valida: 72 está en rango → Resultado = ✓ OK
```

### Ejemplo 4: Crear Evento (Oferta_c.xlsb)

**Hoja XLSB:** Eventos  
**Modal:** `evento`  
**URL:** `/api/eventos` (POST)

```html
<button onclick="abrirModalDinamico('evento')">
  🎉 Crear Evento
</button>
```

**Datos Relacionados:**
```
Evento → Clientes (multi-select)
       → Menus Eventos
       → Pedidos Eventos
       → Cálculo Coste Total
```

---

## ✅ Validaciones y Relaciones

### VALIDACIONES IMPLEMENTADAS

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `no_vacio` | Campo debe tener valor | nombre, descripción |
| `numero` | Debe ser número válido | cantidad, coste |
| `numero_positivo` | Mayor a 0 | cantidad, precio |
| `mayor_cero` | Mayor a 0 (con decimales) | peso, volumen |
| `email` | Formato email válido | correo |
| `unico_en_tabla` | No existe en BD | codigo_plato, codigo_articulo |
| `existe_en_platos` | Existe plato activo | codigo_plato (pedido) |
| `existe_y_venta` | Plato existe y está a venta | codigo_plato (venta) |
| `cantidad_disponible` | Stock disponible | cantidad_pedido |
| `validar_planning` | Cumple PLANG.PROD | dia_produccion vs dia_servicio |

### RELACIONES CRÍTICAS

#### Relación 1: PLANG.PROD (Un solo día de producción por día de servicio)

```javascript
Validación:
dia_servicio = "Lunes 1 Alm."
    ↓
Busca en PLANG.PROD
    ↓
Encuentra dias_produccion válidos: ["Lunes", "Martes"]
    ↓
Usuario selecciona: "Lunes"
    ↓
Suma de selecciones para este servicio = 1 ✓
    ↓
Si suma > 1 → Error (Rojo/Amarillo)
```

**Implementación:**
```javascript
async function cargarDiasProduccionValidos(diaServicio) {
  const plannings = await fetch(`/api/plang-prod?dia_servicio=${diaServicio}`)
    .then(r => r.json());
  
  const diasValidos = [...new Set(plannings.map(p => p.dia_produccion))];
  
  // Llena dropdown din ámicamente
  const select = document.querySelector('[name="dia_produccion"]');
  select.innerHTML = '';
  diasValidos.forEach(dia => {
    const option = document.createElement('option');
    option.value = dia;
    option.textContent = dia;
    select.appendChild(option);
  });
}
```

#### Relación 2: Escandallo Auto-Cálculo

```javascript
Plato seleccionado: PL-1
    ↓
Busca Escandallo:
[
  { articulo: 'AR-1', cantidad: 0.5, coste_kilo: 8.50 },
  { articulo: 'AR-2', cantidad: 0.25, coste_kilo: 12.00 }
]
    ↓
Cantidad a producir: 100 UD
    ↓
Calcula necesario:
- AR-1: 0.5 × 100 = 50 kg → 50 × €8.50 = €425.00
- AR-2: 0.25 × 100 = 25 kg → 25 × €12.00 = €300.00
    ↓
Coste Total Producción: €725.00
    ↓
Coste por Racion: €725.00 ÷ 100 = €7.25
```

---

## 🚀 Pasos para Integrar en Secciones Existentes

### Integración en SECCIÓN PRODUCCIÓN

**Archivo:** `index.html` - Busque `<section id="produccion">`

Agregue estos botones:
```html
<div class="production-actions">
  <button class="btn btn-primary" onclick="abrirModalDinamico('produccion')">
    📦 Registrar Producción
  </button>
  <button class="btn btn-secondary" onclick="abrirModalDinamico('partida_cocina')">
    🔪 Nueva Partida Cocina
  </button>
  <button class="btn btn-secondary" onclick="abrirModalDinamico('sanidad')">
    🧪 Control Sanidad
  </button>
</div>
```

### Integración en SECCIÓN PLATOS

Agregue:
```html
<div class="platos-actions">
  <button class="btn btn-primary" onclick="abrirModalDinamico('plato')">
    🍽️ Nuevo Plato
  </button>
  <button class="btn btn-secondary" onclick="abrirModalDinamico('escandallo')">
    📖 Nueva Receta
  </button>
  <button class="btn btn-secondary" onclick="abrirModalDinamico('articulo')">
    📦 Nuevo Artículo
  </button>
</div>
```

### Agregrar Botones a Filas de Tabla

```html
<table id="tablaTrazabilidad">
  <tbody>
    <tr>
      <td>${lote}</td>
      <td>${plato}</td>
      <td>
        <button onclick="registrarControlSanidad('${lote}')" 
                class="btn-small btn-sanidad">
          🧪 Control Sanidad
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

---

## 🐛 Troubleshooting

### Problema 1: Modal no aparece

**Causa:** Script no está cargado  
**Solución:**
```html
<!-- Verificar que esté en index.html -->
<script src="modales-dinamicos.js"></script>

<!-- En consola, verificar:
console.log(typeof abrirModalDinamico);  // Debe ser 'function'
console.log(MODAL_CONFIGS);              // Debe mostrar configuraciones
-->
```

### Problema 2: Auto-relleno no funciona

**Causa:** Función onChange no existe o está mal nombrada  
**Solución:**
```javascript
// En modales-dinamicos.js, la función debe existir:
async function autoFillPlato(valor) {
  // ... código
}

// Y estar exportada:
window.autoFillPlato = autoFillPlato;

// En la configuración:
onChange: 'autoFillPlato'  // Nombre debe coincidir
```

### Problema 3: Validación no funciona

**Causa:** Regla de validación no está implementada  
**Solución:**
```javascript
// En método validar() de ModalDinamico, agregar:
case 'mi_regla':
  esValido = /* lógica de validación */;
  break;
```

### Problema 4: API devuelve error 404

**Causa:** Endpoint no existe en backend  
**Solución:**
```javascript
// Verificar que exista en server.js:
app.get('/api/platos', (req, res) => { /* ... */ });
app.post('/api/trazabilidad', (req, res) => { /* ... */ });

// Usar nombre correcto en lookup:
lookup: 'platos'  // Debe coincidir con /api/platos
```

### Problema 5: Campo no se pre-rellena

**Causa:** dependsOn no está definido correctamente  
**Solución:**
```javascript
// Campo que recibe el auto-relleno debe tener:
{
  nombre: 'nombre_plato',
  etiqueta: 'Nombre',
  readonly: true,
  dependsOn: 'codigo_plato'  // Nombre del campo que dispara
}
```

---

## 📊 Matriz de Relación: Modales ↔ Hojas XLSB

| Modal | Hoja XLSB | Tabla API | Campos Principales | Auto-relleno |
|-------|-----------|-----------|-------------------|--------------|
| `produccion` | Trazabilidad Fecha + Produccion | `/trazabilidad` | codigo_plato, cantidad, lote, fecha | Plato → Nombre, Coste |
| `partida_cocina` | Partidas | `/partidas-cocina` | nombre, responsable, descripcion | - |
| `pedido` | Base_Pedidos | `/pedidos` | codigo_plato, cantidad, dia_servicio | Plato → Envases válidos |
| `articulo` | Articulos | `/articulos` | codigo, nombre, familia, coste | - |
| `plato` | Platos | `/platos` | codigo, nombre, grupo_menu | Escandallo |
| `escandallo` | Escandallo | `/escandallo` | codigo_plato, ingredientes | Articulos |
| `sanidad` | Sanidad | `/sanidad` | lote, punto_critico, temperatura | Lote → Plato, Fecha |
| `evento` | Eventos | `/eventos` | codigo, nombre, tipo, fecha, clientes | - |

---

## 🎓 Conclusión

El sistema de modales dinámicos permite:

✅ **Crear formularios** sin escribir HTML  
✅ **Auto-rellenar datos** automáticamente  
✅ **Validar datos** antes de guardar  
✅ **Mapear directamente con XLSB** de forma consistente  
✅ **Extender fácilmente** agregando nuevos modales  

**Próximos pasos:**
1. Agregar botones a las secciones HTML existentes
2. Implementar endpoints API si falta alguno
3. Probar cada modal con datos reales
4. Ajustar validaciones según requerimientos específicos

---

**📞 Contacto:** Para agregar nuevos modales o modificar existentes, ver MODAL_CONFIGS en modales-dinamicos.js

**📅 Última actualización:** 23 de enero de 2026

