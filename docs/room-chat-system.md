# Sistema de Chat en Tiempo Real de Salas de Voz

Este documento detalla la arquitectura, el flujo de datos y las mecánicas del sistema de chat integrado dentro de las salas de voz de PartyLiveApp.

---

## 1. Estructura de Mensajes en Firestore

Los mensajes viven en la subcolección `rooms/{roomId}/messages/{messageId}` con la siguiente firma técnica:

- `id`: ID único del documento.
- `roomId`: Referencia a la sala contenedora.
- `senderId`: ID del usuario remitente (vacío en mensajes tipo `system`).
- `senderName`: Nombre legible del remitente.
- `senderUsername`: Identificador único (username) del remitente.
- `senderPhotoURL`: Enlace a la imagen del avatar.
- `senderRole`: Rol en el momento del envío (`owner` | `host` | `moderator` | `speaker` | `listener`).
- `text`: Cuerpo del mensaje.
- `type`: Clasificación (`"text"` | `"emoji"` | `"system"` | `"gift"` | `"moderation"`).
- `status`: Estado de visualización (`"active"` | `"hidden"` | `"deleted"`).
- `metadata`: Objeto dinámico (ej: información del regalo mock).
- `createdAt`: Timestamp del servidor de Firebase.

---

## 2. Componentes del Chat (`src/components/chat/`)

- **`RoomChatPanel.tsx`**: Panel contenedor principal que encapsula la lista de mensajes, las barras de emojis rápidos, la entrada de texto y el menú de moderación.
- **`ChatMessageList.tsx`**: FlatList optimizada invertida. Muestra los mensajes más recientes al final y permite paginar hacia arriba para cargar mensajes antiguos.
- **`ChatMessageItem.tsx`**: Renderiza burbujas de chat específicas según el remitente y tipo de mensaje (sistema, regalos, emojis grandes o texto clásico con badges de rol).
- **`ChatInputBar.tsx`**: Caja de entrada de texto multilínea con contador de caracteres y ajuste automático de teclado.
- **`EmojiQuickBar.tsx`**: Barra interactiva de reacciones rápidas de un toque.
- **`ChatModerationMenu.tsx`**: Menú contextual activado mediante pulsación larga (Long Press) que permite:
  - Eliminar mensaje propio.
  - Reportar mensajes inapropiados (integra `reportsService`).
  - Bloquear localmente usuarios molestos (integra `blocksService`).
  - Ocultar mensajes de manera global (Admin tools).

---

## 3. Mecánicas Anti-Spam y Validación Local

Para asegurar un chat sano y fluido en dispositivos móviles:
1. **Límite de Frecuencia (Rate Limiting)**:
   - Los mensajes de texto están limitados a un máximo de **5 mensajes cada 10 segundos** por usuario.
   - Las reacciones rápidas (emojis) están limitadas a un máximo de **2 emojis cada 5 segundos**.
2. **Validación y Sanitización**:
   - Se eliminan espacios duplicados y saltos de línea consecutivos excesivos.
   - Se bloquea el envío de textos que contengan palabras inapropiadas definidas en `src/constants/blockedWords.ts`.
   - Se rechaza el envío de enlaces (URLs) por seguridad.
   - Límite estricto de **300 caracteres** por mensaje.

---

## 4. Instrucciones para Pruebas en Tablet Android

1. **Compilar y Desplegar:**
   ```powershell
   npm run android
   ```
2. **Prueba de Mensajería Normal:**
   Entra a cualquier sala de voz activa y escribe en el chat. Verifica que el mensaje se renderiza con tu nombre y el badge de rol correspondiente (`👑 Owner`).
3. **Prueba de Emojis Rápidos:**
   Pulsa los emojis flotantes en la barra inferior. Verás que aparecen como reacciones de mayor tamaño de forma instantánea.
4. **Prueba de Moderación:**
   Realiza una pulsación larga sobre cualquier mensaje del chat para abrir el menú de opciones. Si mantienes presionado un mensaje propio, verás la opción de eliminarlo. Si es de otro usuario, podrás reportarlo o bloquearlo.
