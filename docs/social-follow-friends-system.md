# Sistema Social, Seguidores y Amigos en PartyLiveApp

Este documento proporciona una guía detallada sobre la arquitectura, diseño de datos, configuración de índices, y métodos de verificación del sistema social implementado en PartyLiveApp.

## 1. Diseño del Sistema

El sistema social conecta a los usuarios mediante relaciones de seguimiento, amistades mutuas, actividades en la plataforma y controles de privacidad.

### Flujo de Seguimiento (Follow)
1. **Petición**: Un usuario A inicia una solicitud de seguimiento al usuario B enviando una petición HTTP al backend.
2. **Validación**: El backend comprueba que el objetivo exista, que no esté suspendido o baneado, y que no existan bloqueos entre ambos.
3. **Escritura Transaccional**:
   * Se crea o reactiva el documento `follows/{followerId_followingId}` con estado `'active'`.
   * Se incrementa el contador `followingCount` de A y `followersCount` de B en sus respectivos perfiles.
   * Se verifica si B ya seguía a A. En caso afirmativo, se crea un documento en la colección `friends/{userAId_userBId}` (ordenando los IDs alfabéticamente) con estado `'active'` e incrementando el contador `friendsCount` de ambos.
4. **Actividad y Notificaciones**:
   * Se añade una actividad a `socialActivities`.
   * Se registra una notificación de tipo `'follow'` en la subcolección de notificaciones de B.

---

## 2. Modelado de Datos (Esquema Firestore)

### Colección: `/follows`
* **Document ID**: `{followerId}_{followingId}`
* **Campos**:
  * `id` (string): Identificador compuesto.
  * `followerId` (string): ID de quien sigue.
  * `followingId` (string): ID de quien es seguido.
  * `status` (string): `'active' | 'removed' | 'blocked'`.
  * `createdAt` (timestamp).
  * `updatedAt` (timestamp).

### Colección: `/friends`
* **Document ID**: `{userAId}_{userBId}` (los IDs se guardan en orden alfabético para evitar duplicidad).
* **Campos**:
  * `id` (string).
  * `userAId` (string).
  * `userBId` (string).
  * `status` (string): `'active' | 'removed'`.
  * `createdAt` (timestamp).
  * `updatedAt` (timestamp).

### Colección: `/socialActivities`
* **Document ID**: Auto-generado.
* **Campos**:
  * `id` (string).
  * `userId` (string): ID del emisor.
  * `username` (string).
  * `userPhotoURL` (string).
  * `type` (string): `'follow' | 'start_live' | 'create_room' | 'send_gift' | ...`.
  * `title` (string).
  * `description` (string).
  * `actionType` (string).
  * `actionValue` (string).
  * `visibility` (string): `'public' | 'followers' | 'private'`.
  * `createdAt` (timestamp).

---

## 3. Endpoints del API de Backend

| Método | Ruta | Autenticación | Descripción |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/social/follow/:userId` | Requerida | Sigue a un usuario, actualiza contadores y notifica. |
| **POST** | `/api/social/unfollow/:userId` | Requerida | Deja de seguir a un usuario y remueve amistad. |
| **GET** | `/api/social/is-following/:userId` | Requerida | Comprueba si sigues a un usuario. |
| **GET** | `/api/social/:userId/followers` | Requerida | Lista de seguidores del usuario. |
| **GET** | `/api/social/:userId/following` | Requerida | Lista de seguidos por el usuario. |
| **GET** | `/api/social/friends` | Requerida | Lista de amigos mutuos del usuario logueado. |
| **GET** | `/api/social/:userId/activities` | Requerida | Lista de actividades públicas del usuario. |
| **GET** | `/api/social/feed/following` | Requerida | Feed de actividad de los usuarios seguidos. |
| **GET** | `/api/social/recommended` | Requerida | Algoritmo básico de usuarios recomendados. |

---

## 4. Controles de Privacidad del Perfil

Los usuarios pueden configurar sus preferencias de visibilidad en el menú **Privacidad**:
1. **profileVisibility**:
   * `'public'`: Cualquier usuario puede ver su perfil completo, seguidores y actividad.
   * `'followers'`: Solo sus seguidores aprobados pueden ver su lista de conexiones y actividad detallada.
   * `'private'`: Nadie puede ver sus listas ni actividad a menos que sea el propio usuario.
2. **showCountry**: Activa o desactiva la visibilidad del país.
3. **showOnlineStatus**: Oculta el estado verde de conexión en tiempo real.

---

## 5. Casos de Prueba Recomendados (Dos Usuarios)

Para probar la integración del sistema social:

1. **Prueba de Seguimiento Cruzado (Amistad)**:
   * Con la cuenta del **Usuario A**, entra al perfil de **Usuario B** y presiona **Seguir**. Verifica que el contador de seguidores de B aumente a 1.
   * Inicia sesión con la cuenta de **Usuario B**, entra al perfil de **Usuario A** y presiona **Seguir**.
   * Comprueba que en ambos perfiles ahora aparece el badge **🤝 Amigos** y el contador de `friendsCount` ha incrementado a 1.
2. **Prueba de Notificación**:
   * Cuando A sigue a B, verifica en la barra de notificaciones del Usuario B que llega una alerta con el texto: `"{displayName} comenzó a seguirte."`.
3. **Prueba de Privacidad**:
   * Configura la privacidad del Usuario B como `'followers'`.
   * Intenta entrar al perfil de B con la cuenta de A antes de seguirlo; verifica que aparece el candado y se restringe la lista de actividades.
