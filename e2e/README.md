# E2E Testing con Playwright

## 📋 Descripción

Suite completa de tests end-to-end (E2E) usando Playwright para validar toda la aplicación desde la perspectiva del usuario.

## 🗂️ Estructura de Tests

```
e2e/
├── auth.spec.js          # Tests de autenticación y sesión
├── platos.spec.js        # Tests del módulo de Platos (CRUD)
├── ingredientes.spec.js  # Tests del módulo de Ingredientes
├── pedidos.spec.js       # Tests del módulo de Pedidos
├── inventario.spec.js    # Tests del módulo de Inventario
├── escandallos.spec.js   # Tests del módulo de Escandallos (costos)
├── api.spec.js           # Tests de integración API
├── fixtures.js           # Fixtures y utilities compartidas
└── playwright.config.js  # Configuración de Playwright
```

## 🚀 Instalación

Las dependencias ya están instaladas. Para reinstalar:

```bash
npm install --save-dev @playwright/test
```

## 🧪 Ejecutar Tests

### Todos los tests E2E
```bash
npm run test:e2e
```

### Tests en modo headed (con navegador visible)
```bash
npm run test:e2e:headed
```

### Tests en modo debug
```bash
npm run test:e2e:debug
```

### Interfaz interactiva
```bash
npm run test:e2e:ui
```

### Ver reporte HTML
```bash
npm run test:e2e:report
```

### Todos los tests (unit + E2E)
```bash
npm run test:all
```

## 📊 Suite de Tests

### 1. **auth.spec.js** - Autenticación (5 tests)
- ✓ Cargar página de login
- ✓ Login con credenciales válidas
- ✓ Error con credenciales inválidas
- ✓ Logout
- ✓ Persistencia de sesión en reload

### 2. **platos.spec.js** - Gestión de Platos (7 tests)
- ✓ Cargar lista de platos
- ✓ Ver detalles de plato
- ✓ Crear nuevo plato
- ✓ Editar plato existente
- ✓ Eliminar plato con confirmación
- ✓ Buscar/filtrar platos
- ✓ Mostrar estadísticas

### 3. **ingredientes.spec.js** - Gestión de Ingredientes (6 tests)
- ✓ Cargar lista de ingredientes
- ✓ Crear nuevo ingrediente
- ✓ Ver detalles de ingrediente
- ✓ Actualizar ingrediente
- ✓ Mostrar alérgenos
- ✓ Filtrar por tipo

### 4. **pedidos.spec.js** - Gestión de Pedidos (7 tests)
- ✓ Cargar lista de pedidos
- ✓ Crear nuevo pedido
- ✓ Ver detalles de pedido
- ✓ Actualizar estado de pedido
- ✓ Mostrar estadísticas
- ✓ Filtrar por estado
- ✓ Exportar pedidos

### 5. **inventario.spec.js** - Gestión de Inventario (8 tests)
- ✓ Cargar lista de inventario
- ✓ Mostrar niveles de stock
- ✓ Actualizar cantidad de stock
- ✓ Identificar items con stock bajo
- ✓ Filtrar por tipo
- ✓ Buscar items
- ✓ Mostrar estadísticas
- ✓ Ver historial de movimientos

### 6. **escandallos.spec.js** - Análisis de Costos (9 tests)
- ✓ Cargar lista de escandallos
- ✓ Ver detalles
- ✓ Mostrar desglose de costos
- ✓ Calcular costo total
- ✓ Actualizar ingredientes de receta
- ✓ Filtrar por plato
- ✓ Comparar costo vs precio de venta
- ✓ Exportar reporte

### 7. **api.spec.js** - Integración API (12 tests)
- ✓ Health check
- ✓ Listar platos
- ✓ Paginación en platos
- ✓ Estadísticas de platos
- ✓ Listar ingredientes
- ✓ Listar pedidos
- ✓ Estadísticas de pedidos
- ✓ Listar inventario
- ✓ Listar escandallos
- ✓ Manejo de 404
- ✓ Rate limiting
- ✓ Headers y validación JSON

**Total: 54+ test cases**

## 🔐 Credenciales para Tests

