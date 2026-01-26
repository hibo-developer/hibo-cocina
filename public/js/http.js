/**
 * HTTP Client Utility
 * ==================
 * 
 * Cliente HTTP mejorado con:
 * - Interceptores
 * - Retry logic
 * - Timeouts
 * - Request/Response middleware
 * - Type safety (JSDoc)
 */

/**
 * @typedef {Object} RequestConfig
 * @property {string} method - GET, POST, PUT, DELETE
 * @property {Object} headers - Headers HTTP
 * @property {any} body - Body de la request
 * @property {number} timeout - Timeout en ms
 * @property {number} retries - Número de reintentos
 * @property {boolean} includeCredentials - Include credentials
 */

class HttpClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
    this.timeout = 30000;
    this.retries = 3;
  }
  
  /**
   * Set base URL
   */
  setBaseUrl(url) {
    this.baseUrl = url;
  }
  
  /**
   * Set default headers
   */
  setDefaultHeaders(headers) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }
  
  /**
   * Add request interceptor
   * @param {Function} callback
   */
  useRequestInterceptor(callback) {
    this.requestInterceptors.push(callback);
  }
  
  /**
   * Add response interceptor
   * @param {Function} callback
   */
  useResponseInterceptor(callback) {
    this.responseInterceptors.push(callback);
  }
  
  /**
   * Add error interceptor
   * @param {Function} callback
   */
  useErrorInterceptor(callback) {
    this.errorInterceptors.push(callback);
  }
  
  /**
   * Make HTTP request
   * @param {string} method
   * @param {string} url
   * @param {any} data
   * @param {RequestConfig} config
   * @returns {Promise}
   */
  async request(method, url, data = null, config = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    let options = {
      method,
      headers: { ...this.defaultHeaders, ...config.headers },
      timeout: config.timeout || this.timeout,
      ...config
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = typeof data === 'string' ? data : JSON.stringify(data);
    }
    
    // Request interceptors
    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(options);
      if (result === false) return null;
      if (result) options = result;
    }
    
    const retries = config.retries || this.retries;
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(fullUrl, options);
        
        // Response interceptors
        let processedResponse = response;
        for (const interceptor of this.responseInterceptors) {
          const result = await interceptor(processedResponse);
          if (result === false) return null;
          if (result) processedResponse = result;
        }
        
        return processedResponse;
      } catch (error) {
        lastError = error;
        
        // Retry logic
        if (attempt < retries && this.isRetryableError(error)) {
          const delay = this.getBackoffDelay(attempt);
          await this.sleep(delay);
          continue;
        }
        
        // Error interceptors
        for (const interceptor of this.errorInterceptors) {
          const handled = await interceptor(error);
          if (handled === false) return null;
        }
        
        throw error;
      }
    }
    
    throw lastError;
  }
  
  /**
   * Fetch with timeout
   */
  async fetchWithTimeout(url, options) {
    const timeout = options.timeout || this.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      // Parse response
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      return {
        status: response.status,
        headers: response.headers,
        data,
        ok: response.ok
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    // Network errors
    if (error.name === 'AbortError') return true;
    
    // 5xx server errors
    if (error.status >= 500) return true;
    
    // 429 Too Many Requests
    if (error.status === 429) return true;
    
    // Timeout
    if (error.message === 'Network request timeout') return true;
    
    return false;
  }
  
  /**
   * Get exponential backoff delay
   */
  getBackoffDelay(attempt) {
    return Math.min(1000 * Math.pow(2, attempt), 10000);
  }
  
  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * GET request
   */
  get(url, config = {}) {
    return this.request('GET', url, null, config);
  }
  
  /**
   * POST request
   */
  post(url, data, config = {}) {
    return this.request('POST', url, data, config);
  }
  
  /**
   * PUT request
   */
  put(url, data, config = {}) {
    return this.request('PUT', url, data, config);
  }
  
  /**
   * PATCH request
   */
  patch(url, data, config = {}) {
    return this.request('PATCH', url, data, config);
  }
  
  /**
   * DELETE request
   */
  delete(url, config = {}) {
    return this.request('DELETE', url, null, config);
  }
  
  /**
   * Upload file
   */
  async upload(url, file, fieldName = 'file', config = {}) {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    // Add additional fields
    if (config.data) {
      Object.entries(config.data).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    return this.fetchWithTimeout(fullUrl, {
      method: 'POST',
      headers: {
        ...config.headers,
        // Don't set Content-Type for FormData
      },
      body: formData,
      timeout: config.timeout || this.timeout
    });
  }
  
  /**
   * Download file
   */
  async download(url, filename) {
    const response = await this.get(url);
    
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || 'download';
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

// Ejemplo de uso:
/*
const http = new HttpClient('http://localhost:3000/api');

// Interceptor de request (agregar token)
http.useRequestInterceptor(async (options) => {
  const token = localStorage.getItem('token');
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }
  return options;
});

// Interceptor de response
http.useResponseInterceptor(async (response) => {
  if (response.data.success === false) {
    throw new Error(response.data.error);
  }
  return response.data.data;
});

// Interceptor de error
http.useErrorInterceptor(async (error) => {
  if (error.status === 401) {
    // Redirigir a login
    window.location.href = '/login.html';
    return false; // Evitar que se lance el error
  }
  console.error(error);
});

// Usar
const platos = await http.get('/platos');
const newPlato = await http.post('/platos', { nombre: 'Pizza' });
await http.put(`/platos/${id}`, { nombre: 'Pasta' });
await http.delete(`/platos/${id}`);

// Upload
const file = document.querySelector('input[type="file"]').files[0];
await http.upload('/platos/upload', file);

// Download
await http.download('/platos/export', 'platos.xlsx');
*/

// Exponer globalmente
window.HttpClient = HttpClient;

// También soportar módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HttpClient };
}
