# Admin Panel — PartyLiveApp

Documentación completa del panel de administración web para PartyLiveApp.

## Descripción General

El panel admin es una aplicación Next.js (App Router + TypeScript + Tailwind CSS) ubicada en la carpeta `admin/` del repositorio. Se conecta a:

- **Firebase Auth** (cliente) para autenticar al admin.
- **Firestore** (cliente) para lecturas seguras de datos.
- **Backend Express** (`partylive-production.up.railway.app` o `localhost:4000`) para acciones sensibles.

---

## Estructura de Archivos

```
admin/
  src/
    app/
      layout.tsx             ← Root layout con AdminAuthProvider
      page.tsx               ← Redirige a /dashboard
      login/page.tsx         ← Página de login
      dashboard/page.tsx     ← Dashboard con estadísticas
      users/
        page.tsx             ← Lista de usuarios
        [userId]/page.tsx    ← Detalle de usuario
      hosts/
        page.tsx             ← Lista de hosts
        applications/page.tsx ← Aprobación de solicitudes
      rooms/
        page.tsx             ← Lista de salas
        [roomId]/page.tsx    ← Detalle de sala
      lives/page.tsx
      reports/page.tsx
      wallets/page.tsx
      purchases/page.tsx
      payouts/page.tsx
      gifts/page.tsx
      banners/page.tsx
      events/page.tsx
      missions/page.tsx
      rankings/page.tsx
      settings/page.tsx
    components/
      auth/
        AdminAuthProvider.tsx  ← Estado de autenticación global
        ProtectedAdminRoute.tsx ← Guard de rutas
      layout/
        AdminSidebar.tsx
        AdminTopbar.tsx
        AdminLayout.tsx
      ui/
        Button.tsx, Card.tsx, Input.tsx, Select.tsx
        Textarea.tsx, Modal.tsx, Table.tsx, Badge.tsx
        StatCard.tsx, Extras.tsx
    lib/
      firebase.ts            ← Firebase client init
    services/
      apiClient.ts           ← HTTP client con Bearer token
      authService.ts         ← Login/logout Firebase
```

---

## Cómo Correr el Admin

```bash
# 1. Ir a carpeta admin
cd admin

# 2. Instalar dependencias
npm install

# 3. Configurar entorno (copiar y editar)
cp .env.example .env

# 4. Correr en desarrollo
npm run dev
# Abre: http://localhost:3001
```

### Variables de entorno `.env`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxx:android:xxx
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

> ⚠️ **NUNCA** colocar claves privadas de Firebase Admin SDK en el frontend. Solo usar las claves públicas del cliente.

---

## Cómo Correr el Backend

```bash
cd backend
npm install
npm run dev     # desarrollo con ts-node-dev
# o
npm run build && npm start    # producción
```

---

## Cómo Correr la App Android

```bash
cd ..    # raíz del proyecto
npm run android
```

---

## Cómo Crear el Primer Admin

> **Nunca crees un endpoint público para hacerse admin.**

### Pasos Manuales (Desarrollo):

