# Lógica de Negocio del Excel - Documentación

## Resumen
Implementación de las fórmulas y lógica de negocio del archivo `fabricación.xlsb` en la aplicación web.

## 📊 Servicios Implementados

### 1. CalculadoraCostes (`src/services/CalculadoraCostes.js`)

Replica las fórmulas de cálculo de costes de la hoja "Escandallos" del Excel.

#### Métodos Principales:

##### `calcularCosteIngrediente(cantidadBruta, unidad, perdida, costeKilo, pesoUnidad)`
**Fórmula Excel replicada:**
```excel
I = IF(F="kg", H) + IF(F="ud", H*G) + IF(F="lt", H)  // Conversión a kg/lt
K = I - I*J                                           // Aplicar pérdidas
M = L * I                                             // Coste total
```

**Uso:**
```javascript
const calculo = calculadora.calcularCosteIngrediente(
  0.5,    // 500g
  'kg',   // kilos
  0.15,   // 15% pérdida
  10.5,   // 10.5€/kg
  0       // peso unidad (solo para 'ud')
);
// Resultado: { cantidadNeta: 0.425, cantidadKilos: 0.5, costeTotal: 5.25 }
```

##### `calcularCosteEscandallo(platoId)`
**Fórmula Excel replicada:**
```excel
Coste Total = SUM(M8:M27)           // Suma de costes de ingredientes
Pérdida Total = 100% - K7/I7        // Porcentaje de merma total
```

**Retorna:**
- `costeTotal`: Suma de todos los costes de ingredientes
- `pesoNetoTotal`: Peso total después de pérdidas
- `pesoBrutoTotal`: Peso total antes de pérdidas
- `perdidaTotal`: Porcentaje de merma
- `ingredientes[]`: Detalle por ingrediente

##### `calcularCosteRacion(platoId, pesoRacion)`
**Fórmula Excel replicada:**
```excel
L = SUM(M8:M27) / K7    // Coste por kg
Coste Ración = L * peso_racion
```

**Uso automático:**
- Se actualiza automáticamente al crear/modificar/eliminar ingredientes del escandallo
- Se guarda en la tabla `platos.coste_racion`

##### `calcularAlergenosPlato(platoId)`
**Fórmula Excel replicada:**
```excel
AO7 = IF(COUNTIF(AO8:AO27,"X"),"x",0)  // Para cada alérgeno
```

**Lógica:**
- Si **algún** ingrediente del escandallo tiene un alérgeno marcado → el plato lo hereda
- Se actualiza automáticamente junto con el coste

---

### 2. ControlStock (`src/services/ControlStock.js`)

Gestiona el inventario y replica las fórmulas de stock del Excel.

#### Métodos Principales:

##### `descontarProduccion(platoId, cantidad)`
**Lógica de negocio:**
```
Para cada ingrediente del escandallo:
  stock_actual = stock_actual - (cantidad_ingrediente * cantidad_platos)
```

**Trigger:**
- Se ejecuta automáticamente al crear un registro de trazabilidad/producción
- Registra el movimiento en la tabla `movimientos_stock`

**Ejemplo:**
```javascript
// Al producir 50 platos de "Arroz caldoso"
await controlStock.descontarProduccion('PL-1', 50);
// Descuenta: 0.16kg arroz x 50, 0.42kg bogavante x 50, etc.
```

##### `calcularNecesidadesSemanales(semana)`
**Fórmula Excel replicada (hoja Trazabilidad):**
```excel
E4 = SUMIF(Escandallos!$C$6:$O$8406, ingrediente, cantidad) + pedidos_semana
```

**SQL Implementado:**
```sql
SELECT 
  i.codigo,
  SUM(e.cantidad * p.cantidad_pedida) as cantidad_necesaria,
  inv.stock_actual,
  (SUM(...) - stock_actual) as cantidad_pedir
FROM pedidos p
JOIN escandallos e ON p.plato_id = e.plato_id
JOIN ingredientes i ON e.ingrediente_id = i.id
WHERE p.semana = ?
GROUP BY i.codigo
HAVING cantidad_pedir > 0
```

**Endpoint:**
```
GET /api/stock/necesidades/:semana
```

##### `verificarAlertas()`
**Fórmula Excel replicada:**
```excel
IF(stock_actual < stock_reserva, "ALERTA", "OK")
```

**Retorna:** Lista de ingredientes con stock por debajo del mínimo

**Endpoint:**
```
GET /api/stock/alertas
```

##### `calcularValorInventario()`
**Fórmula:**
```excel
Valor Total = SUM(stock_actual * coste_kilo)
```

**Endpoint:**
```
GET /api/stock/valor
```

---

## 🔄 Flujo Automático de Cálculos

### Escenario 1: Modificar Escandallo

```mermaid
Usuario modifica cantidad ingrediente
    ↓
escandallosController.actualizar()
    ↓
CalculadoraCostes.calcularCosteEscandallo(plato_id)
    ↓
CalculadoraCostes.actualizarCostePlato()
    ├── Calcula coste_racion
    ├── Calcula alérgenos heredados
    └── UPDATE platos SET coste_racion=X, sesamo='x', etc.
```

### Escenario 2: Registrar Producción

```mermaid
Usuario crea registro trazabilidad
    ↓
trazabilidadController.crear(plato_id, cantidad)
    ↓
ControlStock.descontarProduccion()
    ├── Por cada ingrediente:
    │   ├── UPDATE inventario SET stock_actual -= cantidad
    │   └── INSERT INTO movimientos_stock
    └── Retorna movimientos realizados
```

### Escenario 3: Planificar Semana

