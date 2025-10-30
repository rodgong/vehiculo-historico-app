// Componentes reutilizables y utilidades

// Mostrar toast messages
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Mostrar/ocultar loading en botones
function setButtonLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    const text = button.querySelector('.btn-text');
    const loadingEl = button.querySelector('.loading');
    
    if (loading) {
        text.classList.add('hidden');
        loadingEl.classList.remove('hidden');
        button.disabled = true;
    } else {
        text.classList.remove('hidden');
        loadingEl.classList.add('hidden');
        button.disabled = false;
    }
}

// Mostrar modal
function showModal(modalId) {
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById(modalId).classList.remove('hidden');
}

// Cerrar modal
function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    
    // Limpiar formularios
    document.querySelectorAll('.modal form').forEach(form => {
        form.reset();
    });
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Crear tarjeta de vehículo
function createVehiculoCard(vehiculo) {
    const contadorDias = db.getContadorDias(vehiculo.id);
    let cardClass = 'vehiculo-card';
    
    if (contadorDias >= 96) {
        cardClass += ' error';
    } else if (contadorDias >= 90) {
        cardClass += ' warning';
    }
    
    return `
        <div class="${cardClass}" onclick="showVehiculoDetail(${vehiculo.id})">
            <div class="vehiculo-info">
                <h3>${vehiculo.nombre}</h3>
                <p>${vehiculo.marca} ${vehiculo.modelo}</p>
                <p>Días de uso: ${contadorDias}</p>
                ${vehiculo.esCompartido ? '<p><em>Vehículo compartido</em></p>' : ''}
            </div>
            <div class="vehiculo-actions">
                ${!vehiculo.esCompartido ? `
                    <button class="delete-btn" onclick="event.stopPropagation(); eliminarVehiculo(${vehiculo.id})">
                        <span class="material-icons">delete</span>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Crear item de historial
function createHistorialItem(diaUso) {
    return `
        <div class="historial-item">
            <div class="historial-info">
                <h4>${formatDate(diaUso.fecha)}</h4>
                <p>Usuario: ${diaUso.nombreUsuario}</p>
            </div>
            <button class="delete-btn" onclick="eliminarDiaUso(${diaUso.id})">
                <span class="material-icons">delete</span>
            </button>
        </div>
    `;
}

// Crear item de selector de vehículo
function createVehiculoSelectorItem(vehiculo, onSelect) {
    return `
        <div class="vehiculo-selector-item" onclick="${onSelect}(${vehiculo.id})">
            <h4>${vehiculo.nombre}</h4>
            <p>${vehiculo.marca} ${vehiculo.modelo}</p>
        </div>
    `;
}

// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validar formulario
function validateForm(formId) {
    const form = document.getElementById(formId);
    
    // Determinar si estamos en modo registro o login
    const registerFields = document.getElementById('registerFields');
    const isRegistering = registerFields && !registerFields.classList.contains('hidden');
    
    // Seleccionar inputs según el modo
    let inputs;
    if (formId === 'loginForm') {
        if (isRegistering) {
            // En modo registro: validar todos los campos incluyendo nombre
            inputs = form.querySelectorAll('input[required], #nombre');
        } else {
            // En modo login: solo email y password
            inputs = form.querySelectorAll('#email, #password');
        }
    } else {
        // Para otros formularios, validar todos los campos requeridos
        inputs = form.querySelectorAll('input[required]');
    }
    
    let isValid = true;
    
    inputs.forEach(input => {
        const value = input.value.trim();
        
        // Verificar si el campo está vacío
        if (!value) {
            isValid = false;
            input.style.borderColor = 'var(--error-color)';
        } else {
            input.style.borderColor = 'var(--border-color)';
        }
        
        // Validación específica para email
        if (input.type === 'email' && value && !isValidEmail(value)) {
            isValid = false;
            input.style.borderColor = 'var(--error-color)';
        }
    });
    
    return isValid;
}

// Compartir por WhatsApp
function shareWhatsApp(codigo, nombreVehiculo) {
    const mensaje = `¡Hola! Te comparto mi vehículo histórico '${nombreVehiculo}' para que puedas agregar días de uso. Usa este código en la app 'Control de Días Vehículo Histórico': ${codigo}`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// Compartir por Email
function shareEmail(codigo, nombreVehiculo) {
    const asunto = `Vehículo histórico compartido: ${nombreVehiculo}`;
    const mensaje = `¡Hola!

Te comparto mi vehículo histórico '${nombreVehiculo}' para que puedas agregar días de uso.

Para acceder:
1. Abre la app 'Control de Días Vehículo Histórico' en tu navegador
2. Crea tu cuenta o inicia sesión
3. Usa este código para agregar el vehículo: ${codigo}

¡Saludos!`;
    
    const url = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
    window.location.href = url;
}

// Confirmar acción
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Obtener fecha de hoy en formato YYYY-MM-DD
function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Parsear fecha desde input
function parseDate(dateString) {
    return new Date(dateString + 'T00:00:00');
}