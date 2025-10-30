// Adaptador para usar base de datos local o compartida
class DatabaseAdapter {
    constructor() {
        this.useCloudDB = false;
        this.cloudDB = null;
        this.localDB = null;
        this.initialized = false;
    }

    // Inicializar adaptador
    async init(useCloud = false, token = null) {
        this.useCloudDB = useCloud;
        
        if (useCloud) {
            // Inicializar base de datos en la nube (GitHub)
            this.cloudDB = githubDB;
            await this.cloudDB.init(token);
            console.log('🌐 Usando base de datos compartida (GitHub)');
        } else {
            // Usar base de datos local existente
            this.localDB = db;
            console.log('💾 Usando base de datos local');
        }
        
        this.initialized = true;
    }

    // Registrar usuario
    async registrarUsuario(nombre, email, password) {
        if (!this.initialized) await this.init();

        try {
            if (this.useCloudDB && this.cloudDB) {
                // Usar base de datos compartida
                const { hash, salt } = await SecurityUtils.hashPasswordWithSalt(password);
                const result = await this.cloudDB.registrarUsuario(nombre, email, hash, salt);
                
                if (result) {
                    showToast('Usuario registrado en base de datos compartida', 'success');
                }
                
                return result;
            } else {
                // Usar base de datos local
                return await this.localDB.registrarUsuario(nombre, email, password);
            }
        } catch (error) {
            console.error('Error registrando usuario:', error);
            // Fallback a base de datos local
            if (this.useCloudDB) {
                showToast('Error en BD compartida, usando local', 'warning');
                return await this.localDB.registrarUsuario(nombre, email, password);
            }
            throw error;
        }
    }

    // Login
    async login(email, password) {
        if (!this.initialized) await this.init();

        try {
            if (this.useCloudDB && this.cloudDB) {
                // Intentar login en base de datos compartida
                const result = await this.cloudDB.login(email, password);
                
                if (result) {
                    showToast('Login desde base de datos compartida', 'success');
                    return result;
                } else {
                    // Si no encuentra el usuario en la nube, intentar local
                    showToast('Usuario no encontrado en BD compartida, probando local...', 'info');
                    return await this.localDB.login(email, password);
                }
            } else {
                // Usar base de datos local
                return await this.localDB.login(email, password);
            }
        } catch (error) {
            console.error('Error en login:', error);
            // Fallback a base de datos local
            if (this.useCloudDB) {
                showToast('Error en BD compartida, usando local', 'warning');
                return await this.localDB.login(email, password);
            }
            throw error;
        }
    }

    // Obtener vehículos del usuario
    async getVehiculosByUsuario(usuarioId) {
        if (!this.initialized) await this.init();

        try {
            if (this.useCloudDB && this.cloudDB) {
                // Obtener de base de datos compartida
                const cloudVehiculos = await this.cloudDB.getVehiculosByUsuario(usuarioId);
                
                // También obtener locales para combinar
                const localVehiculos = this.localDB.getVehiculosByUsuario(usuarioId);
                
                // Combinar vehículos (evitar duplicados)
                const combined = [...cloudVehiculos];
                localVehiculos.forEach(localV => {
                    if (!combined.find(cloudV => cloudV.id === localV.id)) {
                        combined.push(localV);
                    }
                });
                
                return combined;
            } else {
                // Usar base de datos local
                return this.localDB.getVehiculosByUsuario(usuarioId);
            }
        } catch (error) {
            console.error('Error obteniendo vehículos:', error);
            // Fallback a base de datos local
            return this.localDB.getVehiculosByUsuario(usuarioId);
        }
    }

    // Agregar vehículo
    async agregarVehiculo(nombre, marca, modelo, usuarioId) {
        if (!this.initialized) await this.init();

        const vehiculo = {
            id: Date.now(),
            nombre,
            marca,
            modelo,
            usuarioId,
            compartido: false,
            codigoCompartido: null,
            fechaCreacion: new Date().toISOString()
        };

        try {
            if (this.useCloudDB && this.cloudDB) {
                // Agregar a base de datos compartida
                await this.cloudDB.agregarVehiculo(vehiculo);
                showToast('Vehículo agregado a BD compartida', 'success');
            }
            
            // Siempre agregar también a local (para acceso offline)
            this.localDB.agregarVehiculo(nombre, marca, modelo, usuarioId);
            
            return vehiculo;
        } catch (error) {
            console.error('Error agregando vehículo:', error);
            // Fallback a base de datos local
            return this.localDB.agregarVehiculo(nombre, marca, modelo, usuarioId);
        }
    }