1. Crea un usuario normal en la app móvil.
2. Ve a [Firebase Console → Firestore](https://console.firebase.google.com).
3. Navega a la colección `users` → busca el documento con el `uid` del usuario.
4. Edita el campo `role` y cámbialo de `"user"` a `"admin"`.
5. Guarda el cambio.
6. Ahora ese usuario puede iniciar sesión en el panel admin (`http://localhost:3001/login`).

---

## Roles Permitidos en el Admin

| Rol         | Acceso al Panel | Acciones de Solo Admin |
|-------------|-----------------|------------------------|
| `admin`     | ✅ Completo     | Cambiar roles, ajustar wallets, toda acción |
| `moderator` | ✅ Limitado     | Ver, reportes, suspender, aprobar hosts/payouts |
| `host`      | ❌ Bloqueado    | N/A |
| `user`      | ❌ Bloqueado    | N/A |

---

## Cómo Aprobar una Solicitud de Host

1. Ir a `/hosts/applications` en el panel admin.
2. Filtrar por estado "pending".
3. Revisar la información del solicitante.
4. Click en **Aprobar** → llama a `POST /api/host/admin/applications/:applicationId/approve`.
5. O click en **Rechazar** → abre modal para ingresar motivo → llama a `POST /api/host/admin/applications/:applicationId/reject`.

El sistema automáticamente actualiza el `role` del usuario a `"host"` y crea un `hostStats` document.

---

## Cómo Aprobar un Payout

1. Ir a `/payouts` en el panel admin.
2. Los payouts `pending` aparecen por defecto.
3. Click en **Aprobar** → llama a `POST /api/payouts/admin/:payoutId/approve`.
4. Una vez aprobado, cuando se procese el pago fuera de la app, click en **Marcar Pagado** → llama a `POST /api/payouts/admin/:payoutId/mark-paid`.
5. Para rechazar, click en **Rechazar** e ingresar notas → llama a `POST /api/payouts/admin/:payoutId/reject`.

---

## Cómo Hacer un Wallet Adjustment

1. Ir a `/users` → buscar el usuario.
2. Click en **Ver** para ir al detalle.
3. Click en **Ajustar Wallet**.
4. Seleccionar: Moneda (coins/diamonds), Dirección (credit/debit), Cantidad, Motivo.
5. Click **Aplicar Ajuste** → llama a `POST /api/admin/users/:userId/wallet-adjustment`.
6. Se crea automáticamente una `walletTransaction` de tipo `adjustment` y un `adminLog`.

---

## Cómo Revisar Admin Logs

Los logs se almacenan en la colección Firestore `adminLogs`:

```
adminLogs/{logId}
  ├── adminId       ← UID del admin que realizó la acción
  ├── action        ← Tipo: wallet_adjustment, suspend_user, etc.
  ├── targetType    ← user | room | live | report | gift | payout
  ├── targetId      ← ID del recurso afectado
  ├── description   ← Descripción legible
  ├── metadata      ← Datos adicionales (JSON)
  └── createdAt     ← Timestamp
```

Para consultarlos, ve a Firebase Console → Firestore → `adminLogs`.

---

## Endpoints Backend Admin

| Método | Ruta | Descripción | Rol Requerido |
|--------|------|-------------|---------------|
| GET | `/api/admin/summary` | Estadísticas del dashboard | Admin/Moderator |
| POST | `/api/admin/users/:userId/wallet-adjustment` | Ajuste manual de wallet | Admin |
| POST | `/api/admin/users/:userId/suspend` | Suspender usuario | Admin/Moderator |
| POST | `/api/admin/users/:userId/reactivate` | Reactivar usuario | Admin/Moderator |
| POST | `/api/admin/users/:userId/verify` | Verificar usuario | Admin/Moderator |
| POST | `/api/admin/users/:userId/unverify` | Quitar verificación | Admin/Moderator |
| POST | `/api/admin/users/:userId/role` | Cambiar rol | Admin |
| POST | `/api/admin/rooms/:roomId/close` | Cerrar sala | Admin/Moderator |
| POST | `/api/admin/rooms/:roomId/suspend` | Suspender sala | Admin/Moderator |
| POST | `/api/admin/lives/:liveId/end` | Finalizar live | Admin/Moderator |
| POST | `/api/admin/lives/:liveId/suspend` | Suspender live | Admin/Moderator |
| GET | `/api/admin/reports` | Listar reportes | Admin/Moderator |
| POST | `/api/admin/reports/:reportId/status` | Actualizar estado de reporte | Admin/Moderator |
| GET | `/api/admin/gifts` | Listar regalos | Admin/Moderator |
| POST | `/api/admin/gifts` | Crear regalo | Admin |
| PATCH | `/api/admin/gifts/:giftId` | Editar regalo | Admin |

---

## Colecciones Firestore Usadas por el Admin

| Colección | Uso |
|-----------|-----|
| `users` | Lista y detalle de usuarios |
| `wallets` | Balance de coins/diamonds |
| `walletTransactions` | Historial de transacciones |
| `hostApplications` | Solicitudes de host |
| `hostStats` | Stats de hosts aprobados |
| `hostPayouts` | Solicitudes de retiro |
| `rooms` | Salas de audio |
| `rooms/{id}/members` | Miembros de una sala |
| `rooms/{id}/messages` | Chat de una sala |
| `lives` | Transmisiones en vivo |
| `reports` | Reportes de usuarios |
| `gifts` | Catálogo de regalos |
| `adminLogs` | Logs de acciones admin |

---

## Seguridad

- El panel admin **nunca** expone service account keys, claves B2, ni credenciales de Google Play.
- Todas las acciones sensibles van por **backend API** con validación de `Firebase ID Token`.
- El backend verifica el token y luego consulta `users/{uid}.role` antes de permitir operaciones.
- Cada acción sensible crea un registro en `adminLogs`.
- El `requireAdmin` middleware rechaza con `403` si el rol no es `admin`.
- El `requireAdminOrModerator` middleware rechaza con `403` si el rol no es `admin` ni `moderator`.
