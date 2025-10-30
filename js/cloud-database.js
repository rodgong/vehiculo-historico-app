// Base de datos en la nube usando JSONBin (más simple que Firebase)
class CloudDatabase {
    constructor() {
        // Configuración de JSONBin (servicio gratuito)
        this.apiKey = '$2a$10$YOUR_API_KEY_HERE'; // Reemplazar con tu API key
        this.binId = 'YOUR_BIN_ID_HERE'; // Reemplazar con tu Bin ID
        this.baseUrl = 'https://api.jsonbin.io/v3';
        this.initialized = false;
        this.fallbackMode = false;
    }

    // Inicializar conexión
    async init() {
        if (this.initialized) return;

        try {
            // Verificar conectividad
            const response = await fetch(`${this.baseUrl}/b/${this.binId}/latest`, {
                headers: {
                    'X-Master-Key': this.apiKey
                }
            });

            if (response.ok) {
                console.log('✅ CloudDatabase conectado');
                this.initialized = true;
                this.fallbackMode = false;
            } else {
                throw new Error('No se pudo conectar');
            }

        } catch (error) {
            console.log('⚠️ CloudDatabase no disponible, usando modo offline');
            this.fallbackMode = true;
            this.initialized = true;
        }
    }

    // Obtener todos los datos
    async getData() {
        if (!this.initialized) await this.init();

        if (this.fallbackMode) {
            return this.getLocalData();
        }

        try {
            const response = await fetch(`${this.baseUrl}/b/${this.binId}/latest`, {
                headers: {
                    'X-Master-Key': this.apiKey
                }
            });

            if (response.ok) {
                const result = await response.json();
                return result.record || this.getEmptyData();
            } else {
                throw new Error('Error obteniendo datos');
            }

        } catch (error) {
            console.error('❌ Error obteniendo datos de la nube:', error);
            return this.getLocalData();
        }
    }