```mermaid
Usuario consulta necesidades semana X
    ↓
GET /api/stock/necesidades/:semana
    ↓
ControlStock.calcularNecesidadesSemanales()
    ├── JOIN pedidos + escandallos + ingredientes
    ├── SUM(cantidad * pedidos)
    ├── Comparar con stock_actual
    └── RETURN lista de ingredientes a pedir
```

---

## 📋 Endpoints Nuevos

### Stock

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/stock/alertas` | Ingredientes con stock bajo |
| GET | `/api/stock/necesidades/:semana` | Necesidades semanales |
| GET | `/api/stock/valor` | Valor total del inventario |
| POST | `/api/stock/entrada` | Registrar entrada manual |
| POST | `/api/stock/salida` | Registrar salida manual |
| GET | `/api/stock/movimientos` | Historial de movimientos |

### Ejemplo uso:

```javascript
// Consultar alertas
const response = await fetch('/api/stock/alertas');
const alertas = await response.json();
// [{codigo: 'AR-5', nombre: 'Arroz bomba', stock_actual: 2, stock_reserva: 10, cantidad_faltante: 8}]

// Calcular necesidades semana 15
const necesidades = await fetch('/api/stock/necesidades/15').then(r => r.json());
// [{codigo: 'AR-5', nombre: 'Arroz', cantidad_necesaria: 25, stock_actual: 2, cantidad_pedir: 23}]

// Registrar entrada
await fetch('/api/stock/entrada', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    ingrediente_id: 'AR-5',
    cantidad: 50,
    motivo: 'Pedido proveedor PP-123'
  })
});
```

---

## 🗄️ Cambios en Base de Datos

### Nueva Tabla: `movimientos_stock`

```sql
CREATE TABLE movimientos_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  articulo_codigo TEXT NOT NULL,
  tipo TEXT CHECK(tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'PRODUCCION')) NOT NULL,
  cantidad REAL NOT NULL,
  motivo TEXT,
  stock_resultante REAL,
  usuario TEXT,
  documento_ref TEXT
);
```

**Tipos de movimientos:**
- `ENTRADA`: Compras, devoluciones
- `SALIDA`: Ventas, desperdicios
- `AJUSTE`: Correcciones de inventario
- `PRODUCCION`: Descuentos automáticos por producción

---

## 🔧 Integración con Controladores

### escandallosController.js

**Cambios:**
```javascript
// Al crear escandallo
exports.crear = async (req, res) => {
  const escandallo = await Escandallo.crear(datos);
  
  // ✅ NUEVO: Recalcular coste del plato automáticamente
  await calculadora.actualizarCostePlato(plato_id);
  
  res.json(escandallo);
};
```

### trazabilidadController.js

**Cambios:**
```javascript
// Al crear trazabilidad
exports.crear = async (req, res) => {
  const trazabilidad = await Trazabilidad.crear(datos);
  
  // ✅ NUEVO: Descontar ingredientes del stock
  await controlStock.descontarProduccion(codigo_plato, cantidad_producida);
  
  res.json(trazabilidad);
};
```

---

## 📊 Fórmulas Excel → JavaScript

### Tabla de Equivalencias

| Fórmula Excel Original | Implementación JavaScript |
|------------------------|---------------------------|
| `=I8*L8` | `cantidadKilos * costeKilo` |
| `=I8-I8*J8` | `cantidad - (cantidad * perdida)` |
| `=SUM(M8:M27)` | `ingredientes.reduce((sum, ing) => sum + ing.coste, 0)` |
| `=VLOOKUP(C8,Articulos!$B:$M,12,FALSE)` | `JOIN ingredientes ON codigo` |
| `=IF(COUNTIF(AO8:AO27,"X"),"x",0)` | `ingredientes.some(i => i.sesamo === 'X') ? 'x' : 0` |
| `=SUMIF(Escandallos!$C:$C,ingrediente,cantidad)` | `SUM(e.cantidad) WHERE e.ingrediente_id = ?` |

---

## 🚀 Próximos Pasos

### Pendiente de implementar:

1. **Cálculo de número de semana:**
   ```excel
   =WEEKNUM(fecha_produccion)
   ```
   → Usar en Trazabilidad para agrupar por semanas

2. **Formatos GN (Gastronorm):**
   ```excel
   =IFS(formato="GN 1/1", peso_total, formato="GN 1/2", peso_total/2, ...)
   ```
   → Calcular porciones según formato de cubeta

3. **Valores esperados APPCC:**
   ```excel
   =IF(AND(valor_medido>=min, valor_medido<=max), "OK", "NO OK")
   ```
   → Validación automática de controles de sanidad

4. **Plantillas de producción:**
   ```excel
   =IF(plantilla="Preparacion", anticipado=1, anticipado=0)
   ```
   → Determinar días de anticipación según tipo de plato

---

## 📝 Notas de Desarrollo

- **Performance:** Los cálculos se ejecutan de forma asíncrona para no bloquear
- **Errores:** Si falla un cálculo, no se bloquea la operación principal (solo se logea)
- **Transacciones:** Pendiente implementar transacciones SQLite para rollback en caso de error
- **Testing:** Pendiente crear tests unitarios para las fórmulas

---

## 🐛 Debugging

Para activar logs detallados de cálculos:

```javascript
// En CalculadoraCostes.js
console.log('Calculando coste ingrediente:', {
  cantidadBruta,
  unidad,
  perdida,
  costeKilo,
  resultado: calculo
});
```

Ver movimientos de stock en tiempo real:
```sql
SELECT * FROM movimientos_stock 
ORDER BY fecha DESC 
LIMIT 50;
```

---

## 📖 Referencias

- Excel original: `fabricación.xlsb`
- Script de análisis: `analizar_logica_excel.js`
- Commit: `d92f896` - "feat: Implementar lógica de negocio del Excel"
