/**
 * Esquemas de validación con Joi
 * Define las reglas de validación para cada entidad
 */

const Joi = require('joi');

/**
 * Esquemas para PLATOS
 */
const platosSchemas = {
  crear: Joi.object({
    codigo: Joi.string().required().min(1).max(50).messages({
      'any.required': 'código es requerido',
      'string.min': 'código debe tener al menos 1 carácter',
      'string.max': 'código no puede exceder 50 caracteres'
    }),
    nombre: Joi.string().required().min(3).max(100).messages({
      'any.required': 'nombre es requerido',
      'string.min': 'nombre debe tener al menos 3 caracteres',
      'string.max': 'nombre no puede exceder 100 caracteres'
    }),
    categoria: Joi.string().allow('').max(50),
    pvp: Joi.number().min(0).messages({
      'number.min': 'pvp no puede ser negativo'
    }),
    coste_produccion: Joi.number().min(0).messages({
      'number.min': 'coste_produccion no puede ser negativo'
    }),
    activo: Joi.boolean(),
    descripcion: Joi.string().allow('').max(500)
  }),
  actualizar: Joi.object({
    codigo: Joi.string().min(1).max(50),
    nombre: Joi.string().min(3).max(100),
    categoria: Joi.string().allow('').max(50),
    pvp: Joi.number().min(0),
    coste_produccion: Joi.number().min(0),
    activo: Joi.boolean(),
    descripcion: Joi.string().allow('').max(500)
  })
};

/**
 * Esquemas para INGREDIENTES
 */
const ingredientesSchemas = {
  crear: Joi.object({
    nombre: Joi.string().required().min(3).max(100).messages({
      'any.required': 'nombre es requerido',
      'string.min': 'nombre debe tener al menos 3 caracteres'
    }),
    unidad: Joi.string().allow('').max(20),
    precio: Joi.number().min(0),
    stock_actual: Joi.number().min(0),
    activo: Joi.boolean()
  }),
  actualizar: Joi.object({
    nombre: Joi.string().min(3).max(100),
    unidad: Joi.string().allow('').max(20),
    precio: Joi.number().min(0),
    stock_actual: Joi.number().min(0),
    activo: Joi.boolean()
  })
};

/**
 * Esquemas para ESCANDALLOS
 */
const escandallosSchemas = {
  crear: Joi.object({
    plato_id: Joi.number().integer().required().messages({
      'any.required': 'plato_id es requerido'
    }),
    ingrediente_id: Joi.number().integer().required().messages({
      'any.required': 'ingrediente_id es requerido'
    }),
    cantidad: Joi.number().min(0)
  }),
  actualizar: Joi.object({
    plato_id: Joi.number().integer(),
    ingrediente_id: Joi.number().integer(),
    cantidad: Joi.number().min(0)
  })
};

/**
 * Esquemas para INVENTARIO
 */
const inventarioSchemas = {
  crear: Joi.object({
    ingrediente_id: Joi.number().integer().required().messages({
      'any.required': 'ingrediente_id es requerido'
    }),
    cantidad: Joi.number().min(0),
    unidad: Joi.string().allow('').max(20),
    lote: Joi.string().allow('').max(50),
    fecha: Joi.date().iso(),
    fecha_caducidad: Joi.date().iso(),
    ubicacion: Joi.string().allow('').max(100)
  }),
  actualizar: Joi.object({
    ingrediente_id: Joi.number().integer(),
    cantidad: Joi.number().min(0),
    unidad: Joi.string().allow('').max(20),
    lote: Joi.string().allow('').max(50),
    fecha: Joi.date().iso(),
    fecha_caducidad: Joi.date().iso(),
    ubicacion: Joi.string().allow('').max(100)
  })
};

/**
 * Esquemas para PEDIDOS
 */
const pedidosSchemas = {
  crear: Joi.object({
    numero: Joi.string().required().min(1).max(50).messages({
      'any.required': 'numero es requerido'
    }),
    cliente_codigo: Joi.string().allow('').max(50),
    fecha_pedido: Joi.date().iso(),
    fecha_entrega: Joi.date().iso(),
    estado: Joi.string().allow('').max(50),
    total: Joi.number().min(0)
  }),
  actualizar: Joi.object({
    numero: Joi.string().min(1).max(50),
    cliente_codigo: Joi.string().allow('').max(50),
    fecha_pedido: Joi.date().iso(),
    fecha_entrega: Joi.date().iso(),
    estado: Joi.string().allow('').max(50),
    total: Joi.number().min(0)
  })
};

/**
 * Esquemas para PARTIDAS
 */
