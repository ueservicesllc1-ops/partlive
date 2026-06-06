# Sistema de Live Streaming - PartyLiveApp

Este documento describe la arquitectura, estructura de datos y flujos de trabajo del sistema de Lives implementado en PartyLiveApp.

## 1. Estructura de Datos en Firestore

### Colección Principal: `lives`
Ruta: `lives/{liveId}`

Campos principales:
- `hostId` (string): ID del usuario que transmite.
- `hostName` (string): Nombre visible del host.
- `title` (string): Título del live.
- `category` (string): Categoría (Popular, Música, Juegos, etc.).
- `viewersCount` (number): Espectadores en tiempo real.
- `likesCount` (number): Total de likes recibidos.
- `giftsCount` (number): Total de regalos virtuales recibidos.
- `diamondsEarned` (number): Diamantes generados para el host.
- `status` (string): `'scheduled' | 'live' | 'ended' | 'suspended'`.
- `allowChat` (boolean): Habilitar/deshabilitar chat.
- `allowGifts` (boolean): Habilitar/deshabilitar regalos.

### Subcolección: `viewers`
Ruta: `lives/{liveId}/viewers/{userId}`
Registra los espectadores conectados en tiempo real.
- `userId` (string): ID del espectador.
- `displayName` (string): Nombre visible.
- `role` (string): `'host' | 'moderator' | 'viewer'`.
- `joinedAt` (timestamp): Hora de ingreso.

### Subcolección: `messages`
Ruta: `lives/{liveId}/messages/{messageId}`
Chat en vivo para el stream.
- `senderId` (string): ID del autor.
- `text` (string): Contenido del mensaje.
- `type` (string): `'text' | 'emoji' | 'system' | 'gift' | 'moderation'`.
- `status` (string): `'active' | 'hidden' | 'deleted'`.

### Subcolección: `giftEvents`
Ruta: `lives/{liveId}/giftEvents/{eventId}`
Registro de regalos virtuales recibidos.

---

## 2. Flujo de Control e Integración con LiveKit

1. **Host Inicia Transmisión (`StartLiveScreen`)**:
   - Crea el documento en la colección `lives` con estado `'live'`.
   - Agrega al Host dentro de la subcolección `viewers` con rol `'host'`.
   - Solicita permisos de cámara y micrófono en Android (`requestCameraAndMicrophonePermissions`).
   - Obtiene el token de LiveKit con permiso `canPublish: true` e inicia la publicación de video.

2. **Espectador Entra a Transmisión (`LiveDetailsScreen`)**:
   - Llama a `joinLive` en `livesService` agregándose como espectador en la subcolección `viewers`.
   - Automáticamente incrementa el `viewersCount` global.
   - Obtiene el token de LiveKit con permiso `canPublish: false` y se suscribe al canal de video.

3. **Interacciones en Tiempo Real (Likes & Regalos)**:
   - Los likes incrementan `likesCount` en `lives/{liveId}`.
   - Al enviar regalos, se crea un log en `giftEvents`, se notifica al chat, y se actualiza `giftsCount` y `diamondsEarned`.

4. **Host Termina Transmisión (`endLive`)**:
   - Cambia el estado del live a `'ended'`.
   - Limpia e interrumpe las conexiones de WebRTC/LiveKit.
   - Muestra el resumen estadístico de la transmisión (`LiveEndedState`).

---

## 3. Pruebas y Validación

### Iniciar y Probar localmente
1. Levanta el backend de Express:
   ```bash
   cd backend
   npm run dev
   ```
2. Ejecuta la aplicación React Native en tu dispositivo Android o emulador:
   ```bash
   npm run android
   ```
3. Ve a la pestaña **Lives**, presiona **Iniciar live**, completa los campos y confirma la transmisión.
4. En otro dispositivo, inicia sesión con otra cuenta, ve a la pestaña de Lives, selecciona la transmisión y verifica que las interacciones del chat, likes y regalos mock se reflejen al instante.
