// Herramientas de depuración para diagnosticar problemas
class DebugUtils {
    
    // Mostrar todos los usuarios registrados
    static showAllUsers() {
        const usuarios = JSON.parse(localStorage.getItem('vehiculo_usuarios') || '[]');
        console.log('=== USUARIOS REGISTRADOS ===');
        usuarios.forEach((user, index) => {
            console.log(`Usuario ${index + 1}:`, {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                tienePassword: !!user.password,
                tienePasswordHash: !!user.passwordHash,
                tienePasswordSalt: !!user.passwordSalt,
                passwordLength: user.password ? user.password.length : 0,
                fechaRegistro: user.fechaRegistro
            });
        });
        return usuarios;
    }
    
    // Mostrar usuario actual
    static showCurrentUser() {
        const currentUser = localStorage.getItem('vehiculo_current_user');
        console.log('=== USUARIO ACTUAL ===');
        console.log('Raw data:', currentUser);
        if (currentUser && currentUser !== 'null') {
            console.log('Parsed:', JSON.parse(currentUser));
        } else {
            console.log('No hay usuario logueado');
        }
        return currentUser;
    }
    
    // Probar login manualmente
    static async testLogin(email, password) {
        console.log('=== PRUEBA DE LOGIN ===');
        console.log('Email:', email);
        console.log('Password:', password);
        
        const usuarios = JSON.parse(localStorage.getItem('vehiculo_usuarios') || '[]');
        const usuario = usuarios.find(u => u.email === email);
        
        if (!usuario) {
            console.log('❌ Usuario no encontrado');
            return false;
        }
        
        console.log('✅ Usuario encontrado:', {
            nombre: usuario.nombre,
            email: usuario.email,
            tienePassword: !!usuario.password,
            tienePasswordHash: !!usuario.passwordHash
        });
        
        // Probar contraseña en texto plano
        if (usuario.password) {
            const match = usuario.password === password;
            console.log('Prueba texto plano:', {
                passwordGuardada: usuario.password,
                passwordIngresada: password,
                coincide: match
            });
            return match;
        }
        
        // Probar contraseña hasheada
        if (usuario.passwordHash && usuario.passwordSalt) {
            try {
                const match = await SecurityUtils.verifyPasswordWithSalt(
                    password, 
                    usuario.passwordHash, 
                    usuario.passwordSalt
                );
                console.log('Prueba hash:', {
                    coincide: match
                });
                return match;
            } catch (error) {
                console.log('❌ Error verificando hash:', error);
                return false;
            }
        }
        
        console.log('❌ Usuario sin contraseña válida');
        return false;
    }
    
    // Limpiar todos los datos
    static clearAllData() {
        const keys = [
            'vehiculo_usuarios',
            'vehiculo_vehiculos', 
            'vehiculo_dias_uso',
            'vehiculo_compartidos',
            'vehiculo_current_user'
        ];
        
        console.log('=== LIMPIANDO DATOS ===');
        keys.forEach(key => {
            localStorage.removeItem(key);
            console.log('Eliminado:', key);
        });
        
        console.log('✅ Todos los datos eliminados');
        console.log('Recarga la página para empezar de nuevo');
    }
    
    // Crear usuario de prueba
    static async createTestUser() {
        console.log('=== CREANDO USUARIO DE PRUEBA ===');
        
        const testUser = {
            nombre: 'Usuario Test',
            email: 'test@test.com',
            password: 'test123'
        };
        
        try {
            const result = await db.registrarUsuario(
                testUser.nombre, 
                testUser.email, 
                testUser.password
            );
            
            if (result) {
                console.log('✅ Usuario de prueba creado:', result);
                console.log('Puedes hacer login con:');
                console.log('Email: test@test.com');
                console.log('Password: test123');
            } else {
                console.log('❌ Error creando usuario (posiblemente ya existe)');
            }
            
            return result;
        } catch (error) {
            console.log('❌ Error:', error);
            return null;
        }
    }
    
    // Migrar usuarios legacy a hash
    static async migrateAllUsers() {
        console.log('=== MIGRANDO USUARIOS A HASH ===');
        
        const usuarios = JSON.parse(localStorage.getItem('vehiculo_usuarios') || '[]');
        let migrated = 0;
        
        for (let usuario of usuarios) {
            if (usuario.password && !usuario.passwordHash) {
                console.log('Migrando usuario:', usuario.nombre);
                
                try {
                    const { hash, salt } = await SecurityUtils.hashPasswordWithSalt(usuario.password);
                    usuario.passwordHash = hash;
                    usuario.passwordSalt = salt;
                    delete usuario.password;
                    migrated++;
                    
                    console.log('✅ Migrado:', usuario.nombre);
                } catch (error) {
                    console.log('❌ Error migrando:', usuario.nombre, error);
                }
            }
        }
        
        if (migrated > 0) {
            localStorage.setItem('vehiculo_usuarios', JSON.stringify(usuarios));
            console.log(`✅ ${migrated} usuarios migrados exitosamente`);
        } else {
            console.log('ℹ️ No hay usuarios para migrar');
        }
        
        return migrated;
    }
}

// Hacer disponible globalmente
window.DebugUtils = DebugUtils;

// Comandos rápidos para la consola
window.showUsers = () => DebugUtils.showAllUsers();
window.showCurrent = () => DebugUtils.showCurrentUser();
window.testLogin = (email, password) => DebugUtils.testLogin(email, password);
window.clearData = () => DebugUtils.clearAllData();
window.createTest = () => DebugUtils.createTestUser();
window.migrateUsers = () => DebugUtils.migrateAllUsers();

console.log('🔧 Herramientas de depuración cargadas');
console.log('Comandos disponibles:');
console.log('- showUsers() - Mostrar todos los usuarios');
console.log('- showCurrent() - Mostrar usuario actual');
console.log('- testLogin("email", "password") - Probar login');
console.log('- clearData() - Limpiar todos los datos');
console.log('- createTest() - Crear usuario de prueba');
console.log('- migrateUsers() - Migrar usuarios a hash');