const partidasSchemas = {
  crear: Joi.object({
    nombre: Joi.string().required().min(3).max(100).messages({
      'any.required': 'nombre es requerido'
    }),
    responsable: Joi.string().allow('').max(100),
    descripcion: Joi.string().allow('').max(500),
    activo: Joi.boolean()
  }),
  actualizar: Joi.object({
    nombre: Joi.string().min(3).max(100),
    responsable: Joi.string().allow('').max(100),
    descripcion: Joi.string().allow('').max(500),
    activo: Joi.boolean()
  })
};

/**
 * Esquemas para SANIDAD
 */
const sanidadSchemas = {
  crear: Joi.object({
    plato_codigo: Joi.string().allow('').max(50),
    ingrediente_codigo: Joi.string().allow('').max(50),
    fecha_produccion: Joi.date().iso().required().messages({
      'any.required': 'fecha_produccion es requerida'
    }),
    punto_critico: Joi.string().allow('').max(100),
    corrector: Joi.string().allow('').max(100),
    responsable: Joi.string().allow('').max(100),
    observaciones: Joi.string().allow('').max(500)
  }),
  actualizar: Joi.object({
    plato_codigo: Joi.string().allow('').max(50),
    ingrediente_codigo: Joi.string().allow('').max(50),
    fecha_produccion: Joi.date().iso(),
    punto_critico: Joi.string().allow('').max(100),
    corrector: Joi.string().allow('').max(100),
    responsable: Joi.string().allow('').max(100),
    observaciones: Joi.string().allow('').max(500)
  })
};

/**
 * Esquemas para PRODUCCIÓN
 */
const produccionSchemas = {
  crearOrden: Joi.object({
    codigo: Joi.string().required().min(1).max(50).messages({
      'any.required': 'código es requerido',
      'string.min': 'código debe tener al menos 1 carácter'
    }),
    plato_id: Joi.number().integer().required().messages({
      'any.required': 'plato_id es requerido'
    }),
    cantidad: Joi.number().min(1).required().messages({
      'any.required': 'cantidad es requerida',
      'number.min': 'cantidad debe ser al menos 1'
    }),
    prioridad: Joi.string().valid('baja', 'normal', 'alta', 'urgente').default('normal'),
    pedido_id: Joi.number().integer().allow(null),
    fecha_entrega: Joi.date().iso().allow(null),
    notas: Joi.string().allow('').max(500)
  }),
  actualizarOrden: Joi.object({
    estado: Joi.string().valid('pendiente', 'en_proceso', 'completada', 'cancelada'),
    prioridad: Joi.string().valid('baja', 'normal', 'alta', 'urgente'),
    cantidad: Joi.number().min(1),
    fecha_entrega: Joi.date().iso().allow(null),
    notas: Joi.string().allow('').max(500)
  }),
  crearLote: Joi.object({
    codigo: Joi.string().required().min(1).max(50),
    orden_id: Joi.number().integer().required(),
    cantidad: Joi.number().min(1).required(),
    fecha_fabricacion: Joi.date().iso(),
    fecha_caducidad: Joi.date().iso(),
    ubicacion: Joi.string().allow('').max(100),
    notas: Joi.string().allow('').max(500)
  }),
  crearConsumo: Joi.object({
    orden_id: Joi.number().integer().required(),
    ingrediente_id: Joi.number().integer().required(),
    cantidad: Joi.number().min(0).required(),
    unidad: Joi.string().max(20),
    lote: Joi.string().allow('').max(50)
  })
};

/**
 * Esquemas para OFERTAS
 */
