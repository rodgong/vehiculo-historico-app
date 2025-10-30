// Database management using GitHub as shared backend
class VehiculoDatabase {
    constructor() {
        this.githubDB = window.githubDB;
        this.initializeDatabase();
    }

    initializeDatabase() {
        if (!localStorage.getItem('vehiculo_usuarios')) {
            localStorage.setItem('vehiculo_usuarios', JSON.stringify([]));
        }
        if (!localStorage.getItem('vehiculo_vehiculos')) {
            localStorage.setItem('vehiculo_vehiculos', JSON.stringify([]));
        }
        if (!localStorage.getItem('vehiculo_dias_uso')) {
            localStorage.setItem('vehiculo_dias_uso', JSON.stringify([]));
        }
        if (!localStorage.getItem('vehiculo_compartidos')) {
            localStorage.setItem('vehiculo_compartidos', JSON.stringify([]));
        }
        if (!localStorage.getItem('vehiculo_current_user')) {
            localStorage.setItem('vehiculo_current_user', 'null');
        }
    }

    // Usuarios
    getUsuarios() {
        return JSON.parse(localStorage.getItem('vehiculo_usuarios') || '[]');
    }

    saveUsuarios(usuarios) {
        localStorage.setItem('vehiculo_usuarios', JSON.stringify(usuarios));
    }

    async registrarUsuario(nombre, email, password) {
        // Usar GitHub Database para registro
        if (this.githubDB && this.githubDB.initialized) {
            const { hash, salt } = await SecurityUtils.hashPasswordWithSalt(password);
            return await this.githubDB.registrarUsuario(nombre, email, hash, salt);
        }
        
        // Fallback a localStorage
        const usuarios = this.getUsuarios();
        
        // Verificar si el email ya existe
        if (usuarios.find(u => u.email === email)) {
            return null;
        }

        // Hash de la contraseña con salt
        const { hash, salt } = await SecurityUtils.hashPasswordWithSalt(password);

        const nuevoUsuario = {
            id: Date.now(),
            nombre,
            email,
            passwordHash: hash,
            passwordSalt: salt,
            fechaRegistro: new Date().toISOString()
        };

        usuarios.push(nuevoUsuario);
        this.saveUsuarios(usuarios);
        
        // Retornar usuario sin datos sensibles
        const { passwordHash, passwordSalt, ...userSafe } = nuevoUsuario;
        return userSafe;
    }

    async login(email, password) {
        try {
            // Usar GitHub Database para login si está disponible
            if (this.githubDB && this.githubDB.initialized) {
                console.log('🌐 Intentando login con GitHub Database...');
                const result = await this.githubDB.login(email, password);
                if (result) {
                    console.log('🎉 Login exitoso con GitHub Database');
                    return result;
                }
                console.log('⚠️ Login fallido en GitHub, intentando local...');
            }

            // Fallback a localStorage
            const usuarios = this.getUsuarios();
            console.log('🔍 Intento de login local para:', email);
            console.log('📊 Total usuarios locales:', usuarios.length);
            
            const usuario = usuarios.find(u => u.email === email);
            
            if (!usuario) {
                console.log('❌ Usuario no encontrado localmente');
                return null;
            }

            console.log('✅ Usuario encontrado localmente:', {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                tienePasswordHash: !!usuario.passwordHash,
                tienePasswordSalt: !!usuario.passwordSalt,
                tienePasswordPlano: !!usuario.password
            });

            let isValidPassword = false;
            
            // Primero intentar con contraseña en texto plano (usuarios legacy)
            if (usuario.password) {
                console.log('🔓 Verificando contraseña en texto plano...');
                isValidPassword = usuario.password === password;
                console.log('Resultado texto plano:', isValidPassword);
                
                if (isValidPassword) {
                    console.log('🔄 Migrando a hash...');
                    try {
                        const { hash, salt } = await SecurityUtils.hashPasswordWithSalt(password);
                        usuario.passwordHash = hash;
                        usuario.passwordSalt = salt;
                        delete usuario.password;
                        this.saveUsuarios(usuarios);
                        console.log('✅ Migración completada');
                    } catch (error) {
                        console.log('⚠️ Error en migración, pero login válido:', error);
                    }
                }
            }
            // Si no hay contraseña plana, intentar con hash
            else if (usuario.passwordHash && usuario.passwordSalt) {
                console.log('🔐 Verificando contraseña hasheada...');
                try {
                    isValidPassword = await SecurityUtils.verifyPasswordWithSalt(
                        password, 
                        usuario.passwordHash, 
                        usuario.passwordSalt
                    );
                    console.log('Resultado hash:', isValidPassword);
                } catch (error) {
                    console.log('❌ Error verificando hash:', error);
                    isValidPassword = false;
                }
            } else {
                console.log('❌ Usuario sin contraseña válida');
            }
            
            if (isValidPassword) {
                // Crear usuario seguro sin datos sensibles
                const userSafe = {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    fechaRegistro: usuario.fechaRegistro
                };
                
                localStorage.setItem('vehiculo_current_user', JSON.stringify(userSafe));
                console.log('🎉 Login exitoso local para:', userSafe.nombre);
                return userSafe;
            }
            
            console.log('❌ Contraseña incorrecta');
            return null;
            
        } catch (error) {
            console.error('💥 Error en login:', error);
            return null;
        }
    }

    getCurrentUser() {
        const user = localStorage.getItem('vehiculo_current_user');
        return user && user !== 'null' ? JSON.parse(user) : null;
    }

    logout() {
        localStorage.setItem('vehiculo_current_user', 'null');
    }

    // Vehículos
    getVehiculos() {
        return JSON.parse(localStorage.getItem('vehiculo_vehiculos') || '[]');
    }

