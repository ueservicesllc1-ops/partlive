# Sistema de Notificaciones Internas y Push - PartyLiveApp

Este documento describe la arquitectura, integración de Firebase Cloud Messaging (FCM) y pasos para realizar pruebas en dispositivos físicos.

---

## 1. Arquitectura de Notificaciones
El sistema soporta canales In-App (Firestore en tiempo real), Push (FCM) o ambos:
- **Colección `notifications`**: Mapea las alertas mostradas dentro de la app (campana en cabecera).
- **Colección `deviceTokens`**: Registra los tokens únicos del emulador/tablet vinculados a cada usuario.
- **Colección `notificationSettings`**: Registra las preferencias del usuario para silenciar categorías específicas (Juegos, VIP, Payouts).

---

## 2. Configuración en Firebase Console
Para que las notificaciones push funcionen en Android, debes activar FCM:

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/) y abre tu proyecto.
2. Abre la pestaña **Configuración del proyecto (Project Settings)** ⚙️ -> **Mensajería en la nube (Cloud Messaging)**.
3. Asegúrate de que **Firebase Cloud Messaging API (v1)** esté habilitada.
4. El archivo `google-services.json` ya se encuentra configurado en la carpeta `android/app/` del proyecto móvil.

---

## 3. Pruebas en Dispositivos Físicos (Tablet Samsung)

### Paso 1: Pedir Permiso de Notificaciones (Android 13+)
La aplicación solicita automáticamente el permiso `POST_NOTIFICATIONS` en runtime al loguearse o iniciar la app a través de la API `fcmService.ts`. Confirma el cuadro de diálogo en la pantalla de la tablet.

### Paso 2: Verificar Registro de Token
1. Levanta los servicios locales:
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Metro Bundler
   npm start
   ```
2. Loguéate en la aplicación en la tablet Samsung.
3. El frontend de React Native solicitará su token a FCM y llamará a `/api/device-tokens/register`.
4. Comprueba en la consola de Firestore que existe un documento en `deviceTokens` con el ID de tu token y `isActive: true`.

### Paso 3: Probar Envío de Notificación Unitaria (Admin)
1. Abre el panel de administración Next.js:
   ```bash
   cd admin && npm run dev
   ```
2. Ve a la sección **Notificaciones** (`http://localhost:3000/notifications`).
3. Selecciona **Usuario Único**, introduce tu `userId` (uid de Firebase) y rellena los campos.
4. Presiona **Enviar Notificación**. Deberías ver la notificación Push inmediatamente en el panel superior de la tablet (si la app está en background) o como un banner Toast interno animado en la parte superior (si la app está en primer plano / foreground).
