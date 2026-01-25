/**
 * Middleware de validación mejorado
 * Valida requests contra esquemas Joi con manejo granular de errores
 */

const { ValidationError } = require('./errors');
const { getLogger } = require('../utils/logger');
const log = getLogger();

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
      // Construir mensaje de error detallado con información clara
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
        context: detail.context
      }));

      // Log de validación fallida
      log.warn('Validation failed:', {
        path: req.path,
        method: req.method,
        errorCount: details.length,
        fields: details.map(d => d.field)
      });

      // Lanzar ValidationError que será capturado por el middleware de error
      const validationError = new ValidationError(
        'Errores de validación en la solicitud',
        details
      );
      return next(validationError);
    }

    // Reemplazar body con datos validados y tipo-convertidos
    req.body = value;
    next();
  };
}

module.exports = {
  validate
};
