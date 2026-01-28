/**
 * UI Handler para OFERTAS Y EVENTOS
 * Gestiona la interacción con el DOM y lógica de presentación
 */

// Variables globales
let ofertasData = [];
let eventosData = [];
let eventoActualAsistentes = null;

// ==========================================================================
// NAVEGACIÓN DE TABS
// ==========================================================================

function cambiarTabOfertasEventos(tab) {
  // Actualizar botones de tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tab) {
      btn.classList.add('active');
    }
  });

  // Mostrar/ocultar contenido de tabs
  document.getElementById('tab-ofertas').style.display = tab === 'ofertas' ? 'block' : 'none';
  document.getElementById('tab-eventos').style.display = tab === 'eventos' ? 'block' : 'none';

  // Cargar datos del tab seleccionado
  if (tab === 'ofertas') {
    cargarOfertas();
  } else if (tab === 'eventos') {
    cargarEventos();
  }
}

// ==========================================================================
// OFERTAS
// ==========================================================================

async function cargarOfertas() {
  try {
    const estado = document.getElementById('filtroEstadoOferta')?.value || '';
    const tipo = document.getElementById('filtroTipoOferta')?.value || '';

    const filtros = {};
    if (estado) filtros.estado = estado;
    if (tipo) filtros.tipo = tipo;

    const response = await OfertasEventosService.obtenerOfertas(filtros);
    
    if (response.success) {
      ofertasData = response.data || [];
      renderizarOfertas();
      await cargarEstadisticasOfertas();
    } else {
      mostrarNotificacion('Error al cargar ofertas: ' + response.message, 'error');
      document.getElementById('tbodyOfertas').innerHTML = 
        '<tr><td colspan="10" class="text-center">Error al cargar ofertas</td></tr>';
    }
  } catch (error) {
    console.error('Error cargando ofertas:', error);
    mostrarNotificacion('Error al cargar ofertas', 'error');
  }
}

