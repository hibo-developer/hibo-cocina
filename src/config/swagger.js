/**
 * Configuración de Swagger/OpenAPI para HIBO COCINA
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HIBO COCINA - API REST',
      description: 'Documentación completa de la API REST para sistema de gestión de cocina industrial',
      version: '2.0.0',
      contact: {
        name: 'HIBO Team',
        email: 'info@hibo.es'
      },
      license: {
        name: 'MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'https://api.hibo.es',
        description: 'Servidor de producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Token para autenticación'
        }
      },
      schemas: {
        // Response genérico
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica si la solicitud fue exitosa'
            },
            data: {
              type: 'object',
              description: 'Datos retornados por el endpoint'
            },
            error: {
              type: 'string',
              nullable: true,
              description: 'Mensaje de error si la solicitud falló'
            },
            statusCode: {
              type: 'integer',
              description: 'Código HTTP de la respuesta'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp ISO 8601 del servidor'
            }
          }
        },

        // Platos
        Plato: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            descripcion: { type: 'string' },
            grupo_menu: { type: 'string' },
            tipo: { type: 'string' },
            precio_venta: { type: 'number' },
            precio_menu: { type: 'number' },
            coste_escandallo: { type: 'number' },
            activo: { type: 'boolean' },
            escandallado: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        StatisticsPlatos: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            activos: { type: 'integer' },
            platos_venta: { type: 'integer' },
            precio_venta_promedio: { type: 'number' },
            precio_venta_minimo: { type: 'number' },
            precio_venta_maximo: { type: 'number' },
            coste_promedio: { type: 'number' },
            escandallados: { type: 'integer' }
          }
        },

        // Ingredientes
        Ingrediente: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            unidad: { type: 'string' },
            precio_base: { type: 'number' },
            alergenos: { type: 'string' },
            activo: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // Pedidos
        Pedido: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            numero_pedido: { type: 'string' },
            cliente: { type: 'string' },
            fecha: { type: 'string', format: 'date-time' },
            estado: { type: 'string', enum: ['pendiente', 'completado', 'cancelado'] },
            total: { type: 'number' },
            items: { type: 'array' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        StatisticsPedidos: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            completados: { type: 'integer' },
            pendientes: { type: 'integer' },
            cancelados: { type: 'integer' },
            total_promedio: { type: 'number' },
            total_vendido: { type: 'number' }
          }
        },

        // Inventario
        InventarioItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            ingrediente_id: { type: 'integer' },
            cantidad: { type: 'number' },
            cantidad_minima: { type: 'number' },
            ubicacion: { type: 'string' },
            estado: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // Error
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            data: { type: 'null' },
            error: { type: 'string' },
            statusCode: { type: 'integer' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/auth.js',
    './src/routes/platos.js',
    './src/routes/ingredientes.js',
    './src/routes/escandallos.js',
    './src/routes/inventario.js',
    './src/routes/pedidos.js',
    './src/routes/partidas.js',
    './src/routes/sanidad.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
