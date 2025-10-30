// Base de datos usando GitHub como backend (más simple)
class GitHubDatabase {
    constructor() {
        // Configuración de tu repositorio GitHub
        this.owner = 'rodgong'; // Tu usuario de GitHub
        this.repo = 'vehiculo-historico-app'; // Tu repositorio
        this.branch = 'main';
        this.dataFile = 'data/database.json'; // Archivo donde se guardarán los datos
        this.token = null; // Token de GitHub (opcional para escritura)
        this.initialized = false;
        this.readOnly = true; // Solo lectura por defecto
    }

    // Inicializar
    async init(token = null) {
        // Intentar obtener token desde localStorage si no se proporciona
        if (!token) {
            token = localStorage.getItem('github_token');
        }
        
        this.token = token;
        this.readOnly = !token;
        this.initialized = true;
        
        console.log(this.readOnly ? 
            '📖 GitHub Database en modo solo lectura' : 
            '✅ GitHub Database con permisos de escritura'
        );
    }

    // Configurar token de GitHub
    setToken(token) {
        this.token = token;
        this.readOnly = !token;
        
        if (token) {
            localStorage.setItem('github_token', token);
            console.log('✅ Token de GitHub configurado - Modo escritura activado');
        } else {
            localStorage.removeItem('github_token');
            console.log('📖 Token removido - Modo solo lectura');
        }
    }

    // Obtener estado del token
    getTokenStatus() {
        return {
            hasToken: !!this.token,
            readOnly: this.readOnly,
            tokenPreview: this.token ? `${this.token.substring(0, 8)}...` : null
        };
    }

    // Obtener datos del archivo JSON en GitHub
    async getData() {
        try {
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataFile}`;
            const response = await fetch(url);

            if (response.ok) {
                const fileData = await response.json();
                const content = atob(fileData.content); // Decodificar base64
                const data = JSON.parse(content);
                
                console.log('✅ Datos obtenidos de GitHub');
                return data;
            } else if (response.status === 404) {
                // Archivo no existe, crear estructura vacía
                console.log('📁 Archivo de datos no existe, creando estructura vacía');
                return this.getEmptyData();
            } else {
                throw new Error(`Error HTTP: ${response.status}`);
            }

        } catch (error) {
            console.error('❌ Error obteniendo datos de GitHub:', error);
            // Fallback a datos locales
            return this.getLocalData();
        }
    }

    // Guardar datos en GitHub (requiere token)
    async saveData(data) {
        if (this.readOnly) {
            console.log('⚠️ Modo solo lectura - guardando solo localmente');
            this.saveLocalData(data);
            return false;
        }

        try {
            // Primero obtener el SHA del archivo actual (si existe)
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataFile}`;
            let sha = null;

            try {
                const currentFile = await fetch(url, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (currentFile.ok) {
                    const fileData = await currentFile.json();
                    sha = fileData.sha;
                }
            } catch (e) {
                // Archivo no existe, se creará nuevo
            }

            // Preparar datos para GitHub
            const content = btoa(JSON.stringify(data, null, 2)); // Codificar a base64
            const commitData = {
                message: `Actualizar base de datos - ${new Date().toISOString()}`,
                content: content,
                branch: this.branch
            };

            if (sha) {
                commitData.sha = sha; // Requerido para actualizar archivo existente
            }

            // Subir archivo a GitHub
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commitData)
            });

            if (response.ok) {
                console.log('✅ Datos guardados en GitHub');
                this.saveLocalData(data); // También guardar localmente
                return true;
            } else {
                const error = await response.json();
                throw new Error(`Error GitHub: ${error.message}`);
            }

        } catch (error) {
            console.error('❌ Error guardando en GitHub:', error);
            // Fallback a localStorage
            this.saveLocalData(data);
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
        
        // Intentar guardar en GitHub
        const saved = await this.saveData(data);
        
        if (!saved && !this.readOnly) {
            showToast('Usuario registrado localmente - sincronizar más tarde', 'warning');
        }

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

            if (isValidPassword && !this.readOnly) {
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

    // Sincronizar datos
    async sincronizar() {
        try {
            showToast('Sincronizando con GitHub...', 'info');

            // Obtener datos de GitHub
            const githubData = await this.getData();
            
            // Obtener datos locales
            const localData = this.getLocalData();

            // Combinar datos
            const mergedData = this.mergeData(githubData, localData);

            // Guardar datos combinados
            const saved = await this.saveData(mergedData);
            
            if (saved) {
                showToast('✅ Sincronización completada', 'success');
            } else {
                showToast('⚠️ Sincronización parcial (solo local)', 'warning');
            }

            return saved;

        } catch (error) {
            console.error('❌ Error sincronizando:', error);
            showToast('❌ Error al sincronizar', 'error');
            return false;
        }
    }

    // Combinar datos locales y de GitHub
    mergeData(githubData, localData) {
        const merged = {
            usuarios: [...githubData.usuarios],
            vehiculos: [...githubData.vehiculos],
            diasUso: [...githubData.diasUso],
            compartidos: [...githubData.compartidos],
            lastSync: new Date().toISOString(),
            version: '1.0'
        };

        // Agregar datos locales que no estén en GitHub
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

    // Métodos auxiliares
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
            lastSync: new Date().toISOString(),
            version: '1.0'
        };
    }

    // Estado
    getStatus() {
        return {
            initialized: this.initialized,
            readOnly: this.readOnly,
            hasToken: !!this.token,
            lastSync: localStorage.getItem('vehiculo_last_sync')
        };
    }
}

// Instancia global
const githubDB = new GitHubDatabase();
window.githubDB = githubDB;