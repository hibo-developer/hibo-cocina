/**
 * ============================================================================
 * CRUD-HANDLERS.JS - Manejadores de UI para operaciones CRUD
 * ============================================================================
 * 
 * Funciones que conectan los botones de la UI con los módulos de negocio
 * 
 */

// ============================================================================
// PLATOS
// ============================================================================

/**
 * Editar plato (llamada desde botón en tabla)
 */
async function editarPlato(id) {
  try {
    console.log(`✏️ Editando plato ${id}...`);
    
    // Obtener datos del plato
    const plato = await platosModule.obtener(id);
    
    if (!plato) {
      throw new Error('Plato no encontrado');
    }
    
    // Abrir modal con datos precargados
    const campos = [
      { id: 'codigo', nombre: 'codigo', label: 'Código', tipo: 'texto', requerido: true },
      { id: 'nombre', nombre: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true },
      { id: 'grupo_menu', nombre: 'grupo_menu', label: 'Grupo Menú', tipo: 'select', requerido: false,
        opciones: [
          { valor: 'Entrante caliente', label: 'Entrante caliente' },
          { valor: 'Entrante frio', label: 'Entrante frio' },
          { valor: 'Arroces', label: 'Arroces' },
          { valor: 'Carnes', label: 'Carnes' },
          { valor: 'Pescados', label: 'Pescados' },
          { valor: 'Guarniciones', label: 'Guarniciones' },
          { valor: 'Postre', label: 'Postre' }
        ]
      },
      { id: 'unidad', nombre: 'unidad', label: 'Unidad', tipo: 'texto', requerido: false },
      { id: 'coste', nombre: 'coste', label: 'Coste (€)', tipo: 'numero', requerido: false },
      { id: 'peso_raciones', nombre: 'peso_raciones', label: 'Peso Ración (g)', tipo: 'numero', requerido: false },
      { id: 'stock_activo', nombre: 'stock_activo', label: 'Stock Activo', tipo: 'checkbox', requerido: false }
    ];
    
    modalManager.open(`Editar Plato: ${plato.nombre}`, campos);
    
    // Cargar datos en el formulario
    setTimeout(() => {
      document.getElementById('codigo').value = plato.codigo || '';
      document.getElementById('nombre').value = plato.nombre || '';
      document.getElementById('grupo_menu').value = plato.grupo_menu || '';
      document.getElementById('unidad').value = plato.unidad || '';
      document.getElementById('coste').value = plato.coste || 0;
      document.getElementById('peso_raciones').value = plato.peso_raciones || 0;
      document.getElementById('stock_activo').checked = plato.stock_activo || false;
    }, 100);
    
    // Configurar callback de guardado
    modalManager.setCallback(async (formData) => {
      try {
        console.log('💾 Guardando cambios...', formData);
        await platosModule.actualizar(id, formData);
        notify.success('Plato actualizado correctamente');
        await platosModule.cargar();
        mostrarPlatos();
      } catch (error) {
        console.error('Error al actualizar plato:', error);
        notify.error('Error al actualizar plato');
        throw error;
      }
    });
    
  } catch (error) {
    console.error('Error al editar plato:', error);
    notify.error('Error al cargar datos del plato');
  }
}

/**
 * Eliminar plato (llamada desde botón en tabla)
 */
async function eliminarPlato(id) {
  if (!confirm('¿Está seguro de que desea eliminar este plato?')) {
    return;
  }
  
  try {
    console.log(`🗑️ Eliminando plato ${id}...`);
    await platosModule.eliminar(id);
    notify.success('Plato eliminado correctamente');
    await platosModule.cargar();
    mostrarPlatos();
  } catch (error) {
    console.error('Error al eliminar plato:', error);
    notify.error('Error al eliminar plato');
  }
}

// ============================================================================
// INGREDIENTES
// ============================================================================

/**
 * Editar ingrediente
 */
