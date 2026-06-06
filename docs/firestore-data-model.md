# Modelos de Datos en Firestore para PartyLiveApp

Este documento describe la estructura completa de colecciones y subcolecciones de Firestore que componen la base de datos de la aplicación.

---

## Estructura General

El sistema utiliza las siguientes colecciones raíces y sus subcolecciones correspondientes:

1. `users`: Información del perfil de usuario, niveles, monedas y diamantes.
2. `rooms`: Salas de voz activas e historial de salas cerradas.
3. `lives`: Transmisiones de video en vivo (Live Streams).
4. `games`: Listado de juegos disponibles en la plataforma.
5. `gifts`: Listado de regalos virtuales.
6. `wallets`: Billetera con saldos y transacciones.
7. `rankings`: Tablas de clasificación diarias, semanales e históricas.
8. `follows`: Relaciones de seguidor/seguido entre usuarios.

---

## Detalle del Sistema de Salas de Voz (`rooms`)

Las salas de voz en vivo se gestionan bajo la colección principal `rooms`.

### 1. Colección Principal: `/rooms`

Cada documento representa una sala de voz.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID del documento auto-generado. |
| `title` | `string` | Nombre/Título de la sala de voz. |
| `description` | `string` | Breve descripción de la temática de la sala. |
| `category` | `string` | Categoría (Popular, Música, Fiesta, Juegos, Karaoke, Amistad, Debate). |
| `ownerId` | `string` | ID del usuario creador (dueño de la sala). |
| `ownerName` | `string` | Nombre en pantalla del propietario. |
| `ownerPhotoURL` | `string` (opcional) | Enlace a la imagen de perfil del propietario. |
| `hostIds` | `array<string>` | IDs de los usuarios con rol de anfitrión (Hosts). |
| `moderatorIds` | `array<string>` | IDs de los usuarios designados como moderadores. |
| `speakersCount` | `number` | Número actual de usuarios hablando en los micrófonos (0-8). |
| `listenersCount` | `number` | Número actual de oyentes en la sala. |
| `maxUsers` | `number` | Límite máximo de usuarios concurrentes en la sala. |
| `maxSpeakers` | `number` | Límite máximo de micrófonos en el escenario (ej: 8). |
| `isLive` | `boolean` | Flag que determina si la sala está activa en este momento. |
| `isPrivate` | `boolean` | Flag que define si la sala está protegida con contraseña. |
| `password` | `string` (opcional) | Contraseña de acceso encriptada o texto plano si es privada. |
| `coverImageUrl` | `string` (opcional) | Imagen de portada de la sala. |
| `country` | `string` | Código de país (ej: `MX`, `CO`, `ES`). |
| `language` | `string` | Idioma de la sala (ej: `es`, `en`). |
| `tags` | `array<string>` | Etiquetas descriptivas. |
| `status` | `string` | Estado actual: `"active" \| "ended" \| "suspended"`. |
| `createdAt` | `timestamp` | Fecha de creación del servidor. |
| `updatedAt` | `timestamp` | Fecha de última actualización del servidor. |
| `endedAt` | `timestamp` (opcional) | Fecha de finalización si aplica. |

---

### 2. Subcolecciones en `/rooms/{roomId}`

#### A. Miembros de la sala: `/members`
Registra a todos los usuarios que han ingresado a la sala en tiempo real.
* **Document ID**: El mismo `userId` para búsquedas directas rápidas.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID del usuario. |
| `roomId` | `string` | ID de la sala asociada. |
| `userId` | `string` | ID del usuario miembro. |
| `displayName` | `string` | Nombre en pantalla. |
| `username` | `string` (opcional) | Nombre de usuario único. |
| `photoURL` | `string` (opcional) | Imagen del usuario. |
| `role` | `string` | Rol: `"owner" \| "host" \| "moderator" \| "speaker" \| "listener"`. |
| `seatIndex` | `number` (opcional) | Índice de asiento ocupado en el escenario (0 a 7). |
| `isMuted` | `boolean` | Flag si el usuario está silenciado en el escenario. |
| `isSpeaking` | `boolean` (opcional) | Flag para retroalimentación visual si está emitiendo sonido. |
| `joinedAt` | `timestamp` | Fecha de ingreso a la sala. |
| `lastActiveAt` | `timestamp` | Fecha de última actividad. |

#### B. Mensajes de Chat: `/messages`
Mensajes en tiempo real enviados dentro de la sala.
* **Document ID**: Generado automáticamente por Firestore.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID del mensaje. |
| `senderId` | `string` | ID del remitente. |
| `senderName` | `string` | Nombre en pantalla del remitente. |
| `senderPhotoURL` | `string` (opcional) | Foto de perfil del remitente. |
| `text` | `string` | Contenido del mensaje. |
| `type` | `string` | Tipo: `"text" \| "emoji" \| "system" \| "gift"`. |
| `status` | `string` | Estado: `"active" \| "deleted" \| "hidden"`. |
| `createdAt` | `timestamp` | Fecha de creación. |

#### C. Solicitudes de Micrófono: `/micRequests`
Lista de oyentes esperando turno para hablar en el escenario.
* **Document ID**: El mismo `userId` de quien realiza la solicitud (garantiza una solicitud a la vez).

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID de la solicitud (userId). |
| `roomId` | `string` | ID de la sala. |
| `userId` | `string` | ID del usuario solicitante. |
| `displayName` | `string` | Nombre en pantalla. |
| `username` | `string` (opcional) | Nombre de usuario. |
| `photoURL` | `string` (opcional) | Foto del usuario. |
| `status` | `string` | Estado: `"pending" \| "approved" \| "rejected" \| "cancelled"`. |
| `createdAt` | `timestamp` | Fecha de creación de la solicitud. |
| `updatedAt` | `timestamp` | Fecha de última actualización. |

#### D. Eventos de Regalo: `/giftEvents`
Historial de regalos enviados dentro de la sala de voz en la sesión activa.
* **Document ID**: Autogenerado.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID del evento. |
| `giftId` | `string` | ID del regalo de la colección `/gifts`. |
| `giftName` | `string` | Nombre del regalo. |
| `giftIconUrl` | `string` (opcional) | Emoji o URL del icono. |
| `senderId` | `string` | ID del remitente del regalo. |
| `senderName` | `string` | Nombre del remitente. |
| `receiverId` | `string` | ID de la persona en el micrófono que recibe el regalo. |
| `receiverName` | `string` | Nombre de quien recibe. |
| `roomId` | `string` | ID de la sala. |
| `quantity` | `number` | Cantidad de regalos. |
| `totalCoins` | `number` | Costo en monedas cobradas al remitente. |
| `totalDiamonds` | `number` | Diamantes acumulados por el receptor. |
| `createdAt` | `timestamp` | Fecha de envío. |

#### E. Bitácora de Moderación: `/moderationLogs`
Logs de acciones de kick/mute.
* **Document ID**: Autogenerado.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID del log. |
| `action` | `string` | Acción: `"mute" \| "unmute" \| "kick_mic" \| "kick_room"`. |
| `targetUserId` | `string` | ID del usuario afectado. |
| `targetName` | `string` | Nombre del usuario afectado. |
| `moderatorId` | `string` | ID del moderador que ejecutó la acción. |
| `reason` | `string` (opcional) | Motivo de la acción. |
| `createdAt` | `timestamp` | Fecha de ejecución. |
