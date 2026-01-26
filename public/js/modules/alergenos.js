/**
 * Módulo de Alérgenos
 * Gestión de alérgenos oficiales y personalizados con palabras clave
 */

// Estado global
let alergenosOficiales = [];
let alergenosPersonalizados = [];

// ====================================================================
// TABS
// ====================================================================

window.cambiarTab = function(tab) {
    // Actualizar botones
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tab}`).classList.add('active');
};

// ====================================================================
// ALÉRGENOS OFICIALES
// ====================================================================

window.cargarAlergenosOficiales = async function() {
    try {
        const response = await fetch('/api/alergenos/oficiales');
        const data = await response.json();
        
        alergenosOficiales = data;
        renderizarAlergenosOficiales();
        
        mostrarNotificacion('Alérgenos oficiales cargados', 'success');
    } catch (error) {
        console.error('Error al cargar alérgenos oficiales:', error);
        mostrarNotificacion('Error al cargar alérgenos oficiales', 'error');
    }
};

function renderizarAlergenosOficiales() {
    const tbody = document.getElementById('tbody-oficiales');
    
    if (!tbody) return;
    
    if (alergenosOficiales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No hay alérgenos oficiales registrados</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = alergenosOficiales.map(alergeno => `
        <tr data-id="${alergeno.id}">
            <td>
                <input type="checkbox" class="row-checkbox" value="${alergeno.id}">
            </td>
            <td>${alergeno.orden || '-'}</td>
            <td><code>${alergeno.codigo}</code></td>
            <td><strong>${alergeno.nombre}</strong></td>
            <td>
                <input type="text" 
                       class="form-control form-control-sm"
                       value="${alergeno.palabras_clave || ''}"
                       data-id="${alergeno.id}"
                       onchange="actualizarPalabrasClave(${alergeno.id}, this.value, 'oficial')">
            </td>
            <td>
                <label class="switch">
                    <input type="checkbox" 
                           ${alergeno.activo ? 'checked' : ''}
                           onchange="toggleActivoOficial(${alergeno.id}, this.checked)">
                    <span class="slider"></span>
                </label>
            </td>
            <td class="text-center">${alergeno.icono || '-'}</td>
        </tr>
    `).join('');
}

window.actualizarPalabrasClave = function(id, palabras, tipo) {
    const alergeno = tipo === 'oficial' 
        ? alergenosOficiales.find(a => a.id === id)
        : alergenosPersonalizados.find(a => a.id === id);
    
    if (alergeno) {
        alergeno.palabras_clave = palabras;
    }
};

window.toggleActivoOficial = function(id, activo) {
    const alergeno = alergenosOficiales.find(a => a.id === id);
    if (alergeno) {
        alergeno.activo = activo ? 1 : 0;
    }
};

window.guardarAlergenosOficiales = async function() {
    try {
        const promesas = alergenosOficiales.map(alergeno => 
            fetch(`/api/alergenos/oficiales/${alergeno.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    palabras_clave: alergeno.palabras_clave,
                    activo: alergeno.activo
                })
            })
        );

        await Promise.all(promesas);
        mostrarNotificacion('Alérgenos oficiales actualizados correctamente', 'success');
        cargarAlergenosOficiales();
    } catch (error) {
        console.error('Error al guardar alérgenos oficiales:', error);
        mostrarNotificacion('Error al guardar cambios', 'error');
    }
};

// ====================================================================
// ALÉRGENOS PERSONALIZADOS
// ====================================================================

window.cargarAlergenosPersonalizados = async function() {
    try {
        const response = await fetch('/api/alergenos/personalizados');
        const data = await response.json();
        
        alergenosPersonalizados = data;
        renderizarAlergenosPersonalizados();
        
        mostrarNotificacion('Alérgenos personalizados cargados', 'success');
    } catch (error) {
        console.error('Error al cargar alérgenos personalizados:', error);
        mostrarNotificacion('Error al cargar alérgenos personalizados', 'error');
    }
};

