// Aplicación principal
class VehiculoApp {
    constructor() {
        this.currentUser = null;
        this.currentVehiculo = null;
        this.selectedDate = null;
        this.init();
    }

    async init() {
        // Inicializar GitHub Database
        await this.initializeGitHubDatabase();
        
        this.setupEventListeners();
        this.checkAuthState();
    }

    async initializeGitHubDatabase() {
        try {
            // Inicializar GitHub Database en modo solo lectura
            await githubDB.init();
            console.log('✅ GitHub Database inicializada');
            
            // Mostrar estado de sincronización
            this.updateSyncStatus();
            
            // Sincronizar automáticamente al iniciar
            setTimeout(() => {
                this.autoSync();
            }, 2000);
            
        } catch (error) {
            console.error('❌ Error inicializando GitHub Database:', error);
            showToast('Modo offline - datos solo locales', 'warning');
        }
    }

    async autoSync() {
        try {
            console.log('🔄 Sincronización automática...');
            await githubDB.sincronizar();
            this.updateSyncStatus();
        } catch (error) {
            console.log('⚠️ Sincronización automática fallida:', error);
        }
    }

    updateSyncStatus() {
        const status = githubDB.getStatus();
        const syncBtn = document.getElementById('syncBtn');
        
        if (syncBtn) {
            if (status.readOnly) {
                syncBtn.innerHTML = '<span class="material-icons">cloud_download</span> Solo lectura';
                syncBtn.title = 'Haz clic para configurar sincronización completa';
            } else {
                syncBtn.innerHTML = '<span class="material-icons">sync</span> Sincronizar';
                syncBtn.title = 'Sincronizar con base de datos compartida';
            }
        }
    }

