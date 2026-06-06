# Sistema de Roles y Permisos en Salas de Voz - PartyLiveApp

Este documento describe en detalle el diseño, la lógica de negocio, el flujo de datos y los mecanismos de sincronización para el sistema de roles y permisos dentro de las salas de voz de PartyLiveApp.

---

## 1. Roles en la Sala

Cada miembro de una sala de voz tiene asignado uno de los siguientes roles (`RoomRole`):

1. **`owner`** (Creador/Dueño de la sala):
   - Control total sobre el ciclo de vida de la sala y todos sus miembros.
   - Es el único que puede finalizar la sala.
2. **`host`** (Anfitrión secundario):
   - Gestiona micrófonos y participantes de rango menor.
   - Ayuda a conducir el flujo de voz.
   - No puede finalizar la sala ni degradar/remover al `owner`.
3. **`moderator`** (Moderador):
   - Mantiene el orden silenciando o expulsando oyentes y oradores problemáticos.
   - No puede gestionar roles superiores (`owner`, `host`).
4. **`speaker`** (Orador):
   - Ocupa un asiento/micrófono de voz.
   - Puede hablar y silenciarse a sí mismo localmente.
5. **`listener`** (Oyente):
   - Escucha el audio de la sala.
   - Puede interactuar en el chat de texto y pedir micrófono.

---

## 2. Matriz de Permisos por Rol

