# 📊 ANÁLISIS EXHAUSTIVO ARCHIVOS XLSB

## Resumen Ejecutivo

**ARCHIVO 1: fabricación.xlsb** (31 hojas)
- **Propósito:** Gestión completa del ciclo de fabricación y producción
- **Datos principales:** Artículos (1008), Platos (1023), Inventario (996), Producción (681), Trazabilidad

**ARCHIVO 2: oferta_c.xlsb** (16 hojas)
- **Propósito:** Gestión de eventos, ofertas y menús
- **Datos principales:** Clientes (150), Eventos, Menús, Pedidos de eventos

---

## 📋 ANÁLISIS DETALLADO: FABRICACIÓN.XLSB

### 1️⃣ HOJAS MAESTRAS (Bases de Datos Principales)

#### 📦 **Hoja: Articulos** (1008 filas × 44 columnas)
**Descripción:** Base datos completa de artículos/ingredientes

**Estructura:**
```
Columns (sugeridas basado en estructura):
- Codigo Interno (AR-1, AR-2, ...)
- Nombre Articulo
- Familia (Aceites y Grasas, etc.)
- Grupo Conservacion (Neutro, Congelado, Fresco)
- Unidad Economato
- Unidad Escandallo
- Activos (booleano)
- ...más columnas de almacén
```

**Relaciones:**
- ← Escandallo (usa ingredientes)
- ← Trazabilidad (seguimiento de artículos)
- ← Inventario (stock actual)

---

#### 🍽️ **Hoja: Platos** (1023 filas × 43 columnas)
**Descripción:** Base datos de todos los platos del menú

**Estructura:**
```
- Codigo Platos (PL-1, PL-2, ...)
- Nombre Plato
- Unidad Escandallo (Ud, Kg, Lt, etc.)
- Coste Raciones
- Plato a la Venta (Si/No)
- Grupo Menu (Arroces, Carnes, etc.)
- Cocina (Fria/Caliente)
- PESO RACIONES
- Cubetas, Barqueta GN 100, Mono, etc. (envases)
- STOCK (Si/No)
```

**Relaciones:**
- ← Escandallo (recetas)
- ← Trazabilidad Platos (ingredientes por plato)
- ← Datos_Etiquetas (alérgenos)

---

#### 📊 **Hoja: Base_Pedidos** (998 filas × 28 columnas)
**Descripción:** Registro histórico de pedidos de producción

**Estructura:**
```
- Codigo Plato
- Cantidad a Pedir
- Fecha Pedido
- Estado (PEDIDO, SERVIDO, etc.)
- Cliente
- Cantidad UD.
- Formato envase
```

**Relaciones:**
- → Produccion (orden de fabricación)
- → ORDEN PRODUCCION (planning)

---

#### 📈 **Hoja: Inventario** (996 filas × 11 columnas)
**Descripción:** Control de stock actual y deseado

**Estructura:**
```
- Codigo Interno (AR-1)
- Articulo
- Grupo Conservacion
- Familia
- Formato Economato
- Pedidos (cantidad)
- Inventario (cantidad actual)
- Stock Deseado (%)
- Stock Reserva
```

**Relaciones:**
- ← Articulos (datos maestros)
- ← Base_Pedidos (nuevas compras)

---

### 2️⃣ HOJAS DE RECETAS (Escandallo)

#### 🔧 **Hoja: Escandallo** (8405 filas × 75 columnas)
**Descripción:** Relación detallada ingredientes → platos

**Estructura:**
```
- Codigo Plato (PL-1)
- Nombre Plato
- Ingredientes (múltiples)
- Cantidades
- Unidades
- Coste Kilo
- Tipo
```

**Relaciones:**
- ← Platos (detalle de receta)
- ← Articulos (ingredientes)
- → Produccion (cantidades necesarias)

---

#### 📋 **Hoja: Articulos Escandallos** (1640 filas × 5 columnas)
**Descripción:** Resumen simplificado de recetas

**Estructura:**
```
- Codigo Platos
- Ingredientes
- Unidad
- Coste Kilo
- Tipo
```

---

### 3️⃣ HOJAS DE PRODUCCIÓN