async function editarIngrediente(id) {
  try {
    console.log(`✏️ Editando ingrediente ${id}...`);
    
    const ingrediente = await ingredientesModule.obtener(id);
    
    if (!ingrediente) {
      throw new Error('Ingrediente no encontrado');
    }
    
    const campos = [
      { id: 'codigo', nombre: 'codigo', label: 'Código', tipo: 'texto', requerido: true },
      { id: 'nombre', nombre: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true },
      { id: 'familia', nombre: 'familia', label: 'Familia', tipo: 'texto', requerido: false },
      { id: 'grupo_conservacion', nombre: 'grupo_conservacion', label: 'Conservación', tipo: 'select', requerido: false,
        opciones: [
          { valor: 'Refrigerado', label: 'Refrigerado' },
          { valor: 'Congelado', label: 'Congelado' },
          { valor: 'Ambiente', label: 'Ambiente' }
        ]
      },
      { id: 'proveedor', nombre: 'proveedor', label: 'Proveedor', tipo: 'texto', requerido: false },
      { id: 'coste_unitario', nombre: 'coste_unitario', label: 'Coste Unitario (€)', tipo: 'numero', requerido: false }
    ];
    
    modalManager.open(`Editar Ingrediente: ${ingrediente.nombre}`, campos);
    
    // Cargar datos
    setTimeout(() => {
      document.getElementById('codigo').value = ingrediente.codigo || '';
      document.getElementById('nombre').value = ingrediente.nombre || '';
      document.getElementById('familia').value = ingrediente.familia || '';
      document.getElementById('grupo_conservacion').value = ingrediente.grupo_conservacion || '';
      document.getElementById('proveedor').value = ingrediente.proveedor || '';
      document.getElementById('coste_unitario').value = ingrediente.coste_unitario || 0;
    }, 100);
    
    modalManager.setCallback(async (formData) => {
      await ingredientesModule.actualizar(id, formData);
      notify.success('Ingrediente actualizado correctamente');
      await ingredientesModule.cargar();
      mostrarIngredientes();
    });
    
  } catch (error) {
    console.error('Error al editar ingrediente:', error);
    notify.error('Error al cargar datos del ingrediente');
  }
}

/**
 * Eliminar ingrediente
 */
async function eliminarIngrediente(id) {
  if (!confirm('¿Está seguro de que desea eliminar este ingrediente?')) {
    return;
  }
  
  try {
    await ingredientesModule.eliminar(id);
    notify.success('Ingrediente eliminado correctamente');
    await ingredientesModule.cargar();
    mostrarIngredientes();
  } catch (error) {
    console.error('Error al eliminar ingrediente:', error);
    notify.error('Error al eliminar ingrediente');
  }
}

// ============================================================================
// ESCANDALLOS
// ============================================================================

/**
 * Editar escandallo
 */
async function editarEscandallo(id) {
  try {
    console.log(`✏️ Editando escandallo ${id}...`);
    
    const escandallo = await escandallosModule.obtener(id);
    
    if (!escandallo) {
      throw new Error('Escandallo no encontrado');
    }
    
    // Por ahora, redirigir al modal dinámico
    if (typeof abrirModalDinamico === 'function') {
      abrirModalDinamico('escandallo', { modo: 'editar', escandalloId: id });
    } else {
      notify.warning('Funcionalidad de edición de escandallos aún no migrada');
    }
    
  } catch (error) {
    console.error('Error al editar escandallo:', error);
    notify.error('Error al cargar datos del escandallo');
  }
}

/**
 * Eliminar escandallo
 */
async function eliminarEscandallo(id) {
  if (!confirm('¿Está seguro de que desea eliminar este escandallo?')) {
    return;
  }
  
  try {
    await escandallosModule.eliminar(id);
    notify.success('Escandallo eliminado correctamente');
    await escandallosModule.cargar();
    mostrarEscandallos();
  } catch (error) {
    console.error('Error al eliminar escandallo:', error);
    notify.error('Error al eliminar escandallo');
  }
}

// ============================================================================
// PEDIDOS
// ============================================================================

/**
 * Editar pedido
 */