    // Guardar todos los datos
    async saveData(data) {
        if (!this.initialized) await this.init();

        // Siempre guardar localmente primero
        this.saveLocalData(data);

        if (this.fallbackMode) {
            return true;
        }

        try {
            const response = await fetch(`${this.baseUrl}/b/${this.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                console.log('✅ Datos guardados en la nube');
                return true;
            } else {
                throw new Error('Error guardando datos');
            }

        } catch (error) {
            console.error('❌ Error guardando en la nube:', error);
            return false;
        }
    }

    // Registrar usuario
    async registrarUsuario(nombre, email, passwordHash, passwordSalt) {
        const data = await this.getData();

        // Verificar si el usuario ya existe
        if (data.usuarios.find(u => u.email === email)) {
            return null;
        }

        const nuevoUsuario = {
            id: Date.now(),
            nombre,
            email,
            passwordHash,
            passwordSalt,
            fechaRegistro: new Date().toISOString(),
            activo: true
        };

        data.usuarios.push(nuevoUsuario);
        await this.saveData(data);

        return {
            id: nuevoUsuario.id,
            nombre,
            email,
            fechaRegistro: nuevoUsuario.fechaRegistro
        };
    }

    // Login
    async login(email, password) {
        const data = await this.getData();
        const usuario = data.usuarios.find(u => u.email === email && u.activo);

        if (!usuario) return null;

        let isValidPassword = false;

        if (usuario.passwordHash && usuario.passwordSalt) {
            isValidPassword = await SecurityUtils.verifyPasswordWithSalt(
                password,
                usuario.passwordHash,
                usuario.passwordSalt
            );
        } else if (usuario.password) {
            // Usuario legacy
            isValidPassword = usuario.password === password;

            if (isValidPassword) {
                // Migrar a hash
                const { hash, salt } = await SecurityUtils.hashPasswordWithSalt(password);
                usuario.passwordHash = hash;
                usuario.passwordSalt = salt;
                delete usuario.password;
                await this.saveData(data);
            }
        }

        if (isValidPassword) {
            const userSafe = {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                fechaRegistro: usuario.fechaRegistro
            };

            localStorage.setItem('vehiculo_current_user', JSON.stringify(userSafe));
            return userSafe;
        }

        return null;
    }

    // Obtener vehículos del usuario
    async getVehiculosByUsuario(usuarioId) {
        const data = await this.getData();
        return data.vehiculos.filter(v => v.usuarioId === usuarioId);
    }

    // Agregar vehículo
    async agregarVehiculo(vehiculo) {
        const data = await this.getData();
        data.vehiculos.push(vehiculo);
        await this.saveData(data);
        return vehiculo;
    }

    // Agregar día de uso
    async agregarDiaUso(diaUso) {
        const data = await this.getData();
        
        // Verificar si ya existe
        const existente = data.diasUso.find(d => 
            d.vehiculoId === diaUso.vehiculoId && 
            d.fecha.split('T')[0] === diaUso.fecha.split('T')[0]
        );

        if (existente) return false;

        data.diasUso.push(diaUso);
        await this.saveData(data);
        return true;
    }

    // Sincronizar datos locales con la nube
    async sincronizar() {
        if (this.fallbackMode) {
            showToast('Modo offline - no se puede sincronizar', 'warning');
            return false;
        }

        try {
            // Obtener datos de la nube
            const cloudData = await this.getData();
            
            // Obtener datos locales
            const localData = this.getLocalData();

            // Combinar datos (la nube tiene prioridad)
            const mergedData = this.mergeData(cloudData, localData);

            // Guardar datos combinados
            await this.saveData(mergedData);
            this.saveLocalData(mergedData);

            showToast('Datos sincronizados exitosamente', 'success');
            return true;

        } catch (error) {
            console.error('❌ Error sincronizando:', error);
            showToast('Error al sincronizar datos', 'error');
            return false;
        }
    }

    // Combinar datos locales y de la nube
    mergeData(cloudData, localData) {
        const merged = {
            usuarios: [...cloudData.usuarios],
            vehiculos: [...cloudData.vehiculos],
            diasUso: [...cloudData.diasUso],
            compartidos: [...cloudData.compartidos],
            lastSync: new Date().toISOString()
        };

        // Agregar datos locales que no estén en la nube
        localData.vehiculos.forEach(localVehiculo => {
            if (!merged.vehiculos.find(v => v.id === localVehiculo.id)) {
                merged.vehiculos.push(localVehiculo);
            }
        });

        localData.diasUso.forEach(localDia => {
            if (!merged.diasUso.find(d => d.id === localDia.id)) {
                merged.diasUso.push(localDia);
            }
        });

        return merged;
    }

    // Datos locales
    getLocalData() {
        return {
            usuarios: JSON.parse(localStorage.getItem('vehiculo_usuarios') || '[]'),
            vehiculos: JSON.parse(localStorage.getItem('vehiculo_vehiculos') || '[]'),
            diasUso: JSON.parse(localStorage.getItem('vehiculo_dias_uso') || '[]'),
            compartidos: JSON.parse(localStorage.getItem('vehiculo_compartidos') || '[]'),
            lastSync: localStorage.getItem('vehiculo_last_sync') || null
        };
    }

    saveLocalData(data) {
        localStorage.setItem('vehiculo_usuarios', JSON.stringify(data.usuarios || []));
        localStorage.setItem('vehiculo_vehiculos', JSON.stringify(data.vehiculos || []));
        localStorage.setItem('vehiculo_dias_uso', JSON.stringify(data.diasUso || []));
        localStorage.setItem('vehiculo_compartidos', JSON.stringify(data.compartidos || []));
        localStorage.setItem('vehiculo_last_sync', data.lastSync || new Date().toISOString());
    }

    getEmptyData() {
        return {
            usuarios: [],
            vehiculos: [],
            diasUso: [],
            compartidos: [],
            lastSync: new Date().toISOString()
        };
    }

    // Estado de la conexión
    getStatus() {
        return {
            initialized: this.initialized,
            online: !this.fallbackMode,
            lastSync: localStorage.getItem('vehiculo_last_sync')
        };
    }
}

// Instancia global
const cloudDB = new CloudDatabase();
window.cloudDB = cloudDB;