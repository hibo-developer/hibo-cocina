/**
 * ============================================================================
 * FORMS.JS - Gestor de formularios
 * ============================================================================
 * 
 * Facilita la creación y validación de formularios
 * 
 * Uso:
 * const form = new Form('mi-formulario');
 * const datos = form.getData();
 * form.setData({ nombre: 'Juan' });
 * form.validate();
 * 
 */

class Form {
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.errors = {};
  }

  /**
   * Obtener datos del formulario
   */
  getData() {
    const formData = new FormData(this.form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  }

  /**
   * Establecer datos en el formulario
   */
  setData(data) {
    Object.keys(data).forEach(key => {
      const input = this.form.querySelector(`[name="${key}"]`);
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = Boolean(data[key]);
        } else if (input.tagName === 'SELECT') {
          input.value = data[key];
        } else {
          input.value = data[key];
        }
      }
    });
  }

  /**
   * Validar formulario
   */
  validate(rules = {}) {
    this.errors = {};
    let isValid = true;

    Object.keys(rules).forEach(fieldName => {
      const input = this.form.querySelector(`[name="${fieldName}"]`);
      if (!input) return;

      const value = input.value.trim();
      const rule = rules[fieldName];

      // Validación requerida
      if (rule.required && !value) {
        this.errors[fieldName] = `${rule.label} es requerido`;
        isValid = false;
      }

      // Validación email
      if (rule.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        this.errors[fieldName] = `${rule.label} no es válido`;
        isValid = false;
      }

      // Validación longitud mínima
      if (rule.minLength && value.length < rule.minLength) {
        this.errors[fieldName] = `${rule.label} debe tener al menos ${rule.minLength} caracteres`;
        isValid = false;
      }

      // Mostrar error en el input
      this.showFieldError(fieldName);
    });

    return isValid;
  }

  /**
   * Mostrar error en campo
   */
  showFieldError(fieldName) {
    const input = this.form.querySelector(`[name="${fieldName}"]`);
    if (!input) return;

    const group = input.closest('.form-group');
    if (!group) return;

    group.classList.remove('has-error');

    if (this.errors[fieldName]) {
      group.classList.add('has-error');
      
      let errorMsg = group.querySelector('.error-message');
      if (!errorMsg) {
        errorMsg = document.createElement('span');
        errorMsg.className = 'error-message';
        group.appendChild(errorMsg);
      }
      errorMsg.textContent = this.errors[fieldName];
    }
  }

  /**
   * Limpiar formulario
   */
  clear() {
    this.form.reset();
    this.errors = {};
    this.form.querySelectorAll('.form-group').forEach(group => {
      group.classList.remove('has-error');
      const errorMsg = group.querySelector('.error-message');
      if (errorMsg) errorMsg.remove();
    });
  }

  /**
   * Deshabilitar/habilitar formulario
   */
  setDisabled(disabled) {
    this.form.querySelectorAll('input, select, textarea, button').forEach(input => {
      input.disabled = disabled;
    });
  }
}