Los permisos están definidos en [roomPermissions.ts](file:///e:/Chaton/src/constants/roomPermissions.ts) bajo la constante `ROOM_ROLE_PERMISSIONS`:

| Permiso | owner | host | moderator | speaker | listener |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `CLOSE_ROOM` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `ASSIGN_HOST` / `REMOVE_HOST` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `ASSIGN_MODERATOR` / `REMOVE_MODERATOR` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `APPROVE_MIC_REQUEST` / `REJECT_MIC_REQUEST` | ✅ | ✅ | ✅* | ❌ | ❌ |
| `ASSIGN_SPEAKER` / `REMOVE_SPEAKER` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `LOCK_MIC_SEAT` / `UNLOCK_MIC_SEAT` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `MUTE_MEMBER` / `UNMUTE_MEMBER` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `KICK_MEMBER` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `HIDE_MESSAGE` / `DELETE_MESSAGE` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `SEND_MESSAGE` / `SEND_EMOJI` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `REQUEST_MIC` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `SEND_GIFT_MOCK` | ✅ | ✅ | ✅ | ✅ | ✅ |

*\* `moderator` puede aprobar/rechazar solicitudes de micrófono únicamente si `MODERATOR_CAN_APPROVE_MIC = true`.*

---

## 3. Jerarquía y Reglas de Gestión de Roles

Para realizar cualquier acción de moderación, el sistema evalúa la jerarquía de roles mediante las siguientes reglas:

- **`canManageRole(actor, target)`**:
  - `owner` puede gestionar a todos excepto a otro `owner`.
  - `host` puede gestionar a `moderator`, `speaker` y `listener`. No puede gestionar a `owner` ni a otros `hosts`.
  - `moderator` puede gestionar a `speaker` y `listener`. No puede gestionar a `owner`, `host` ni a otros `moderators`.
  - Un usuario **nunca** puede moderarse a sí mismo (ej. auto-expulsarse o auto-silenciarse de forma remota).
- **`canPromoteToRole(actor, newRole)`**:
  - Solo el `owner` puede promover/degradar a `host` y `moderator`.
  - El `host` puede promover usuarios a `speaker`.

---

## 4. Flujos Clave

### A. Subir al Escenario (Speaker Flow)
1. Un `listener` toca el botón de micrófono o un asiento vacío, lo cual crea un documento en `rooms/{roomId}/micRequests/{userId}` con estado `pending`.
2. Un miembro con permiso `APPROVE_MIC_REQUEST` (`owner` o `host`) recibe la notificación en tiempo real a través de `MicRequestsPanel`.
3. Al aprobar, se ejecuta una transacción en Firestore:
   - Se cambia el rol de la persona a `speaker`.
   - Se le asigna un `seatIndex` (0 a 7).
   - Se elimina la solicitud en `micRequests`.
   - Se genera un mensaje de sistema informando que subió al escenario.
   - Se crea un log de moderación `promote_speaker`.

### B. Expulsar de la Sala (Kick Flow)
1. Un moderador autorizado ejecuta la expulsión.
2. En la subcolección `members`, el documento del usuario se actualiza con `isKicked = true`, `kickedBy = actorUserId` y `kickedAt = timestamp`. El `seatIndex` es removido.
3. En la tablet del usuario expulsado, el listener en tiempo real de `RoomDetailsScreen` detecta `currentMember.isKicked === true`.
4. El cliente:
   - Desconecta inmediatamente de la sesión de LiveKit.
   - Muestra una alerta: *"Fuiste expulsado de la sala."*
   - Redirecciona al usuario a la pantalla anterior (Home / RoomsScreen).

### C. Silenciar (Mute Flow)
1. Un moderador silencia a un orador a través del `RoomMemberActionsModal`.
2. Se actualiza `isMuted = true` en Firestore.
3. El hook `useRoomLiveKit` detecta el cambio reactivamente en `currentMember.isMuted` y cambia el estado del micrófono local (`roomInstance.localParticipant.setMicrophoneEnabled(false)`) impidiendo que el audio se propague al servidor WebRTC.

---

## 5. Logs de Moderación

Cada acción importante de moderación se registra en la subcolección:
`rooms/{roomId}/moderationLogs/{logId}`

Los campos grabados son:
- `id` (string): Identificador único del log.
- `roomId` (string): Sala donde ocurrió.
- `moderatorId` (string): Quién realizó la acción.
- `action` (string): Ej. `promote_host`, `remove_host`, `promote_moderator`, `mute_member`, `kick_member`, `close_room`.
- `targetUserId` (string): Usuario sobre el cual recae la acción.
- `createdAt` (Timestamp): Fecha y hora del evento.

---

## 6. Seguridad Recomendada en Producción

Actualmente, las mutaciones de roles se realizan mediante transacciones y escrituras directas desde el SDK móvil cliente, validadas a través de reglas locales de TypeScript. Para producción, **es imperativo restringir las escrituras directas en Firestore y migrar la lógica crítica a Firebase Cloud Functions** para evitar manipulación de tokens de LiveKit y estados de cuenta desde clientes vulnerados.

En `firebase/firestore.rules.draft` se proponen las siguientes validaciones básicas:
- Ningún miembro puede modificar su propio rol a `owner`, `host` o `moderator`.
- Solo el `owner` de la sala tiene permisos de escritura en campos de configuración y roles principales en `rooms/{roomId}`.

---

## 7. Guía de Pruebas Manuales (Tablet Samsung por USB)

### Preparación
1. Conecta la tablet y asegúrate de tener activada la depuración USB.
2. Ejecuta la aplicación en modo desarrollo:
   ```bash
   npm run android
   ```
3. Ejecuta el servidor LiveKit en local:
   ```bash
   .\livekit-server.exe --config .\livekit.yaml
   ```

### Casos de Prueba

| ID | Escenario | Pasos | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **P1** | Creación y Rol de Owner | Crea una sala nueva desde la tablet. Abre la lista de miembros y verifica tu badge. | Aparece el badge dorado `Owner`. Tienes control de todas las acciones del menú. |
| **P2** | Solicitar y Aprobar Mic | Ingresa con un segundo dispositivo como Oyente. Presiona "Pedir Micrófono". Desde la tablet (Owner), abre la lista de solicitudes y aprueba. | El segundo usuario pasa a ser `Speaker` y ocupa el asiento asignado visualmente. |
| **P3** | Moderación de Host | Promueve al segundo usuario a `Host`. Intenta desde ese usuario mutear a un tercero, y luego intenta finalizar la sala. | El Host puede mutear oyentes/speakers, pero el botón de finalizar sala no está disponible y no puede remover al Owner. |
| **P4** | Mute en Tiempo Real | Silencia a un Speaker en los micrófonos visuales. | El micrófono del Speaker se desactiva instantáneamente y aparece el ícono de silenciado 🔇 sobre su avatar. |
| **P5** | Expulsión Completa | Expulsa al segundo usuario. | El usuario es desconectado de LiveKit, se le redirige al Home con la alerta *"Fuiste expulsado de la sala."*, y no puede reingresar. |
