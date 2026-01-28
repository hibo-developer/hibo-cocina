/**
 * AUDITORÍA DE FUNCIONALIDAD - HIBO COCINA
 * Verificar qué falta para que la app funcione 100% como los Excel
 */

const XLSX = require('xlsx');
const fs = require('fs');

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║  AUDITORÍA: Funcionalidad requerida vs Implementada                ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const wb1 = XLSX.readFile('fabricación.xlsx');
const wb2 = XLSX.readFile('oferta_c.xlsx');

// Leer archivos relevantes
const platosRuta = fs.existsSync('src/routes/platos.js');
const ingredientesRuta = fs.existsSync('src/routes/ingredientes.js');
const escandallosRuta = fs.existsSync('src/routes/escandallos.js');
const inventarioRuta = fs.existsSync('src/routes/inventario.js');
const pedidosRuta = fs.existsSync('src/routes/pedidos.js');
const sanidadRuta = fs.existsSync('src/routes/sanidad.js');
const ofertasRuta = fs.existsSync('src/routes/ofertas.js');
const produccionRuta = fs.existsSync('src/routes/produccion.js');

// Funciones esperadas del Excel (basadas en hojas)
const funcionesEsperadas = {
  'Platos': {
    backend: ['GET /api/platos', 'POST /api/platos', 'PUT /api/platos/:id', 'DELETE /api/platos/:id'],
    logica: ['Validar código único', 'Calcular costes', 'Gestionar alergenos', 'Generar etiquetas'],
    frontend: ['Listar platos', 'Crear plato', 'Editar plato', 'Ver detalle', 'Filtrar por tipo'],
    excel: ['Código', 'Nombre', 'Descripción', 'Peso', 'Alergenos', 'Precio venta']
  },
  'Ingredientes': {
    backend: ['GET /api/ingredientes', 'POST /api/ingredientes', 'PUT /api/ingredientes/:id'],
    logica: ['Validar código único', 'Gestionar proveedores', 'Control de stock', 'Conversión de unidades'],
    frontend: ['Listar ingredientes', 'Crear ingrediente', 'Editar ingrediente', 'Stock actual'],
    excel: ['Código', 'Nombre', 'Familia', 'Unidad economato', 'Proveedor', 'Coste unitario']
  },
  'Escandallos': {
    backend: ['GET /api/escandallos', 'POST /api/escandallos', 'PUT /api/escandallos/:id'],
    logica: ['Calcular coste del plato', 'Validar referencias', 'Rendimiento (rendim)', 'Coste unitario'],
    frontend: ['Ver composición del plato', 'Editar receta', 'Calcular coste', 'Impacto de cambios'],
    excel: ['Plato', 'Ingrediente', 'Cantidad', 'Unidad', 'Coste escandallo']
  },
  'Inventario': {
    backend: ['GET /api/inventario', 'PUT /api/inventario/:id', 'POST /api/inventario/compras'],
    logica: ['Actualizar stock', 'Validar stock mínimo', 'Alertas de falta', 'Rotación FIFO'],
    frontend: ['Ver stock disponible', 'Registrar compras', 'Alertas de reorden', 'Historial'],
    excel: ['Ingrediente', 'Stock actual', 'Stock mínimo', 'Stock máximo', 'Última compra']
  },
  'Pedidos': {
    backend: ['GET /api/pedidos', 'POST /api/pedidos', 'PUT /api/pedidos/:id', 'POST /api/pedidos/:id/confirmar'],
    logica: ['Validar disponibilidad', 'Calcular totales', 'Estado del pedido', 'Generar albaran'],
    frontend: ['Crear pedido', 'Ver pedidos', 'Cambiar estado', 'Imprimir', 'Seguimiento'],
    excel: ['Número pedido', 'Cliente', 'Platos', 'Cantidades', 'Fecha entrega', 'Estado']
  },
  'Producción': {
    backend: ['GET /api/produccion', 'POST /api/produccion', 'PUT /api/produccion/:id'],
    logica: ['Planificar producción', 'Asignar partidas', 'Calcular insumos', 'Control de tiempos'],
    frontend: ['Ver plan de producción', 'Asignar tareas', 'Registrar avance', 'Control de calidad'],
    excel: ['Semana', 'Platos', 'Cantidades', 'Partidas', 'Envases', 'Responsables']
  },
  'Sanidad': {
    backend: ['GET /api/sanidad', 'POST /api/sanidad', 'PUT /api/sanidad/:id'],
    logica: ['Validar puntos críticos', 'Control de temperatura', 'Trazabilidad', 'Cumplimiento APPCC'],
    frontend: ['Registrar controles', 'Ver histórico', 'Alertas', 'Conformidad', 'Informes APPCC'],
    excel: ['Plato', 'Ingrediente', 'Punto crítico', 'Rango temp', 'Acción correctora']
  }
};

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║  1. MÓDULOS BACKEND                                               ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const modulosBackend = {
  'platos.js': { existe: platosRuta, status: platosRuta ? '✅' : '❌' },
  'ingredientes.js': { existe: ingredientesRuta, status: ingredientesRuta ? '✅' : '❌' },
  'escandallos.js': { existe: escandallosRuta, status: escandallosRuta ? '✅' : '❌' },
  'inventario.js': { existe: inventarioRuta, status: inventarioRuta ? '✅' : '❌' },
  'pedidos.js': { existe: pedidosRuta, status: pedidosRuta ? '✅' : '❌' },
  'sanidad.js': { existe: sanidadRuta, status: sanidadRuta ? '✅' : '❌' },
  'ofertas.js': { existe: ofertasRuta, status: ofertasRuta ? '✅' : '❌' },
  'produccion.js': { existe: produccionRuta, status: produccionRuta ? '⚠️' : '❌' }
};

