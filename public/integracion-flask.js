/**
 * INTEGRACION_FLASK.JS - Parcheo de funciones para usar API client de Flask
 * Se ejecuta después de app.js para reemplazar funciones con llamadas a backend Flask
 */

// ==================== ACTUALIZAR cargarPlatos ====================
async function cargarPlatos() {
  try {
    const page = estadoApp.paginacion.platos.pagina || 1;
    const limit = estadoApp.paginacion.platos.porPagina || 12;
    
    console.log(`📥 Cargando platos desde Flask... (página ${page})`);
    
    const response = await getPlatosList(page, limit);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener platos');
    }
    
    estadoApp.platosData = response.data || [];
    console.log(`✅ Se cargaron ${estadoApp.platosData.length} platos`);
    
    mostrarPlatos(estadoApp.platosData);
  } catch (error) {
    console.error('❌ Error cargando platos:', error);
    mostrarError(`Error al cargar platos: ${error.message}`);
  }
}

// ==================== ACTUALIZAR cargarIngredientes ====================
async function cargarIngredientes() {
  try {
    const page = estadoApp.paginacion.ingredientes.pagina || 1;
    const limit = estadoApp.paginacion.ingredientes.porPagina || 12;
    
    console.log(`📥 Cargando ingredientes desde Flask... (página ${page})`);
    
    const response = await getIngredientesList(page, limit);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener ingredientes');
    }
    
    estadoApp.ingredientesData = response.data || [];
    console.log(`✅ Se cargaron ${estadoApp.ingredientesData.length} ingredientes`);
    
    mostrarIngredientes(estadoApp.ingredientesData);
  } catch (error) {
    console.error('❌ Error cargando ingredientes:', error);
    mostrarError(`Error al cargar ingredientes: ${error.message}`);
  }
}

// ==================== ACTUALIZAR cargarEscandallos ====================
async function cargarEscandallos() {
  try {
    const page = estadoApp.paginacion.escandallos.pagina || 1;
    const limit = estadoApp.paginacion.escandallos.porPagina || 12;
    
    console.log(`📥 Cargando escandallos desde Flask... (página ${page})`);
    
    const response = await getEscandallosList(page, limit);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener escandallos');
    }
    
    estadoApp.escandallosData = response.data || [];
    console.log(`✅ Se cargaron ${estadoApp.escandallosData.length} escandallos`);
    
    mostrarEscandallos(estadoApp.escandallosData);
  } catch (error) {
    console.error('❌ Error cargando escandallos:', error);
    mostrarError(`Error al cargar escandallos: ${error.message}`);
  }
}

// ==================== ACTUALIZAR cargarControles APPCC ====================
async function cargarControlAPPCC() {
  try {
    const page = estadoApp.paginacion.controlesAPPCC.pagina || 1;
    const limit = estadoApp.paginacion.controlesAPPCC.porPagina || 12;
    
    console.log(`📥 Cargando controles APPCC desde Flask... (página ${page})`);
    
    const response = await getControlesList(page, limit);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener controles');
    }
    
    estadoApp.controlesAPPCC = response.data || [];
    console.log(`✅ Se cargaron ${estadoApp.controlesAPPCC.length} controles APPCC`);
    
    mostrarControlesAPPCC(estadoApp.controlesAPPCC);
  } catch (error) {
    console.error('❌ Error cargando controles:', error);
    mostrarError(`Error al cargar controles: ${error.message}`);
  }
}

// ==================== CREAR PLATO ====================
async function guardarPlato(formData) {
  try {
    const platoData = {
      tipo_entidad: document.getElementById('tipo_entidad')?.value,
      codigo: document.getElementById('codigo')?.value,
      nombre: document.getElementById('nombre')?.value,
      grupo_menu: document.getElementById('grupo_menu')?.value,
      unidad: document.getElementById('unidad')?.value,
      coste: parseFloat(document.getElementById('coste')?.value || 0),
      precio_venta: parseFloat(document.getElementById('precio_venta')?.value || 0),
      margen_beneficio: parseFloat(document.getElementById('margen_beneficio')?.value || 0),
      peso_raciones: parseFloat(document.getElementById('peso_raciones')?.value || 0),
      stock_activo: document.getElementById('stock_activo')?.checked || false,
      alergenos_personalizados: (document.getElementById('alergenos_personalizados')?.value || '').split(',').filter(a => a.trim()),
      descripcion: document.getElementById('descripcion')?.value
    };

    console.log('📝 Guardando plato:', platoData);

    const platoId = document.getElementById('platoId')?.value;
    const response = platoId 
      ? await updatePlato(platoId, platoData)
      : await createPlato(platoData);

    if (!response.success) {
      throw new Error(response.message || 'Error al guardar plato');
    }

    console.log('✅ Plato guardado correctamente');
    mostrarExito(`Plato ${platoId ? 'actualizado' : 'creado'} correctamente`);
    cerrarModal();
    cargarPlatos();
  } catch (error) {
    console.error('❌ Error guardando plato:', error);
    mostrarError(`Error al guardar plato: ${error.message}`);
  }
}