    setupEventListeners() {
        // Login/Register
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('toggleMode').addEventListener('click', () => this.toggleLoginMode());
        
        // Main screen
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('syncBtn').addEventListener('click', () => this.handleSync());

        
        // Detail screen
        document.getElementById('logoutBtnDetail').addEventListener('click', () => this.logout());
        document.getElementById('addVehiculoBtn').addEventListener('click', () => showModal('addVehiculoModal'));
        document.getElementById('addSharedBtn').addEventListener('click', () => showModal('addSharedModal'));
        document.getElementById('todayBtn').addEventListener('click', () => this.showVehiculoSelectorForToday());
        document.getElementById('dateBtn').addEventListener('click', () => showModal('datePickerModal'));
        
        // Detail screen
        document.getElementById('backBtn').addEventListener('click', () => this.showMainScreen());
        document.getElementById('shareWhatsAppBtn').addEventListener('click', () => this.shareVehiculoWhatsApp());
        document.getElementById('shareEmailBtn').addEventListener('click', () => this.shareVehiculoEmail());
        
        // Forms
        document.getElementById('addVehiculoForm').addEventListener('submit', (e) => this.handleAddVehiculo(e));
        document.getElementById('addSharedForm').addEventListener('submit', (e) => this.handleAddSharedVehiculo(e));
        document.getElementById('confirmDateBtn').addEventListener('click', () => this.handleDateSelection());
        
        // GitHub Token Configuration
        document.getElementById('githubTokenForm').addEventListener('submit', (e) => this.handleGitHubTokenConfig(e));
        document.getElementById('removeTokenBtn').addEventListener('click', () => this.removeGitHubToken());
        

        
        // Modal overlay
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                closeModal();
            }
        });
    }

    checkAuthState() {
        this.currentUser = db.getCurrentUser();
        if (this.currentUser) {
            this.showMainScreen();
        } else {
            this.showLoginScreen();
        }
    }

    // Authentication
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const nombre = document.getElementById('nombre').value.trim();
        const isRegistering = !document.getElementById('registerFields').classList.contains('hidden');
        
        // Validación mejorada que maneja correctamente los campos según el modo
        if (!validateForm('loginForm')) {
            showToast('Por favor completa todos los campos correctamente', 'error');
            return;
        }
        
        // Validación adicional para registro
        if (isRegistering) {
            if (!nombre.trim()) {
                showToast('Por favor ingresa tu nombre completo', 'error');
                return;
            }
            
            // Validar fortaleza de contraseña en registro
            if (typeof SecurityUtils !== 'undefined') {
                const passwordValidation = SecurityUtils.validatePasswordStrength(password);
                if (!passwordValidation.isValid) {
                    showToast('La contraseña debe tener al menos 8 caracteres y incluir mayúsculas, minúsculas y números', 'error');
                    return;
                }
            }
        }
        
        setButtonLoading('loginBtn', true);
        
        try {
            if (isRegistering) {
                console.log('🔄 Iniciando proceso de registro...');
                const user = await db.registrarUsuario(nombre, email, password);
                console.log('📝 Resultado del registro:', user);
                if (user) {
                    this.currentUser = user;
                    // Guardar usuario actual en localStorage después del registro
                    localStorage.setItem('vehiculo_current_user', JSON.stringify(user));
                    console.log('✅ Usuario asignado a currentUser y guardado en localStorage:', this.currentUser);
                    showToast('Cuenta creada exitosamente', 'success');
                    this.showMainScreen();
                } else {
                    showToast('El email ya está registrado', 'error');
                }
            } else {
                console.log('🔄 Iniciando proceso de login...');
                const user = await db.login(email, password);
                console.log('📝 Resultado del login:', user);
                if (user) {
                    this.currentUser = user;
                    console.log('✅ Usuario asignado a currentUser:', this.currentUser);
                    showToast(`Bienvenido, ${user.nombre}`, 'success');
                    this.showMainScreen();
                } else {
                    showToast('Credenciales incorrectas', 'error');
                }
            }
        } catch (error) {
            console.error('Error en login:', error);
            showToast('Error en el sistema', 'error');
        }
        
        // Limpiar datos sensibles
        if (typeof SecurityUtils !== 'undefined') {
            SecurityUtils.clearSensitiveData();
        }
        setButtonLoading('loginBtn', false);
    }

    toggleLoginMode() {
        const registerFields = document.getElementById('registerFields');
        const loginBtn = document.getElementById('loginBtn');
        const toggleBtn = document.getElementById('toggleMode');
        const nombreField = document.getElementById('nombre');
        
        if (registerFields.classList.contains('hidden')) {
            // Cambiar a modo registro
            registerFields.classList.remove('hidden');
            loginBtn.querySelector('.btn-text').textContent = 'Registrarse';
            toggleBtn.textContent = '¿Ya tienes cuenta? Inicia sesión';
            nombreField.setAttribute('required', '');
        } else {
            // Cambiar a modo login
            registerFields.classList.add('hidden');
            loginBtn.querySelector('.btn-text').textContent = 'Iniciar Sesión';
            toggleBtn.textContent = '¿No tienes cuenta? Regístrate';
            nombreField.removeAttribute('required');
        }
    }

    logout() {
        confirmAction('¿Estás seguro de que quieres cerrar sesión?', () => {
            db.logout();
            this.currentUser = null;
            this.showLoginScreen();
            showToast('Sesión cerrada', 'info');
        });
    }

    // Navigation
    showLoginScreen() {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById('loginScreen').classList.add('active');
    }

    updateUserInfo() {
        if (this.currentUser) {
            // Actualizar nombre en pantalla principal
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.nombre;
            }
            
            // Actualizar nombre en pantalla de detalle
            const userNameDetailElement = document.getElementById('userNameDetail');
            if (userNameDetailElement) {
                userNameDetailElement.textContent = this.currentUser.nombre;
            }
        }
    }

    showMainScreen() {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById('mainScreen').classList.add('active');
        this.updateUserInfo();
        this.loadVehiculos();
    }

    showDetailScreen(vehiculoId) {
        this.currentVehiculo = db.getVehiculoById(vehiculoId);
        if (!this.currentVehiculo) return;
        
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById('detailScreen').classList.add('active');
        this.updateUserInfo();
        this.loadVehiculoDetail();
    }

    // Vehicle management
    loadVehiculos() {
        const vehiculos = db.getVehiculosByUsuario(this.currentUser.id);
        const container = document.getElementById('vehiculosList');
        
        if (vehiculos.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="padding: 40px;">
                    <p>No tienes vehículos registrados</p>
                    <p>Usa el botón "Nuevo" para agregar tu primer vehículo</p>
                </div>
            `;
        } else {
            container.innerHTML = vehiculos.map(vehiculo => createVehiculoCard(vehiculo)).join('');
        }
    }

    handleAddVehiculo(e) {
        e.preventDefault();
        
        const nombre = document.getElementById('vehiculoNombreInput').value.trim();
        const marca = document.getElementById('vehiculoMarcaInput').value.trim();
        const modelo = document.getElementById('vehiculoModeloInput').value.trim();
        
        if (!nombre || !marca || !modelo) {
            showToast('Completa todos los campos', 'error');
            return;
        }
        
        try {
            db.agregarVehiculo(nombre, marca, modelo, this.currentUser.id);
            showToast('Vehículo agregado exitosamente', 'success');
            closeModal();
            this.loadVehiculos();
        } catch (error) {
            showToast('Error al agregar vehículo', 'error');
        }
    }

    handleAddSharedVehiculo(e) {
        e.preventDefault();
        
        const codigo = document.getElementById('codigoInput').value.trim().toUpperCase();
        
        if (!codigo) {
            showToast('Ingresa el código del vehículo', 'error');
            return;
        }
        
        try {
            const success = db.agregarVehiculoCompartido(codigo, this.currentUser.id);
            if (success) {
                showToast('Vehículo compartido agregado exitosamente', 'success');
                closeModal();
                this.loadVehiculos();
            } else {
                showToast('Código no válido o vehículo ya agregado', 'error');
            }
        } catch (error) {
            showToast('Error al agregar vehículo compartido', 'error');
        }
    }

    // Day usage management
    showVehiculoSelectorForToday() {
        this.showVehiculoSelector('agregarDiaHoy');
    }

    showVehiculoSelectorForDate() {
        this.showVehiculoSelector('agregarDiaFecha');
    }

    showVehiculoSelector(action) {
        const vehiculos = db.getVehiculosByUsuario(this.currentUser.id);
        
        if (vehiculos.length === 0) {
            showToast('No tienes vehículos registrados', 'warning');
            return;
        }
        
        const container = document.getElementById('vehiculoSelectorList');
        container.innerHTML = vehiculos.map(vehiculo => 
            createVehiculoSelectorItem(vehiculo, action)
        ).join('');
        
        showModal('vehiculoSelectorModal');
    }

    async agregarDiaHoy(vehiculoId) {
        try {
            const result = await db.agregarDiaUso(vehiculoId, this.currentUser.id, new Date());
            if (result === true) {
                showToast('Día de uso agregado', 'success');
                this.loadVehiculos();
            } else if (result && result.error) {
                showToast(result.message, 'warning');
            } else {
                showToast('Ya existe un registro para hoy', 'warning');
            }
        } catch (error) {
            console.error('Error al agregar día de uso:', error);
            showToast('Error al agregar día de uso', 'error');
        }
        closeModal();
    }

    async agregarDiaFecha(vehiculoId) {
        if (!this.selectedDate) return;
        
        try {
            const result = await db.agregarDiaUso(vehiculoId, this.currentUser.id, this.selectedDate);
            if (result === true) {
                showToast('Día de uso agregado', 'success');
                this.loadVehiculos();
                if (this.currentVehiculo && this.currentVehiculo.id === vehiculoId) {
                    this.loadVehiculoDetail();
                }
            } else if (result && result.error) {
                showToast(result.message, 'warning');
            } else {
                showToast('Ya existe un registro para esta fecha', 'warning');
            }
        } catch (error) {
            console.error('Error al agregar día de uso:', error);
            showToast('Error al agregar día de uso', 'error');
        }
        closeModal();
    }

    handleDateSelection() {
        const fechaInput = document.getElementById('fechaInput');
        const fechaStr = fechaInput.value;
        
        if (!fechaStr) {
            showToast('Selecciona una fecha', 'error');
            return;
        }
        
        this.selectedDate = parseDate(fechaStr);
        closeModal();
        this.showVehiculoSelectorForDate();
    }

    // Vehicle detail
    loadVehiculoDetail() {
        if (!this.currentVehiculo) return;
        
        // Actualizar información del vehículo
        document.getElementById('vehiculoNombre').textContent = this.currentVehiculo.nombre;
        document.getElementById('vehiculoInfo').textContent = 
            `${this.currentVehiculo.marca} ${this.currentVehiculo.modelo}`;
        
        // Actualizar contador
        const contadorDias = db.getContadorDias(this.currentVehiculo.id);
        const contadorCard = document.getElementById('contadorCard');
        const contadorTexto = document.getElementById('contadorDias');
        const alertaTexto = document.getElementById('alertaTexto');
        
        contadorTexto.textContent = `${contadorDias} días`;
        
        // Configurar alertas
        contadorCard.className = 'contador-card';
        alertaTexto.textContent = '';
        
        if (contadorDias >= 96) {
            contadorCard.classList.add('error');
            alertaTexto.textContent = '⚠️ Límite de uso alcanzado';
        } else if (contadorDias >= 90) {
            contadorCard.classList.add('warning');
            alertaTexto.textContent = '⚠️ Se acerca al límite de uso';
        }
        
        // Cargar historial
        this.loadHistorial();
    }

    loadHistorial() {
        const diasUso = db.getDiasUsoByVehiculo(this.currentVehiculo.id);
        const container = document.getElementById('historialList');
        
        if (diasUso.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="padding: 20px;">
                    <p>No hay días de uso registrados</p>
                </div>
            `;
        } else {
            container.innerHTML = diasUso.map(dia => createHistorialItem(dia)).join('');
        }
    }

    // Sharing
    shareVehiculoWhatsApp() {
        if (!this.currentVehiculo) return;
        
        try {
            const codigo = db.compartirVehiculo(this.currentVehiculo.id, this.currentUser.id);
            if (codigo) {
                shareWhatsApp(codigo, this.currentVehiculo.nombre);
            } else {
                showToast('Error al generar código de compartir', 'error');
            }
        } catch (error) {
            showToast('Error al compartir vehículo', 'error');
        }
    }

    shareVehiculoEmail() {
        if (!this.currentVehiculo) return;
        
        try {
            const codigo = db.compartirVehiculo(this.currentVehiculo.id, this.currentUser.id);
            if (codigo) {
                shareEmail(codigo, this.currentVehiculo.nombre);
            } else {
                showToast('Error al generar código de compartir', 'error');
            }
        } catch (error) {
            showToast('Error al compartir vehículo', 'error');
        }
    }

    // GitHub Sync functionality
    async handleSync() {
        const status = githubDB.getTokenStatus();
        
        // Si está en modo solo lectura, mostrar configuración
        if (status.readOnly) {
            this.showGitHubTokenConfig();
            return;
        }
        
        try {
            // Cambiar texto del botón de sincronización
            const syncBtn = document.getElementById('syncBtn');
            const originalHTML = syncBtn.innerHTML;
            syncBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Sincronizando...';
            syncBtn.disabled = true;
            
            const success = await githubDB.sincronizar();
            
            if (success) {
                showToast('✅ Sincronización completada', 'success');
                // Recargar datos si estamos en pantalla principal
                if (this.currentUser) {
                    this.loadVehiculos();
                    if (this.currentVehiculo) {
                        this.loadVehiculoDetail();
                    }
                }
            } else {
                showToast('⚠️ Sincronización parcial (solo local)', 'warning');
            }
            
            this.updateSyncStatus();
            
        } catch (error) {
            console.error('Error en sincronización:', error);
            showToast('❌ Error al sincronizar', 'error');
        } finally {
            // Restaurar botón de sincronización
            const syncBtn = document.getElementById('syncBtn');
            this.updateSyncStatus(); // Esto restaurará el texto correcto del botón
            syncBtn.disabled = false;
        }
    }

    // GitHub Token Configuration
    showGitHubTokenConfig() {
        const status = githubDB.getTokenStatus();
        
        // Actualizar estado en el modal
        const statusText = document.getElementById('tokenStatusText');
        const removeBtn = document.getElementById('removeTokenBtn');
        const tokenInput = document.getElementById('githubTokenInput');
        
        if (status.hasToken) {
            statusText.textContent = `Configurado (${status.tokenPreview})`;
            removeBtn.classList.remove('hidden');
            tokenInput.placeholder = 'Ingresa un nuevo token para reemplazar el actual';
        } else {
            statusText.textContent = 'Solo lectura';
            removeBtn.classList.add('hidden');
            tokenInput.placeholder = 'Pega tu Personal Access Token aquí';
        }
        
        tokenInput.value = '';
        showModal('githubTokenModal');
    }

    async handleGitHubTokenConfig(e) {
        e.preventDefault();
        
        const token = document.getElementById('githubTokenInput').value.trim();
        
        if (!token) {
            showToast('Ingresa un token válido', 'error');
            return;
        }
        
        // Validar formato básico del token
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            showToast('El token no tiene un formato válido', 'error');
            return;
        }
        
        try {
            // Cambiar texto del botón en lugar de usar setButtonLoading
            const submitBtn = document.querySelector('#githubTokenForm button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Configurando...';
            submitBtn.disabled = true;
            
            console.log('🔧 Configurando token GitHub...');
            
            // Configurar el token
            githubDB.setToken(token);
            console.log('✅ Token configurado en githubDB');
            
            // Probar el token haciendo una sincronización
            console.log('🔄 Probando token con sincronización...');
            const success = await githubDB.sincronizar();
            console.log('📊 Resultado sincronización:', success);
            
            if (success) {
                showToast('✅ Token configurado correctamente', 'success');
                this.updateSyncStatus();
                closeModal();
                
                // Recargar datos
                if (this.currentUser) {
                    this.loadVehiculos();
                    if (this.currentVehiculo) {
                        this.loadVehiculoDetail();
                    }
                }
            } else {
                showToast('⚠️ Token configurado pero sincronización parcial', 'warning');
                this.updateSyncStatus();
                closeModal();
            }
            
        } catch (error) {
            console.error('Error configurando token:', error);
            
            // Remover token inválido
            githubDB.setToken(null);
            this.updateSyncStatus();
            
            if (error.message.includes('401') || error.message.includes('403')) {
                showToast('❌ Token inválido o sin permisos', 'error');
            } else {
                showToast('❌ Error al configurar token', 'error');
            }
        } finally {
            // Restaurar botón
            const submitBtn = document.querySelector('#githubTokenForm button[type="submit"]');
            submitBtn.textContent = 'Configurar';
            submitBtn.disabled = false;
        }
    }

    removeGitHubToken() {
        confirmAction('¿Estás seguro de que quieres remover el token de GitHub?', () => {
            githubDB.setToken(null);
            this.updateSyncStatus();
            showToast('Token removido - Modo solo lectura activado', 'info');
            closeModal();
        });
    }


}

