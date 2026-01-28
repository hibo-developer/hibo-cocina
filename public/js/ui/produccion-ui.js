/**
 * UI - Gestión de Producción
 * Manejo de interfaz de usuario para órdenes, lotes y consumos
 */

// Estado local de la sección de producción
let produccionState = {
  ordenes: [],
  lotes: [],
  consumos: [],
  platos: [],
  ingredientes: [],
  filtroEstadoOrdenes: '',
  filtroEstadoLotes: '',
  filtroOrdenIdConsumos: ''
};

// ============================================================================
// FUNCIONES DE CARGA
// ============================================================================

async function cargarOrdenesProduccion() {
  try {
    const filtros = {};
    if (produccionState.filtroEstadoOrdenes) {
      filtros.estado = produccionState.filtroEstadoOrdenes;
    }

    const response = await ProduccionService.obtenerOrdenes(filtros);
    if (response.success) {
      produccionState.ordenes = response.data || [];
      renderizarOrdenesProduccion();
    } else {
      mostrarNotificacion('Error al cargar órdenes', 'error');
    }
  } catch (error) {
    console.error('Error cargando órdenes:', error);
    mostrarNotificacion('Error al cargar órdenes de producción', 'error');
  }
}

async function cargarLotesProduccion() {
  try {
    const filtros = {};
    if (produccionState.filtroEstadoLotes) {
      filtros.estado = produccionState.filtroEstadoLotes;
    }

    const response = await ProduccionService.obtenerLotes(filtros);
    if (response.success) {
      produccionState.lotes = response.data || [];
      renderizarLotesProduccion();
    } else {
      mostrarNotificacion('Error al cargar lotes', 'error');
    }
  } catch (error) {
    console.error('Error cargando lotes:', error);
    mostrarNotificacion('Error al cargar lotes de producción', 'error');
  }
}

async function cargarConsumosProduccion() {
  try {
    const filtros = {};
    if (produccionState.filtroOrdenIdConsumos) {
      filtros.orden_id = produccionState.filtroOrdenIdConsumos;
    }

    const response = await ProduccionService.obtenerConsumos(filtros);
    if (response.success) {
      produccionState.consumos = response.data || [];
      renderizarConsumosProduccion();
    } else {
      mostrarNotificacion('Error al cargar consumos', 'error');
    }
  } catch (error) {
    console.error('Error cargando consumos:', error);
    mostrarNotificacion('Error al cargar consumos de producción', 'error');
  }
}

async function cargarEstadisticasProduccion() {
  try {
    // Destruir gráficos previos
    if (window.ChartsModule) {
      ChartsModule.destroyAll();
    }

    const desde = document.getElementById('filtroFechaDesdeStats')?.value || '';
    const hasta = document.getElementById('filtroFechaHastaStats')?.value || '';

    const filtros = {};
    if (desde) filtros.desde = desde;
    if (hasta) filtros.hasta = hasta;

    // Obtener datos de estadísticas y órdenes
    const statsResponse = await ProduccionService.obtenerEstadisticas(filtros);
    const ordenesResponse = await ProduccionService.obtenerOrdenes(filtros);
    const rendimientosResponse = await ProduccionService.obtenerRendimientos(filtros);

    if (statsResponse.success) {
      const stats = statsResponse.data;
      
      // Actualizar cards de estadísticas
      document.getElementById('statTotalOrdenes').textContent = stats.total_ordenes || 0;
      document.getElementById('statOrdenesCompletadas').textContent = stats.ordenes_completadas || 0;
      document.getElementById('statOrdenesEnProceso').textContent = stats.ordenes_en_proceso || 0;
      document.getElementById('statOrdenesCanceladas').textContent = stats.ordenes_canceladas || 0;
      document.getElementById('statRendimiento').textContent = (stats.rendimiento_general || 0).toFixed(2) + '%';
      document.getElementById('statCosteTotal').textContent = '$' + (stats.coste_total || 0).toFixed(2);

      // Crear gráficos si ChartsModule está disponible
      if (window.ChartsModule && ordenesResponse.success && rendimientosResponse.success) {
        const ordenes = ordenesResponse.data || [];
        const rendimientos = rendimientosResponse.data || [];

        // Gráfico de Producción - Últimos 30 días
        try {
          ChartsModule.createProduccionTimeseriesChart('chartProduccionTimeseries', ordenes);
        } catch (e) { console.warn('Error al crear gráfico de timeseries:', e); }

        // Gráfico de Rendimiento
        try {
          ChartsModule.createRendimientoChart('chartRendimiento', rendimientos);
        } catch (e) { console.warn('Error al crear gráfico de rendimiento:', e); }

        // Gráfico de Estados
        try {
          ChartsModule.createEstadosChart('chartEstados', ordenes);
        } catch (e) { console.warn('Error al crear gráfico de estados:', e); }

        // Gráfico de Costes
        try {
          ChartsModule.createCostesChart('chartCostes', rendimientos);
        } catch (e) { console.warn('Error al crear gráfico de costes:', e); }

        // Gráfico de Inventario
        try {
          ChartsModule.createInventarioChart('chartInventario', rendimientos);
        } catch (e) { console.warn('Error al crear gráfico de inventario:', e); }

        // Gráfico Comparativo
        try {
          ChartsModule.createComparativePlatos('chartComparative', rendimientos);
        } catch (e) { console.warn('Error al crear gráfico comparativo:', e); }
      }

      // Cargar rendimientos
      await cargarRendimientosTabla();
    }
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    mostrarNotificacion('Error al cargar estadísticas', 'error');
  }
}