#### 📅 **Hoja: ORDEN PRODUCCION** (47 filas × 18 columnas)
**Descripción:** Planning de producción semanal

**Estructura:**
```
- Codigo Plato
- Cantidad PEDIDO
- Cantidad SERVIDO
- Dia Produccion (selección dropdown)
- Fecha Produccion
- Estado
```

**Relaciones:**
- ← Base_Pedidos
- → PLANG.PROD (planning detallado)
- → Produccion (ejecución)

---

#### 🏭 **Hoja: PLANG.PROD** (100 filas × 27 columnas)
**Descripción:** Planning detallado de producción por días

**Estructura:**
```
- Codigo Produccion (PROD_8)
- Dia Semana (Lunes, Martes, etc.)
- Dias Servicios (Lunes 1 Alm., Lunes 1 Cen., etc.) × 14 días
- Observaciones
- PLANING (1 = activar)
```

**Lógica:**
```
Para cada dia de servicio, 1 solo dia de produccion
- Control: suma ≤ 1 (Si > 1 = amarillo/rojo)
```

---

#### 🔄 **Hoja: Produccion** (681 filas × 34 columnas)
**Descripción:** Ejecución real de producción

**Estructura:**
```
- Semana Año Nº
- Dia Produccion
- Fecha Produccion
- Plato a Producir
- Cantidad Total
- Cantidad Venta
- Cantidad Mise-Place
- Control Produccion
- Estado (ANTICIPADO, EN CURSO, COMPLETADO)
```

**Relaciones:**
- ← ORDEN PRODUCCION
- → Trazabilidad Fecha
- → Trazabilidad Platos

---

### 4️⃣ HOJAS DE TRAZABILIDAD

#### 🏷️ **Hoja: Trazabilidad Fecha** (996 filas × 26 columnas)
**Descripción:** Trazabilidad por ingredientes y fechas

**Estructura:**
```
- Codigo Interno (AR-1)
- Articulo
- Codigo Platos que usa
- Cantidad Articulos
- Grupo Conservacion
- Partidas y Almacen
- Trazabilidad Lotes (Trz-1 a Trz-14)
- Activo (1/0)
```

**Relaciones:**
- ← Articulos
- ← Inventario
- ← Produccion (lotes)

---

#### 📍 **Hoja: Trazabilidad Platos** (3253 filas × 6 columnas)
**Descripción:** Trazabilidad de platos terminados

**Estructura:**
```
- Codigo Platos (PL-1)
- Nombre Plato
- Ingredientes (lista)
- Nº Lotes (Nº1, Nº2)
```

---

### 5️⃣ HOJAS DE PARTIDAS Y PRODUCCIÓN POR ESTACIÓN

#### 🔪 **Hoja: Partidas** (292 filas × 6 columnas)
**Descripción:** Organización de trabajo por estaciones/partidas

**Estructura:**
```
- Partida (cocina caliente, cocina fria, etc.)
- Anticipado (cantidad)
- Anticipado Total
- Control Produccion
- Fecha Produccion
```

**Relaciones:**
- ← PLANG.SUMI. (asignaciones)
- ← Tab.PROD (detalle)
- → Trazabilidad (seguimiento)

---

#### 📋 **Hoja: PLANG.SUMI.** (31 filas × 20 columnas)
**Descripción:** Planning de suministro y control

**Estructura:**
```
- Comprobacion (Congelado, Fresco, Neutro)
- Cantidad
```

---

#### 🗂️ **Hoja: Tab.PROD** (28 filas × 6 columnas)
**Descripción:** Tabla de producción por partidas

**Estructura:**
```
- Partidas (seleccionar)
- Total UD. a Producir
- VENTA (cantidad)
- Mise-Place (cantidad)
- Control Produccion (validación)
- Fecha Prod
```

---

### 6️⃣ HOJAS DE ENVASES

#### 📦 **Hoja: Prod_Envases** (3 filas × 13 columnas)
**Descripción:** Tipo de envases para producción

**Estructura:**
```
- Envases Platos a Producir
- Total Raciones
- Cubetas
- Barqueta GN 100
- Barqueta GN 60
- Barqueta GN 30
- Mono
- Total Envases
```

---