    saveVehiculos(vehiculos) {
        localStorage.setItem('vehiculo_vehiculos', JSON.stringify(vehiculos));
    }

    getVehiculosByUsuario(usuarioId) {
        const vehiculos = this.getVehiculos();
        const compartidos = this.getVehiculosCompartidos();
        
        // Vehículos propios
        const propios = vehiculos.filter(v => v.usuarioId === usuarioId);
        
        // Vehículos compartidos
        const vehiculosCompartidos = compartidos
            .filter(c => c.usuarioId === usuarioId)
            .map(c => {
                const vehiculo = vehiculos.find(v => v.codigoCompartido === c.codigoCompartido);
                return vehiculo ? { ...vehiculo, esCompartido: true } : null;
            })
            .filter(v => v !== null);

        return [...propios, ...vehiculosCompartidos];
    }

    agregarVehiculo(nombre, marca, modelo, usuarioId) {
        const vehiculos = this.getVehiculos();
        
        const nuevoVehiculo = {
            id: Date.now(),
            nombre,
            marca,
            modelo,
            usuarioId,
            compartido: false,
            codigoCompartido: null,
            fechaCreacion: new Date().toISOString()
        };

        vehiculos.push(nuevoVehiculo);
        this.saveVehiculos(vehiculos);
        return nuevoVehiculo;
    }

    eliminarVehiculo(vehiculoId) {
        const vehiculos = this.getVehiculos();
        const nuevosVehiculos = vehiculos.filter(v => v.id !== vehiculoId);
        this.saveVehiculos(nuevosVehiculos);

        // También eliminar días de uso asociados
        const diasUso = this.getDiasUso();
        const nuevosDiasUso = diasUso.filter(d => d.vehiculoId !== vehiculoId);
        this.saveDiasUso(nuevosDiasUso);
    }

    getVehiculoById(vehiculoId) {
        const vehiculos = this.getVehiculos();
        return vehiculos.find(v => v.id === vehiculoId);
    }

    // Compartir vehículos
    compartirVehiculo(vehiculoId, usuarioId) {
        const vehiculos = this.getVehiculos();
        const vehiculo = vehiculos.find(v => v.id === vehiculoId && v.usuarioId === usuarioId);
        
        if (!vehiculo) return null;

        // Generar código único si no existe
        if (!vehiculo.codigoCompartido) {
            vehiculo.codigoCompartido = this.generarCodigo();
            vehiculo.compartido = true;
            this.saveVehiculos(vehiculos);
        }

        return vehiculo.codigoCompartido;
    }

    agregarVehiculoCompartido(codigo, usuarioId) {
        const vehiculos = this.getVehiculos();
        const vehiculo = vehiculos.find(v => v.codigoCompartido === codigo);
        
        if (!vehiculo) return false;

        const compartidos = this.getVehiculosCompartidos();
        
        // Verificar si ya está compartido con este usuario
        if (compartidos.find(c => c.codigoCompartido === codigo && c.usuarioId === usuarioId)) {
            return false;
        }

        const nuevoCompartido = {
            id: Date.now(),
            vehiculoId: vehiculo.id,
            usuarioId,
            codigoCompartido: codigo,
            fechaCompartido: new Date().toISOString()
        };

        compartidos.push(nuevoCompartido);
        this.saveVehiculosCompartidos(compartidos);
        return true;
    }

    getVehiculosCompartidos() {
        return JSON.parse(localStorage.getItem('vehiculo_compartidos') || '[]');
    }

    saveVehiculosCompartidos(compartidos) {
        localStorage.setItem('vehiculo_compartidos', JSON.stringify(compartidos));
    }

    generarCodigo() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    // Días de uso
    getDiasUso() {
        return JSON.parse(localStorage.getItem('vehiculo_dias_uso') || '[]');
    }

    saveDiasUso(diasUso) {
        localStorage.setItem('vehiculo_dias_uso', JSON.stringify(diasUso));
    }

    getDiasUsoByVehiculo(vehiculoId) {
        const diasUso = this.getDiasUso();
        return diasUso
            .filter(d => d.vehiculoId === vehiculoId)
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    agregarDiaUso(vehiculoId, usuarioId, fecha) {
        const diasUso = this.getDiasUso();
        const fechaStr = fecha.toISOString().split('T')[0];
        
        // Verificar si ya existe un día de uso para esta fecha
        const existente = diasUso.find(d => 
            d.vehiculoId === vehiculoId && 
            d.fecha.split('T')[0] === fechaStr
        );
        
        if (existente) {
            return false; // Ya existe
        }

        // Obtener el nombre del usuario por ID en lugar de getCurrentUser
        const usuarios = this.getUsuarios();
        const usuario = usuarios.find(u => u.id === usuarioId);
        
        if (!usuario) {
            console.error('Usuario no encontrado:', usuarioId);
            return false;
        }

        const nuevoDiaUso = {
            id: Date.now(),
            vehiculoId,
            usuarioId,
            fecha: fecha.toISOString(),
            nombreUsuario: usuario.nombre,
            fechaCreacion: new Date().toISOString()
        };

        diasUso.push(nuevoDiaUso);
        this.saveDiasUso(diasUso);
        return true;
    }

    eliminarDiaUso(diaUsoId) {
        const diasUso = this.getDiasUso();
        const nuevosDiasUso = diasUso.filter(d => d.id !== diaUsoId);
        this.saveDiasUso(nuevosDiasUso);
    }

    getContadorDias(vehiculoId) {
        const diasUso = this.getDiasUso();
        return diasUso.filter(d => d.vehiculoId === vehiculoId).length;
    }
}

// Instancia global de la base de datos
const db = new VehiculoDatabase();