async function cargarRendimientosTabla() {
  try {
    const desde = document.getElementById('filtroFechaDesdeStats')?.value || '';
    const hasta = document.getElementById('filtroFechaHastaStats')?.value || '';

    const filtros = {};
    if (desde) filtros.desde = desde;
    if (hasta) filtros.hasta = hasta;

    const response = await ProduccionService.obtenerRendimientos(filtros);
    if (response.success) {
      const tbody = document.getElementById('rendimientosTableBody');
      tbody.innerHTML = '';

      (response.data || []).forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.plato_nombre || 'N/A'}</td>
          <td>${item.total_ordenes || 0}</td>
          <td>${item.ordenes_completadas || 0}</td>
          <td>${(item.rendimiento_promedio || 0).toFixed(2)}%</td>
          <td>${(item.rendimiento_minimo || 0).toFixed(2)}% - ${(item.rendimiento_maximo || 0).toFixed(2)}%</td>
        `;
        tbody.appendChild(row);
      });

      if (!response.data || response.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay datos</td></tr>';
      }
    }
  } catch (error) {
    console.error('Error cargando rendimientos:', error);
  }
}

// ============================================================================
// RENDERIZACIÓN
// ============================================================================

function renderizarOrdenesProduccion() {
  const tbody = document.getElementById('ordenesTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (produccionState.ordenes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No hay órdenes</td></tr>';
    return;
  }

  produccionState.ordenes.forEach(orden => {
    const estadoClass = `estado-${orden.estado.toLowerCase()}`;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${orden.codigo}</strong></td>
      <td>${orden.plato_nombre || 'N/A'}</td>
      <td>${orden.cantidad_planificada}</td>
      <td>${orden.fecha_planificada}</td>
      <td><span class="badge ${estadoClass}">${orden.estado}</span></td>
      <td>${orden.prioridad || 'NORMAL'}</td>
      <td>${orden.responsable || '-'}</td>
      <td>${orden.rendimiento ? orden.rendimiento.toFixed(2) + '%' : '-'}</td>
      <td>
        ${orden.estado === 'PENDIENTE' ? `<button class="btn-small btn-start" onclick="iniciarOrdenProduccion(${orden.id})">▶ Iniciar</button>` : ''}
        ${orden.estado === 'EN_PROCESO' ? `<button class="btn-small btn-finish" onclick="abrirDialogoFinalizarOrden(${orden.id})">✓ Finalizar</button>` : ''}
        ${orden.estado !== 'COMPLETADA' && orden.estado !== 'CANCELADA' ? `<button class="btn-small btn-cancel" onclick="cancelarOrdenProduccion(${orden.id})">✕ Cancelar</button>` : ''}
        <button class="btn-small btn-view" onclick="verDetalleOrdenProduccion(${orden.id})">👁 Ver</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderizarLotesProduccion() {
  const tbody = document.getElementById('lotesTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (produccionState.lotes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No hay lotes</td></tr>';
    return;
  }

  produccionState.lotes.forEach(lote => {
    const estadoClass = `estado-${lote.estado.toLowerCase()}`;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${lote.codigo_lote}</strong></td>
      <td>${lote.orden_codigo || 'N/A'}</td>
      <td>${lote.cantidad}</td>
      <td>${new Date(lote.fecha_produccion).toLocaleString()}</td>
      <td>${lote.fecha_caducidad ? lote.fecha_caducidad : '-'}</td>
      <td><span class="badge ${estadoClass}">${lote.estado}</span></td>
      <td>${lote.ubicacion || '-'}</td>
      <td>
        <button class="btn-small btn-view" onclick="verDetalleLoteProduccion(${lote.id})">👁 Ver</button>
        <button class="btn-small btn-edit" onclick="editarLoteProduccion(${lote.id})">✎ Editar</button>
        <button class="btn-small btn-delete" onclick="eliminarLoteProduccion(${lote.id})">🗑 Eliminar</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderizarConsumosProduccion() {
  const tbody = document.getElementById('consumosTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (produccionState.consumos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No hay consumos</td></tr>';
    return;
  }

  produccionState.consumos.forEach(consumo => {
    const row = document.createElement('tr');
    const rendimiento = consumo.cantidad_consumida ? ((consumo.cantidad_consumida / consumo.cantidad_planificada) * 100).toFixed(2) : 'N/A';
    
    row.innerHTML = `
      <td>${consumo.orden_codigo || 'N/A'}</td>
      <td>${consumo.ingrediente_nombre || 'N/A'}</td>
      <td>${consumo.cantidad_planificada}</td>
      <td>${consumo.cantidad_consumida || '-'}</td>
      <td>${consumo.ingrediente_unidad || '-'}</td>
      <td>$${consumo.coste || 0}</td>
      <td>${consumo.usuario_registro || '-'}</td>
      <td>${consumo.fecha_consumo ? new Date(consumo.fecha_consumo).toLocaleString() : '-'}</td>
      <td>
        <button class="btn-small btn-view" onclick="verDetalleConsumoProduccion(${consumo.id})">👁 Ver</button>
        <button class="btn-small btn-edit" onclick="editarConsumoProduccion(${consumo.id})">✎ Editar</button>
        <button class="btn-small btn-delete" onclick="eliminarConsumoProduccion(${consumo.id})">🗑 Eliminar</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ============================================================================
// FILTROS
// ============================================================================

function filtrarOrdenesProduccion() {
  const filtro = document.getElementById('filtroEstadoOrdenes')?.value || '';
  produccionState.filtroEstadoOrdenes = filtro;
  cargarOrdenesProduccion();
}

function filtrarLotesProduccion() {
  const filtro = document.getElementById('filtroEstadoLotes')?.value || '';
  produccionState.filtroEstadoLotes = filtro;
  cargarLotesProduccion();
}

function filtrarConsumosProduccion() {
  const filtro = document.getElementById('filtroOrdenIdConsumos')?.value || '';
  produccionState.filtroOrdenIdConsumos = filtro;
  cargarConsumosProduccion();
}

// ============================================================================
// MODALES Y FORMULARIOS
// ============================================================================

async function cargarPlatosYIngredientes() {
  try {
    // Cargar platos
    const platosResponse = await fetch('/api/platos', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (platosResponse.ok) {
      const platosData = await platosResponse.json();
      produccionState.platos = platosData.data || [];
      
      const platoSelect = document.getElementById('platoSelectProduccion');
      if (platoSelect) {
        platoSelect.innerHTML = '<option value="">Seleccionar plato...</option>';
        produccionState.platos.forEach(plato => {
          const option = document.createElement('option');
          option.value = plato.id;
          option.textContent = plato.nombre;
          platoSelect.appendChild(option);
        });
      }
    }

    // Cargar ingredientes
    const ingredientesResponse = await fetch('/api/ingredientes', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (ingredientesResponse.ok) {
      const ingredientesData = await ingredientesResponse.json();
      produccionState.ingredientes = ingredientesData.data || [];
      
      const ingredienteSelect = document.getElementById('ingredienteSelectConsumo');
      if (ingredienteSelect) {
        ingredienteSelect.innerHTML = '<option value="">Seleccionar ingrediente...</option>';
        produccionState.ingredientes.forEach(ing => {
          const option = document.createElement('option');
          option.value = ing.id;
          option.textContent = ing.nombre;
          ingredienteSelect.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Error cargando datos:', error);
  }
}

function abrirModalNuevaOrdenProduccion() {
  cargarPlatosYIngredientes();
  document.getElementById('modalNuevaOrdenProduccion').style.display = 'block';
}

async function abrirModalNuevoLote() {
  await cargarPlatosYIngredientes();
  const ordenSelect = document.getElementById('ordenSelectLote');
  ordenSelect.innerHTML = '<option value="">Seleccionar orden...</option>';
  produccionState.ordenes.forEach(orden => {
    const option = document.createElement('option');
    option.value = orden.id;
    option.textContent = `${orden.codigo} - ${orden.plato_nombre}`;
    ordenSelect.appendChild(option);
  });
  document.getElementById('modalNuevoLote').style.display = 'block';
}

async function abrirModalNuevoConsumo() {
  await cargarPlatosYIngredientes();
  
  // Cargar órdenes
  const ordenSelect = document.getElementById('ordenSelectConsumo');
  ordenSelect.innerHTML = '<option value="">Seleccionar orden...</option>';
  produccionState.ordenes.forEach(orden => {
    const option = document.createElement('option');
    option.value = orden.id;
    option.textContent = `${orden.codigo} - ${orden.plato_nombre}`;
    ordenSelect.appendChild(option);
  });
  
  document.getElementById('modalNuevoConsumo').style.display = 'block';
}

function cerrarModalProduccion(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    // Limpiar formularios
    const forms = modal.querySelectorAll('form');
    forms.forEach(form => form.reset());
  }
}

// ============================================================================
// OPERACIONES CRUD
// ============================================================================

async function crearOrdenProduccion(event) {
  event.preventDefault();
  
  try {
    const datos = {
      plato_id: parseInt(document.getElementById('platoSelectProduccion').value),
      cantidad_planificada: parseFloat(document.getElementById('cantidadPlanificada').value),
      fecha_planificada: document.getElementById('fechaPlanificada').value,
      prioridad: document.getElementById('prioridadOrden').value,
      responsable: document.getElementById('responsableOrden').value,
      observaciones: document.getElementById('observacionesOrden').value
    };

    const response = await ProduccionService.crearOrden(datos);
    if (response.success) {
      mostrarNotificacion('Orden creada correctamente', 'success');
      cerrarModalProduccion('modalNuevaOrdenProduccion');
      await cargarOrdenesProduccion();
    } else {
      mostrarNotificacion(response.error || 'Error al crear orden', 'error');
    }
  } catch (error) {
    console.error('Error creando orden:', error);
    mostrarNotificacion('Error al crear la orden de producción', 'error');
  }
}

async function crearLoteProduccion(event) {
  event.preventDefault();
  
  try {
    const datos = {
      orden_id: parseInt(document.getElementById('ordenSelectLote').value),
      cantidad: parseFloat(document.getElementById('cantidadLote').value),
      fecha_produccion: document.getElementById('fechaProduccionLote').value,
      fecha_caducidad: document.getElementById('fechaCaducidadLote').value || null,
      ubicacion: document.getElementById('ubicacionLote').value,
      observaciones: document.getElementById('observacionesLote').value
    };

    const response = await ProduccionService.crearLote(datos);
    if (response.success) {
      mostrarNotificacion('Lote creado correctamente', 'success');
      cerrarModalProduccion('modalNuevoLote');
      await cargarLotesProduccion();
    } else {
      mostrarNotificacion(response.error || 'Error al crear lote', 'error');
    }
  } catch (error) {
    console.error('Error creando lote:', error);
    mostrarNotificacion('Error al crear el lote', 'error');
  }
}

async function crearConsumoProduccion(event) {
  event.preventDefault();
  
  try {
    const datos = {
      orden_id: parseInt(document.getElementById('ordenSelectConsumo').value),
      ingrediente_id: parseInt(document.getElementById('ingredienteSelectConsumo').value),
      cantidad_planificada: parseFloat(document.getElementById('cantidadPlanificadaConsumo').value),
      cantidad_consumida: document.getElementById('cantidadConsumidaConsumo').value ? 
        parseFloat(document.getElementById('cantidadConsumidaConsumo').value) : null,
      coste: document.getElementById('costeConsumo').value ?
        parseFloat(document.getElementById('costeConsumo').value) : null,
      observaciones: document.getElementById('observacionesConsumo').value
    };

    const response = await ProduccionService.crearConsumo(datos);
    if (response.success) {
      mostrarNotificacion('Consumo registrado correctamente', 'success');
      cerrarModalProduccion('modalNuevoConsumo');
      await cargarConsumosProduccion();
    } else {
      mostrarNotificacion(response.error || 'Error al registrar consumo', 'error');
    }
  } catch (error) {
    console.error('Error registrando consumo:', error);
    mostrarNotificacion('Error al registrar el consumo', 'error');
  }
}

async function iniciarOrdenProduccion(id) {
  if (!confirm('¿Desea iniciar la producción de esta orden?')) return;

  try {
    const response = await ProduccionService.iniciarProduccion(id);
    if (response.success) {
      mostrarNotificacion('Producción iniciada', 'success');
      await cargarOrdenesProduccion();
    } else {
      mostrarNotificacion(response.error || 'Error', 'error');
    }
  } catch (error) {
    mostrarNotificacion('Error al iniciar producción', 'error');
  }
}

function abrirDialogoFinalizarOrden(id) {
  const cantidad = prompt('Ingrese la cantidad producida:');
  if (cantidad !== null && cantidad !== '') {
    finalizarOrdenProduccion(id, parseFloat(cantidad));
  }
}

async function finalizarOrdenProduccion(id, cantidadProducida) {
  try {
    const response = await ProduccionService.finalizarProduccion(id, cantidadProducida);
    if (response.success) {
      mostrarNotificacion('Producción finalizada', 'success');
      await cargarOrdenesProduccion();
    } else {
      mostrarNotificacion(response.error || 'Error', 'error');
    }
  } catch (error) {
    mostrarNotificacion('Error al finalizar producción', 'error');
  }
}

async function cancelarOrdenProduccion(id) {
  const motivo = prompt('Ingrese el motivo de cancelación:');
  if (motivo === null) return;

  try {
    const response = await ProduccionService.cancelarOrden(id, motivo);
    if (response.success) {
      mostrarNotificacion('Orden cancelada', 'success');
      await cargarOrdenesProduccion();
    } else {
      mostrarNotificacion(response.error || 'Error', 'error');
    }
  } catch (error) {
    mostrarNotificacion('Error al cancelar orden', 'error');
  }
}

async function eliminarLoteProduccion(id) {
  if (!confirm('¿Desea eliminar este lote?')) return;

  try {
    const response = await ProduccionService.eliminarLote(id);
    if (response.success) {
      mostrarNotificacion('Lote eliminado', 'success');
      await cargarLotesProduccion();
    } else {
      mostrarNotificacion(response.error || 'Error', 'error');
    }
  } catch (error) {
    mostrarNotificacion('Error al eliminar lote', 'error');
  }
}

async function eliminarConsumoProduccion(id) {
  if (!confirm('¿Desea eliminar este consumo?')) return;

  try {
    const response = await ProduccionService.eliminarConsumo(id);
    if (response.success) {
      mostrarNotificacion('Consumo eliminado', 'success');
      await cargarConsumosProduccion();
    } else {
      mostrarNotificacion(response.error || 'Error', 'error');
    }
  } catch (error) {
    mostrarNotificacion('Error al eliminar consumo', 'error');
  }
}

// ============================================================================
// FUNCIONES DE VISTA
// ============================================================================

async function verDetalleOrdenProduccion(id) {
  try {
    const response = await ProduccionService.obtenerOrdenPorId(id);
    if (response.success) {
      const orden = response.data;
      const detalle = `
        <div style="padding: 20px;">
          <h3>${orden.codigo}</h3>
          <p><strong>Plato:</strong> ${orden.plato_nombre}</p>
          <p><strong>Cantidad Planificada:</strong> ${orden.cantidad_planificada}</p>
          <p><strong>Cantidad Producida:</strong> ${orden.cantidad_producida || 0}</p>
          <p><strong>Fecha Planificada:</strong> ${orden.fecha_planificada}</p>
          <p><strong>Estado:</strong> ${orden.estado}</p>
          <p><strong>Prioridad:</strong> ${orden.prioridad}</p>
          <p><strong>Responsable:</strong> ${orden.responsable || '-'}</p>
          <p><strong>Rendimiento:</strong> ${orden.rendimiento ? orden.rendimiento.toFixed(2) + '%' : '-'}</p>
          <p><strong>Observaciones:</strong> ${orden.observaciones || '-'}</p>
          <p><strong>Lotes:</strong> ${orden.lotes?.length || 0}</p>
          <p><strong>Consumos:</strong> ${orden.consumos?.length || 0}</p>
        </div>
      `;
      alert(detalle);
    }
  } catch (error) {
    mostrarNotificacion('Error al cargar detalles', 'error');
  }
}

async function verDetalleLoteProduccion(id) {
  try {
    const response = await ProduccionService.obtenerLotePorId(id);
    if (response.success) {
      const lote = response.data;
      const detalle = `
        <div style="padding: 20px;">
          <h3>${lote.codigo_lote}</h3>
          <p><strong>Orden:</strong> ${lote.orden_codigo}</p>
          <p><strong>Cantidad:</strong> ${lote.cantidad}</p>
          <p><strong>Fecha Producción:</strong> ${new Date(lote.fecha_produccion).toLocaleString()}</p>
          <p><strong>Caducidad:</strong> ${lote.fecha_caducidad || '-'}</p>
          <p><strong>Estado:</strong> ${lote.estado}</p>
          <p><strong>Ubicación:</strong> ${lote.ubicacion || '-'}</p>
          <p><strong>Rendimiento:</strong> ${lote.rendimiento || '-'}</p>
          <p><strong>Coste Total:</strong> $${lote.coste_total || 0}</p>
        </div>
      `;
      alert(detalle);
    }
  } catch (error) {
    mostrarNotificacion('Error al cargar detalles', 'error');
  }
}

async function verDetalleConsumoProduccion(id) {
  try {
    const response = await ProduccionService.obtenerConsumoPorId(id);
    if (response.success) {
      const consumo = response.data;
      const detalle = `
        <div style="padding: 20px;">
          <h3>Consumo ID: ${id}</h3>
          <p><strong>Orden:</strong> ${consumo.orden_codigo}</p>
          <p><strong>Ingrediente:</strong> ${consumo.ingrediente_nombre}</p>
          <p><strong>Cantidad Planificada:</strong> ${consumo.cantidad_planificada} ${consumo.ingrediente_unidad}</p>
          <p><strong>Cantidad Consumida:</strong> ${consumo.cantidad_consumida || '-'}</p>
          <p><strong>Coste:</strong> $${consumo.coste || 0}</p>
          <p><strong>Usuario:</strong> ${consumo.usuario_registro || '-'}</p>
          <p><strong>Fecha:</strong> ${consumo.fecha_consumo ? new Date(consumo.fecha_consumo).toLocaleString() : '-'}</p>
          <p><strong>Observaciones:</strong> ${consumo.observaciones || '-'}</p>
        </div>
      `;
      alert(detalle);
    }
  } catch (error) {
    mostrarNotificacion('Error al cargar detalles', 'error');
  }
}

async function editarLoteProduccion(id) {
  // Implementar edición
  alert('Función de edición en desarrollo');
}

async function editarConsumoProduccion(id) {
  // Implementar edición
  alert('Función de edición en desarrollo');
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

function inicializarProduccion() {
  // Cargar datos iniciales
  cargarOrdenesProduccion();
  cargarLotesProduccion();
  cargarConsumosProduccion();
  cargarPlatosYIngredientes();
}

// Función para cambiar tabs
function cambiarTab(tab) {
  // Ocultar todos los tabs
  const tabs = document.querySelectorAll('#produccion .tab-content');
  tabs.forEach(t => t.style.display = 'none');

  // Mostrar el tab seleccionado
  const selectedTab = document.getElementById(`tab-${tab}`);
  if (selectedTab) {
    selectedTab.style.display = 'block';
  }

  // Actualizar estilos de botones
  const buttons = document.querySelectorAll('#produccion .tab-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  // Cargar datos según el tab
  if (tab === 'ordenes') cargarOrdenesProduccion();
  else if (tab === 'lotes') cargarLotesProduccion();
  else if (tab === 'consumos') cargarConsumosProduccion();
  else if (tab === 'estadisticas') cargarEstadisticasProduccion();
}
