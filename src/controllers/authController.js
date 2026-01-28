/**
 * Controlador para AUTENTICACIÓN
 * Maneja login, registro y gestión de tokens
 */

const { getDatabase } = require('../utils/database');
const { createResponse } = require('../middleware/errorHandler');
const { 
  hashPassword, 
  comparePasswords, 
  generateAuthResponse 
} = require('../utils/auth');
const ServicioValidaciones = require('../utils/servicioValidaciones');
const logger = require('../utils/logger');

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 */
async function register(req, res, next) {
  try {
    const { email, nombre, password } = req.body;

    // Validar campos requeridos
    if (!email || !nombre || !password) {
      return res.status(400).json(
        createResponse(false, null, 'email, nombre y password son requeridos', 400)
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(
        createResponse(false, null, 'email no válido', 400)
      );
    }

    if (password.length < 6) {
      return res.status(400).json(
        createResponse(false, null, 'password debe tener al menos 6 caracteres', 400)
      );
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password);
    const db = getDatabase();

    // Insertar nuevo usuario (tabla ya existe por migraciones)
    db.run(
      'INSERT INTO usuarios (email, nombre, password_hash, rol) VALUES (?, ?, ?, ?)',
      [email, nombre, hashedPassword, 'usuario'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json(
              createResponse(false, null, 'email ya existe', 409)
            );
          }
          console.error('Error al crear usuario:', err);
          return res.status(500).json(
            createResponse(false, null, err.message, 500)
          );
        }

        const userData = {
          id: this.lastID,
          email,
          nombre,
          rol: 'usuario'
        };

        const authResponse = generateAuthResponse(userData);
        logger.info(`Usuario registrado: ${email}`);
        
        res.status(201).json(
          createResponse(true, authResponse, null, 201)
        );
      }
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Autentica usuario y retorna JWT
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(
        createResponse(false, null, 'email y password son requeridos', 400)
      );
    }

    const db = getDatabase();

    // Buscar usuario por email
    db.get(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
      [email],
      async (err, user) => {
        if (err) {
          console.error('Error al buscar usuario:', err);
          return res.status(500).json(
            createResponse(false, null, err.message, 500)
          );
        }

        if (!user) {
          return res.status(401).json(
            createResponse(false, null, 'Email o contraseña incorrectos', 401)
          );
        }

        // Verificar contraseña
        try {
          const passwordMatch = await comparePasswords(password, user.password_hash);

          if (!passwordMatch) {
            return res.status(401).json(
              createResponse(false, null, 'Email o contraseña incorrectos', 401)
            );
          }

          // Actualizar last_login
          db.run(
            'UPDATE usuarios SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
          );

          // Contraseña correcta - generar token
          const authResponse = generateAuthResponse({
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol
          });

          logger.info(`Usuario autenticado: ${email}`);
          res.json(createResponse(true, authResponse, null, 200));
        } catch (error) {
          console.error('Error al verificar contraseña:', error);
          return res.status(500).json(
            createResponse(false, null, 'Error al procesar autenticación', 500)
          );
        }
      }
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Obtiene información del usuario autenticado
 */
async function getMe(req, res, next) {
  try {
    const db = getDatabase();

    db.get(
      'SELECT id, username, role FROM usuarios WHERE id = ?',
      [req.user.id],
      (err, user) => {
        if (err) {
          console.error('Error al obtener usuario:', err);
          return res.status(500).json(
            createResponse(false, null, err.message, 500)
          );
        }

        if (!user) {
          return res.status(404).json(
            createResponse(false, null, 'Usuario no encontrado', 404)
          );
        }

        res.json(createResponse(true, user, null, 200));
      }
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Logout (principalmente para frontend, backend es stateless)
 */
function logout(req, res) {
  res.json(createResponse(true, { message: 'Sesión cerrada' }, null, 200));
}

module.exports = {
  register,
  login,
  getMe,
  logout
};