const ofertasSchemas = {
  crear: Joi.object({
    codigo: Joi.string().required().min(1).max(50).messages({
      'any.required': 'código es requerido'
    }),
    nombre: Joi.string().required().min(3).max(200).messages({
      'any.required': 'nombre es requerido',
      'string.min': 'nombre debe tener al menos 3 caracteres'
    }),
    descripcion: Joi.string().allow('').max(1000),
    tipo: Joi.string().valid('oferta', 'promocion', 'descuento').default('oferta'),
    estado: Joi.string().valid('activa', 'inactiva', 'pausada', 'finalizada').default('activa'),
    precio_regular: Joi.number().min(0),
    precio_oferta: Joi.number().min(0),
    descuento_porcentaje: Joi.number().min(0).max(100),
    fecha_inicio: Joi.date().iso(),
    fecha_fin: Joi.date().iso().greater(Joi.ref('fecha_inicio')).messages({
      'date.greater': 'fecha_fin debe ser posterior a fecha_inicio'
    }),
    platos: Joi.string().allow(''),
    ingredientes: Joi.string().allow(''),
    audiencia: Joi.string().allow(''),
    terminos_condiciones: Joi.string().allow('').max(2000)
  }),
  actualizar: Joi.object({
    codigo: Joi.string().min(1).max(50),
    nombre: Joi.string().min(3).max(200),
    descripcion: Joi.string().allow('').max(1000),
    tipo: Joi.string().valid('oferta', 'promocion', 'descuento'),
    estado: Joi.string().valid('activa', 'inactiva', 'pausada', 'finalizada'),
    precio_regular: Joi.number().min(0),
    precio_oferta: Joi.number().min(0),
    descuento_porcentaje: Joi.number().min(0).max(100),
    fecha_inicio: Joi.date().iso(),
    fecha_fin: Joi.date().iso(),
    platos: Joi.string().allow(''),
    ingredientes: Joi.string().allow(''),
    audiencia: Joi.string().allow(''),
    terminos_condiciones: Joi.string().allow('').max(2000)
  }),
  aplicar: Joi.object({
    oferta_id: Joi.number().integer().required().messages({
      'any.required': 'oferta_id es requerido'
    }),
    pedido_id: Joi.number().integer().allow(null),
    evento_id: Joi.number().integer().allow(null),
    cliente_id: Joi.number().integer().allow(null),
    codigo_cupon: Joi.string().allow('').max(50)
  })
};

/**
 * Esquemas para EVENTOS
 */
const eventosSchemas = {
  crear: Joi.object({
    codigo: Joi.string().required().min(1).max(50).messages({
      'any.required': 'código es requerido'
    }),
    nombre: Joi.string().required().min(3).max(200).messages({
      'any.required': 'nombre es requerido'
    }),
    descripcion: Joi.string().allow('').max(1000),
    tipo_evento: Joi.string().valid('cumpleaños', 'corporativo', 'boda', 'catering', 'otro').default('otro'),
    estado: Joi.string().valid('planificado', 'confirmado', 'en_progreso', 'completado', 'cancelado').default('planificado'),
    fecha_evento: Joi.date().iso().required().messages({
      'any.required': 'fecha_evento es requerida'
    }),
    lugar: Joi.string().allow('').max(200),
    capacidad: Joi.number().integer().min(0).default(0),
    personas_confirmadas: Joi.number().integer().min(0).default(0),
    personas_pendientes: Joi.number().integer().min(0).default(0),
    precio_entrada: Joi.number().min(0),
    precio_total: Joi.number().min(0),
    menu_especial: Joi.string().allow(''),
    decoracion: Joi.string().allow('').max(500),
    contacto_principal: Joi.string().allow(''),
    notas: Joi.string().allow('').max(1000)
  }),
  actualizar: Joi.object({
    codigo: Joi.string().min(1).max(50),
    nombre: Joi.string().min(3).max(200),
    descripcion: Joi.string().allow('').max(1000),
    tipo_evento: Joi.string().valid('cumpleaños', 'corporativo', 'boda', 'catering', 'otro'),
    estado: Joi.string().valid('planificado', 'confirmado', 'en_progreso', 'completado', 'cancelado'),
    fecha_evento: Joi.date().iso(),
    lugar: Joi.string().allow('').max(200),
    capacidad: Joi.number().integer().min(0),
    personas_confirmadas: Joi.number().integer().min(0),
    personas_pendientes: Joi.number().integer().min(0),
    precio_entrada: Joi.number().min(0),
    precio_total: Joi.number().min(0),
    menu_especial: Joi.string().allow(''),
    decoracion: Joi.string().allow('').max(500),
    contacto_principal: Joi.string().allow(''),
    notas: Joi.string().allow('').max(1000)
  }),
  agregarAsistente: Joi.object({
    nombre: Joi.string().required().min(3).max(200).messages({
      'any.required': 'nombre es requerido'
    }),
    email: Joi.string().email().allow('').max(200),
    telefono: Joi.string().allow('').max(20),
    estado_confirmacion: Joi.string().valid('pendiente', 'confirmado', 'rechazado', 'no_confirmo').default('pendiente'),
    numero_acompanantes: Joi.number().integer().min(0).default(0),
    restricciones_dieteticas: Joi.string().allow(''),
    notas: Joi.string().allow('').max(500)
  })
};

module.exports = {
  platosSchemas,
  ingredientesSchemas,
  escandallosSchemas,
  inventarioSchemas,
  pedidosSchemas,
  partidasSchemas,
  sanidadSchemas,
  produccionSchemas,
  ofertasSchemas,
  eventosSchemas
};
