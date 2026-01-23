# ⚡ REFERENCIA RÁPIDA - MODALES DINÁMICOS

**Uso:** Bookmark esto en tu navegador o IDE para referencia rápida

---

## 🔥 TOP 5 OPERACIONES MÁS COMUNES

### 1. Abrir un modal
```javascript
abrirModalDinamico('plato');           // Abre modal Plato
abrirModalDinamico('pedido');          // Abre modal Pedido
abrirModalDinamico('produccion');      // Abre modal Producción
abrirModalDinamico('sanidad');         // Abre modal Sanidad
```

### 2. Crear un nuevo modal (personalizado)
```javascript
// En MODAL_CONFIGS, agregar:
nuevo_modal: {
  titulo: 'Título del Modal',
  tabla_destino: 'nombre_tabla',
  campos: [
    { nombre: 'campo1', label: 'Etiqueta', tipo: 'text', validacion: 'no_vacio' },
    { nombre: 'campo2', label: 'Precio', tipo: 'number', validacion: 'numero_positivo' },
  ]
}

// Luego usar:
abrirModalDinamico('nuevo_modal');
```

### 3. Validar antes de guardar
```javascript
const modal = new ModalDinamico('plato');
if (modal.validar(datos)) {
  // Datos válidos, guardar
} else {
  // Mostrar errores
}
```

### 4. Agregar auto-relleno
```javascript
// En el campo, agregar propiedad 'auto_rellenar'
{ nombre: 'plato_id', tipo: 'select', auto_rellenar: 'autoFillPlato' }

// Luego crear la función:
async function autoFillPlato() {
  // Cargar datos del API
  const platos = await fetch('/api/platos').then(r => r.json());
  // Rellenar campos relacionados
}
```

### 5. Llamar API después de guardar
```javascript
const response = await fetch('/api/platos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(datos)
});
```

---

## 🎯 MODALES DISPONIBLES (Acceso directo)

| Modal | Código | Ubicación | Botón |
|-------|--------|-----------|-------|
| Plato | `plato` | Platos | 🍽️ |
| Pedido | `pedido` | Pedidos | 📦 |
| Producción | `produccion` | Prod > Traz | 📊 |
| Partida Cocina | `partida_cocina` | Prod > Part | 🍳 |
| Sanidad | `sanidad` | Prod > Part | ⚕️ |
| Escandallo | `escandallo` | Menú | 🥘 |
| Artículo | `articulo` | Menú | 📝 |
| Evento | `evento` | Menú | 🎪 |

---

## 📍 UBICACIÓN DE CÓDIGO

```
public/
├── modales-dinamicos.js ← CÓDIGO PRINCIPAL
│   ├── MODAL_CONFIGS (línea 1)
│   ├── ModalDinamico class (línea 400)
│   ├── autoFill functions (línea 550)
│   └── abrirModalDinamico() (línea 800)
│
├── ejemplos-modales-dinamicos.js ← EJEMPLOS
│   └── Copiar y adaptar según necesidad
│
└── index.html ← BOTONES INTEGRADOS
    └── onclick="abrirModalDinamico('...')"
```

---

## 🔌 ENDPOINTS API (Rápida referencia)

```bash
# Listar
curl http://localhost:3000/api/platos
curl http://localhost:3000/api/pedidos
curl http://localhost:3000/api/articulos

# Crear
curl -X POST http://localhost:3000/api/platos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Mi Plato"}'

# Obtener uno
curl http://localhost:3000/api/platos/1

# Actualizar
curl -X PUT http://localhost:3000/api/platos/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Nuevo nombre"}'

# Eliminar
curl -X DELETE http://localhost:3000/api/platos/1
```

---

## ✅ VALIDACIONES (Referencia)

```javascript
// Usar en MODAL_CONFIGS:
{ validacion: 'no_vacio' }           // Campo requerido
{ validacion: 'numero' }              // Debe ser número
{ validacion: 'numero_positivo' }     // Número > 0
{ validacion: 'email' }               // Email válido
{ validacion: 'unico_en_tabla' }      // Único en BD
{ validacion: 'existe_en_platos' }    // Referencia válida
{ validacion: 'cantidad_disponible' } // Stock suficiente
```

---

## 🔄 FLUJO DE DATOS

```
Usuario → Modal → Validar → API → BD → Actualizar Tabla
   ↑                                        ↓
   └────────────────────────────────────────┘
```

**Paso a paso:**
1. Usuario abre modal: `abrirModalDinamico('plato')`
2. Completa formulario
3. Click Guardar
4. `validar()` revisa datos
5. `fetch()` envía a `/api/platos`
6. API guarda en BD
7. Modal cierra
8. Tabla se refresca

---

## 🎨 TIPOS DE CAMPOS DISPONIBLES

```javascript
// En MODAL_CONFIGS.campos[]
{ tipo: 'text' }              // Campo texto
{ tipo: 'number' }            // Campo número
{ tipo: 'date' }              // Selector fecha
{ tipo: 'select' }            // Dropdown
{ tipo: 'multi_select' }      // Selecciones múltiples
{ tipo: 'textarea' }          // Área de texto
{ tipo: 'toggle' }            // Switch on/off
{ tipo: 'search_select' }     // Select con búsqueda
{ tipo: 'dynamic_array' }     // Array dinámico
```