function renderizarAlergenosPersonalizados() {
    const tbody = document.getElementById('tbody-personalizados');
    
    if (!tbody) return;
    
    if (alergenosPersonalizados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    No hay alérgenos personalizados. 
                    <a href="#" onclick="abrirModalAlergenoPersonalizado(); return false;">Crear uno nuevo</a>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = alergenosPersonalizados.map(alergeno => `
        <tr data-id="${alergeno.id}">
            <td>
                <input type="checkbox" class="row-checkbox" value="${alergeno.id}">
            </td>
            <td><strong>${alergeno.nombre}</strong></td>
            <td>${alergeno.descripcion || '-'}</td>
            <td>
                <input type="text" 
                       class="form-control form-control-sm"
                       value="${alergeno.palabras_clave || ''}"
                       data-id="${alergeno.id}"
                       onchange="actualizarYGuardarPersonalizado(${alergeno.id}, 'palabras_clave', this.value)">
            </td>
            <td>
                <label class="switch">
                    <input type="checkbox" 
                           ${alergeno.activo ? 'checked' : ''}
                           onchange="actualizarYGuardarPersonalizado(${alergeno.id}, 'activo', this.checked)">
                    <span class="slider"></span>
                </label>
            </td>
            <td>
                <button class="btn-icon" onclick="editarAlergenoPersonalizado(${alergeno.id})" 
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="eliminarAlergenoPersonalizado(${alergeno.id})" 
                        title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

window.actualizarYGuardarPersonalizado = async function(id, campo, valor) {
    try {
        const alergeno = alergenosPersonalizados.find(a => a.id === id);
        if (!alergeno) return;

        const body = {
            nombre: alergeno.nombre,
            descripcion: alergeno.descripcion,
            icono: alergeno.icono,
            palabras_clave: alergeno.palabras_clave,
            activo: alergeno.activo
        };

        if (campo === 'activo') {
            body.activo = valor ? 1 : 0;
        } else {
            body[campo] = valor;
        }

        const response = await fetch(`/api/alergenos/personalizados/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            alergeno[campo] = campo === 'activo' ? (valor ? 1 : 0) : valor;
            mostrarNotificacion('Actualizado correctamente', 'success');
        } else {
            throw new Error('Error al actualizar');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al actualizar', 'error');
    }
};

// ====================================================================
// MODAL ALÉRGENO PERSONALIZADO
// ====================================================================

window.abrirModalAlergenoPersonalizado = function(id = null) {
    const modal = document.getElementById('modal-alergeno-personalizado');
    const titulo = document.getElementById('modal-alergeno-titulo');
    
    if (id) {
        const alergeno = alergenosPersonalizados.find(a => a.id === id);
        if (!alergeno) return;

        titulo.textContent = 'Editar Alérgeno Personalizado';
        document.getElementById('alergeno-id').value = id;
        document.getElementById('alergeno-nombre').value = alergeno.nombre;
        document.getElementById('alergeno-descripcion').value = alergeno.descripcion || '';
        document.getElementById('alergeno-palabras').value = alergeno.palabras_clave || '';
        document.getElementById('alergeno-icono').value = alergeno.icono || '';
        document.getElementById('alergeno-activo').checked = alergeno.activo;
    } else {
        titulo.textContent = 'Nuevo Alérgeno Personalizado';
        document.getElementById('form-alergeno-personalizado').reset();
        document.getElementById('alergeno-id').value = '';
    }

    modal.style.display = 'flex';
};

window.cerrarModalAlergenoPersonalizado = function() {
    document.getElementById('modal-alergeno-personalizado').style.display = 'none';
};

window.editarAlergenoPersonalizado = function(id) {
    abrirModalAlergenoPersonalizado(id);
};

window.guardarAlergenoPersonalizado = async function() {
    const id = document.getElementById('alergeno-id').value;
    const nombre = document.getElementById('alergeno-nombre').value.trim();
    const descripcion = document.getElementById('alergeno-descripcion').value.trim();
    const palabras = document.getElementById('alergeno-palabras').value.trim();
    const icono = document.getElementById('alergeno-icono').value.trim();
    const activo = document.getElementById('alergeno-activo').checked ? 1 : 0;

    if (!nombre) {
        mostrarNotificacion('El nombre es requerido', 'error');
        return;
    }

    try {
        const body = { nombre, descripcion, palabras_clave: palabras, icono, activo };
        const url = id 
            ? `/api/alergenos/personalizados/${id}`
            : '/api/alergenos/personalizados';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            mostrarNotificacion(
                id ? 'Alérgeno actualizado correctamente' : 'Alérgeno creado correctamente',
                'success'
            );
            cerrarModalAlergenoPersonalizado();
            cargarAlergenosPersonalizados();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error al guardar');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
    }
};

window.eliminarAlergenoPersonalizado = async function(id) {
    if (!confirm('¿Está seguro de eliminar este alérgeno personalizado?')) {
        return;
    }

    try {
        const response = await fetch(`/api/alergenos/personalizados/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            mostrarNotificacion('Alérgeno eliminado correctamente', 'success');
            cargarAlergenosPersonalizados();
        } else {
            throw new Error('Error al eliminar');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar alérgeno', 'error');
    }
};

// ====================================================================
// INICIALIZACIÓN
// ====================================================================

// Función para inicializar el módulo cuando se muestre la sección
window.inicializarModuloAlergenos = function() {
    cargarAlergenosOficiales();
    cargarAlergenosPersonalizados();
};

console.log('✅ Módulo Alérgenos cargado y expuesto globalmente');
