# Sistema de Salas de Voz - PartyLiveApp

Este documento describe la arquitectura técnica, la integración con Firestore, el flujo de llamadas de red y el uso de los componentes de UI creados para el sistema de salas de voz de PartyLiveApp (sin audio real).

---

## 1. Estructura de Datos en Firestore

Para habilitar un sistema colaborativo interactivo multiusuario, se diseñó la siguiente estructura en Firestore:

```
rooms/ (Colección Principal)
  ├── {roomId}/ (Documento de Sala)
        ├── members/ (Subcolección de Usuarios Conectados)
        │     └── {userId} (Datos del miembro de sala, rol, seatIndex, estado mute)
        ├── messages/ (Subcolección de Mensajes de Chat)
        │     └── {messageId} (Mensajes de texto, sistema y regalos mock)
        ├── micRequests/ (Subcolección de Solicitudes de Micrófono)
        │     └── {userId} (Petición pendiente de micrófono para subir al escenario)
        ├── giftEvents/ (Subcolección de Regalos enviados)
        └── moderationLogs/ (Historial de expulsiones y silencios de usuarios)
```

---

## 2. Roles y Reglas de Permisos

El sistema maneja cinco niveles de roles asignados a los usuarios dentro de la subcolección `/members`:

1. **Owner (Propietario / Creador):**
   - Puede encender/terminar la sala para todos.
   - Puede mutear/desmutear a cualquier miembro del escenario.
   - Puede bajar a cualquier usuario del escenario (asientos 1-8).
   - Puede designar anfitriones (hosts) o moderadores temporales.
   - Puede aprobar/rechazar solicitudes de micrófono de los oyentes.
   - Puede expulsar (kick) usuarios de la sala de chat.

2. **Host (Anfitrión):**
   - Permisos similares al owner excepto que no puede terminar la sala, transferir la propiedad ni expulsar a moderadores u owners.
   - Puede gestionar los micrófonos de la sala y aprobar solicitudes de turno.

3. **Moderator (Moderador):**
   - Puede silenciar (mute) a oyentes (listeners) y oradores (speakers).
   - Puede expulsar (kick) de la sala a usuarios comunes que violen las directrices de convivencia.
   - Puede aprobar/rechazar solicitudes de micrófono.

4. **Speaker (Orador):**
   - Ocupa un asiento de micrófono (de 0 a 7) en el escenario.
   - Puede hablar (silenciarse y desmutearse a sí mismo).
   - Puede elegir voluntariamente bajarse del escenario para volver a ser oyente.

5. **Listener (Oyente):**
   - Por defecto ingresa en este estado al unirse a la sala.
   - Puede escuchar el audio, escribir en el chat y enviar regalos.
   - No puede hablar en los micrófonos a menos que solicite turno y sea aprobado por un moderador, host o el dueño de la sala.

---

## 3. Flujos del Ciclo de Vida

### A. Crear una Sala
1. El usuario completa el formulario en `CreateRoomScreen`.
2. Se ejecuta `roomsService.createRoom()`.
3. Se crea el documento en `/rooms` con `status = "active"` e `isLive = true`.
4. Mediante una transacción/batch, se añade al creador a la subcolección `/members/{uid}` con el rol `owner` y se le asigna por defecto el asiento `0`.
5. Se navega automáticamente a la sala de chat `RoomDetailsScreen`.

### B. Entrar a una Sala
1. Al pulsar una tarjeta de sala en `RoomsScreen` o `HomeScreen`, se abre `RoomDetailsScreen` pasando el `roomId`.
2. El hook `useRoom` llama a `joinRoom()`.
3. Si el usuario no es miembro registrado, se añade un documento a `/members/{uid}` con rol `listener` y `seatIndex = undefined`.
4. El contador `listenersCount` se incrementa atómicamente por 1 en Firestore mediante una transacción.
5. Se activan las suscripciones en tiempo real a:
   - Datos de la sala (título, counts, estado).
   - Lista de miembros de la sala.
   - Mensajes de chat en vivo.
   - Solicitudes pendientes de micrófono (solo si el usuario tiene privilegios de moderación).

