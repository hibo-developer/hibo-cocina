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

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 */
async function register(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json(
        createResponse(false, null, 'username y password son requeridos', 400)
      );
    }

    if (password.length < 6) {
      return res.status(400).json(
        createResponse(false, null, 'password debe tener al menos 6 caracteres', 400)
      );
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password);

    // Crear tabla de usuarios si no existe
    const db = getDatabase();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createTableQuery, (err) => {
      if (err && !err.message.includes('table usuarios already exists')) {
        console.error('Error creando tabla usuarios:', err);
        return res.status(500).json(
          createResponse(false, null, err.message, 500)
        );
      }

      // Insertar nuevo usuario
      db.run(
        'INSERT INTO usuarios (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, 'user'],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(409).json(
                createResponse(false, null, 'username ya existe', 409)
              );
            }
            console.error('Error al crear usuario:', err);
            return res.status(500).json(
              createResponse(false, null, err.message, 500)
            );
          }

          const userData = {
            id: this.lastID,
            username,
            role: 'user'
          };

          const authResponse = generateAuthResponse(userData);
          res.status(201).json(
            createResponse(true, authResponse, null, 201)
          );
        }
      );
    });
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
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json(
        createResponse(false, null, 'username y password son requeridos', 400)
      );
    }

    const db = getDatabase();

    // Buscar usuario
    db.get(
      'SELECT * FROM usuarios WHERE username = ? AND activo = 1',
      [username],
      async (err, user) => {
        if (err) {
          console.error('Error al buscar usuario:', err);
          return res.status(500).json(
            createResponse(false, null, err.message, 500)
          );
        }

        if (!user) {
          return res.status(401).json(
            createResponse(false, null, 'Usuario o contraseña incorrectos', 401)
          );
        }

        // Verificar contraseña
        try {
          const passwordMatch = await comparePasswords(password, user.password);

          if (!passwordMatch) {
            return res.status(401).json(
              createResponse(false, null, 'Usuario o contraseña incorrectos', 401)
            );
          }

          // Contraseña correcta - generar token
          const authResponse = generateAuthResponse({
            id: user.id,
            username: user.username,
            role: user.role
          });

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
