# Sistema de Karaoke - PartyLiveApp

Este documento describe la arquitectura, esquema de datos, integraciones de monetización y moderación del módulo de Karaoke para salas de voz y lives.

## 1. Arquitectura & Flujo

```mermaid
sequenceDiagram
    participant U as Usuario/Cantante
    participant H as Host/Moderador
    participant B as Backend API
    participant F as Firestore (Sync)
    participant W as Wallet System

    H->>B: Iniciar Sesión de Karaoke
    B->>F: Crear karaokeSessions (status: active)
    U->>B: Pedir Canción (song_id)
    B->>F: Agregar a karaokeQueue (status: pending)
    H->>B: Aprobar Turno (queue_item_id)
    B->>F: Actualizar queue item (status: approved)
    H->>B: Iniciar Presentación
    B->>F: Marcar 'singing', actualizar session.currentQueueItemId
    U->>F: Ver letras en tiempo real (LyricsViewer)
    U->>B: Enviar regalo virtual a cantante
    B->>W: Transacción de Coins -> Diamonds
    B->>F: Incrementar karaokePerformances.giftsReceivedDiamonds
    H->>B: Finalizar Presentación
    B->>F: Marcar 'completed', crear log de rendimiento
```

## 2. Estructura de Datos (Firestore)

### `karaokeSongs` (Colección Global)
Catálogo oficial y subido por usuarios:
* `id`: string
* `title`: string
* `artist`: string
* `language`: string
* `genre`: string
* `durationSeconds`: number
* `instrumentalUrl`: string
* `lyricsText`: string
* `status`: 'active' | 'inactive' | 'pending_review' | 'rejected'
* `playCount`: number
* `searchKeywords`: string[]

### `karaokeQueue` (Sub-colección / Colección Global)
Cola de reproducción por sesión:
* `id`: string
* `sessionId`: string
* `songId`: string
* `songTitle`: string
* `singerId`: string
* `singerName`: string
* `status`: 'pending' | 'approved' | 'singing' | 'completed' | 'skipped' | 'rejected'
* `position`: number
* `requestedAt`: timestamp

### `karaokePerformances`
Registro de rendimiento e ingresos históricos:
* `id`: string
* `sessionId`: string
* `singerId`: string
* `singerName`: string
* `songId`: string
* `giftsReceivedDiamonds`: number
* `beansGenerated`: number
* `completedAt`: timestamp

## 3. Integración de Monetización (Regalos)

Cuando se envía un regalo durante una sesión activa, el backend intercepta la operación en `giftWalletService.ts` para verificar si el destinatario está cantando actualmente. Si coincide, las estadísticas se asocian directamente con la performance activa, permitiendo rankings en tiempo real de los mejores cantantes monetizados del día.

## 4. Moderación y Seguridad

* **Control de Spam**: Los usuarios con estado `banned` o `suspended` no pueden encolar canciones.
* **Bloqueos directos**: Si un usuario está bloqueado por el anfitrión de la sala, no podrá interactuar con el sistema de karaoke dentro de esa sala.
* **Aprobación de Contenido**: El panel de administración Next.js permite auditar canciones subidas por los hosts antes de hacerlas públicas para toda la comunidad.