async function editarPedido(id) {
  try {
    console.log(`✏️ Editando pedido ${id}...`);
    
    const pedido = await pedidosModule.obtener(id);
    
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }
    
    const campos = [
      { id: 'cliente', nombre: 'cliente', label: 'Cliente', tipo: 'texto', requerido: true },
      { id: 'plato', nombre: 'plato', label: 'Plato', tipo: 'texto', requerido: true },
      { id: 'cantidad', nombre: 'cantidad', label: 'Cantidad', tipo: 'numero', requerido: true },
      { id: 'estado', nombre: 'estado', label: 'Estado', tipo: 'select', requerido: true,
        opciones: [
          { valor: 'pendiente', label: 'Pendiente' },
          { valor: 'preparacion', label: 'En Preparación' },
          { valor: 'listo', label: 'Listo' },
          { valor: 'entregado', label: 'Entregado' }
        ]
      },
      { id: 'total', nombre: 'total', label: 'Total (€)', tipo: 'numero', requerido: false }
    ];
    
    modalManager.open(`Editar Pedido #${id}`, campos);
    
    setTimeout(() => {
      document.getElementById('cliente').value = pedido.cliente || '';
      document.getElementById('plato').value = pedido.plato || '';
      document.getElementById('cantidad').value = pedido.cantidad || 1;
      document.getElementById('estado').value = pedido.estado || 'pendiente';
      document.getElementById('total').value = pedido.total || 0;
    }, 100);
    
    modalManager.setCallback(async (formData) => {
      await pedidosModule.actualizar(id, formData);
      notify.success('Pedido actualizado correctamente');
      await pedidosModule.cargar();
      mostrarPedidos();
    });
    
  } catch (error) {
    console.error('Error al editar pedido:', error);
    notify.error('Error al cargar datos del pedido');
  }
}

/**
 * Eliminar pedido
 */
async function eliminarPedido(id) {
  if (!confirm('¿Está seguro de que desea eliminar este pedido?')) {
    return;
  }
  
  try {
    await pedidosModule.eliminar(id);
    notify.success('Pedido eliminado correctamente');
    await pedidosModule.cargar();
    mostrarPedidos();
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    notify.error('Error al eliminar pedido');
  }
}

// ============================================================================
// PRODUCCIÓN
// ============================================================================

/**
 * Editar partida/orden de producción
 */
