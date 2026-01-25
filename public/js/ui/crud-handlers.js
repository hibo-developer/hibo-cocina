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
    
    const partida = produccionModule.obtener(id);
    
    if (!partida) {
      throw new Error('Partida no encontrada');
    }
    
    notify.info('Edición de partidas en desarrollo');
    
  } catch (error) {
    console.error('Error al editar partida:', error);
    notify.error('Error al cargar datos de la partida');
  }
}

/**
 * Eliminar partida
 */
async function eliminarPartida(id) {
  if (!confirm('¿Está seguro de que desea eliminar esta partida?')) {
    return;
  }
  
  try {
    notify.info('Eliminación de partidas en desarrollo');
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
    notify.info('Edición de controles APPCC en desarrollo');
  } catch (error) {
    console.error('Error al editar control:', error);
    notify.error('Error al cargar datos del control');
  }
}

/**
 * Eliminar control de sanidad
 */
async function eliminarControlSanidad(id) {
  if (!confirm('¿Está seguro de que desea eliminar este control?')) {
    return;
  }
  
  try {
    notify.info('Eliminación de controles APPCC en desarrollo');
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
    notify.info('Edición de inventario en desarrollo');
  } catch (error) {
    console.error('Error al editar inventario:', error);
    notify.error('Error al cargar datos del inventario');
  }
}

/**
 * Eliminar item de inventario
 */
async function eliminarInventario(id) {
  if (!confirm('¿Está seguro de que desea eliminar este item?')) {
    return;
  }
  
  try {
    notify.info('Eliminación de inventario en desarrollo');
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