// ==================== ELIMINAR PLATO ====================
async function eliminarPlato(platoId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este plato?')) {
    return;
  }

  try {
    console.log(`🗑️ Eliminando plato ${platoId}...`);
    
    const response = await deletePlato(platoId);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar plato');
    }

    console.log('✅ Plato eliminado');
    mostrarExito('Plato eliminado correctamente');
    cargarPlatos();
  } catch (error) {
    console.error('❌ Error eliminando plato:', error);
    mostrarError(`Error al eliminar plato: ${error.message}`);
  }
}

// ==================== CREAR/EDITAR INGREDIENTE ====================
async function guardarIngrediente(formData) {
  try {
    const ingredienteData = {
      codigo: document.getElementById('codigo')?.value,
      nombre: document.getElementById('nombre')?.value,
      familia: document.getElementById('familia')?.value,
      unidad: document.getElementById('unidad')?.value,
      coste_unitario: parseFloat(document.getElementById('coste_unitario')?.value || 0),
      proveedor: document.getElementById('proveedor')?.value,
      conservacion: document.getElementById('conservacion')?.value,
      alergenos: (document.getElementById('alergenos')?.value || '').split(',').filter(a => a.trim()),
      stock_minimo: parseFloat(document.getElementById('stock_minimo')?.value || 0),
      descripcion: document.getElementById('descripcion')?.value
    };

    console.log('📝 Guardando ingrediente:', ingredienteData);

    const ingredienteId = document.getElementById('ingredienteId')?.value;
    const response = ingredienteId
      ? await updateIngrediente(ingredienteId, ingredienteData)
      : await createIngrediente(ingredienteData);

    if (!response.success) {
      throw new Error(response.message || 'Error al guardar ingrediente');
    }

    console.log('✅ Ingrediente guardado correctamente');
    mostrarExito(`Ingrediente ${ingredienteId ? 'actualizado' : 'creado'} correctamente`);
    cerrarModal();
    cargarIngredientes();
  } catch (error) {
    console.error('❌ Error guardando ingrediente:', error);
    mostrarError(`Error al guardar ingrediente: ${error.message}`);
  }
}

// ==================== ELIMINAR INGREDIENTE ====================
async function eliminarIngrediente(ingredienteId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este ingrediente?')) {
    return;
  }

  try {
    console.log(`🗑️ Eliminando ingrediente ${ingredienteId}...`);
    
    const response = await deleteIngrediente(ingredienteId);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar ingrediente');
    }

    console.log('✅ Ingrediente eliminado');
    mostrarExito('Ingrediente eliminado correctamente');
    cargarIngredientes();
  } catch (error) {
    console.error('❌ Error eliminando ingrediente:', error);
    mostrarError(`Error al eliminar ingrediente: ${error.message}`);
  }
}

// ==================== CREAR/EDITAR ESCANDALLO ====================
async function guardarEscandallo(formData) {
  try {
    const escandalloData = {
      nombre: document.getElementById('nombre')?.value,
      plato_id: parseInt(document.getElementById('plato_id')?.value || 0),
      version: parseInt(document.getElementById('version')?.value || 1),
      coste_total: parseFloat(document.getElementById('coste_total')?.value || 0),
      observaciones: document.getElementById('observaciones')?.value,
      estado: 'activo'
    };

    console.log('📝 Guardando escandallo:', escandalloData);

    const escandalloId = document.getElementById('escandalloId')?.value;
    const response = escandalloId
      ? await updateEscandallo(escandalloId, escandalloData)
      : await createEscandallo(escandalloData);

    if (!response.success) {
      throw new Error(response.message || 'Error al guardar escandallo');
    }

    console.log('✅ Escandallo guardado correctamente');
    mostrarExito(`Escandallo ${escandalloId ? 'actualizado' : 'creado'} correctamente`);
    cerrarModal();
    cargarEscandallos();
  } catch (error) {
    console.error('❌ Error guardando escandallo:', error);
    mostrarError(`Error al guardar escandallo: ${error.message}`);
  }
}

