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

---

## Detalle del Sistema de Juegos (`gameSessions`, `gameInvites`, `matchmakingRequests`)

### 1. Colección Principal: `/gameSessions`
Cada documento representa una sesión de juego activa o finalizada.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID de la sesión (auto-generado). |
| `gameId` | `string` | ID del juego en el catálogo. |
| `gameSlug` | `string` | Slug/tipo de juego (ej: `trivia`, `rps`). |
| `hostId` | `string` | ID del usuario anfitrión. |
| `status` | `string` | Estado: `"waiting" \| "ready" \| "playing" \| "finished" \| "cancelled"`. |
| `currentRound` | `number` | Ronda actual en curso. |
| `totalRounds` | `number` | Cantidad total de rondas planificadas. |
| `maxPlayers` | `number` | Límite máximo de jugadores. |
| `minPlayers` | `number` | Mínimo requerido para iniciar. |
| `playerCount` | `number` | Número actual de jugadores unidos. |
| `visibility` | `string` | Visibilidad de la sala: `"public" \| "private" \| "friends_only"`. |
| `inviteCode` | `string` (opcional) | Código alfanumérico de 6 letras para unirse a salas privadas. |
| `invitedUserIds` | `array<string>` (opcional) | Lista de IDs de usuarios expresamente invitados. |
| `matchmakingEnabled` | `boolean` | Flag para indicar si la sala acepta emparejamiento rápido. |
| `region` | `string` (opcional) | Región de juego. |
| `language` | `string` (opcional) | Idioma preferido. |
| `expiresAt` | `timestamp` (opcional) | Fecha en la que expira/limpia la sesión si no se inicia. |
| `gameState` | `map` | Objeto de estado interno propio de cada juego. |
| `createdAt` | `timestamp` | Fecha de creación del servidor. |

#### Subcolección: `/players`
* **Document ID**: `userId` del jugador.
Mapea a los participantes unidos a la sesión actual.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `userId` | `string` | ID de usuario del jugador. |
| `username` | `string` | Nombre de usuario único. |
| `avatarEmoji` | `string` (opcional) | Avatar emoji. |
| `score` | `number` | Puntaje acumulado del jugador. |
| `roundsWon` | `number` | Rondas ganadas. |
| `isReady` | `boolean` | Flag de listo para empezar. |
| `isHost` | `boolean` | Indica si es el anfitrión. |
| `isOnline` | `boolean` | Estado de conexión en la partida. |
| `joinedAt` | `timestamp` | Fecha de unión a la sesión. |

#### Subcolección: `/moves`
* **Document ID**: Auto-generado.
Registra cada movimiento de los jugadores para ser procesado por los motores locales.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID del movimiento. |
| `sessionId` | `string` | ID de la sesión. |
| `userId` | `string` | ID del jugador que hizo el movimiento. |
| `round` | `number` | Ronda a la que corresponde el movimiento. |
| `moveType` | `string` | Acción: `"answer" \| "roll" \| "pick" \| "mark"`. |
| `payload` | `map` | Datos específicos del movimiento. |
| `createdAt` | `timestamp` | Fecha de creación. |

---

### 2. Colección Principal: `/gameInvites`
Contiene las invitaciones directas enviadas entre usuarios.
* **Document ID**: Auto-generado.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID de la invitación. |
| `sessionId` | `string` | ID de la sesión de juego vinculada. |
| `gameId` | `string` | ID del juego en el catálogo. |
| `gameTitle` | `string` | Título legible del juego. |
| `fromUserId` | `string` | ID del usuario que envía la invitación. |
| `fromDisplayName` | `string` | Nombre del remitente. |
| `fromPhotoURL` | `string` (opcional) | Enlace de foto del remitente. |
| `toUserId` | `string` | ID del usuario que recibe la invitación. |
| `toDisplayName` | `string` (opcional) | Nombre del destinatario. |
| `status` | `string` | `"pending" \| "accepted" \| "declined" \| "expired" \| "cancelled"`. |
| `message` | `string` (opcional) | Mensaje personalizado adjunto. |
| `expiresAt` | `timestamp` | Fecha límite para responder (por defecto, +10 minutos). |
| `createdAt` | `timestamp` | Fecha de envío. |
| `updatedAt` | `timestamp` | Fecha de modificación del estado. |
| `respondedAt` | `timestamp` (opcional) | Fecha de aceptación o rechazo. |

