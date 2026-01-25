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

module.exports = {
  platosSchemas,
  ingredientesSchemas,
  escandallosSchemas,
  inventarioSchemas,
  pedidosSchemas,
  partidasSchemas,
  sanidadSchemas
};