// ==================== ELIMINAR ESCANDALLO ====================
async function eliminarEscandallo(escandalloId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este escandallo?')) {
    return;
  }

  try {
    console.log(`🗑️ Eliminando escandallo ${escandalloId}...`);
    
    const response = await deleteEscandallo(escandalloId);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar escandallo');
    }

    console.log('✅ Escandallo eliminado');
    mostrarExito('Escandallo eliminado correctamente');
    cargarEscandallos();
  } catch (error) {
    console.error('❌ Error eliminando escandallo:', error);
    mostrarError(`Error al eliminar escandallo: ${error.message}`);
  }
}

// ==================== CREAR/EDITAR CONTROL APPCC ====================
async function guardarControl(formData) {
  try {
    const controlData = {
      nombre: document.getElementById('nombre')?.value,
      descripcion: document.getElementById('descripcion')?.value,
      tipo_control: document.getElementById('tipo_control')?.value,
      limites_criticos: document.getElementById('limites_criticos')?.value,
      acciones_correctoras: document.getElementById('acciones_correctoras')?.value,
      responsable: document.getElementById('responsable')?.value,
      frecuencia: document.getElementById('frecuencia')?.value,
      activo: document.getElementById('activo')?.checked || true
    };

    console.log('📝 Guardando control:', controlData);

    const controlId = document.getElementById('controlId')?.value;
    const response = controlId
      ? await updateControl(controlId, controlData)
      : await createControl(controlData);

    if (!response.success) {
      throw new Error(response.message || 'Error al guardar control');
    }

    console.log('✅ Control guardado correctamente');
    mostrarExito(`Control ${controlId ? 'actualizado' : 'creado'} correctamente`);
    cerrarModal();
    cargarControlAPPCC();
  } catch (error) {
    console.error('❌ Error guardando control:', error);
    mostrarError(`Error al guardar control: ${error.message}`);
  }
}

// ==================== ELIMINAR CONTROL ====================
async function eliminarControl(controlId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este control?')) {
    return;
  }

  try {
    console.log(`🗑️ Eliminando control ${controlId}...`);
    
    const response = await deleteControl(controlId);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar control');
    }

    console.log('✅ Control eliminado');
    mostrarExito('Control eliminado correctamente');
    cargarControlAPPCC();
  } catch (error) {
    console.error('❌ Error eliminando control:', error);
    mostrarError(`Error al eliminar control: ${error.message}`);
  }
}

// ==================== DASHBOARD ====================
async function actualizarDashboard() {
  try {
    console.log('📊 Actualizando dashboard desde Flask...');
    
    // Cargar datos en paralelo
    const [statsPlatos, statsControles] = await Promise.all([
      getPlatosStats().catch(() => ({ success: false, data: [] })),
      getControlesList(1, 5).catch(() => ({ success: false, data: [] }))
    ]);

    // Actualizar métricas
    if (statsPlatos.success) {
      const totalPlatos = statsPlatos.data.reduce((s, g) => s + g.cantidad, 0);
      const totalPlatosEl = document.getElementById('totalPlatos');
      if (totalPlatosEl) totalPlatosEl.textContent = totalPlatos;
    }

    console.log('✅ Dashboard actualizado');
  } catch (error) {
    console.error('❌ Error actualizando dashboard:', error);
  }
}

// Exportar para uso global
window.integracionFlask = {
  cargarPlatos,
  cargarIngredientes,
  cargarEscandallos,
  cargarControlAPPCC,
  guardarPlato,
  eliminarPlato,
  guardarIngrediente,
  eliminarIngrediente,
  guardarEscandallo,
  eliminarEscandallo,
  guardarControl,
  eliminarControl,
  actualizarDashboard
};