Usa estas credenciales en los tests:
```javascript
{
  email: 'admin@example.com',
  password: 'admin123'
}
```

Asegúrate de que estos credenciales existan en la base de datos.

## 🎯 Mejores Prácticas

### 1. **Selectores Robustos**
```javascript
// ✓ Bueno - específico y accesible
const loginBtn = page.locator('button[type="submit"]');

// ✓ Bueno - por texto
const platosLink = page.locator('a:has-text("Platos")');

// ✗ Evitar - selectores frágiles
const btn = page.locator('button.btn-primary.bg-blue-500');
```

### 2. **Waits Explícitos**
```javascript
// ✓ Esperar elemento visible
await expect(element).toBeVisible();

// ✓ Esperar URL
await page.waitForURL(/.*dashboard.*/);

// ✗ Evitar - hardcoded delays
// await page.waitForTimeout(5000);
```

### 3. **Manejo de Errores**
```javascript
// ✓ Usar try-catch para operaciones opcionales
if (await element.isVisible()) {
  await element.click();
}

// ✓ Verificar estado antes de actuar
const btnCount = await locator.count();
expect(btnCount).toBeGreaterThan(0);
```

### 4. **Fixtures y Setup**
```javascript
// ✓ Usar test.beforeEach para repetitivos
test.beforeEach(async ({ page }) => {
  await loginPage(page);
});

// ✓ Usar fixtures para código compartido
const { test, expect, TEST_USER } = require('./fixtures');
```

## 📈 Configuración en playwright.config.js

```javascript
module.exports = defineConfig({
  testDir: './e2e',           // Directorio de tests
  fullyParallel: true,        // Ejecutar en paralelo
  forbidOnly: !!process.env.CI, // Fail on test.only in CI
  retries: 0,                 // Reintentos
  workers: 1,                 // Workers paralelos
  reporter: 'html',           // Reporte HTML
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

## 🐛 Debugging

### Modo Debug Interactivo
```bash
npm run test:e2e:debug
```

Comandos disponibles:
- `c` - continuar hasta siguiente breakpoint
- `s` - step into
- `n` - next
- `o` - step out
- `p` - show page
- `l` - list locators
- `e` - evaluate expression

### Inspect Element
```javascript
// Pausa y abre inspector
await page.pause();

// Despuée puedes inspeccionar el DOM
await page.screenshot({ path: 'debug.png' });
```

### Traces
```javascript
// Los traces se guardan automáticamente en on-first-retry
// Ver con:
npx playwright show-trace trace.zip
```

## 📊 CI/CD Integration

Los tests E2E están integrados en el workflow de GitHub Actions:

```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  
- name: Upload Test Report
  if: always()
  uses: actions/upload-artifact@v2
  with:
    name: playwright-report
    path: playwright-report/
```

## 🔍 Monitoreo

### Reporte HTML
Después de cada ejecución:
```bash
npm run test:e2e:report
```

Se abre automáticamente en el navegador con:
- ✓ Tests pasados/fallidos
- ⏱ Duración de cada test
- 📸 Screenshots en fallos
- 🎥 Videos (si está habilitado)
- 📝 Logs detallados

## 🚨 Troubleshooting

### Test cuelga en login
```javascript
// Aumenta timeout
test.setTimeout(60000);

// Espera explícita más larga
await page.waitForURL(/.*(?:index|dashboard).*/, { timeout: 30000 });
```

### Selector no encontrado
```javascript
// Usa locator en lugar de querySelector
const btn = page.locator('button:has-text("Platos")');
await expect(btn).toBeVisible({ timeout: 10000 });
```

### Rate limiting en tests
```javascript
// Usa delays entre requests en API tests
await page.waitForTimeout(100);
```

## 📚 Recursos

- [Documentación Oficial Playwright](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors](https://playwright.dev/docs/locators)
- [API Testing](https://playwright.dev/docs/api-testing)

## 🎯 Próximos Pasos

- [ ] Agregar tests visuales (visual regression)
- [ ] Agregar tests de performance
- [ ] Agregar tests de accesibilidad (a11y)
- [ ] Agregar coverage report
- [ ] Integrar con Allure Report
- [ ] Mobile testing (responsive)