// Funciones globales para eventos onclick
function showVehiculoDetail(vehiculoId) {
    app.showDetailScreen(vehiculoId);
}

function eliminarVehiculo(vehiculoId) {
    confirmAction('¿Estás seguro de que quieres eliminar este vehículo?', () => {
        try {
            db.eliminarVehiculo(vehiculoId);
            showToast('Vehículo eliminado', 'success');
            app.loadVehiculos();
        } catch (error) {
            showToast('Error al eliminar vehículo', 'error');
        }
    });
}

function eliminarDiaUso(diaUsoId) {
    confirmAction('¿Estás seguro de que quieres eliminar este día de uso?', () => {
        try {
            db.eliminarDiaUso(diaUsoId);
            showToast('Día de uso eliminado', 'success');
            app.loadHistorial();
            app.loadVehiculoDetail();
        } catch (error) {
            showToast('Error al eliminar día de uso', 'error');
        }
    });
}

function agregarDiaHoy(vehiculoId) {
    app.agregarDiaHoy(vehiculoId);
}

function agregarDiaFecha(vehiculoId) {
    app.agregarDiaFecha(vehiculoId);
}

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registrado: ', registration);
            })
            .catch(registrationError => {
                console.log('SW falló: ', registrationError);
            });
    });
}

// Inicializar aplicación
const app = new VehiculoApp();

// Configurar fecha de hoy por defecto
document.getElementById('fechaInput').value = getTodayString();