#### 🎁 **Hoja: Envase clientes** (1641 filas × 17 columnas)
**Descripción:** Especificación de envases por cliente

---

### 7️⃣ HOJAS DE ETIQUETADO Y SANIDAD

#### 🏷️ **Hoja: Datos_Etiquetas** (2131 filas × 9 columnas)
**Descripción:** Información para etiquetas de producción

**Estructura:**
```
- Ingredientes
- Codigo Platos
- Nombre Plato
- Alergia
- NETO (peso sin embalaje)
- BRUTO (peso con embalaje)
- % Perdidas
- Nº Etiquetas
```

---

#### 🧪 **Hoja: Sanidad** (2171 filas × 7 columnas)
**Descripción:** Puntos críticos de control (APPCC)

**Estructura:**
```
- Platos
- Ingredientes
- Fecha Produccion
- Punto Critico
- Punto Corrector
- Resultado Control
```

---

#### 📄 **Hoja: Impreso** (1080 filas × 7 columnas)
**Descripción:** Control de impresión de etiquetas

---

### 8️⃣ HOJAS DE CONFIGURACIÓN

#### ⚙️ **Hoja: CONFIGURACION** (41 filas × 20 columnas)
**Descripción:** Parámetros de sistema

#### 📝 **Hoja: PROCESOS** (4 filas × 4 columnas)
**Descripción:** Documentación de procesos

#### 📅 **Hoja: FECHA** (168 filas × 8 columnas)
**Descripción:** Control de fechas de producción

---

## 📊 ANÁLISIS DETALLADO: OFERTA_C.XLSB

### ARCHIVO 2: GESTIÓN DE EVENTOS Y OFERTAS

#### 👥 **Hoja: Clientes** (150 filas × 15 columnas)
**Descripción:** Base de clientes para eventos

**Estructura:**
```
- Codigo Cliente (Clt-1)
- Nombre Cliente
- Menu Evento
- Nombre Evento (BODAS, etc.)
- Opciones (Opt-1, Opt-2)
- Fecha Evento
- Nº Clientes
- Coste €
- Situacion (Hecho, Pendiente)
```

**Relaciones:**
- → Eventos
- → Pedidos Eventos

---

#### 🎉 **Hoja: Eventos** (131 filas × 52 columnas)
**Descripción:** Definición de eventos

**Estructura:**
```
- Evento_1, Evento_2, etc.
- Tipo Evento (BODAS, CORPORATIVO, etc.)
- Opciones (Opt-1, Opt-2, Opt-3, etc.)
- Cantidades por opción
- Fechas
```

**Relaciones:**
- ← Clientes
- → Menus Eventos
- → Pedidos Eventos

---

#### 🍽️ **Hoja: Menus Eventos** (116 filas × 59 columnas)
**Descripción:** Menús personalizados para eventos

**Estructura:**
```
- Codigo Menu
- Separador (Aperitivo, Arroces, etc.)
- Platos (por opción)
- Cantidades
```

**Relaciones:**
- ← Eventos
- → Platos a la Venta

---

#### 🛒 **Hoja: Pedidos Eventos** (497 filas × 24 columnas)
**Descripción:** Pedidos específicos de eventos

**Estructura:**
```
- Fecha Servicio
- Semana Servicios (S1, S2, S3)
- Platos pedidos
- Cantidades
```

---

#### 📋 **Hoja: Platos a la venta** (1530 filas × 10 columnas)
**Descripción:** Catálogo de platos disponibles

**Estructura:**
```
- Codigo Plato
- Nombre Plato
- Grupo Menu
- Preparacion (Fria/Caliente)
- Plato a la Venta (Si/No)
- Coste Raciones
- Peso
```

**Relaciones:**
- ← Platos (fabricación.xlsb)
- → Menus Eventos

---

#### 💳 **Hoja: campos TPV** (15 filas × 6 columnas)
**Descripción:** Categorías para TPV

**Estructura:**
```
- IMPUESTO (%)
- TIPO PREPARACION (Comida, Bebidas)
- CATEGORIA (Carta, Menu)
- ORDEN PREPARACION
- FAMILIA (Arroces, Carnes)
- Sub familia (frio, caliente)
```

---