async function editarPartida(id) {
  try {
    console.log(`✏️ Editando partida ${id}...`);
    
    // Cargar datos de la partida desde la API
    const response = await fetch(`${window.API_BASE}/partidas-cocina/${id}`);
    if (!response.ok) throw new Error('Error al cargar partida');
    const result = await response.json();
    const partida = result.data || result;
    
    if (!partida || !partida.id) {
      throw new Error('No se pudieron cargar los datos de la partida');
    }
    
    console.log('✅ Partida cargada:', partida);
    
    // Definir campos del formulario
    const campos = [
      { id: 'nombre', nombre: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true },
      { id: 'responsable', nombre: 'responsable', label: 'Responsable', tipo: 'texto', requerido: false },
      { id: 'descripcion', nombre: 'descripcion', label: 'Descripción', tipo: 'textarea', requerido: false },
      { id: 'activo', nombre: 'activo', label: 'Activa', tipo: 'checkbox', requerido: false }
    ];
    
    // Abrir modal con datos
    modalManager.open(`Editar Partida: ${partida.nombre}`, campos);
    
    // Cargar valores en el formulario
    setTimeout(() => {
      document.getElementById('nombre').value = partida.nombre || '';
      document.getElementById('responsable').value = partida.responsable || '';
      document.getElementById('descripcion').value = partida.descripcion || '';
      document.getElementById('activo').checked = partida.activo || false;
    }, 100);
    
    // Configurar callback de guardado
    modalManager.setCallback(async (formData) => {
      try {
        console.log('💾 Guardando cambios de partida...', formData);
        
        const datos = {
          nombre: formData.nombre,
          responsable: formData.responsable || '',
          descripcion: formData.descripcion || '',
          activo: formData.activo ? 1 : 0
        };
        
        const resp = await fetch(`${window.API_BASE}/partidas-cocina/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        
        if (!resp.ok) throw new Error('Error al actualizar partida');
        
        notify.success('Partida actualizada correctamente');
        
        // Recargar lista
        if (typeof window.cargarPartidas === 'function') {
          await window.cargarPartidas();
        }
      } catch (error) {
        console.error('Error al actualizar partida:', error);
        notify.error('Error al actualizar partida');
        throw error;
      }
    });
    
  } catch (error) {
    console.error('Error al editar partida:', error);
    notify.error('Error al cargar datos de la partida');
  }
}

/**
 * Eliminar partida
 */
async function eliminarPartida(id) {
  if (!confirm('¿Está seguro de que desea eliminar esta partida de cocina?')) {
    return;
  }
  
  try {
    console.log(`🗑️ Eliminando partida ${id}...`);
    
    const response = await fetch(`${window.API_BASE}/partidas-cocina/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Error al eliminar partida');
    
    notify.success('Partida eliminada correctamente');
    
    // Recargar lista
    if (typeof window.cargarPartidas === 'function') {
      await window.cargarPartidas();
    }
  } catch (error) {
    console.error('Error al eliminar partida:', error);
    notify.error('Error al eliminar partida');
  }
}

// ============================================================================
// SANIDAD/APPCC
// ============================================================================

/**
 * Editar control de sanidad
 */
async function editarControlSanidad(id) {
  try {
    console.log(`✏️ Editando control de sanidad ${id}...`);
    
    // Cargar datos del control
    const response = await fetch(`${window.API_BASE}/control-sanidad/${id}`);
    if (!response.ok) throw new Error('Error al cargar control');
    const control = await response.json();
    
    if (!control || !control.id) {
      throw new Error('No se pudieron cargar los datos del control');
    }
    
    console.log('✅ Control sanidad cargado:', control);
    
    // Definir campos del formulario
    const campos = [
      { id: 'platos', nombre: 'platos', label: 'Código Plato', tipo: 'texto', requerido: true },
      { id: 'ingredientes', nombre: 'ingredientes', label: 'Código Ingrediente', tipo: 'texto', requerido: false },
      { id: 'lote_produccion', nombre: 'lote_produccion', label: 'Lote Producción', tipo: 'texto', requerido: false },
      { id: 'fecha_produccion', nombre: 'fecha_produccion', label: 'Fecha Producción', tipo: 'fecha', requerido: false },
      { id: 'punto_critico', nombre: 'punto_critico', label: 'Punto Crítico', tipo: 'texto', requerido: false },
      { id: 'punto_corrector', nombre: 'punto_corrector', label: 'Punto Corrector', tipo: 'textarea', requerido: false },
      { id: 'resultado', nombre: 'resultado', label: 'Resultado', tipo: 'texto', requerido: false },
      { id: 'responsable', nombre: 'responsable', label: 'Responsable', tipo: 'texto', requerido: false },
      { id: 'observaciones', nombre: 'observaciones', label: 'Observaciones', tipo: 'textarea', requerido: false }
    ];
    
    // Abrir modal
    modalManager.open('Editar Control APPCC', campos);
    
    // Cargar valores
    setTimeout(() => {
      document.getElementById('platos').value = control.platos || '';
      document.getElementById('ingredientes').value = control.ingredientes || '';
      document.getElementById('lote_produccion').value = control.lote_produccion || '';
      if (control.fecha_produccion) {
        document.getElementById('fecha_produccion').value = control.fecha_produccion.split('T')[0];
      }
      document.getElementById('punto_critico').value = control.punto_critico || '';
      document.getElementById('punto_corrector').value = control.punto_corrector || '';
      document.getElementById('resultado').value = control.resultado || '';
      document.getElementById('responsable').value = control.responsable || '';
      document.getElementById('observaciones').value = control.observaciones || '';
    }, 100);
    
    // Configurar callback
    modalManager.setCallback(async (formData) => {
      try {
        console.log('💾 Guardando cambios de control sanidad...', formData);
        
        const resp = await fetch(`${window.API_BASE}/control-sanidad/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (!resp.ok) throw new Error('Error al actualizar control');
        
        notify.success('Control APPCC actualizado correctamente');
        
        // Recargar lista
        if (typeof window.cargarSanidad === 'function') {
          await window.cargarSanidad();
        }
      } catch (error) {
        console.error('Error al actualizar control:', error);
        notify.error('Error al actualizar control');
        throw error;
      }
    });
    
  } catch (error) {
    console.error('Error al editar control:', error);
    notify.error('Error al cargar datos del control');
  }
}

/**
 * Eliminar control de sanidad
 */
async function eliminarControlSanidad(id) {
  if (!confirm('¿Está seguro de que desea eliminar este control APPCC?')) {
    return;
  }
  
  try {
    console.log(`🗑️ Eliminando control sanidad ${id}...`);
    
    const response = await fetch(`${window.API_BASE}/control-sanidad/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Error al eliminar control');
    
    notify.success('Control APPCC eliminado correctamente');
    
    // Recargar lista
    if (typeof window.cargarSanidad === 'function') {
      await window.cargarSanidad();
    }
  } catch (error) {
    console.error('Error al eliminar control:', error);
    notify.error('Error al eliminar control');
  }
}

// ============================================================================
// INVENTARIO
// ============================================================================

/**
 * Editar item de inventario
 */
async function editarInventario(id) {
  try {
    console.log(`✏️ Editando inventario ${id}...`);
    
    // Cargar datos del inventario
    const response = await fetch(`${window.API_BASE}/inventario/${id}`);
    if (!response.ok) throw new Error('Error al cargar inventario');
    const result = await response.json();
    const inv = result.data || result;
    
    if (!inv || !inv.id) {
      throw new Error('No se pudieron cargar los datos del inventario');
    }
    
    console.log('✅ Inventario cargado:', inv);
    
    // Cargar lista de artículos para el select
    let articulos = [];
    try {
      const articulosResp = await fetch(`${window.API_BASE}/ingredientes`);
      if (articulosResp.ok) {
        articulos = await articulosResp.json();
      }
    } catch (error) {
      console.error('Error al cargar artículos:', error);
    }
    
    // Crear opciones para el select de artículos
    const opcionesArticulos = articulos.map(a => ({
      valor: a.id,
      label: `${a.codigo || ''} - ${a.nombre || ''}`
    }));
    
    // Definir campos del formulario
    const campos = [
      { id: 'articulo_id', nombre: 'articulo_id', label: 'Artículo', tipo: 'select', requerido: true,
        opciones: opcionesArticulos
      },
      { id: 'cantidad', nombre: 'cantidad', label: 'Cantidad', tipo: 'numero', requerido: true },
      { id: 'fecha_registro', nombre: 'fecha_registro', label: 'Fecha Registro', tipo: 'fecha', requerido: false }
    ];
    
    // Abrir modal
    modalManager.open('Editar Inventario', campos);
    
    // Cargar valores
    setTimeout(() => {
      document.getElementById('articulo_id').value = inv.articulo_id || '';
      document.getElementById('cantidad').value = inv.cantidad || 0;
      if (inv.fecha_registro) {
        document.getElementById('fecha_registro').value = inv.fecha_registro.split('T')[0];
      }
    }, 100);
    
    // Configurar callback
    modalManager.setCallback(async (formData) => {
      try {
        console.log('💾 Guardando cambios de inventario...', formData);
        
        const datos = {
          articulo_id: parseInt(formData.articulo_id),
          cantidad: parseFloat(formData.cantidad),
          fecha_registro: formData.fecha_registro || new Date().toISOString().split('T')[0]
        };
        
        const resp = await fetch(`${window.API_BASE}/inventario/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        
        if (!resp.ok) throw new Error('Error al actualizar inventario');
        
        notify.success('Inventario actualizado correctamente');
        
        // Recargar lista
        if (typeof window.cargarInventario === 'function') {
          await window.cargarInventario();
        }
      } catch (error) {
        console.error('Error al actualizar inventario:', error);
        notify.error('Error al actualizar inventario');
        throw error;
      }
    });
    
  } catch (error) {
    console.error('Error al editar inventario:', error);
    notify.error('Error al cargar datos del inventario');
  }
}

/**
 * Eliminar item de inventario
 */
async function eliminarInventario(id) {
  if (!confirm('¿Está seguro de que desea eliminar este registro de inventario?')) {
    return;
  }
  
  try {
    console.log(`🗑️ Eliminando inventario ${id}...`);
    
    const response = await fetch(`${window.API_BASE}/inventario/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Error al eliminar inventario');
    
    notify.success('Inventario eliminado correctamente');
    
    // Recargar lista
    if (typeof window.cargarInventario === 'function') {
      await window.cargarInventario();
    }
  } catch (error) {
    console.error('Error al eliminar inventario:', error);
    notify.error('Error al eliminar inventario');
  }
}

// ============================================================================
// EXPORTAR GLOBALMENTE
// ============================================================================

window.editarPlato = editarPlato;
window.eliminarPlato = eliminarPlato;
window.editarIngrediente = editarIngrediente;
window.eliminarIngrediente = eliminarIngrediente;
window.editarEscandallo = editarEscandallo;
window.eliminarEscandallo = eliminarEscandallo;
window.editarPedido = editarPedido;
window.eliminarPedido = eliminarPedido;
window.editarPartida = editarPartida;
window.eliminarPartida = eliminarPartida;
window.editarControlSanidad = editarControlSanidad;
window.eliminarControlSanidad = eliminarControlSanidad;
window.editarInventario = editarInventario;
window.eliminarInventario = eliminarInventario;

console.log('✅ CRUD Handlers cargados y expuestos globalmente');