---

### 3. Colección Principal: `/matchmakingRequests`
Registra las peticiones de emparejamiento activo de usuarios en espera de partida rápida.
* **Document ID**: Auto-generado o `userId` (para limitar a una petición activa).

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID de la petición (usualmente `userId` o auto-generado). |
| `userId` | `string` | ID del usuario que busca partida. |
| `gameId` | `string` | ID del juego en el catálogo. |
| `gameType` | `string` | Slug del juego. |
| `status` | `string` | `"searching" \| "matched" \| "cancelled" \| "expired"`. |
| `preferredPlayers` | `number` (opcional) | Cantidad de jugadores que prefiere. |
| `language` | `string` (opcional) | Idioma de preferencia. |
| `region` | `string` (opcional) | Región geográfica. |
| `skillLevel` | `string` | `"any" \| "beginner" \| "intermediate" \| "advanced"`. |
| `matchedSessionId` | `string` (opcional) | ID de la sesión a la que fue emparejado. |
| `createdAt` | `timestamp` | Fecha de creación del request. |
| `updatedAt` | `timestamp` | Fecha de última actualización. |
| `expiresAt` | `timestamp` | Expiración automática (ej: +5 minutos). |

---

## Detalle del Sistema de Monetización Tipo BIGO LIVE

### 1. Colección Principal: `/diamondPackages`
Lista los paquetes de diamantes disponibles para compra in-app.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID del paquete (ej: `diamonds_100`). |
| `title` | `string` | Título del paquete. |
| `diamonds` | `number` | Cantidad base de diamantes. |
| `bonusDiamonds` | `number` | Diamantes extra de bonificación. |
| `totalDiamonds` | `number` | Suma de diamonds + bonus. |
| `priceUsd` | `number` | Precio en USD (ej: `0.99`). |
| `googlePlayProductId` | `string` | ID del producto en Google Play. |
| `isActive` | `boolean` | Flag de disponibilidad. |
| `sortOrder` | `number` | Orden en la lista. |

### 2. Colección Principal: `/hostLevels`
Define los umbrales de requisitos mensuales y porcentajes de ganancia para cada rango de host.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID del nivel (`initial`, `silver`, `gold`). |
| `name` | `string` | Nombre del nivel. |
| `minFollowers` | `number` | Seguidores mínimos requeridos. |
| `minLiveHoursMonthly` | `number` | Horas de transmisión mínimas al mes. |
| `minActiveDaysMonthly` | `number` | Días activos mínimos al mes. |
| `minAverageViewers` | `number` | Audiencia media mínima. |
| `minDiamondsMonthly` | `number` | Valor de diamantes recibidos necesarios al mes. |
| `hostSharePercent` | `number` | Porcentaje de ganancias asignado al Host (ej: `45` significa 45%). |
| `platformSharePercent` | `number` | Porcentaje retenido por la plataforma (ej: `55`). |

### 3. Colección Principal: `/vipPlans` & `/vipSubscriptions`
Planes de suscripción VIP y el registro de suscripciones activas de los usuarios.

#### `/vipPlans` (Plan VIP)
- `id`: ID del plan (ej: `vip_bronze`).
- `name`: Nombre del plan.
- `priceUsd`: Precio en dólares.
- `durationDays`: Duración en días (normalmente `30`).
- `benefits`: Map con beneficios visuales y de prioridad.

#### `/vipSubscriptions` (Suscripciones VIP Activas)
- `id`: Auto-generado.
- `userId`: ID del usuario suscrito.
- `planId`: ID del plan vinculado.
- `status`: Estado (`"active" \| "expired" \| "cancelled"`).
- `expiresAt`: Fecha de vencimiento.