---

## 🧪 DEBUGGING RÁPIDO

```javascript
// En consola F12:

// Ver si modales está cargado
typeof abrirModalDinamico  // 'function' = OK

// Ver configuración
console.table(MODAL_CONFIGS)

// Ver si API responde
fetch('/api/platos').then(r => r.json()).then(console.log)

// Ver variables de un modal
document.querySelector('.form-group input').value

// Simular click en botón
document.querySelector('button[onclick*="plato"]').click()
```

---

## 🚀 ATAJOS DE TECLADO

| Atajo | Acción |
|-------|--------|
| `F12` | Abrir DevTools |
| `Ctrl+Shift+C` | Inspeccionar elemento |
| `Ctrl+Shift+J` | Consola |
| `Ctrl+K` (en consola) | Limpiar |

---

## 📦 INSTALACIÓN Y ARRANQUE

```bash
# Instalar dependencias (primera vez)
npm install

# Arrancar servidor
npm start

# Modo desarrollo (con auto-reload)
npm dev

# Ejecutar pruebas
npm test

# Inicializar BD
npm run build
```

---

## 🆘 PROBLEMAS COMUNES

| Problema | Solución |
|----------|----------|
| Modal no abre | Revisar F12 console, verificar `typeof abrirModalDinamico` |
| Auto-relleno no funciona | Verificar API: `curl http://localhost:3000/api/platos` |
| Validación rechaza datos | Revisar regla en MODAL_CONFIGS y tipo de dato |
| BD vacía | Ejecutar: `npm run build` |
| Puerto 3000 ocupado | Cambiar `const PORT = 3001` en server.js |

---

## 📚 DOCUMENTACIÓN RÁPIDA

| Pregunta | Respuesta |
|----------|----------|
| ¿Cómo abro un modal? | `abrirModalDinamico('nombre')` |
| ¿Cómo creo uno nuevo? | Copiar en MODAL_CONFIGS y ajustar |
| ¿Cómo agrego validación? | Agregar `validacion: 'tipo'` en campo |
| ¿Cómo auto-relleno? | Crear función y referenciarla en campo |
| ¿Dónde están los ejemplos? | [public/ejemplos-modales-dinamicos.js](public/ejemplos-modales-dinamicos.js) |
| ¿Cuáles son los endpoints? | [Ver en server.js](server.js) línea 45+ |

---

## 🎯 FLUJO TÍPICO DE DESARROLLO

### Crear nuevo modal en 5 pasos:

**Paso 1:** Copiar config de modal existente
```javascript
// En MODAL_CONFIGS
mi_modal: { ... }
```

**Paso 2:** Personalizar campos
```javascript
campos: [
  { nombre: 'campo1', label: 'Mi Campo', tipo: 'text' }
]
```

**Paso 3:** Agregar validaciones si necesario
```javascript
{ validacion: 'no_vacio' }
```

**Paso 4:** Agregar auto-relleno si necesario
```javascript
{ auto_rellenar: 'miAutoFill' }

async function miAutoFill() {
  // Cargar datos
}
```

**Paso 5:** Usar en HTML
```html
<button onclick="abrirModalDinamico('mi_modal')">Abrir</button>
```

---

## 💾 GUARDAR DATOS

```javascript
// El sistema lo hace automáticamente, pero si necesitas:

// Opción 1: Desde evento del modal
document.addEventListener('modal:guardar', (e) => {
  console.log('Datos guardados:', e.detail);
});

// Opción 2: Función personalizada en ejemplos-modales-dinamicos.js
async function guardarMiFormulario(datos) {
  const response = await fetch('/api/tabla', {
    method: 'POST',
    body: JSON.stringify(datos)
  });
  return response.json();
}
```

---

## 🔐 SEGURIDAD

- ✅ Validación en cliente (feedback inmediato)
- ✅ Validación en servidor (seguridad)
- ✅ Protección SQL via prepared statements
- ✅ CORS habilitado para desarrollo

---

## 📊 MÉTRICAS ÚTILES

```bash
# Ver tamaño de archivos
ls -lh public/modales-dinamicos.js  # ~20-30 KB

# Ver líneas de código
wc -l public/modales-dinamicos.js  # ~850 líneas

# Ver modales disponibles
grep "^  [a-z_]*:" public/modales-dinamicos.js  # 8 modales
```

---

## 🎓 RECURSOS

- **Código:** [public/modales-dinamicos.js](public/modales-dinamicos.js)
- **Ejemplos:** [public/ejemplos-modales-dinamicos.js](public/ejemplos-dinamicos.js)
- **Guía completa:** [GUIA_IMPLEMENTACION_MODALES.md](GUIA_IMPLEMENTACION_MODALES.md)
- **Análisis XLSB:** [ANALISIS_XLSB_EXHAUSTIVO.md](ANALISIS_XLSB_EXHAUSTIVO.md)
- **Index:** [INDICE_DOCUMENTACION.md](INDICE_DOCUMENTACION.md)

---

**Última actualización:** 23 de enero de 2026  
**Versión:** 1.0.0  
**Status:** ✅ Producción Ready

Bookmark esta página para referencia rápida 📌

