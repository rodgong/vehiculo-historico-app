// Sistema de sincronización de datos entre web y app
class DataSync {
    
    // Exportar todos los datos del usuario
    static exportUserData() {
        const data = {
            usuarios: JSON.parse(localStorage.getItem('vehiculo_usuarios') || '[]'),
            vehiculos: JSON.parse(localStorage.getItem('vehiculo_vehiculos') || '[]'),
            diasUso: JSON.parse(localStorage.getItem('vehiculo_dias_uso') || '[]'),
            compartidos: JSON.parse(localStorage.getItem('vehiculo_compartidos') || '[]'),
            currentUser: JSON.parse(localStorage.getItem('vehiculo_current_user') || 'null'),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return JSON.stringify(data, null, 2);
    }
    
    // Importar datos del usuario
    static importUserData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validar estructura
            if (!data.usuarios || !Array.isArray(data.usuarios)) {
                throw new Error('Formato de datos inválido');
            }
            
            // Confirmar importación
            const confirmMsg = `¿Importar datos?\n\n` +
                `Usuarios: ${data.usuarios.length}\n` +
                `Vehículos: ${data.vehiculos?.length || 0}\n` +
                `Días de uso: ${data.diasUso?.length || 0}\n\n` +
                `ADVERTENCIA: Esto sobrescribirá todos los datos actuales.`;
            
            if (!confirm(confirmMsg)) {
                return false;
            }
            
            // Importar datos
            localStorage.setItem('vehiculo_usuarios', JSON.stringify(data.usuarios || []));
            localStorage.setItem('vehiculo_vehiculos', JSON.stringify(data.vehiculos || []));
            localStorage.setItem('vehiculo_dias_uso', JSON.stringify(data.diasUso || []));
            localStorage.setItem('vehiculo_compartidos', JSON.stringify(data.compartidos || []));
            localStorage.setItem('vehiculo_current_user', JSON.stringify(data.currentUser || null));
            
            alert('✅ Datos importados exitosamente. Recarga la página.');
            return true;
            
        } catch (error) {
            alert('❌ Error al importar datos: ' + error.message);
            return false;
        }
    }
    
    // Descargar datos como archivo
    static downloadUserData() {
        const data = this.exportUserData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `vehiculo-historico-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Generar código QR para transferir datos
    static generateTransferCode() {
        const data = this.exportUserData();
        const compressed = btoa(data); // Base64 encode
        
        // Mostrar código para copiar
        const code = compressed.substring(0, 100) + '...'; // Truncar para mostrar
        
        prompt('Código de transferencia (copia todo):', compressed);
        return compressed;
    }
    
    // Importar desde código
    static importFromCode(code) {
        try {
            const data = atob(code); // Base64 decode
            return this.importUserData(data);
        } catch (error) {
            alert('❌ Código inválido');
            return false;
        }
    }
    
    // Sincronizar con URL (para compartir entre dispositivos)
    static generateSyncUrl() {
        const data = this.exportUserData();
        const compressed = btoa(encodeURIComponent(data));
        const baseUrl = window.location.origin + window.location.pathname;
        const syncUrl = `${baseUrl}?sync=${compressed}`;
        
        // Copiar al portapapeles si es posible
        if (navigator.clipboard) {
            navigator.clipboard.writeText(syncUrl).then(() => {
                alert('✅ URL de sincronización copiada al portapapeles');
            });
        } else {
            prompt('URL de sincronización:', syncUrl);
        }
        
        return syncUrl;
    }
    
    // Verificar si hay datos de sincronización en la URL
    static checkSyncUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const syncData = urlParams.get('sync');
        
        if (syncData) {
            try {
                const data = decodeURIComponent(atob(syncData));
                
                if (confirm('¿Importar datos desde URL de sincronización?')) {
                    this.importUserData(data);
                    
                    // Limpiar URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } catch (error) {
                console.error('Error al procesar datos de sincronización:', error);
            }
        }
    }
}

// Hacer disponible globalmente
window.DataSync = DataSync;

// Verificar sincronización al cargar
document.addEventListener('DOMContentLoaded', () => {
    DataSync.checkSyncUrl();
});

// Comandos rápidos para la consola
window.exportData = () => DataSync.downloadUserData();
window.importData = (jsonString) => DataSync.importUserData(jsonString);
window.generateSync = () => DataSync.generateSyncUrl();