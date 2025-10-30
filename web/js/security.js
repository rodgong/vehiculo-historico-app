// Utilidades de seguridad
class SecurityUtils {
    
    // Hash simple usando SHA-256 (para demo - usar bcrypt en producción)
    static async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Verificar contraseña
    static async verifyPassword(password, hash) {
        const passwordHash = await this.hashPassword(password);
        return passwordHash === hash;
    }
    
    // Generar salt aleatorio
    static generateSalt() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Hash con salt
    static async hashPasswordWithSalt(password, salt = null) {
        if (!salt) {
            salt = this.generateSalt();
        }
        const saltedPassword = salt + password;
        const hash = await this.hashPassword(saltedPassword);
        return { hash, salt };
    }
    
    // Verificar con salt
    static async verifyPasswordWithSalt(password, hash, salt) {
        const { hash: newHash } = await this.hashPasswordWithSalt(password, salt);
        return newHash === hash;
    }
    
    // Cifrar datos sensibles (AES-GCM)
    static async encryptData(data, password) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedData = encoder.encode(JSON.stringify(data));
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encodedData
        );
        
        return {
            encrypted: Array.from(new Uint8Array(encrypted)),
            salt: Array.from(salt),
            iv: Array.from(iv)
        };
    }
    
    // Descifrar datos
    static async decryptData(encryptedData, password) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: new Uint8Array(encryptedData.salt),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
            key,
            new Uint8Array(encryptedData.encrypted)
        );
        
        return JSON.parse(decoder.decode(decrypted));
    }
    
    // Validar fortaleza de contraseña
    static validatePasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const score = [
            password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        ].filter(Boolean).length;
        
        return {
            isValid: score >= 3 && password.length >= minLength,
            score: score,
            feedback: {
                length: password.length >= minLength,
                uppercase: hasUpperCase,
                lowercase: hasLowerCase,
                numbers: hasNumbers,
                special: hasSpecialChar
            }
        };
    }
    
    // Limpiar datos sensibles de memoria
    static clearSensitiveData() {
        // Limpiar campos de contraseña
        document.querySelectorAll('input[type="password"]').forEach(input => {
            input.value = '';
        });
        
        // Forzar garbage collection si está disponible
        if (window.gc) {
            window.gc();
        }
    }
}

// Exportar para uso global
window.SecurityUtils = SecurityUtils;