/**
 * Servicio de Autenticación con JWT
 * Maneja generación de tokens, verificación y validación
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambiar_en_produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Genera un hash bcrypt para una contraseña
 * @param {string} password - Contraseña a hashear
 * @returns {Promise<string>} Hash de la contraseña
 */
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error(`Error al hashear contraseña: ${error.message}`);
  }
}

/**
 * Compara una contraseña con su hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado
 * @returns {Promise<boolean>} True si coinciden
 */
async function comparePasswords(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error(`Error al comparar contraseñas: ${error.message}`);
  }
}

/**
 * Genera un JWT
 * @param {Object} payload - Datos a incluir en el token
 * @returns {string} JWT
 */
function generateToken(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: 'HS256'
    });
  } catch (error) {
    throw new Error(`Error al generar token: ${error.message}`);
  }
}

/**
 * Verifica y decodifica un JWT
 * @param {string} token - JWT a verificar
 * @returns {Object} Payload decodificado
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch (error) {
    throw new Error(`Token inválido o expirado: ${error.message}`);
  }
}

/**
 * Genera una respuesta de autenticación
 * @param {Object} userData - Datos del usuario
 * @returns {Object} Contiene token y user info
 */
function generateAuthResponse(userData) {
  const token = generateToken({
    id: userData.id,
    username: userData.username,
    role: userData.role || 'user'
  });

  return {
    token,
    user: {
      id: userData.id,
      username: userData.username,
      role: userData.role || 'user'
    },
    expiresIn: JWT_EXPIRES_IN
  };
}

module.exports = {
  hashPassword,
  comparePasswords,
  generateToken,
  verifyToken,
  generateAuthResponse,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