### C. Salir de una Sala
1. El usuario presiona "Salir".
2. Se ejecuta `leaveRoom()`.
3. Se elimina el documento en `/members/{uid}`.
4. Si el miembro era orador, se reduce `speakersCount` en 1; si era oyente, se reduce `listenersCount` en 1. Todo se calcula de manera segura mediante transacciones.
5. Se remueven todos los listeners de Firestore (onSnapshot) y se limpia el estado en memoria para evitar fugas de recursos.
6. Si el Propietario (`owner`) decide salir, la interfaz le da la opción de cerrar la sala definitivamente (`endRoom()`) para todos los participantes.

### D. Pedir y Asignar Micrófono
1. Un oyente presiona "Pedir Micro" en la barra de acciones.
2. Se añade un registro en `/micRequests/{uid}` con estado `pending`.
3. Los administradores ven la alerta visual en el botón de opciones/admin e ingresan a `MicRequestsPanel`.
4. Al presionar "Aceptar", se ejecuta `approveMicRequest()` que realiza lo siguiente:
   - Cambia el estado de la solicitud a `approved`.
   - Llama a `assignSeat()` para actualizar el documento del miembro en `/members` configurando su rol a `speaker` e inyectando el `seatIndex` seleccionado (0-7).
   - Elimina la solicitud de la base de datos.
   - Re-calcula atómicamente la cantidad de oradores y oyentes activos.

---

## 4. Próxima Fase: Conexión con SDK de Voz Real (Agora / Zego / LiveKit)

Cuando se integre el SDK de audio en tiempo real en la siguiente fase:

1. **Suscripción al Canal:**
   Al cargarse con éxito `useRoom` (después del callback de `joinRoom`), se inicializará el cliente del SDK (ej. Agora Engine) y se unirá al canal de voz utilizando el ID de la sala (`roomId`) como el nombre del canal.

2. **Roles de Audio en Tiempo Real:**
   - Si el rol del usuario cambia a `owner`, `host` o `speaker` (detectado a través del listener de miembros), se debe cambiar el rol de audio en el SDK a **Broadcaster** (Publicador de Audio) y activar el micrófono local.
   - Si el rol es `listener` o si el administrador silencia al usuario (`isMuted == true`), se debe cambiar el rol de audio en el SDK a **Audience** (Espectador) y silenciar la captura local de audio.

3. **Indicador de Habla (`isSpeaking`):**
   El SDK proporciona listeners de volumen en tiempo real (ej. `onAudioVolumeIndication`). Cuando se detecte volumen de un UID específico, se puede reflejar localmente cambiando el estado visual de la tarjeta de micrófono en `MicSeatsGrid` (el borde brillante ya está preparado para reaccionar a `member.isSpeaking`).

---

## 5. Instrucciones para Pruebas en Dispositivo Android/Tablet

1. **Asegurar dispositivo conectado:**
   Conecta la tablet Samsung por USB con depuración USB habilitada. Comprueba la conexión mediante:
   ```bash
   adb devices
   ```

2. **Iniciar Servidor de Desarrollo Metro:**
   ```bash
   npm start
   ```

3. **Compilar y Desplegar la Aplicación:**
   En otra consola, compila y sube la app a la tablet Samsung ejecutando:
   ```bash
   npm run android
   ```

4. **Flujo de pruebas sugerido:**
   - Abre la pestaña de salas en la tablet y crea una nueva sala con el botón flotante `+`.
   - Abre Firestore en la consola de Firebase para verificar que se creó el documento de sala y el miembro con rol `owner`.
   - Escribe mensajes en el chat de la sala para probar la reactividad instantánea.
   - Prueba las acciones rápidas del micrófono para simular los flujos de orador y oyente.