#### 💰 **Hoja: Estudio € Eventos** (30 filas × 12 columnas)
**Descripción:** Análisis de costes por eventos

---

---

## 🔗 MAPA DE RELACIONES ENTRE HOJAS

```
FABRICACIÓN.XLSB

    ┌─────────────────────────────────────────────────────┐
    │                 DATOS MAESTROS                      │
    ├─────────────────────────────────────────────────────┤
    │ Articulos ──────────── Platos ──────────── Partidas │
    │    (1008)      (1023)        (292)                   │
    └─────────────────────────────────────────────────────┘
           ↓              ↓              ↓
    ┌─────────────────────────────────────────────────────┐
    │              RECETAS (ESCANDALLO)                   │
    ├─────────────────────────────────────────────────────┤
    │ Escandallo (8405) ─→ Articulos Escandallos (1640)  │
    └─────────────────────────────────────────────────────┘
           ↓
    ┌─────────────────────────────────────────────────────┐
    │        PLANNING Y PRODUCCIÓN                        │
    ├─────────────────────────────────────────────────────┤
    │ Base_Pedidos ─→ ORDEN PRODUCCION ─→ PLANG.PROD    │
    │    (998)            (47)           (100)            │
    │       ↓              ↓              ↓                │
    │   Produccion ──────────────────────────────────→   │
    │      (681)                                          │
    └─────────────────────────────────────────────────────┘
           ↓              ↓              ↓
    ┌─────────────────────────────────────────────────────┐
    │          TRAZABILIDAD Y CONTROL                     │
    ├─────────────────────────────────────────────────────┤
    │ Trazabilidad Fecha ─→ Trazabilidad Platos         │
    │      (996)                (3253)                    │
    │       ↓
    │ Datos_Etiquetas ──→ Impreso
    │     (2131)            (1080)
    │       ↓
    │ Sanidad (APPCC)
    │     (2171)
    └─────────────────────────────────────────────────────┘
           ↓
    ┌─────────────────────────────────────────────────────┐
    │          INVENTARIO Y ALMACÉN                       │
    ├─────────────────────────────────────────────────────┤
    │ Inventario (996) ←──── Base_Pedidos               │
    │       ↓                                              │
    │ Envase clientes (1641) ← Prod_Envases (3)         │
    └─────────────────────────────────────────────────────┘

OFERTA_C.XLSB

    ┌─────────────────────────────────────────────────────┐
    │          EVENTOS Y CLIENTES                         │
    ├─────────────────────────────────────────────────────┤
    │ Clientes (150) ──────→ Eventos (131)              │
    │       ↓                      ↓                      │
    │       └─────→ Pedidos Eventos (497)              │
    │                             ↓                      │
    │                    Menus Eventos (116)            │
    └─────────────────────────────────────────────────────┘
           ↓
    ┌─────────────────────────────────────────────────────┐
    │          CATÁLOGO Y CONFIGURACIÓN                   │
    ├─────────────────────────────────────────────────────┤
    │ Platos a la venta (1530) ← campos TPV (15)        │
    │       ↓
    │ Estudio € Eventos (30)
    └─────────────────────────────────────────────────────┘
```

---

## 🎯 MAPEO MODALES ↔ HOJAS

### MODAL 1: REGISTRO DE PRODUCCIÓN (TRAZABILIDAD)
**Correspondencia:** Hoja "Trazabilidad Fecha" + "Produccion"

**Campos Auto-rellenables:**
```
✓ Codigo Plato          → Select (desde Platos)
✓ Nombre Plato          → Auto (lookup Platos.Nombre)
✓ Ingredientes (lista)  → Auto (lookup Escandallo)
✓ Cantidad Producida    → Manual
✓ Lote Produccion       → Auto (YYYYMMDD-001)
✓ Fecha Produccion      → Auto (hoy)
✓ Partida Cocina        → Select (desde Partidas)
✓ Responsable           → Select (usuario actual)
✓ Observaciones         → Manual

Auto-calc:
- Coste Total = Cantidad × (Coste Racion desde Platos)
- Ingredientes necesarios = Cantidad × Escandallo
```

---

### MODAL 2: CREAR PARTIDA COCINA
**Correspondencia:** Hoja "Partidas"