### 4. Colección Principal: `/fraudSignals` & `/userRisk`
Colecciones del módulo de seguridad y antifraude.

#### `/fraudSignals` (Señales de Fraude)
- `id`: Auto-generado.
- `userId`: ID del usuario que emite la señal.
- `type`: Tipo de señal (`multi_account`, `self_gifting`, `suspicious_ip`, etc.).
- `severity`: Severidad (`low`, `medium`, `high`, `critical`).
- `score`: Puntuación de riesgo de esta señal (ej: `40`).

#### `/userRisk` (Riesgo Consolidado del Usuario)
- `id`: Mapeado al `userId`.
- `riskScore`: Puntuación de riesgo acumulada (0-100).
- `riskLevel`: Nivel (`low`, `medium`, `high`, `critical`).
- `payoutBlocked`: Bloquea solicitudes de retiro si es `true`.
- `giftBlocked`: Bloquea envío de regalos.
- `walletLocked`: Congela la billetera del usuario.

### 5. Colección Principal: `/agencies`, `/agencyHosts`, `/agencyCommissions`
Colecciones para administración de agencias y liquidación de comisiones.

#### `/agencies` (Agencias de Reclutamiento)
- `id`: ID único de la agencia.
- `ownerId`: ID del usuario propietario.
- `name`: Nombre comercial.
- `commissionPercent`: Porcentaje de comisión sobre las ganancias del host (ej: `10` para 10%).
- `totalHosts`: Número de hosts afiliados.

#### `/agencyHosts` (Hosts Afiliados a Agencia)
- `id`: `agencyId_hostId`.
- `agencyId`: ID de la agencia.
- `hostId`: ID del host reclutado.
- `status`: `"active" \| "removed"`.

#### `/agencyCommissions` (Historial de Comisiones devengadas)
- `id`: Auto-generado.
- `agencyId`: ID de la agencia.
- `beansGenerated`: Beans totales generados en la donación.
- `commissionBeans`: Porción asignada a la agencia.

### 6. Colección Principal: `/platformRevenue`

Registros consolidados de rentabilidad de la plataforma.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | Período (ej: `2026-06-07`). |
| `diamondsSold` | `number` | Diamantes totales vendidos en el día. |
| `revenueUsd` | `number` | Ingresos directos en USD cobrados. |
| `platformBeansEquivalent` | `number` | Beans correspondientes al margen de plataforma. |
| `hostBeansPaid` | `number` | Beans distribuidos a los hosts. |
| `agencyCommissionBeans` | `number` | Beans pagados como comisión a las agencias. |
| `payoutUsd` | `number` | Fondos de retiro pagados en dólares. |
| `estimatedMarginPercent` | `number` | Margen porcentual neto. |

---

## Detalle del Sistema de Misiones Diarias y Recompensas

### 1. Colección Principal: `/missions`
Define cada reto o tarea que los usuarios pueden realizar para progresar y ganar premios.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID único de la misión. |
| `title` | `string` | Título legible. |
| `description` | `string` | Instrucciones claras de la misión. |
| `type` | `string` | `"daily" \| "weekly" \| "event" \| "host" \| "vip" \| "new_user"`. |
| `actionType` | `string` | Acción registrada a monitorear (ej: `"daily_login"`, `"send_message"`). |
| `targetValue` | `number` | Cantidad requerida de acciones para completar. |
| `rewardType` | `string` | `"xp" \| "diamonds" \| "beans" \| "badge" \| "event_points" \| "vip_trial" \| "gift_ticket"`. |
| `rewardAmount` | `number` | Cantidad del premio a otorgar. |
| `rewardMetadata` | `map` (opcional) | Configuración extra de la recompensa (ej: `badgeId`). |
| `isRepeatable` | `boolean` | Determina si la misión se reinicia en el siguiente periodo. |
| `maxClaimsPerUser` | `number` | Máximo de reclamos permitidos por usuario. |
| `requiresVip` | `boolean` (opcional) | Si la misión requiere membresía VIP activa. |
| `requiresHost` | `boolean` (opcional) | Si la misión está reservada a hosts calificados. |
| `eventId` | `string` (opcional) | ID de evento asociado si aplica. |
| `startsAt` | `timestamp` (opcional) | Fecha de inicio. |
| `endsAt` | `timestamp` (opcional) | Fecha de caducidad. |
| `status` | `string` | `"active" \| "inactive" \| "scheduled" \| "ended"`. |
| `sortOrder` | `number` | Control de orden de aparición en la interfaz. |

