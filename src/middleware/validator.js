/**
 * Middleware de validación
 * Valida requests contra esquemas Joi
 */

const { createResponse } = require('./errorHandler');

/**
 * Crea un middleware validador para un esquema dado
 * @param {Object} schema - Esquema Joi a usar para validación
 * @returns {Function} Middleware Express
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      // Construir mensaje de error detallado
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      console.warn('❌ Validación fallida:', {
        path: req.path,
        method: req.method,
        errors: details
      });

      return res.status(400).json(
        createResponse(false, null, {
          message: 'Errores de validación',
          details
        }, 400)
      );
    }

    // Reemplazar body con datos validados
    req.body = value;
    next();
  };
}

module.exports = {
  validate
};