function renderizarOfertas() {
  const tbody = document.getElementById('tbodyOfertas');
  
  if (!ofertasData || ofertasData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">No hay ofertas</td></tr>';
    return;
  }

  tbody.innerHTML = ofertasData.map(oferta => `
    <tr>
      <td>${escapeHtml(oferta.codigo)}</td>
      <td>${escapeHtml(oferta.nombre)}</td>
      <td><span class="badge badge-${oferta.tipo}">${oferta.tipo}</span></td>
      <td><span class="badge badge-${oferta.estado}">${oferta.estado}</span></td>
      <td>${oferta.descuento_porcentaje ? oferta.descuento_porcentaje + '%' : '-'}</td>
      <td>${formatearFecha(oferta.fecha_inicio)}</td>
      <td>${formatearFecha(oferta.fecha_fin)}</td>
      <td>$${formatearNumero(oferta.precio_regular || 0)}</td>
      <td>$${formatearNumero(oferta.precio_oferta || 0)}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="editarOferta(${oferta.id})" title="Editar">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="confirmarEliminarOferta(${oferta.id})" title="Eliminar">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function filtrarOfertasLocal() {
  const busqueda = document.getElementById('busquedaOferta').value.toLowerCase();
  
  if (!busqueda) {
    renderizarOfertas();
    return;
  }

  const ofertasFiltradas = ofertasData.filter(o => 
    o.codigo.toLowerCase().includes(busqueda) ||
    o.nombre.toLowerCase().includes(busqueda)
  );

  const tbody = document.getElementById('tbodyOfertas');
  if (ofertasFiltradas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">No se encontraron ofertas</td></tr>';
    return;
  }

  tbody.innerHTML = ofertasFiltradas.map(oferta => `
    <tr>
      <td>${escapeHtml(oferta.codigo)}</td>
      <td>${escapeHtml(oferta.nombre)}</td>
      <td><span class="badge badge-${oferta.tipo}">${oferta.tipo}</span></td>
      <td><span class="badge badge-${oferta.estado}">${oferta.estado}</span></td>
      <td>${oferta.descuento_porcentaje ? oferta.descuento_porcentaje + '%' : '-'}</td>
      <td>${formatearFecha(oferta.fecha_inicio)}</td>
      <td>${formatearFecha(oferta.fecha_fin)}</td>
      <td>$${formatearNumero(oferta.precio_regular || 0)}</td>
      <td>$${formatearNumero(oferta.precio_oferta || 0)}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="editarOferta(${oferta.id})">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="confirmarEliminarOferta(${oferta.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function cargarEstadisticasOfertas() {
  try {
    const response = await OfertasEventosService.obtenerEstadisticasOfertas();
    if (response.success) {
      const stats = response.data || [];
      
      document.getElementById('statTotalOfertas').textContent = ofertasData.length;
      document.getElementById('statOfertasActivas').textContent = 
        ofertasData.filter(o => o.estado === 'activa').length;
      
      const totalAplicaciones = stats.reduce((sum, s) => sum + (s.veces_aplicada || 0), 0);
      const descuentoTotal = stats.reduce((sum, s) => sum + (s.descuento_total || 0), 0);
      
      document.getElementById('statTotalAplicaciones').textContent = totalAplicaciones;
      document.getElementById('statDescuentoTotal').textContent = '$' + formatearNumero(descuentoTotal);
    }
  } catch (error) {
    console.error('Error cargando estadísticas ofertas:', error);
  }
}

function abrirModalNuevaOferta() {
  document.getElementById('formNuevaOferta').reset();
  document.getElementById('modalNuevaOferta').style.display = 'flex';
}

function cerrarModalOferta() {
  document.getElementById('modalNuevaOferta').style.display = 'none';
}

async function guardarOferta(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const datos = Object.fromEntries(formData.entries());

  // Convertir números
  if (datos.precio_regular) datos.precio_regular = parseFloat(datos.precio_regular);
  if (datos.precio_oferta) datos.precio_oferta = parseFloat(datos.precio_oferta);
  if (datos.descuento_porcentaje) datos.descuento_porcentaje = parseFloat(datos.descuento_porcentaje);

  const response = await OfertasEventosService.crearOferta(datos);
  
  if (response.success) {
    mostrarNotificacion('Oferta creada exitosamente', 'success');
    cerrarModalOferta();
    cargarOfertas();
  } else {
    mostrarNotificacion('Error al crear oferta: ' + response.message, 'error');
  }
}

async function editarOferta(id) {
  const oferta = ofertasData.find(o => o.id === id);
  if (!oferta) return;

  const nuevoNombre = prompt('Nuevo nombre de la oferta:', oferta.nombre);
  if (!nuevoNombre) return;

  const response = await OfertasEventosService.actualizarOferta(id, { nombre: nuevoNombre });
  
  if (response.success) {
    mostrarNotificacion('Oferta actualizada', 'success');
    cargarOfertas();
  } else {
    mostrarNotificacion('Error al actualizar oferta: ' + response.message, 'error');
  }
}

async function confirmarEliminarOferta(id) {
  if (!confirm('¿Eliminar esta oferta?')) return;
  
  const response = await OfertasEventosService.eliminarOferta(id);
  
  if (response.success) {
    mostrarNotificacion('Oferta eliminada', 'success');
    cargarOfertas();
  } else {
    mostrarNotificacion('Error al eliminar oferta: ' + response.message, 'error');
  }
}

// ==========================================================================
// EVENTOS
// ==========================================================================

async function cargarEventos() {
  try {
    const estado = document.getElementById('filtroEstadoEvento')?.value || '';
    const tipo = document.getElementById('filtroTipoEvento')?.value || '';

    const filtros = {};
    if (estado) filtros.estado = estado;
    if (tipo) filtros.tipo_evento = tipo;

    const response = await OfertasEventosService.obtenerEventos(filtros);
    
    if (response.success) {
      eventosData = response.data || [];
      renderizarEventos();
      await cargarEstadisticasEventos();
    } else {
      mostrarNotificacion('Error al cargar eventos: ' + response.message, 'error');
      document.getElementById('tbodyEventos').innerHTML = 
        '<tr><td colspan="10" class="text-center">Error al cargar eventos</td></tr>';
    }
  } catch (error) {
    console.error('Error cargando eventos:', error);
    mostrarNotificacion('Error al cargar eventos', 'error');
  }
}

function renderizarEventos() {
  const tbody = document.getElementById('tbodyEventos');
  
  if (!eventosData || eventosData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">No hay eventos</td></tr>';
    return;
  }

  tbody.innerHTML = eventosData.map(evento => `
    <tr>
      <td>${escapeHtml(evento.codigo)}</td>
      <td>${escapeHtml(evento.nombre)}</td>
      <td><span class="badge badge-${evento.tipo_evento}">${evento.tipo_evento}</span></td>
      <td><span class="badge badge-${evento.estado}">${evento.estado}</span></td>
      <td>${formatearFechaHora(evento.fecha_evento)}</td>
      <td>${escapeHtml(evento.lugar || '-')}</td>
      <td>${evento.capacidad || 0}</td>
      <td>${evento.personas_confirmadas || 0}</td>
      <td>$${formatearNumero(evento.precio_total || 0)}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="verAsistentes(${evento.id}, '${escapeHtml(evento.nombre)}')" title="Asistentes">👥</button>
        <button class="btn btn-sm btn-primary" onclick="editarEvento(${evento.id})" title="Editar">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="confirmarEliminarEvento(${evento.id})" title="Eliminar">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function filtrarEventosLocal() {
  const busqueda = document.getElementById('busquedaEvento').value.toLowerCase();
  
  if (!busqueda) {
    renderizarEventos();
    return;
  }

  const eventosFiltrados = eventosData.filter(e => 
    e.codigo.toLowerCase().includes(busqueda) ||
    e.nombre.toLowerCase().includes(busqueda)
  );

  const tbody = document.getElementById('tbodyEventos');
  if (eventosFiltrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">No se encontraron eventos</td></tr>';
    return;
  }

  tbody.innerHTML = eventosFiltrados.map(evento => `
    <tr>
      <td>${escapeHtml(evento.codigo)}</td>
      <td>${escapeHtml(evento.nombre)}</td>
      <td><span class="badge badge-${evento.tipo_evento}">${evento.tipo_evento}</span></td>
      <td><span class="badge badge-${evento.estado}">${evento.estado}</span></td>
      <td>${formatearFechaHora(evento.fecha_evento)}</td>
      <td>${escapeHtml(evento.lugar || '-')}</td>
      <td>${evento.capacidad || 0}</td>
      <td>${evento.personas_confirmadas || 0}</td>
      <td>$${formatearNumero(evento.precio_total || 0)}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="verAsistentes(${evento.id}, '${escapeHtml(evento.nombre)}')">👥</button>
        <button class="btn btn-sm btn-primary" onclick="editarEvento(${evento.id})">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="confirmarEliminarEvento(${evento.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function cargarEstadisticasEventos() {
  try {
    const response = await OfertasEventosService.obtenerEstadisticasEventos();
    const proximosResponse = await OfertasEventosService.obtenerEventosProximos(30);
    
    if (response.success) {
      const stats = response.data || [];
      
      document.getElementById('statTotalEventos').textContent = eventosData.length;
      document.getElementById('statEventosProximos').textContent = 
        proximosResponse.success ? (proximosResponse.data || []).length : 0;
      
      const totalAsistentes = stats.reduce((sum, s) => sum + (s.total_asistentes || 0), 0);
      const ingresos = eventosData.reduce((sum, e) => sum + (e.precio_total || 0), 0);
      
      document.getElementById('statTotalAsistentes').textContent = totalAsistentes;
      document.getElementById('statIngresosEventos').textContent = '$' + formatearNumero(ingresos);
    }
  } catch (error) {
    console.error('Error cargando estadísticas eventos:', error);
  }
}

function abrirModalNuevoEvento() {
  document.getElementById('formNuevoEvento').reset();
  document.getElementById('modalNuevoEvento').style.display = 'flex';
}

function cerrarModalEvento() {
  document.getElementById('modalNuevoEvento').style.display = 'none';
}

async function guardarEvento(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const datos = Object.fromEntries(formData.entries());

  // Convertir números
  if (datos.capacidad) datos.capacidad = parseInt(datos.capacidad);
  if (datos.precio_entrada) datos.precio_entrada = parseFloat(datos.precio_entrada);
  if (datos.precio_total) datos.precio_total = parseFloat(datos.precio_total);

  const response = await OfertasEventosService.crearEvento(datos);
  
  if (response.success) {
    mostrarNotificacion('Evento creado exitosamente', 'success');
    cerrarModalEvento();
    cargarEventos();
  } else {
    mostrarNotificacion('Error al crear evento: ' + response.message, 'error');
  }
}

async function editarEvento(id) {
  const evento = eventosData.find(e => e.id === id);
  if (!evento) return;

  const nuevoNombre = prompt('Nuevo nombre del evento:', evento.nombre);
  if (!nuevoNombre) return;

  const response = await OfertasEventosService.actualizarEvento(id, { nombre: nuevoNombre });
  
  if (response.success) {
    mostrarNotificacion('Evento actualizado', 'success');
    cargarEventos();
  } else {
    mostrarNotificacion('Error al actualizar evento: ' + response.message, 'error');
  }
}

async function confirmarEliminarEvento(id) {
  if (!confirm('¿Eliminar este evento?')) return;
  
  const response = await OfertasEventosService.eliminarEvento(id);
  
  if (response.success) {
    mostrarNotificacion('Evento eliminado', 'success');
    cargarEventos();
  } else {
    mostrarNotificacion('Error al eliminar evento: ' + response.message, 'error');
  }
}

// ==========================================================================
// ASISTENTES
// ==========================================================================

async function verAsistentes(eventoId, nombreEvento) {
  eventoActualAsistentes = eventoId;
  document.getElementById('tituloEventoAsistentes').textContent = nombreEvento;
  document.getElementById('modalAsistentes').style.display = 'flex';
  await cargarAsistentes(eventoId);
}

async function cargarAsistentes(eventoId) {
  try {
    const response = await OfertasEventosService.obtenerAsistentes(eventoId);
    
    const tbody = document.getElementById('tbodyAsistentes');
    if (!response.success || !response.data || response.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay asistentes registrados</td></tr>';
      return;
    }

    tbody.innerHTML = response.data.map(asistente => `
      <tr>
        <td>${escapeHtml(asistente.nombre)}</td>
        <td>${escapeHtml(asistente.email || '-')}</td>
        <td>${escapeHtml(asistente.telefono || '-')}</td>
        <td><span class="badge badge-${asistente.estado_confirmacion}">${asistente.estado_confirmacion}</span></td>
        <td>${asistente.numero_acompanantes || 0}</td>
        <td>
          <button class="btn btn-sm btn-success" onclick="confirmarAsistente(${asistente.id})" title="Confirmar">✓</button>
          <button class="btn btn-sm btn-danger" onclick="confirmarEliminarAsistente(${asistente.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error cargando asistentes:', error);
  }
}

function cerrarModalAsistentes() {
  document.getElementById('modalAsistentes').style.display = 'none';
  eventoActualAsistentes = null;
}

function abrirModalNuevoAsistente() {
  if (!eventoActualAsistentes) return;
  
  document.getElementById('formNuevoAsistente').reset();
  document.getElementById('asistenteEventoId').value = eventoActualAsistentes;
  document.getElementById('modalNuevoAsistente').style.display = 'flex';
}

function cerrarModalNuevoAsistente() {
  document.getElementById('modalNuevoAsistente').style.display = 'none';
}

async function guardarAsistente(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const datos = Object.fromEntries(formData.entries());
  const eventoId = datos.evento_id;
  delete datos.evento_id;

  // Convertir número
  if (datos.numero_acompanantes) datos.numero_acompanantes = parseInt(datos.numero_acompanantes);

  const response = await OfertasEventosService.agregarAsistente(eventoId, datos);
  
  if (response.success) {
    mostrarNotificacion('Asistente agregado exitosamente', 'success');
    cerrarModalNuevoAsistente();
    await cargarAsistentes(eventoId);
  } else {
    mostrarNotificacion('Error al agregar asistente: ' + response.message, 'error');
  }
}

async function confirmarAsistente(asistenteId) {
  const response = await OfertasEventosService.actualizarConfirmacionAsistente(asistenteId, 'confirmado');
  
  if (response.success) {
    mostrarNotificacion('Asistente confirmado', 'success');
    await cargarAsistentes(eventoActualAsistentes);
  } else {
    mostrarNotificacion('Error al confirmar asistente: ' + response.message, 'error');
  }
}

async function confirmarEliminarAsistente(asistenteId) {
  if (!confirm('¿Eliminar este asistente?')) return;
  
  const response = await OfertasEventosService.eliminarAsistente(asistenteId);
  
  if (response.success) {
    mostrarNotificacion('Asistente eliminado', 'success');
    await cargarAsistentes(eventoActualAsistentes);
  } else {
    mostrarNotificacion('Error al eliminar asistente: ' + response.message, 'error');
  }
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

// Cargar ofertas al inicio
if (document.getElementById('tab-ofertas')) {
  cargarOfertas();
}
