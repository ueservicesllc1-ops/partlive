# Sistema de Matchmaking e Invitaciones de Juegos

Este documento detalla la arquitectura, el diseño y las instrucciones de prueba para el sistema de matchmaking e invitaciones de juego integrados en **PartyLiveApp**.

---

## 1. Conceptos y Arquitectura

El sistema permite a los usuarios buscar partidas casuales rápidas, hospedar salas públicas o privadas, invitar a amigos específicos, e incorporarse mediante códigos cortos.

### A. Partida Pública y Matchmaking
Al presionar **Partida Rápida**, el cliente invoca la función `quickMatch()`. Esta realiza lo siguiente:
1. Consulta la colección `/gameSessions` buscando salas con:
   - `gameId` coincidente
   - `status == 'waiting'`
   - `visibility == 'public'`
   - `matchmakingEnabled == true`
   - Sala no llena (`playerCount < maxPlayers`)
2. Si encuentra una disponible:
   - Añade al usuario en la subcolección `/players`.
   - Incrementa el contador `playerCount`.
   - Navega al Lobby de la sesión.
3. Si no encuentra salas disponibles:
   - Crea un documento de sesión con `visibility = 'public'` y `matchmakingEnabled = true`.
   - Agrega al usuario como host (`isHost = true`) y navega al Lobby en espera de otros jugadores.

### B. Partida Privada e Invite Code
Las partidas privadas no aparecen en las búsquedas de emparejamiento ni en las listas de sesiones disponibles:
- Al crear una partida privada, se genera un código alfanumérico legible de 6 caracteres (ej: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, excluyendo `0, O, 1, I` para evitar confusiones).
- Los jugadores pueden incorporarse ingresando este código en el modal **Unirse con Código**.
- El anfitrión puede compartir el código directamente usando la hoja nativa de compartir del sistema operativo.

### C. Invitaciones Directas
- Los usuarios pueden invitar a amigos/seguidores desde el Lobby.
- Al enviar una invitación se crea un documento en `/gameInvites` con estado `pending`.
- Se envía una notificación en tiempo real de tipo `game_invite`.
- Si el receptor acepta la invitación:
  - El estado cambia a `accepted`.
  - Se une al receptor a la sesión y se le redirige automáticamente a la pantalla de juego.
- Si el receptor rechaza, cambia a `declined`.
- El emisor puede revocarla cambiando el estado a `cancelled`.

### D. Expiración de Invitaciones y Peticiones
Para mantener la base de datos limpia de sesiones huérfanas:
- **Invitaciones (`gameInvites`)**: Tienen un TTL (`expiresAt`) de 10 minutos. Una vez vencido, el estado se considera `expired`.
- **MatchmakingRequests**: Tienen un TTL de 5 minutos.
- Se proporciona la función `expireOldInvites()` en cliente y backend para actualizar de forma masiva los estados caducados.

---

## 2. Limitaciones de Firestore y Buenas Prácticas

1. **Búsqueda Limitada**: Firestore no admite consultas complejas como `array-not-contains` y `!=` combinadas. Las búsquedas de perfiles de usuario se basan en prefijos y normalización a minúsculas (`usernameLowercase`). Para producción, se recomienda usar **Algolia**, **Meilisearch** o **Typesense**.
2. **Matchmaking Distribuido**: Para evitar condiciones de carrera (ej: dos usuarios uniéndose simultáneamente al último slot libre de una sala pública), la lógica de matchmaking debe delegarse a una Cloud Function transaccional (`runTransaction`) o a un servicio backend con colas distribuidas (ej: Redis).

---

## 3. Instrucciones de Prueba con Dos Dispositivos / Simuladores

Para validar el flujo completo de invitaciones y partidas:

### Prueba de Partida Privada (Invite Code)
1. **Dispositivo A (Host)**:
   - Navega a **Juegos** -> Selecciona un juego (ej. **Trivia**).
   - Presiona **Crear Partida Privada**. Se abrirá el Lobby y mostrará un código de 6 letras (ej. `JKLMNP`).
2. **Dispositivo B (Jugador)**:
   - Navega a **Juegos** -> Selecciona el mismo juego.
   - Presiona **Unirse con Código**.
   - Digita el código `JKLMNP` y presiona **Entrar**.
   - Comprueba que el Dispositivo B aparece en el listado del Lobby del Dispositivo A.

### Prueba de Invitaciones Directas
1. **Dispositivo A (Host)**:
   - Crea cualquier partida (pública o privada).
   - Presiona **➕ Invitar Jugadores**.
   - Busca el username del Dispositivo B en la barra de búsqueda y presiona **Invitar**. El botón cambiará a **Invitado**.
2. **Dispositivo B (Jugador)**:
   - Abre la pestaña de **Notificaciones** o navega a la pantalla de **Invitaciones de Juego**.
   - Verá una tarjeta con la invitación de A para el juego correspondiente.
   - Presiona **Aceptar**. Comprueba que es redirigido inmediatamente a la sala de espera junto a A.

---

## 4. Migración a Backend Autoritatativo (Autoritario)

Actualmente, los servicios están preparados tanto para ejecutarse directamente en el cliente (Firestore SDK) como mediante endpoints HTTP seguros del backend.

Para cambiar a llamadas backend en producción:
- Reemplazar las llamadas directas de `matchmakingService.ts` por peticiones fetch a `/api/games/...`.
- Los endpoints del backend garantizan transacciones atómicas seguras en Firestore, evitando que un cliente modifique campos sensibles de la sesión (como la puntuación o el estado del ganador).
