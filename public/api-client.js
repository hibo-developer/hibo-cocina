/**
 * API CLIENT - Módulo de integración con backend Flask
 * Reemplaza llamadas locales con llamadas al servidor Flask en puerto 5000
 */

// Configuración
const API_CONFIG = {
  FLASK_BASE_URL: '/api',  // Usar ruta relativa (funciona en cualquier puerto)
  NODE_BASE_URL: '/api',
  TOKEN_KEY: 'auth_token',
  USER_KEY: 'auth_user',
  USE_FLASK: true, // Cambiar a false para usar Node.js
  TIMEOUT: 10000
};

// Estado global de autenticación
let authState = {
  token: null,
  user: null,
  isAuthenticated: false
};

// ==================== UTILIDADES ====================

/**
 * Obtener la URL base correcta (Flask o Node.js)
 */
function getBaseUrl() {
  return API_CONFIG.USE_FLASK ? API_CONFIG.FLASK_BASE_URL : API_CONFIG.NODE_BASE_URL;
}

/**
 * Obtener headers con token de autenticación
 */
function getHeaders(includeAuth = true) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (includeAuth && authState.token) {
    headers['Authorization'] = `Bearer ${authState.token}`;
  }
  
  return headers;
}

/**
 * Hacer una petición HTTP genérica
 */
async function apiCall(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    includeAuth = true,
    timeout = API_CONFIG.TIMEOUT
  } = options;

  const url = `${getBaseUrl()}${endpoint}`;
  
  try {
    const requestConfig = {
      method,
      headers: getHeaders(includeAuth)
    };

    if (body) {
      requestConfig.body = JSON.stringify(body);
    }

    // Añadir timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    requestConfig.signal = controller.signal;

    const response = await fetch(url, requestConfig);
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Manejar error de autenticación
      if (response.status === 401) {
        clearAuthState();
        window.location.href = '/login';
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error.message);
    throw error;
  }
}

// ==================== AUTENTICACIÓN ====================

/**
 * Registrar nuevo usuario
 */
async function authRegistro(email, password, nombre_usuario = '', rol = 'usuario') {
  return apiCall('/auth/registro', {
    method: 'POST',
    body: { 
      email, 
      contrasena: password,  // Flask espera 'contrasena'
      nombre: nombre_usuario,  // Flask espera 'nombre'
      rol 
    },
    includeAuth: false
  });
}

/**
 * Login - Obtener token
 */
async function authLogin(email, password) {
  const response = await apiCall('/auth/login', {
    method: 'POST',
    body: { email, contrasena: password },  // Flask espera 'contrasena'
    includeAuth: false
  });

  // Flask devuelve: { message, token, usuario }
  // Normalizamos a la estructura esperada
  if (response.token && response.usuario) {
    setAuthState(response.token, response.usuario);
    return {
      success: true,
      message: response.message,
      data: {
        token: response.token,
        usuario: response.usuario
      }
    };
  }

  return {
    success: false,
    message: response.message || 'Error desconocido'
  };
}

/**
 * Verificar token
 */
async function authVerify() {
  return apiCall('/auth/verify');
}

/**
 * Cambiar contraseña
 */
async function authCambiarContrasena(contrasena_actual, contrasena_nueva) {
  return apiCall('/auth/cambiar-contrasena', {
    method: 'PUT',
    body: { contrasena_actual, contrasena_nueva }
  });
}

/**
 * Logout
 */
function logout() {
  clearAuthState();
}

/**
 * Guardar estado de autenticación
 */
function setAuthState(token, user) {
  authState.token = token;
  authState.user = user;
  authState.isAuthenticated = true;
  localStorage.setItem(API_CONFIG.TOKEN_KEY, token);
  localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(user));
}

/**
 * Limpiar estado de autenticación
 */
function clearAuthState() {
  authState.token = null;
  authState.user = null;
  authState.isAuthenticated = false;
  localStorage.removeItem(API_CONFIG.TOKEN_KEY);
  localStorage.removeItem(API_CONFIG.USER_KEY);
}

/**
 * Restaurar sesión desde localStorage
 */
function restoreAuthState() {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
  const userJson = localStorage.getItem(API_CONFIG.USER_KEY);
  
  if (token && userJson) {
    try {
      const user = JSON.parse(userJson);
      setAuthState(token, user);
      return true;
    } catch (e) {
      clearAuthState();
      return false;
    }
  }
  
  return false;
}

// ==================== PLATOS ====================

/**
 * Obtener todos los platos con paginación y filtros
 */
