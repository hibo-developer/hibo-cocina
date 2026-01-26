/**
 * Frontend Architecture Refactoring
 * ================================
 * 
 * Modernización de la estructura frontend con:
 * - Componentes reutilizables
 * - Better separation of concerns
 * - ES6+ module system
 * - Improved state management
 * - Type safety (JSDoc)
 */

/**
 * @typedef {Object} ComponentConfig
 * @property {string} selector - Selector del contenedor
 * @property {Object} state - Estado inicial
 * @property {Object} methods - Métodos del componente
 */

class Component {
  /**
   * Base component class para reutilización
   * @param {ComponentConfig} config
   */
  constructor(config) {
    this.selector = config.selector;
    this.$el = document.querySelector(config.selector);
    this.state = config.state || {};
    this.methods = config.methods || {};
    
    if (!this.$el) {
      console.warn(`Elemento no encontrado: ${config.selector}`);
      return;
    }
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.render();
  }
  
  setupEventListeners() {
    // Override en subclases
  }
  
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }
  
  render() {
    // Override en subclases
  }
  
  on(eventName, selector, callback) {
    this.$el.addEventListener(eventName, (e) => {
      if (e.target.matches(selector)) {
        callback.call(this, e);
      }
    });
  }
}

/**
 * Table Component
 * Reutilizable para mostrar datos tabulares
 */
class TableComponent extends Component {
  constructor(config) {
    super({
      selector: config.selector,
      state: {
        data: config.data || [],
        columns: config.columns || [],
        loading: false,
        ...config.state
      },
      ...config
    });
    
    this.onRowClick = config.onRowClick;
    this.onDelete = config.onDelete;
    this.onEdit = config.onEdit;
  }
  
  setupEventListeners() {
    // Click en fila
    this.on('click', 'tbody tr', (e) => {
      if (e.target.closest('button')) return;
      const row = e.currentTarget;
      const id = row.dataset.id;
      if (this.onRowClick) this.onRowClick(id);
    });
    
    // Click en editar
    this.on('click', '.btn-edit', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.closest('tr').dataset.id;
      if (this.onEdit) this.onEdit(id);
    });
    
    // Click en eliminar
    this.on('click', '.btn-delete', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.closest('tr').dataset.id;
      if (confirm('¿Estás seguro?')) {
        if (this.onDelete) this.onDelete(id);
      }
    });
  }
  
  render() {
    if (!this.$el) return;
    
    const html = `
      <table class="table table-striped">
        <thead>
          <tr>
            ${this.state.columns.map(col => 
              `<th>${col.label}</th>`
            ).join('')}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${this.state.data.map(row => `
            <tr data-id="${row.id}">
              ${this.state.columns.map(col => `
                <td data-field="${col.key}">
                  ${this.formatCell(row[col.key], col)}
                </td>
              `).join('')}
              <td>
                <button class="btn-edit btn btn-sm btn-primary">Editar</button>
                <button class="btn-delete btn btn-sm btn-danger">Eliminar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    this.$el.innerHTML = html;
  }
  
  formatCell(value, column) {
    if (column.type === 'currency') {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
      }).format(value);
    }
    
    if (column.type === 'date') {
      return new Date(value).toLocaleDateString('es-ES');
    }
    
    return value || '-';
  }
}

/**
 * Modal Component
 * Modal reutilizable
 */
class ModalComponent extends Component {
  constructor(config) {
    super({
      selector: config.selector || '#modal',
      state: {
        isOpen: false,
        title: '',
        content: '',
        ...config.state
      },
      ...config
    });
  }
  
  setupEventListeners() {
    // Close button
    this.on('click', '.modal-close, .btn-cancel', () => {
      this.close();
    });
    
    // Backdrop click
    this.on('click', '.modal-backdrop', () => {
      this.close();
    });
  }
  
  open(config = {}) {
    this.setState({
      isOpen: true,
      title: config.title || '',
      content: config.content || ''
    });
    this.$el.classList.add('show');
    this.$el.style.display = 'block';
  }
  
  close() {
    this.setState({ isOpen: false });
    this.$el.classList.remove('show');
    this.$el.style.display = 'none';
  }
  
  render() {
    if (!this.$el) return;
    
    const { isOpen, title, content } = this.state;
    
    const html = `
      <div class="modal-backdrop ${isOpen ? 'show' : ''}"></div>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-cancel">Cancelar</button>
            <button type="button" class="btn btn-primary btn-submit">Guardar</button>
          </div>
        </div>
      </div>
    `;
    
    this.$el.innerHTML = html;
  }
}

/**
 * Form Component
 * Componente de formulario reutilizable
 */
