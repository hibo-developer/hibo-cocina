/**
 * ============================================================================
 * MODALS.JS - Gestor de modales
 * ============================================================================
 * 
 * Centraliza toda la lógica de modales para evitar repetición
 * 
 * Uso:
 * modalManager.open('Nuevo Plato', campos);
 * modalManager.close();
 * modalManager.setCallback(async (data) => { ... });
 * 
 */

class ModalManager {
  constructor() {
    this.modal = document.getElementById('modal');
    this.closeBtn = document.querySelector('.close');
    this.callback = null;
    this.setupListeners();
  }

  /**
   * Configurar event listeners
   */
  setupListeners() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    // Cerrar al hacer click fuera del modal
    window.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Formulario
    const form = document.getElementById('modalForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submit();
      });
    }
  }

  /**
   * Abrir modal
   */
  open(titulo, campos = []) {
    if (!this.modal) return;

    document.getElementById('modalTitle').textContent = titulo;
    
    // Renderizar campos
    const fieldsContainer = document.getElementById('modalFields');
    fieldsContainer.innerHTML = this.renderizarCampos(campos);

    this.modal.style.display = 'flex';
    document.body.classList.add('modal-open');
  }

  /**
   * Cerrar modal
   */
  close() {
    if (!this.modal) return;
    this.modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    this.callback = null;
  }

  /**
   * Establecer callback de envío
   */
  setCallback(callback) {
    this.callback = callback;
  }

  /**
   * Enviar formulario
   */
  async submit() {
    if (!this.callback) return;

    const formData = new FormData(document.getElementById('modalForm'));
    const data = Object.fromEntries(formData);

    try {
      await this.callback(data);
      this.close();
    } catch (error) {
      console.error('Error al guardar:', error);
      mostrarError('Error al guardar los datos');
    }
  }

  /**
   * Renderizar campos dinámicamente
   */
  renderizarCampos(campos) {
    return campos.map(campo => `
      <div>
        <label>${campo.label}${campo.requerido ? ' <span class="required">*</span>' : ''}</label>
        ${this.renderizarInput(campo)}
      </div>
    `).join('');
  }

  /**
   * Renderizar input según tipo
   */
  renderizarInput(campo) {
    switch(campo.tipo) {
      case 'texto':
        return `<input type="text" id="${campo.id}" name="${campo.nombre}" ${campo.requerido ? 'required' : ''}>`;
      case 'numero':
        return `<input type="number" id="${campo.id}" name="${campo.nombre}" step="0.01" ${campo.requerido ? 'required' : ''}>`;
      case 'fecha':
        return `<input type="date" id="${campo.id}" name="${campo.nombre}" ${campo.requerido ? 'required' : ''}>`;
      case 'email':
        return `<input type="email" id="${campo.id}" name="${campo.nombre}" ${campo.requerido ? 'required' : ''}>`;
      case 'select':
        return `<select id="${campo.id}" name="${campo.nombre}" ${campo.requerido ? 'required' : ''}>
          ${campo.opciones.map(opt => `<option value="${opt.valor}">${opt.label}</option>`).join('')}
        </select>`;
      case 'checkbox':
        return `<input type="checkbox" id="${campo.id}" name="${campo.nombre}">`;
      case 'textarea':
        return `<textarea id="${campo.id}" name="${campo.nombre}" ${campo.requerido ? 'required' : ''}></textarea>`;
      default:
        return `<input type="text" id="${campo.id}" name="${campo.nombre}" ${campo.requerido ? 'required' : ''}>`;
    }
  }
}

// Instancia global
const modalManager = new ModalManager();

// Exponer globalmente
window.modalManager = modalManager;

console.log('✅ ModalManager cargado y expuesto globalmente');

// Funciones globales para compatibilidad
function abrirModal(titulo, campos) {
  modalManager.open(titulo, campos);
}

function cerrarModal() {
  modalManager.close();
}
