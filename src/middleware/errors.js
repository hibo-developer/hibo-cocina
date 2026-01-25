/**
 * Custom Error Classes for better error handling and classification
 * Allows specific error types for different failure scenarios
 */

/**
 * Base custom error class
 */
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation Error - 400 Bad Request
 * Used when request body validation fails
 */
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication Error - 401 Unauthorized
 * Used when user credentials are invalid or missing
 */
class AuthenticationError extends AppError {
  constructor(message = 'Autenticación requerida') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization Error - 403 Forbidden
 * Used when user lacks permissions for the action
 */
class AuthorizationError extends AppError {
  constructor(message = 'Permiso denegado') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not Found Error - 404 Not Found
 * Used when resource doesn't exist
 */
class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND_ERROR');
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Database Error - 500 Internal Server Error
 * Used when database operations fail
 */
class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Conflict Error - 409 Conflict
 * Used when trying to create duplicate resources
 */
class ConflictError extends AppError {
  constructor(message = 'Conflicto: el recurso ya existe') {
    super(message, 409, 'CONFLICT_ERROR');
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Server Error - 500 Internal Server Error
 * Generic server error
 */
class ServerError extends AppError {
  constructor(message = 'Error interno del servidor') {
    super(message, 500, 'SERVER_ERROR');
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ConflictError,
  ServerError,
};