**Campos:**
```
✓ Nombre Partida        → Manual (Cocina Fria, Cocina Caliente, etc.)
✓ Responsable           → Select (lista de usuarios)
✓ Descripcion           → Manual
✓ Equipos Disponibles   → Multi-select
✓ Activo                → Toggle (default: Si)
```

---

### MODAL 3: CREAR PEDIDO
**Correspondencia:** Hoja "Base_Pedidos"

**Campos Auto-rellenables:**
```
✓ Codigo Plato          → Select (desde Platos a venta)
✓ Nombre Plato          → Auto (lookup)
✓ Cantidad              → Manual
✓ Formato Envase        → Select (Cubetas, Barqueta GN 100, etc.)
✓ Cliente               → Select (desde Clientes oferta_c)
✓ Fecha Pedido          → Auto (hoy)
✓ Dias Servicio         → Select (Lunes 1 Alm., Martes 2 Cen., etc.)
✓ Dia Produccion        → Select (dropdown restringido por dia servicio)
✓ Estado                → Select (PEDIDO, EN PROCESO, SERVIDO)

Validaciones:
- Por cada Dia Servicio, solo 1 Dia Produccion (✓ PLANG.PROD)
```

---

### MODAL 4: CREAR/EDITAR EVENTO
**Correspondencia:** Hoja "Eventos" + "Clientes"

**Campos:**
```
✓ Codigo Evento         → Auto (Evento_1, Evento_2)
✓ Nombre Evento         → Manual (BODAS, CORPORATIVO, etc.)
✓ Tipo Evento           → Select
✓ Fecha Evento          → Date picker
✓ Clientes (multi)      → Multi-select (desde Clientes)
✓ Opciones Menus        → Multi-select

Auto-calc:
- Coste Total = Σ(Clientes.Nº × Opcion.Coste)
- Platos necesarios = Lookup Menus Eventos
```

---

### MODAL 5: CREAR CLIENTE EVENTO
**Correspondencia:** Hoja "Clientes"

**Campos:**
```
✓ Codigo Cliente        → Auto (Clt-1, Clt-2)
✓ Nombre Cliente        → Manual
✓ Evento                → Select (desde Eventos)
✓ Opcion                → Select (Opt-1, Opt-2, etc.)
✓ Nº Clientes           → Numeric
✓ Servicios             → Select (Almuerzo, Desayuno, Cena)
✓ Situacion             → Select (Hecho, Pendiente)
✓ Coste € Unitario      → Auto (lookup Eventos.Opcion.Coste)

Auto-calc:
- Coste Total = Nº Clientes × Coste € Unitario
```

---

### MODAL 6: CREAR ARTÍCULO
**Correspondencia:** Hoja "Articulos"

**Campos:**
```
✓ Codigo Interno        → Auto (AR-1, AR-2)
✓ Nombre Articulo       → Manual
✓ Familia               → Select (Aceites y Grasas, etc.)
✓ Grupo Conservacion    → Select (Congelado, Fresco, Neutro)
✓ Unidad Economato      → Select (Lt, Kg, Ud, etc.)
✓ Unidad Escandallo     → Select
✓ Formato Envase        → Manual
✓ Proveedor             → Select
✓ Coste Kilo            → Numeric
✓ Activo                → Toggle

Validaciones:
- Si Familia = "Aceites y Grasas" → Unidad = "Lt"
```

---

### MODAL 7: CREAR PLATO
**Correspondencia:** Hoja "Platos"

**Campos:**
```
✓ Codigo Plato          → Auto (PL-1, PL-2)
✓ Nombre Plato          → Manual
✓ Grupo Menu            → Select (Arroces, Carnes, etc.)
✓ Preparacion           → Select (Fria, Caliente)
✓ Unidad Escandallo     → Select (Ud, Kg)
✓ Peso Raciones         → Numeric (default: 0.75)
✓ Coste Racion          → Auto (Σ Escandallo)
✓ Plato a Venta         → Toggle (Si/No)
✓ Envases               → Multi-check (Cubetas, Barqueta GN 100, etc.)
✓ Alergia               → Multi-select (Gluten, Pescado, etc.)

Auto-calc:
- Coste Racion = Σ(Articulo.Coste Kilo × Cantidad en Escandallo)
```