    // Agregar día de uso
    async agregarDiaUso(vehiculoId, usuarioId, fecha) {
        if (!this.initialized) await this.init();

        try {
            // Siempre usar base de datos local para días de uso (más rápido)
            const result = await this.localDB.agregarDiaUso(vehiculoId, usuarioId, fecha);
            
            // Si está usando BD compartida, sincronizar después
            if (this.useCloudDB && this.cloudDB && result) {
                // Sincronizar en background (no bloquear la UI)
                setTimeout(() => {
                    this.sincronizarDiasUso();
                }, 1000);
            }
            
            return result;
        } catch (error) {
            console.error('Error agregando día de uso:', error);
            return false;
        }
    }

    // Sincronizar días de uso con la nube
    async sincronizarDiasUso() {
        if (!this.useCloudDB || !this.cloudDB) return;

        try {
            const localDiasUso = JSON.parse(localStorage.getItem('vehiculo_dias_uso') || '[]');
            
            // Aquí podrías implementar la lógica para subir días de uso a la nube
            // Por ahora, solo los mantenemos locales para mejor rendimiento
            
        } catch (error) {
            console.error('Error sincronizando días de uso:', error);
        }
    }

    // Sincronizar todos los datos
    async sincronizar() {
        if (!this.useCloudDB || !this.cloudDB) {
            showToast('No hay base de datos compartida configurada', 'warning');
            return false;
        }

        try {
            showToast('Sincronizando con base de datos compartida...', 'info');
            
            const result = await this.cloudDB.sincronizar();
            
            if (result) {
                showToast('✅ Sincronización completada', 'success');
                // Recargar datos en la interfaz
                if (window.app && window.app.currentUser) {
                    window.app.loadVehiculos();
                }
            } else {
                showToast('⚠️ Sincronización parcial', 'warning');
            }
            
            return result;
        } catch (error) {
            console.error('Error sincronizando:', error);
            showToast('❌ Error al sincronizar', 'error');
            return false;
        }
    }

    // Cambiar modo de base de datos
    async switchToCloudDB(token) {
        try {
            await this.init(true, token);
            showToast('✅ Cambiado a base de datos compartida', 'success');
            return true;
        } catch (error) {
            console.error('Error cambiando a BD compartida:', error);
            showToast('❌ Error configurando BD compartida', 'error');
            return false;
        }
    }

    async switchToLocalDB() {
        await this.init(false);
        showToast('✅ Cambiado a base de datos local', 'success');
        return true;
    }

    // Obtener estado
    getStatus() {
        return {
            initialized: this.initialized,
            useCloudDB: this.useCloudDB,
            cloudStatus: this.cloudDB ? this.cloudDB.getStatus() : null,
            localStatus: this.localDB ? 'available' : 'not available'
        };
    }

    // Métodos que delegan a la base de datos local (para compatibilidad)
    getCurrentUser() {
        return this.localDB ? this.localDB.getCurrentUser() : null;
    }

    logout() {
        if (this.localDB) {
            this.localDB.logout();
        }
    }

    getDiasUsoByVehiculo(vehiculoId) {
        return this.localDB ? this.localDB.getDiasUsoByVehiculo(vehiculoId) : [];
    }

    getContadorDias(vehiculoId) {
        return this.localDB ? this.localDB.getContadorDias(vehiculoId) : 0;
    }

    eliminarVehiculo(vehiculoId) {
        if (this.localDB) {
            this.localDB.eliminarVehiculo(vehiculoId);
        }
        
        // TODO: También eliminar de la nube si está configurada
    }

    eliminarDiaUso(diaUsoId) {
        if (this.localDB) {
            this.localDB.eliminarDiaUso(diaUsoId);
        }
    }

    compartirVehiculo(vehiculoId, usuarioId) {
        return this.localDB ? this.localDB.compartirVehiculo(vehiculoId, usuarioId) : null;
    }

    agregarVehiculoCompartido(codigo, usuarioId) {
        return this.localDB ? this.localDB.agregarVehiculoCompartido(codigo, usuarioId) : false;
    }

    getVehiculoById(vehiculoId) {
        return this.localDB ? this.localDB.getVehiculoById(vehiculoId) : null;
    }
}

// Instancia global del adaptador
const dbAdapter = new DatabaseAdapter();
window.dbAdapter = dbAdapter;

// Comandos para la consola
window.enableCloudDB = (token) => dbAdapter.switchToCloudDB(token);
window.disableCloudDB = () => dbAdapter.switchToLocalDB();
window.syncData = () => dbAdapter.sincronizar();
window.dbStatus = () => console.log(dbAdapter.getStatus());