### 2. Colección Principal: `/userMissionProgress`
Registra el progreso acumulado de cada usuario para una misión en un periodo específico.
* **Document ID**: `{userId}_{missionId}_{periodKey}` (Garantiza unicidad por usuario, misión y periodo).

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID del progreso (`{userId}_{missionId}_{periodKey}`). |
| `userId` | `string` | ID del usuario. |
| `missionId` | `string` | ID de la misión asociada. |
| `missionType` | `string` | Tipo de misión. |
| `actionType` | `string` | Acción monitoreada. |
| `periodKey` | `string` | Clave del periodo (ej: `"2026-06-07"`, `"2026-23"`). |
| `progress` | `number` | Progreso acumulado. |
| `targetValue` | `number` | Meta de acciones. |
| `isCompleted` | `boolean` | Flag de finalización de tarea. |
| `isClaimed` | `boolean` | Flag de recompensa reclamada. |
| `claimedAt` | `timestamp` (opcional) | Fecha de reclamo de recompensa. |
| `rewardType` | `string` | Tipo de recompensa vinculada. |
| `rewardAmount` | `number` | Cantidad de la recompensa. |
| `createdAt` | `timestamp` | Fecha de inicialización. |
| `updatedAt` | `timestamp` | Fecha de última modificación. |

### 3. Colección Principal: `/missionRewards`
Auditoría y bitácora de cada reclamo e historial de transacciones de premios.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID único de la recompensa. |
| `userId` | `string` | ID del beneficiario. |
| `missionId` | `string` | ID de la misión asociada. |
| `progressId` | `string` | ID del progreso vinculado. |
| `rewardType` | `string` | Tipo de premio entregado. |
| `rewardAmount` | `number` | Cantidad entregada. |
| `status` | `string` | `"pending" \| "claimed" \| "failed" \| "reversed"`. |
| `description` | `string` (opcional) | Mensaje o motivo. |
| `adminNote` | `string` (opcional) | Razón de reversiones por moderadores. |
| `createdAt` | `timestamp` | Fecha de creación. |
| `claimedAt` | `timestamp` (opcional) | Fecha en la que fue cobrada la recompensa. |

---

## Detalle del Sistema de Búsqueda y Filtros (`recentSearches`, `trendingSearches`, `blockedSearchTerms`)

### 1. Colección Principal: `/recentSearches`
Almacena el historial de búsquedas recientes realizadas por cada usuario de forma privada.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID de la búsqueda reciente (auto-generado). |
| `userId` | `string` | ID del usuario que realizó la búsqueda. |
| `query` | `string` | Término buscado. |
| `filters` | `map` | Filtros aplicados al realizar la búsqueda. |
| `createdAt` | `timestamp` | Fecha de creación. |

### 2. Colección Principal: `/trendingSearches`
Almacena agregaciones públicas y contadores de los términos más buscados en la plataforma.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID del trending (auto-generado). |
| `query` | `string` | Término de búsqueda. |
| `count` | `number` | Contador de consultas realizadas. |
| `country` | `string` (opcional) | Filtro por región geográfica. |
| `language` | `string` (opcional) | Filtro por idioma. |
| `updatedAt` | `timestamp` | Fecha de la última actualización. |

### 3. Colección Principal: `/blockedSearchTerms`
Términos bloqueados por la moderación que devuelven resultados vacíos.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | ID de la regla (auto-generado). |
| `term` | `string` | Término ofensivo bloqueado. |
| `reason` | `string` | Motivo de la moderación. |
| `isActive` | `boolean` | Flag de disponibilidad. |
| `createdAt` | `timestamp` | Fecha de creación. |