---

### MODAL 8: CREAR ESCANDALLO (RECETA)
**Correspondencia:** Hoja "Escandallo"

**Campos:**
```
✓ Codigo Plato          → Select (desde Platos)
✓ Nombre Plato          → Auto
✓ Ingrediente 1         → Select (desde Articulos)
✓ Cantidad 1            → Numeric
✓ Unidad 1              → Auto (desde Articulo seleccionado)
✓ Ingrediente 2...N     → Repeat (dinámico, + botón)

Auto-calc:
- Coste Total = Σ(Articulo.Coste × Cantidad)
- Coste por Racion = Coste Total / Raciones
```

---

### MODAL 9: CONTROL SANIDAD (APPCC)
**Correspondencia:** Hoja "Sanidad"

**Campos:**
```
✓ Lote Produccion       → Select (auto-search)
✓ Plato                 → Auto (lookup desde Lote)
✓ Ingredientes          → Auto (lookup desde Escandallo)
✓ Fecha Produccion      → Auto
✓ Punto Critico         → Multi-select (pH, Temperatura, Tiempo, etc.)
✓ Temperatura (°C)      → Numeric
✓ Tiempo (min)          → Numeric
✓ Resultado             → Select (✓ OK, ✗ FUERA RANGO)
✓ Punto Corrector       → Text (si resultado = FUERA RANGO)
✓ Responsable           → Auto (usuario actual)

Validaciones:
- Si Plato.Preparacion = "Caliente" → Temp mín. 65°C
- Si Articulo.Grupo = "Fresco" → Puntos críticos obligatorios
```

---

### MODAL 10: ETIQUETADO
**Correspondencia:** Hoja "Datos_Etiquetas" + "Impreso"

**Campos:**
```
✓ Lote Produccion       → Select
✓ Plato                 → Auto
✓ Ingredientes (lista)  → Auto (alérgenos resaltados)
✓ NETO (kg)             → Numeric
✓ BRUTO (kg)            → Numeric
✓ % Perdidas            → Auto (BRUTO - NETO) / BRUTO
✓ Fecha Produccion      → Auto
✓ Fecha Caducidad       → Auto (fecha + dias_caducidad según grupo)
✓ Nº Etiquetas          → Numeric
✓ Imprimir              → Button (genera PDF)
```

---

### MODAL 11: ENVASE POR CLIENTE
**Correspondencia:** Hoja "Envase clientes"

**Campos:**
```
✓ Cliente               → Select (desde Clientes oferta_c)
✓ Plato                 → Select (desde Platos a venta)
✓ Raciones por Envase   → Numeric
✓ Tipo Envase           → Select (Cubetas, Barqueta GN 100, etc.)
✓ % Sin Pasteurizar     → Numeric
✓ Activo                → Toggle
```

---

## 🔄 LÓGICA DE AUTO-RELLENO

### PATRÓN 1: Lookup Simple
```javascript
// Cuando selecciono Codigo Plato
codigo_plato.onChange = (codigoSeleccionado) => {
  const plato = db.platos.find(p => p.codigo === codigoSeleccionado);
  nombre_plato.value = plato.nombre;              // Auto-fill
  coste_racion.value = plato.coste_racion;        // Auto-fill
  preparacion.value = plato.preparacion;          // Auto-fill
  // Llena también Escandallo
  escandallo.items = db.escandallo.filter(
    e => e.codigo_plato === codigoSeleccionado
  );
};
```

### PATRÓN 2: Auto-cálculo
```javascript
// Cuando cambio cantidad
cantidad.onChange = (cantidad) => {
  const plato = getCurrentPlato();
  const escandallo_items = db.escandallo.filter(
    e => e.codigo_plato === plato.codigo
  );
  
  // Calcular ingredientes necesarios
  escandallo_items.forEach(item => {
    item.cantidad_necesaria = item.cantidad_base * cantidad;
  });
  
  // Calcular coste
  coste_total.value = plato.coste_racion * cantidad;
};
```

