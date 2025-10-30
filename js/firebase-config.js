// Configuración de Firebase para base de datos compartida
class FirebaseDB {
    constructor() {
        this.initialized = false;
        this.db = null;
    }

    // Inicializar Firebase
    async init() {
        if (this.initialized) return;

        try {
            // Configuración de Firebase (reemplaza con tus datos)
            const firebaseConfig = {
                apiKey: "TU_API_KEY",
                authDomain: "vehiculo-historico.firebaseapp.com",
                databaseURL: "https://vehiculo-historico-default-rtdb.firebaseio.com",
                projectId: "vehiculo-historico",
                storageBucket: "vehiculo-historico.appspot.com",
                messagingSenderId: "123456789",
                appId: "1:123456789:web:abcdef123456"
            };

            // Importar Firebase (usando CDN)
            if (!window.firebase) {
                await this.loadFirebaseSDK();
            }

            // Inicializar Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            this.db = firebase.firestore();
            this.initialized = true;
            console.log('✅ Firebase inicializado correctamente');

        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
            // Fallback a localStorage si Firebase falla
            this.useFallback();
        }
    }

    // Cargar SDK de Firebase dinámicamente
    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            // Firebase App
            const appScript = document.createElement('script');
            appScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js';
            appScript.onload = () => {
                // Firebase Firestore
                const firestoreScript = document.createElement('script');
                firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore-compat.js';
                firestoreScript.onload = resolve;
                firestoreScript.onerror = reject;
                document.head.appendChild(firestoreScript);
            };
            appScript.onerror = reject;
            document.head.appendChild(appScript);
        });
    }

    // Fallback a localStorage si Firebase no está disponible
    useFallback() {
        console.log('🔄 Usando localStorage como fallback');
        this.initialized = true;
        this.db = null;
    }

    // Registrar usuario en Firebase
    async registrarUsuario(nombre, email, passwordHash, passwordSalt) {
        if (!this.initialized) await this.init();

        try {
            if (this.db) {
                // Verificar si el usuario ya existe
                const userQuery = await this.db.collection('usuarios')
                    .where('email', '==', email)
                    .get();

                if (!userQuery.empty) {
                    return null; // Usuario ya existe
                }

                // Crear nuevo usuario
                const nuevoUsuario = {
                    id: Date.now(),
                    nombre,
                    email,
                    passwordHash,
                    passwordSalt,
                    fechaRegistro: new Date().toISOString(),
                    activo: true
                };

                await this.db.collection('usuarios').doc(nuevoUsuario.id.toString()).set(nuevoUsuario);
                console.log('✅ Usuario registrado en Firebase:', nombre);

                // También guardar en localStorage para acceso offline
                this.syncToLocalStorage('usuarios', nuevoUsuario);

                return { id: nuevoUsuario.id, nombre, email, fechaRegistro: nuevoUsuario.fechaRegistro };

            } else {
                // Fallback a localStorage
                return this.registrarUsuarioLocal(nombre, email, passwordHash, passwordSalt);
            }

        } catch (error) {
            console.error('❌ Error registrando usuario en Firebase:', error);
            // Fallback a localStorage
            return this.registrarUsuarioLocal(nombre, email, passwordHash, passwordSalt);
        }
    }

    // Login con Firebase
    async login(email, password) {
        if (!this.initialized) await this.init();

        try {
            if (this.db) {
                // Buscar usuario en Firebase
                const userQuery = await this.db.collection('usuarios')
                    .where('email', '==', email)
                    .where('activo', '==', true)
                    .get();

                if (userQuery.empty) {
                    return null; // Usuario no encontrado
                }

                const userData = userQuery.docs[0].data();

                // Verificar contraseña
                let isValidPassword = false;

                if (userData.passwordHash && userData.passwordSalt) {
                    isValidPassword = await SecurityUtils.verifyPasswordWithSalt(
                        password, 
                        userData.passwordHash, 
                        userData.passwordSalt
                    );
                } else if (userData.password) {
                    // Usuario legacy
                    isValidPassword = userData.password === password;
                    
                    if (isValidPassword) {
                        // Migrar a hash
                        const { hash, salt } = await SecurityUtils.hashPasswordWithSalt(password);
                        await this.db.collection('usuarios').doc(userData.id.toString()).update({
                            passwordHash: hash,
                            passwordSalt: salt,
                            password: firebase.firestore.FieldValue.delete()
                        });
                    }
                }

                if (isValidPassword) {
                    const userSafe = {
                        id: userData.id,
                        nombre: userData.nombre,
                        email: userData.email,
                        fechaRegistro: userData.fechaRegistro
                    };

                    // Guardar en localStorage para acceso offline
                    localStorage.setItem('vehiculo_current_user', JSON.stringify(userSafe));
                    
                    console.log('✅ Login exitoso desde Firebase:', userData.nombre);
                    return userSafe;
                }

                return null;

            } else {
                // Fallback a localStorage
                return this.loginLocal(email, password);
            }

        } catch (error) {
            console.error('❌ Error en login Firebase:', error);
            // Fallback a localStorage
            return this.loginLocal(email, password);
        }
    }

    // Sincronizar vehículos con Firebase
    async sincronizarVehiculos(usuarioId) {
        if (!this.initialized) await this.init();

        try {
            if (this.db) {
                // Obtener vehículos del usuario desde Firebase
                const vehiculosQuery = await this.db.collection('vehiculos')
                    .where('usuarioId', '==', usuarioId)
                    .get();

                const vehiculosFirebase = vehiculosQuery.docs.map(doc => doc.data());

                // Obtener vehículos locales
                const vehiculosLocal = JSON.parse(localStorage.getItem('vehiculo_vehiculos') || '[]');
                const vehiculosUsuarioLocal = vehiculosLocal.filter(v => v.usuarioId === usuarioId);

                // Sincronizar: subir vehículos locales que no estén en Firebase
                for (const vehiculo of vehiculosUsuarioLocal) {
                    const existeEnFirebase = vehiculosFirebase.find(v => v.id === vehiculo.id);
                    if (!existeEnFirebase) {
                        await this.db.collection('vehiculos').doc(vehiculo.id.toString()).set(vehiculo);
                        console.log('⬆️ Vehículo subido a Firebase:', vehiculo.nombre);
                    }
                }

                // Sincronizar: bajar vehículos de Firebase que no estén localmente
                for (const vehiculo of vehiculosFirebase) {
                    const existeLocal = vehiculosUsuarioLocal.find(v => v.id === vehiculo.id);
                    if (!existeLocal) {
                        vehiculosLocal.push(vehiculo);
                        console.log('⬇️ Vehículo descargado de Firebase:', vehiculo.nombre);
                    }
                }

                // Guardar vehículos sincronizados en localStorage
                localStorage.setItem('vehiculo_vehiculos', JSON.stringify(vehiculosLocal));

                return vehiculosFirebase;

            } else {
                // Fallback a localStorage
                const vehiculos = JSON.parse(localStorage.getItem('vehiculo_vehiculos') || '[]');
                return vehiculos.filter(v => v.usuarioId === usuarioId);
            }

        } catch (error) {
            console.error('❌ Error sincronizando vehículos:', error);
            // Fallback a localStorage
            const vehiculos = JSON.parse(localStorage.getItem('vehiculo_vehiculos') || '[]');
            return vehiculos.filter(v => v.usuarioId === usuarioId);
        }
    }

    // Agregar vehículo a Firebase
    async agregarVehiculo(vehiculo) {
        if (!this.initialized) await this.init();

        try {
            if (this.db) {
                await this.db.collection('vehiculos').doc(vehiculo.id.toString()).set(vehiculo);
                console.log('✅ Vehículo agregado a Firebase:', vehiculo.nombre);
            }

            // También agregar a localStorage
            const vehiculos = JSON.parse(localStorage.getItem('vehiculo_vehiculos') || '[]');
            vehiculos.push(vehiculo);
            localStorage.setItem('vehiculo_vehiculos', JSON.stringify(vehiculos));

            return vehiculo;

        } catch (error) {
            console.error('❌ Error agregando vehículo a Firebase:', error);
            // Fallback a localStorage
            const vehiculos = JSON.parse(localStorage.getItem('vehiculo_vehiculos') || '[]');
            vehiculos.push(vehiculo);
            localStorage.setItem('vehiculo_vehiculos', JSON.stringify(vehiculos));
            return vehiculo;
        }
    }

    // Métodos de fallback para localStorage
    registrarUsuarioLocal(nombre, email, passwordHash, passwordSalt) {
        const usuarios = JSON.parse(localStorage.getItem('vehiculo_usuarios') || '[]');
        
        if (usuarios.find(u => u.email === email)) {
            return null;
        }

        const nuevoUsuario = {
            id: Date.now(),
            nombre,
            email,
            passwordHash,
            passwordSalt,
            fechaRegistro: new Date().toISOString()
        };

        usuarios.push(nuevoUsuario);
        localStorage.setItem('vehiculo_usuarios', JSON.stringify(usuarios));

        return { id: nuevoUsuario.id, nombre, email, fechaRegistro: nuevoUsuario.fechaRegistro };
    }

    async loginLocal(email, password) {
        const usuarios = JSON.parse(localStorage.getItem('vehiculo_usuarios') || '[]');
        const usuario = usuarios.find(u => u.email === email);
        
        if (!usuario) return null;

        let isValidPassword = false;
        
        if (usuario.passwordHash && usuario.passwordSalt) {
            isValidPassword = await SecurityUtils.verifyPasswordWithSalt(
                password, 
                usuario.passwordHash, 
                usuario.passwordSalt
            );
        } else if (usuario.password) {
            isValidPassword = usuario.password === password;
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

    // Sincronizar datos a localStorage para acceso offline
    syncToLocalStorage(collection, data) {
        const key = `vehiculo_${collection}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        
        // Evitar duplicados
        const index = existing.findIndex(item => item.id === data.id);
        if (index >= 0) {
            existing[index] = data;
        } else {
            existing.push(data);
        }
        
        localStorage.setItem(key, JSON.stringify(existing));
    }

    // Verificar conectividad
    isOnline() {
        return navigator.onLine && this.db !== null;
    }

    // Estado de la conexión
    getStatus() {
        return {
            initialized: this.initialized,
            online: this.isOnline(),
            hasFirebase: this.db !== null
        };
    }
}

// Instancia global
const firebaseDB = new FirebaseDB();
window.firebaseDB = firebaseDB;