class FormComponent extends Component {
  constructor(config) {
    super({
      selector: config.selector,
      state: {
        fields: config.fields || [],
        values: {},
        errors: {},
        isSubmitting: false,
        ...config.state
      },
      ...config
    });
    
    this.onSubmit = config.onSubmit;
    this.onCancel = config.onCancel;
    this.validation = config.validation || {};
  }
  
  setupEventListeners() {
    this.on('submit', 'form', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
    
    this.on('change', 'input, textarea, select', (e) => {
      const { name, value } = e.target;
      this.setState({
        values: {
          ...this.state.values,
          [name]: value
        }
      });
    });
    
    this.on('click', '.btn-cancel', () => {
      if (this.onCancel) this.onCancel();
    });
  }
  
  async handleSubmit() {
    // Validar
    const errors = this.validate();
    
    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }
    
    this.setState({ isSubmitting: true });
    
    try {
      if (this.onSubmit) {
        await this.onSubmit(this.state.values);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      this.setState({ isSubmitting: false });
    }
  }
  
  validate() {
    const errors = {};
    
    for (const field of this.state.fields) {
      const value = this.state.values[field.name];
      
      if (field.required && !value) {
        errors[field.name] = `${field.label} es requerido`;
      }
      
      if (this.validation[field.name]) {
        const error = this.validation[field.name](value);
        if (error) errors[field.name] = error;
      }
    }
    
    return errors;
  }
  
  render() {
    if (!this.$el) return;
    
    const { fields, values, errors, isSubmitting } = this.state;
    
    const html = `
      <form>
        ${fields.map(field => `
          <div class="form-group">
            <label for="${field.name}">${field.label}</label>
            
            ${field.type === 'textarea' ? `
              <textarea
                id="${field.name}"
                name="${field.name}"
                class="form-control ${errors[field.name] ? 'is-invalid' : ''}"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required' : ''}
              >${values[field.name] || ''}</textarea>
            ` : field.type === 'select' ? `
              <select
                id="${field.name}"
                name="${field.name}"
                class="form-control ${errors[field.name] ? 'is-invalid' : ''}"
                ${field.required ? 'required' : ''}
              >
                <option value="">Seleccionar...</option>
                ${(field.options || []).map(opt => `
                  <option value="${opt.value}" ${values[field.name] === opt.value ? 'selected' : ''}>
                    ${opt.label}
                  </option>
                `).join('')}
              </select>
            ` : `
              <input
                type="${field.type || 'text'}"
                id="${field.name}"
                name="${field.name}"
                class="form-control ${errors[field.name] ? 'is-invalid' : ''}"
                placeholder="${field.placeholder || ''}"
                value="${values[field.name] || ''}"
                ${field.required ? 'required' : ''}
              />
            `}
            
            ${errors[field.name] ? `
              <div class="invalid-feedback">
                ${errors[field.name]}
              </div>
            ` : ''}
          </div>
        `).join('')}
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" ${isSubmitting ? 'disabled' : ''}>
            ${isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
          <button type="button" class="btn btn-secondary btn-cancel">Cancelar</button>
        </div>
      </form>
    `;
    
    this.$el.innerHTML = html;
  }
}

/**
 * Notification Component
 * Para mostrar notificaciones tipo toast
 */
class NotificationComponent extends Component {
  constructor() {
    super({
      selector: '#notifications',
      state: {
        notifications: []
      }
    });
  }
  
  show(message, type = 'info', duration = 3000) {
    const id = Date.now();
    const notification = { id, message, type };
    
    this.setState({
      notifications: [...this.state.notifications, notification]
    });
    
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }
  
  success(message) {
    this.show(message, 'success');
  }
  
  error(message) {
    this.show(message, 'danger', 5000);
  }
  
  warning(message) {
    this.show(message, 'warning');
  }
  
  remove(id) {
    this.setState({
      notifications: this.state.notifications.filter(n => n.id !== id)
    });
  }
  
  render() {
    if (!this.$el) return;
    
    const html = `
      <div class="notifications-container">
        ${this.state.notifications.map(notification => `
          <div class="alert alert-${notification.type} alert-dismissible fade show">
            ${notification.message}
            <button type="button" class="btn-close" data-dismiss="alert"></button>
          </div>
        `).join('')}
      </div>
    `;
    
    this.$el.innerHTML = html;
  }
}

// Exponer globalmente para compatibilidad
window.Component = Component;
window.TableComponent = TableComponent;
window.ModalComponent = ModalComponent;
window.FormComponent = FormComponent;
window.NotificationComponent = NotificationComponent;

// También soportar módulos ES6 si se usa
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Component,
    TableComponent,
    ModalComponent,
    FormComponent,
    NotificationComponent
  };
}
