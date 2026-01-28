/**
 * Servicio de Validaciones - HIBO COCINA
 * 
 * Validaciones robustas para todos los módulos
 */

const { getDatabase } = require('./database');

class ServicioValidaciones {
  /**
   * Valida un plato completo
   * 
   * @param {Object} plato - Datos del plato
   * @param {boolean} esNuevo - Si es un plato nuevo (requiere código único)
   * @returns {Object} { valido, errores }
   */
  static validarPlato(plato, esNuevo = true) {
    const errores = [];
    
    // Validar código
    if (!plato.codigo || plato.codigo.trim() === '') {
      errores.push('El código del plato es requerido');
    }
    
    // Validar nombre
    if (!plato.nombre || plato.nombre.trim() === '') {
      errores.push('El nombre del plato es requerido');
    }
    
    // Validar precio venta
    if (plato.precio_venta !== undefined) {
      if (isNaN(plato.precio_venta) || plato.precio_venta < 0) {
        errores.push('El precio de venta debe ser un número positivo');
      }
    }
    
    // Validar peso raciones
    if (plato.peso_raciones !== undefined) {
      if (isNaN(plato.peso_raciones) || plato.peso_raciones <= 0) {
        errores.push('El peso de raciones debe ser un número positivo');
      }
    }
    
    // Validar alergenos (deben ser 0 o 1)
    const alergenos = [
      'sesamo', 'pescado', 'mariscos', 'apio', 'frutos_secos',
      'sulfitos', 'lacteos', 'altramuces', 'gluten', 'ovoproductos',
      'cacahuetes', 'soja', 'mostaza', 'moluscos', 'crustaceos'
    ];
    
    alergenos.forEach(alergia => {
      if (plato[alergia] !== undefined) {
        if (![0, 1].includes(parseInt(plato[alergia]))) {
          errores.push(`El campo ${alergia} debe ser 0 o 1`);
        }
      }
    });
    
    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Valida un ingrediente
   * 
   * @param {Object} ingrediente - Datos del ingrediente
   * @returns {Object} { valido, errores }
   */
  static validarIngrediente(ingrediente) {
    const errores = [];
    
    if (!ingrediente.codigo || ingrediente.codigo.trim() === '') {
      errores.push('El código del ingrediente es requerido');
    }
    
    if (!ingrediente.nombre || ingrediente.nombre.trim() === '') {
      errores.push('El nombre del ingrediente es requerido');
    }
    
    if (ingrediente.coste_unitario !== undefined) {
      if (isNaN(ingrediente.coste_unitario) || ingrediente.coste_unitario < 0) {
        errores.push('El coste unitario debe ser un número positivo');
      }
    }
    
    if (ingrediente.peso_neto_envase !== undefined) {
      if (isNaN(ingrediente.peso_neto_envase) || ingrediente.peso_neto_envase <= 0) {
        errores.push('El peso neto del envase debe ser un número positivo');
      }
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Valida un escandallo
   * 
   * @param {Object} escandallo - Datos del escandallo
   * @returns {Object} { valido, errores }
   */
  static validarEscandallo(escandallo) {
    const errores = [];
    
    if (!escandallo.plato_id) {
      errores.push('El plato es requerido');
    }
    
    if (!escandallo.ingrediente_id) {
      errores.push('El ingrediente es requerido');
    }
    
    if (escandallo.cantidad === undefined || escandallo.cantidad === '') {
      errores.push('La cantidad es requerida');
    } else if (isNaN(escandallo.cantidad) || parseFloat(escandallo.cantidad) <= 0) {
      errores.push('La cantidad debe ser un número positivo');
    }
    
    if (!escandallo.unidad || escandallo.unidad.trim() === '') {
      errores.push('La unidad es requerida');
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Valida un pedido
   * 
   * @param {Object} pedido - Datos del pedido
   * @param {Array} lineas - Líneas del pedido
   * @returns {Object} { valido, errores }
   */
  static validarPedido(pedido, lineas = []) {
    const errores = [];
    
    if (!pedido.numero || pedido.numero.trim() === '') {
      errores.push('El número de pedido es requerido');
    }
    
    if (!pedido.cliente_codigo || pedido.cliente_codigo.trim() === '') {
      errores.push('El cliente es requerido');
    }
    
    if (!pedido.fecha_entrega) {
      errores.push('La fecha de entrega es requerida');
    } else {
      const fecha = new Date(pedido.fecha_entrega);
      if (isNaN(fecha.getTime())) {
        errores.push('La fecha de entrega no es válida');
      }
    }
    
    if (!lineas || lineas.length === 0) {
      errores.push('El pedido debe tener al menos una línea');
    }
    
    lineas.forEach((linea, idx) => {
      if (!linea.plato_id) {
        errores.push(`Línea ${idx + 1}: El plato es requerido`);
      }
      if (!linea.cantidad || isNaN(linea.cantidad) || linea.cantidad <= 0) {
        errores.push(`Línea ${idx + 1}: La cantidad debe ser positiva`);
      }
    });
    
    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Valida un registro de sanidad (APPCC)
   * 
   * @param {Object} sanidad - Datos del control
   * @returns {Object} { valido, errores }
   */
  static validarSanidad(sanidad) {
    const errores = [];
    
    if (!sanidad.plato_id) {
      errores.push('El plato es requerido');
    }
    
    if (!sanidad.fecha_control) {
      errores.push('La fecha de control es requerida');
    }
    
    if (!sanidad.punto_critico || sanidad.punto_critico.trim() === '') {
      errores.push('El punto crítico es requerido');
    }
    
    if (sanidad.temperatura_medida !== undefined) {
      if (isNaN(sanidad.temperatura_medida)) {
        errores.push('La temperatura debe ser un número');
      }
    }
    
    if (!sanidad.temperatura_minima || !sanidad.temperatura_maxima) {
      errores.push('Los rangos de temperatura son requeridos');
    }
    
    // Validar que la temperatura medida esté dentro del rango
    if (sanidad.temperatura_medida !== undefined && 
        sanidad.temperatura_minima && sanidad.temperatura_maxima) {
      const temp = parseFloat(sanidad.temperatura_medida);
      const min = parseFloat(sanidad.temperatura_minima);
      const max = parseFloat(sanidad.temperatura_maxima);
      
      if (temp < min || temp > max) {
        errores.push(`La temperatura medida (${temp}°C) está fuera del rango [${min}°C - ${max}°C]`);
      }
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Valida un movimiento de inventario
   * 
   * @param {Object} movimiento - Datos del movimiento
   * @returns {Object} { valido, errores }
   */
  static validarMovimientoInventario(movimiento) {
    const errores = [];
    
    if (!movimiento.ingrediente_id) {
      errores.push('El ingrediente es requerido');
    }
    
    if (movimiento.cantidad === undefined || movimiento.cantidad === '') {
      errores.push('La cantidad es requerida');
    } else if (isNaN(movimiento.cantidad)) {
      errores.push('La cantidad debe ser un número');
    }
    
    if (!movimiento.tipo || !['entrada', 'salida', 'ajuste'].includes(movimiento.tipo)) {
      errores.push('El tipo de movimiento debe ser: entrada, salida o ajuste');
    }
    
    if (!movimiento.razon || movimiento.razon.trim() === '') {
      errores.push('La razón del movimiento es requerida');
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Valida múltiples registros en batch
   * 
   * @param {Array} registros - Array de registros
   * @param {Function} validador - Función validadora
   * @returns {Object} { validos, invalidos }
   */
  static validarEnLote(registros, validador) {
    const validos = [];
    const invalidos = [];
    
    registros.forEach((registro, idx) => {
      const resultado = validador(registro);
      
      if (resultado.valido) {
        validos.push(registro);
      } else {
        invalidos.push({
          indice: idx + 1,
          registro,
          errores: resultado.errores
        });
      }
    });
    
    return { validos, invalidos };
  }

  /**
   * Chequea unicidad de código
   * 
   * @param {string} tabla - Nombre de la tabla
   * @param {string} codigo - Código a verificar
   * @param {number} excludeId - ID a excluir (para edición)
   * @returns {Promise<boolean>} true si es único
   */
  static async verificarCodigoUnico(tabla, codigo, excludeId = null) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      let query = `SELECT id FROM ${tabla} WHERE codigo = ?`;
      const params = [codigo];
      
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      db.get(query, params, (err, row) => {
        if (err) return reject(err);
        resolve(!row);
      });
    });
  }
}

module.exports = ServicioValidaciones;