### PATRÓN 3: Validación Dropdown
```javascript
// PLANG.PROD: Por cada Dia Servicio, solo 1 Dia Produccion
dia_servicio.onChange = (servicioSeleccionado) => {
  // Obtener dias produccion válidos para este servicio
  const dias_produccion_validos = 
    db.plang_prod.filter(p => p.dia_servicios.includes(servicioSeleccionado))
    .map(p => p.dia_produccion);
  
  dia_produccion.options = dias_produccion_validos;
  dia_produccion.value = null;  // Reset
};
```

### PATRÓN 4: Búsqueda con Autosuggest
```javascript
// Campo Lote Produccion (search)
lote_produccion.onChange = (búsqueda) => {
  const resultados = db.trazabilidad.filter(t =>
    t.lote.includes(búsqueda) &&
    t.activo === 1
  );
  
  lote_produccion.suggestions = resultados.map(t => ({
    label: `${t.lote} - ${t.plato}`,
    value: t.lote
  }));
};
```

---

## 🗄️ SCHEMA ACTUALIZADO NECESARIO

```javascript
// Tablas para soportar relaciones

// MAESTROS
articulos: {
  id, codigo, nombre, familia, grupo_conservacion,
  unidad_economato, unidad_escandallo, coste_kilo, activo
}

platos: {
  id, codigo, nombre, grupo_menu, preparacion,
  coste_racion, peso_raciones, plato_venta, activo
}

partidas: {
  id, nombre, responsable, descripcion, activo
}

clientes: {
  id, codigo, nombre, email, telefono
}

// RELACIONES
escandallo: {
  id, codigo_plato, codigo_articulo, cantidad, unidad, coste_total
}

pedidos: {
  id, codigo_plato, cantidad, formato_envase, cliente_id,
  fecha_pedido, dia_servicio, dia_produccion, estado
}

// PRODUCCIÓN
produccion: {
  id, codigo_plato, lote, fecha_produccion, partida_id,
  cantidad_producida, responsable, estado
}

// TRAZABILIDAD
trazabilidad: {
  id, lote_produccion, codigo_plato, codigo_articulo,
  cantidad_usada, fecha, partida_id, responsable
}

// EVENTOS (OFERTA)
eventos: {
  id, codigo, nombre, tipo, fecha, estado
}

evento_clientes: {
  id, evento_id, cliente_id, nº_clientes, servicio
}

evento_menus: {
  id, evento_id, codigo_plato, cantidad_total, por_opcion
}

// SANIDAD
sanidad: {
  id, lote_produccion, punto_critico, valor_medido,
  valor_esperado, resultado, fecha, responsable
}

// ETIQUETAS
etiquetas: {
  id, lote_produccion, neto, bruto, nº_etiquetas,
  fecha_produccion, fecha_caducidad
}
```

---

## ⚙️ RECOMENDACIONES IMPLEMENTACIÓN

### 1. **Arquitectura Modales**
```
ModalDinamico
├── Campos (generados desde config)
├── Validaciones (por tipo de campo)
├── Auto-relleno (listeners)
├── Auto-cálculo (watchers)
└── Submit (con lookup de datos relacionados)
```

### 2. **Sistema de Dropdowns Dinámicos**
```
- Mantener índices en memoria (articulos, platos, etc.)
- Usar debounce para búsquedas
- Cache de resultados recientes
- Validación de existencia antes de guardar
```

### 3. **Validaciones Críticas**
```
- PLANG.PROD: Una sola activación por dia de servicio
- Sanidad: Validar rangos según tipo de plato
- Inventario: No permitir pedidos sin stock disponible
- Trazabilidad: Lote único por fecha-plato-partida
```

### 4. **Workflows Sugeridos**
```
Flujo Completo de Producción:
1. Crear Pedido (Base_Pedidos)
   ↓
2. Generar Orden Produccion (asignar dia)
   ↓
3. Validar Planning (PLANG.PROD)
   ↓
4. Registrar Produccion (Produccion + Trazabilidad)
   ↓
5. Control Sanidad (validar puntos críticos)
   ↓
6. Etiquetar (generar etiquetas)
   ↓
7. Servir (actualizar estado a SERVIDO)
```

---

**✅ Análisis completo. Proceder a implementar modales dinámicos con auto-relleno.**