Object.entries(modulosBackend).forEach(([modulo, info]) => {
  console.log(`${info.status} ${modulo}`);
});

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║  2. FUNCIONALIDAD CRÍTICA FALTANTE                                ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const funcionesCriticas = [
  { nombre: 'Cálculo de costes de platos', status: '⚠️', razon: 'Parcialmente implementado' },
  { nombre: 'Validación de referencias foráneas', status: '❌', razon: 'No validado en importación' },
  { nombre: 'Control de stock en tiempo real', status: '⚠️', razon: 'Parcial, falta alertas' },
  { nombre: 'Validación de stock antes de pedido', status: '❌', razon: 'No validado' },
  { nombre: 'Generación de albaraes', status: '❌', razon: 'No implementado' },
  { nombre: 'Trazabilidad completa', status: '❌', razon: 'No implementado' },
  { nombre: 'Plan de producción automático', status: '❌', razon: 'No implementado' },
  { nombre: 'Control APPCC (Sanidad)', status: '⚠️', razon: 'Módulo existe, falta lógica' },
  { nombre: 'Rotación FIFO en inventario', status: '❌', razon: 'No implementado' },
  { nombre: 'Alertas de stock mínimo', status: '❌', razon: 'No implementado' },
  { nombre: 'Cálculo de rendimiento de ingredientes', status: '❌', razon: 'No implementado' },
  { nombre: 'Gestión de alergenos', status: '⚠️', razon: 'Campos existen, falta filtros' }
];

funcionesCriticas.forEach(f => {
  console.log(`${f.status} ${f.nombre.padEnd(40)} - ${f.razon}`);
});

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║  3. FRONTEND - VISTAS Y FUNCIONALIDAD                             ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const frontendVistas = [
  { vista: 'Dashboard', status: '✅', nota: 'Existe pero muy básico' },
  { vista: 'Platos (CRUD)', status: '✅', nota: 'Funcional' },
  { vista: 'Ingredientes (CRUD)', status: '✅', nota: 'Funcional' },
  { vista: 'Escandallos', status: '✅', nota: 'Básico, sin cálculos' },
  { vista: 'Inventario', status: '✅', nota: 'Básico, sin alertas' },
  { vista: 'Pedidos', status: '✅', nota: 'Básico' },
  { vista: 'Producción', status: '⚠️', nota: 'Existe pero sin lógica' },
  { vista: 'Sanidad (APPCC)', status: '✅', nota: 'Existe pero básico' },
  { vista: 'Reportes', status: '❌', nota: 'No implementado' },
  { vista: 'Alergenos (filtros)', status: '⚠️', nota: 'Parcial' },
  { vista: 'Análisis de costes', status: '❌', nota: 'No implementado' },
  { vista: 'Exportación de datos', status: '⚠️', nota: 'Solo import' }
];

frontendVistas.forEach(v => {
  console.log(`${v.status} ${v.vista.padEnd(30)} - ${v.nota}`);
});

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║  RESUMEN EJECUTIVO                                                ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const implementadas = funcionesCriticas.filter(f => f.status === '✅').length;
const parciales = funcionesCriticas.filter(f => f.status === '⚠️').length;
const faltantes = funcionesCriticas.filter(f => f.status === '❌').length;

console.log(`✅ Funciones implementadas: ${implementadas}/${funcionesCriticas.length}`);
console.log(`⚠️  Funciones parciales: ${parciales}/${funcionesCriticas.length}`);
console.log(`❌ Funciones faltantes: ${faltantes}/${funcionesCriticas.length}`);
console.log(`\n📊 Cobertura funcional: ${Math.round((implementadas + parciales/2) / funcionesCriticas.length * 100)}%`);

console.log('\n✅ CONCLUSIÓN:');
console.log('   La app necesita:');
console.log('   1. Implementar lógica de negocio faltante (cálculos, validaciones)');
console.log('   2. Mejorar UI/UX del frontend');
console.log('   3. Añadir validaciones robustas en backend');
console.log('   4. Implementar módulos pendientes (Producción, Eventos)');
console.log('   5. Crear reportes y análisis');
console.log('   6. Una vez completo, eliminar dependencia de archivos Excel');
