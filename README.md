# Piii-Move! 🚗📱

Aplicación móvil para comunicación entre conductores mediante códigos QR.

![Ionic](https://img.shields.io/badge/Ionic-8.x-3880FF?logo=ionic)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-10.x-FFCA28?logo=firebase)

## 📋 Descripción

Piii-Move! permite a los conductores comunicarse entre sí de forma rápida y sencilla. Cada usuario genera un código QR único que puede colocar en su vehículo. Otros conductores pueden escanear este código para enviar avisos o iniciar conversaciones.

**Caso de uso principal:** Un conductor ve que otro aparcado en doble fila, y le obstruye la salida del vehículo estacionado correctametne y quiere avisarle de que mueva su vehículo. Escanea el QR de su ventanilla y le envía un aviso instantáneo.

## 🌐 Web

**[www.piii-move.net](https://www.piii-move.net)**

## ✨ Funcionalidades

- **Registro y autenticación** de usuarios con email/contraseña
- **Código QR personal** único para cada usuario
- **Escáner QR** para detectar otros conductores
- **Sistema de avisos** con botón tipo claxon y sonidos personalizables
- **Chat en tiempo real** entre conductores
- **Historial de conversaciones**
- **Generación de PDF** del código QR para imprimir y colocar en el vehículo
- **Perfil de usuario** editable

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Ionic 8 + React 18 + TypeScript |
| Backend | Firebase (Authentication + Firestore) |
| Nativo | Capacitor |
| QR | qrcode.react + html5-qrcode |
| PDF | jsPDF |

## 📱 Pantallas

| Pantalla | Descripción |
|----------|-------------|
| Splash | Carga inicial con logo |
| Login | Inicio de sesión |
| Registro | Crear cuenta nueva |
| Recuperar Contraseña | Restablecer contraseña por email |
| Dashboard | Menú principal con 4 opciones |
| Mi Código QR | Muestra el QR personal + generar PDF |
| Escáner QR | Cámara para escanear códigos |
| Resultado QR | Usuario detectado + botón claxon para avisar |
| Historial | Lista de conversaciones |
| Chat | Mensajes en tiempo real |
| Mi Perfil | Datos del usuario |

## 🚀 Instalación

### Requisitos previos

- Node.js 18+ 
- npm 9+
- Ionic CLI (`npm install -g @ionic/cli`)

### Pasos

```bash
# Clonar repositorio
git clone https://github.com/FASISMF/piii-move.git

# Entrar al directorio
cd piii-move

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
ionic serve
```

La aplicación se abrirá en `http://localhost:8100`

## 📝 Notas de desarrollo

- **Escáner QR:** En modo navegador (desarrollo), el escáner funciona con entrada manual del ID para facilitar las pruebas. En dispositivo nativo utilizaría la cámara.
- **Notificaciones push:** Funcionalidad planificada como mejora futura mediante Firebase Cloud Messaging (FCM).
- **Sonidos de claxon:** Incluye 5 tonos diferentes seleccionables por el usuario.

## 📂 Estructura del proyecto

```
piii-move/
├── src/
│   ├── pages/           # Componentes de página (11 pantallas)
│   ├── services/        # Configuración Firebase
│   └── theme/           # Variables CSS
├── public/
│   └── assets/
│       ├── sounds/      # Archivos de sonido claxon
│       └── logo_piii_move.png
└── android/             # Proyecto nativo Android
```

## 🔮 Mejoras futuras

- [ ] Notificaciones push en tiempo real (FCM)
- [ ] Publicación en Google Play Store
- [ ] Sonidos personalizados subidos por el usuario
- [ ] Modo oscuro
- [ ] Estadísticas de avisos recibidos/enviados

## 👨‍💻 Autor

**Francisco de Asis Margelino Furiscal** - Trabajo de Fin de Grado (DAM)

## 📄 Licencia

Este proyecto es parte de un Trabajo de Fin de Grado y tiene fines educativos.

---

*Comunica. Conecta. Conduce.*