async function getPlatosList(page = 1, limit = 12, filters = {}) {
  try {
    let queryParams = `?page=${page}&per_page=${limit}`;
    
    if (filters.nombre) queryParams += `&buscar=${encodeURIComponent(filters.nombre)}`;
    if (filters.categoria) queryParams += `&categoria=${encodeURIComponent(filters.categoria)}`;
    if (filters.activo !== undefined) queryParams += `&activo=${filters.activo}`;
    
    const response = await apiCall(`/platos${queryParams}`);
    
    // Flask devuelve: { platos: [...], total, pages, current_page, per_page }
    // Normalizamos a: { success: true, data: [...] }
    return {
      success: true,
      data: response.platos || [],
      pagination: {
        total: response.total,
        pages: response.pages,
        current_page: response.current_page,
        per_page: response.per_page
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
}

/**
 * Obtener plato por ID
 */
async function getPlatoById(id) {
  return apiCall(`/platos/${id}`);
}

/**
 * Crear nuevo plato
 */
async function createPlato(platoData) {
  return apiCall('/platos', {
    method: 'POST',
    body: platoData
  });
}

/**
 * Actualizar plato
 */
async function updatePlato(id, platoData) {
  return apiCall(`/platos/${id}`, {
    method: 'PUT',
    body: platoData
  });
}

/**
 * Eliminar plato
 */
async function deletePlato(id) {
  return apiCall(`/platos/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Obtener estadísticas de platos
 */
async function getPlatosStats() {
  return apiCall('/platos/stats');
}

// ==================== INGREDIENTES ====================

/**
 * Obtener todos los ingredientes
 */
async function getIngredientesList(page = 1, limit = 12, search = '') {
  try {
    let queryParams = `?page=${page}&per_page=${limit}`;
    if (search) queryParams += `&buscar=${encodeURIComponent(search)}`;
    
    const response = await apiCall(`/ingredientes${queryParams}`);
    
    return {
      success: true,
      data: response.ingredientes || [],
      pagination: {
        total: response.total,
        pages: response.pages,
        current_page: response.current_page,
        per_page: response.per_page
      }
    };
  } catch (error) {
    return { success: false, message: error.message, data: [] };
  }
}

/**
 * Obtener ingrediente por ID
 */
async function getIngredienteById(id) {
  return apiCall(`/ingredientes/${id}`);
}

/**
 * Crear nuevo ingrediente
 */
async function createIngrediente(ingredienteData) {
  return apiCall('/ingredientes', {
    method: 'POST',
    body: ingredienteData
  });
}

/**
 * Actualizar ingrediente
 */
async function updateIngrediente(id, ingredienteData) {
  return apiCall(`/ingredientes/${id}`, {
    method: 'PUT',
    body: ingredienteData
  });
}

/**
 * Eliminar ingrediente
 */
async function deleteIngrediente(id) {
  return apiCall(`/ingredientes/${id}`, {
    method: 'DELETE'
  });
}

// ==================== ESCANDALLOS ====================

/**
 * Obtener todos los escandallos
 */
async function getEscandallosList(page = 1, limit = 12, filters = {}) {
  try {
    let queryParams = `?page=${page}&per_page=${limit}`;
    
    if (filters.nombre) queryParams += `&buscar=${encodeURIComponent(filters.nombre)}`;
    if (filters.plato_id) queryParams += `&plato_id=${filters.plato_id}`;
    
    const response = await apiCall(`/escandallos${queryParams}`);
    
    return {
      success: true,
      data: response.escandallos || [],
      pagination: {
        total: response.total,
        pages: response.pages,
        current_page: response.current_page,
        per_page: response.per_page
      }
    };
  } catch (error) {
    return { success: false, message: error.message, data: [] };
  }
}

/**
 * Obtener escandallo por ID
 */
async function getEscandalloById(id) {
  return apiCall(`/escandallos/${id}`);
}

/**
 * Crear nuevo escandallo
 */
async function createEscandallo(escandalloData) {
  return apiCall('/escandallos', {
    method: 'POST',
    body: escandalloData
  });
}

/**
 * Actualizar escandallo
 */
async function updateEscandallo(id, escandalloData) {
  return apiCall(`/escandallos/${id}`, {
    method: 'PUT',
    body: escandalloData
  });
}

/**
 * Eliminar escandallo
 */
async function deleteEscandallo(id) {
  return apiCall(`/escandallos/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Añadir item a escandallo
 */
async function addEscandalloItem(escandalloId, itemData) {
  return apiCall(`/escandallos/${escandalloId}/items`, {
    method: 'POST',
    body: itemData
  });
}

/**
 * Actualizar item de escandallo
 */
async function updateEscandalloItem(escandalloId, itemId, itemData) {
  return apiCall(`/escandallos/${escandalloId}/items/${itemId}`, {
    method: 'PUT',
    body: itemData
  });
}

/**
 * Eliminar item de escandallo
 */
async function deleteEscandalloItem(escandalloId, itemId) {
  return apiCall(`/escandallos/${escandalloId}/items/${itemId}`, {
    method: 'DELETE'
  });
}

// ==================== CONTROLES APPCC ====================

/**
 * Obtener todos los controles APPCC
 */
async function getControlesList(page = 1, limit = 12) {
  return apiCall(`/controles?page=${page}&limit=${limit}`);
}

/**
 * Obtener control por ID
 */
async function getControlById(id) {
  return apiCall(`/controles/${id}`);
}

/**
 * Crear nuevo control
 */
async function createControl(controlData) {
  return apiCall('/controles', {
    method: 'POST',
    body: controlData
  });
}

/**
 * Actualizar control
 */
async function updateControl(id, controlData) {
  return apiCall(`/controles/${id}`, {
    method: 'PUT',
    body: controlData
  });
}

/**
 * Eliminar control
 */
async function deleteControl(id) {
  return apiCall(`/controles/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Registrar resultado de control
 */
async function registerControlResult(controlId, resultData) {
  return apiCall(`/controles/${controlId}/registros`, {
    method: 'POST',
    body: resultData
  });
}

/**
 * Obtener registros de un control
 */
async function getControlRegistros(controlId) {
  return apiCall(`/controles/${controlId}/registros`);
}

// ==================== UTILIDADES ====================

/**
 * Obtener estadísticas globales
 */
async function getStats() {
  return apiCall('/stats');
}

/**
 * Cambiar servidor (Flask/Node.js)
 */
function switchServer(useFlask = true) {
  API_CONFIG.USE_FLASK = useFlask;
  console.log(`Cambiado a: ${useFlask ? 'Flask (5000)' : 'Node.js (3000)'}`);
}

/**
 * Verificar conexión con servidor
 */
async function checkServerConnection() {
  try {
    const response = await apiCall('/');
    return response.success || response.message;
  } catch (error) {
    return false;
  }
}

// Restaurar sesión al cargar
restoreAuthState();
