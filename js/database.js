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
        console.log('🔄 Iniciando registrarUsuario:', { nombre, email, passwordLength: password.length });
        
        // Primero verificar en localStorage si el usuario ya existe
        const usuariosLocales = this.getUsuarios();
        console.log('📊 Usuarios locales existentes:', usuariosLocales.length);
        
        if (usuariosLocales.find(u => u.email === email)) {
            console.log('❌ Usuario ya existe con email:', email);
            return null;
        }
        
        // También verificar en GitHub Database si está disponible
        if (this.githubDB && this.githubDB.initialized) {
            try {
                const githubData = await this.githubDB.getData();
                if (githubData.usuarios.find(u => u.email === email)) {
                    return null; // Usuario ya existe en GitHub
                }
            } catch (error) {
                console.log('No se pudo verificar en GitHub Database:', error);
            }
        }

        // Hash de la contraseña con salt
        console.log('🔐 Iniciando hash de contraseña...');
        console.log('🔍 SecurityUtils disponible:', typeof SecurityUtils);
        
        let hash, salt;
        try {
            const result = await SecurityUtils.hashPasswordWithSalt(password);
            hash = result.hash;
            salt = result.salt;
            console.log('✅ Hash completado exitosamente');
        } catch (error) {
            console.error('❌ Error en hash de contraseña:', error);
            // Fallback: guardar contraseña en texto plano temporalmente
            console.log('⚠️ Usando fallback: contraseña en texto plano');
            hash = null;
            salt = null;
        }

        const nuevoUsuario = {
            id: Date.now(),
            nombre,
            email,
            fechaRegistro: new Date().toISOString()
        };

        // Agregar datos de contraseña según si el hash funcionó o no
        if (hash && salt) {
            nuevoUsuario.passwordHash = hash;
            nuevoUsuario.passwordSalt = salt;
            console.log('✅ Usuario creado con contraseña hasheada');
        } else {
            // Fallback: guardar contraseña en texto plano temporalmente
            nuevoUsuario.password = password;
            console.log('⚠️ Usuario creado con contraseña en texto plano (fallback)');
        }

        // SIEMPRE registrar en localStorage primero
        usuariosLocales.push(nuevoUsuario);
        this.saveUsuarios(usuariosLocales);
        console.log('✅ Usuario registrado en localStorage:', nombre);

        // Intentar sincronizar con GitHub Database si es posible
        if (this.githubDB && this.githubDB.initialized && !this.githubDB.readOnly) {
            try {
                await this.githubDB.registrarUsuario(nombre, email, hash, salt);
                console.log('✅ Usuario sincronizado con GitHub Database:', nombre);
            } catch (error) {
                console.log('⚠️ No se pudo sincronizar con GitHub Database:', error);
            }
        }
        
        // Retornar usuario sin datos sensibles
        const { passwordHash, passwordSalt, ...userSafe } = nuevoUsuario;
        return userSafe;
    }

    async login(email, password) {
        try {
            // PRIMERO intentar login con localStorage (más rápido y confiable)
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

    async agregarDiaUso(vehiculoId, usuarioId, fecha) {
        const diasUso = this.getDiasUso();
        const fechaStr = fecha.toISOString().split('T')[0];
        
        console.log('🔍 DEBUG agregarDiaUso:', {
            vehiculoId,
            vehiculoIdType: typeof vehiculoId,
            usuarioId,
            usuarioIdType: typeof usuarioId,
            fechaStr,
            totalDiasUso: diasUso.length,
            diasParaEsteVehiculo: diasUso.filter(d => d.vehiculoId === vehiculoId).length,
            todosLosDiasUso: diasUso.map(d => ({
                id: d.id,
                vehiculoId: d.vehiculoId,
                vehiculoIdType: typeof d.vehiculoId,
                usuarioId: d.usuarioId,
                fecha: d.fecha.split('T')[0],
                nombreUsuario: d.nombreUsuario
            }))
        });
        
        // Verificar si ya existe un día de uso para este vehículo en esta fecha (por cualquier usuario)
        const existente = diasUso.find(d => 
            d.vehiculoId === vehiculoId && 
            d.fecha.split('T')[0] === fechaStr
        );
        
        if (existente) {
            console.log('❌ Día existente encontrado:', {
                existenteId: existente.id,
                existenteUsuarioId: existente.usuarioId,
                existenteNombreUsuario: existente.nombreUsuario,
                existenteFecha: existente.fecha,
                usuarioActual: usuarioId
            });
            
            // Si existe, verificar si es del mismo usuario
            if (existente.usuarioId === usuarioId) {
                return { error: 'duplicate', message: 'Ya registraste este día' };
            } else {
                return { error: 'occupied', message: `Este día ya fue usado por ${existente.nombreUsuario}` };
            }
        }
        
        console.log('✅ No hay conflictos, agregando día de uso');

        // Obtener el nombre del usuario por ID - buscar en ambas bases de datos
        let usuario = null;
        
        // Primero buscar en localStorage
        const usuariosLocales = this.getUsuarios();
        usuario = usuariosLocales.find(u => u.id === usuarioId);
        
        // Si no se encuentra localmente y tenemos GitHub DB, buscar ahí
        if (!usuario && this.githubDB && this.githubDB.initialized) {
            try {
                const githubData = await this.githubDB.getData();
                usuario = githubData.usuarios.find(u => u.id === usuarioId);
                console.log('👤 Usuario encontrado en GitHub Database:', usuario?.nombre);
            } catch (error) {
                console.error('Error buscando usuario en GitHub:', error);
            }
        }
        
        if (!usuario) {
            console.error('Usuario no encontrado en ninguna base de datos:', usuarioId);
            console.log('Usuarios locales:', usuariosLocales.map(u => ({ id: u.id, nombre: u.nombre })));
            return { error: 'user_not_found', message: 'Usuario no encontrado' };
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

// Función de debug para diagnosticar problemas
window.debugVehiculos = function() {
    console.log('=== DEBUG VEHICULOS ===');
    console.log('Usuario actual:', db.getCurrentUser());
    console.log('Todos los vehículos:', db.getVehiculos());
    console.log('Vehículos compartidos:', db.getVehiculosCompartidos());
    console.log('Todos los días de uso:', db.getDiasUso());
    console.log('======================');
};