# Control de Días Vehículo Histórico

Una aplicación Android para controlar los días de uso de vehículos históricos, con funcionalidad de compartir entre usuarios.

## Características

### 🔐 Sistema de Usuarios
- Login y registro de usuarios
- Cada usuario tiene sus propios vehículos
- Datos seguros almacenados localmente

### 🚗 Gestión de Vehículos
- Agregar vehículos con nombre, marca y modelo
- Lista de todos los vehículos del usuario
- Eliminar vehículos con confirmación

### 📅 Control de Días de Uso
- Marcar uso para el día actual con un botón
- Agregar días de uso para fechas pasadas
- Contador visual de días acumulados
- Historial completo de días utilizados

### 🤝 Compartir Vehículos
- Compartir vehículos por WhatsApp o Email
- Código único para cada vehículo compartido
- Múltiples usuarios pueden agregar días al mismo vehículo
- Visualización de qué usuario agregó cada día

### ⚠️ Sistema de Alertas
- **Alerta naranja** a los 90 días: "Se acerca al límite de uso"
- **Alerta roja** a los 96 días: "Límite de uso alcanzado"
- Colores visuales en las tarjetas de vehículos

### 📱 Interfaz Intuitiva
- Diseño moderno con Material Design 3
- Navegación simple y clara
- Botones de acción rápida en la pantalla principal

## Funcionalidades Principales

### Pantalla Principal
- **Botón "+"**: Agregar nuevo vehículo propio
- **Botón "Código"**: Agregar vehículo compartido por código
- **Botón "Hoy"**: Marcar uso del día actual
- **Botón "Fecha"**: Agregar uso para fecha específica

### Detalle de Vehículo
- Ver historial completo de días de uso
- Identificar qué usuario agregó cada día
- Eliminar días de uso específicos
- Compartir vehículo por WhatsApp o Email

### Compartir Vehículos
1. El propietario comparte el vehículo
2. Se genera un código único
3. El mensaje se envía por WhatsApp o Email
4. El receptor usa el código para agregar el vehículo
5. Ambos usuarios pueden agregar días de uso

## Tecnologías Utilizadas

- **Kotlin** - Lenguaje de programación
- **Jetpack Compose** - UI moderna y declarativa
- **Room Database** - Base de datos local
- **Hilt** - Inyección de dependencias
- **Navigation Compose** - Navegación entre pantallas
- **Material Design 3** - Diseño y componentes

## Estructura del Proyecto

```
app/src/main/java/com/vehiculohistorico/control/
├── data/
│   ├── entities/          # Entidades de base de datos
│   ├── dao/              # Data Access Objects
│   ├── database/         # Configuración de Room
│   └── repository/       # Repositorios de datos
├── di/                   # Módulos de Hilt
├── ui/
│   ├── screens/          # Pantallas de la aplicación
│   ├── components/       # Componentes reutilizables
│   ├── viewmodel/        # ViewModels
│   └── theme/           # Tema y estilos
└── utils/               # Utilidades (compartir, etc.)
```

## Instalación y Uso

1. **Clonar el repositorio**
2. **Abrir en Android Studio**
3. **Sincronizar Gradle**
4. **Ejecutar en dispositivo o emulador**

### Primer Uso
1. Crear cuenta o iniciar sesión
2. Agregar tu primer vehículo histórico
3. Comenzar a registrar días de uso
4. Compartir con otros usuarios si es necesario

## Límites de Uso

La aplicación está diseñada para vehículos históricos que tienen restricciones legales:
- **90 días**: Advertencia de proximidad al límite
- **96 días**: Límite máximo alcanzado

## Compartir entre Usuarios

### Para Compartir:
1. Ir al detalle del vehículo
2. Presionar "WhatsApp" o "Email"
3. Enviar el mensaje con el código

### Para Recibir:
1. Usar el botón "Código" en la pantalla principal
2. Ingresar el código recibido
3. El vehículo aparecerá en tu lista

## Características de Seguridad

- Datos almacenados localmente en el dispositivo
- No se requiere conexión a internet para uso básico
- Códigos únicos para cada vehículo compartido
- Validación de usuarios y permisos

---

**Desarrollado para el control eficiente de vehículos históricos** 🚗📱