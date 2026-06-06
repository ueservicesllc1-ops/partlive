# Arquitectura de Subidas a Backblaze B2 (Storage)

Este documento detalla el flujo de carga de archivos (fotos, videos, portadas) en PartyLiveApp utilizando URLs prefirmadas a través de un Backend Node.js.

## ¿Por qué usamos URLs Prefirmadas?
En una aplicación móvil, **nunca se deben guardar las claves secretas** de acceso a la base de datos o almacenamiento en el código (como el `B2_APPLICATION_KEY`). Si un usuario malintencionado descompila el APK, podría obtener la clave y borrar todos los archivos de la app o subir contenido pirata.

Para resolverlo, usamos una arquitectura de "firmado":
1. La app móvil le dice al Backend: "Soy el usuario XYZ y quiero subir una foto".
2. El Backend verifica su identidad y le pide permiso especial a Backblaze por 15 minutos.
3. El Backend le devuelve a la app una URL mágica segura.
4. La app usa esa URL para mandar el archivo directamente a Backblaze.

## Flujo Paso a Paso

1. **App Móvil:** `uploadProfilePhoto()` solicita una URL firmada a `/api/uploads/presign`.
2. **Backend:** Valida el token JWT de Firebase. Crea un registro en Firestore `uploads/{id}` con estado `pending`. Devuelve la URL firmada.
3. **App Móvil:** Usa la URL firmada para subir el blob (archivo físico) a Backblaze B2 S3 con una petición PUT HTTP estándar.
4. **App Móvil:** Si la subida HTTP responde OK, llama a `/api/uploads/{id}/confirm`.
5. **Backend:** Cambia el estado de la subida a `uploaded` y actualiza automáticamente el documento asociado en Firestore (ej. actualiza `users/{uid}` guardando el `photoURL`).
6. **App Móvil:** Refresca el contexto local del usuario para mostrar la foto.

## Errores Comunes

- **Error 401 Unauthorized:** El usuario no está logueado en Firebase o el token caducó.
- **Error: File too large:** El tamaño del archivo supera los límites definidos en `uploadRoutes.ts`.
- **Error 403 Forbidden en B2:** La URL firmada caducó (dura 15 min) o el `ContentType` de la petición no coincide exactamente con el que se especificó al pedir la firma.
- **La foto sube pero no aparece:** La subida se completó, pero la petición a `/confirm` falló o no se envió. Verifica tu conexión a internet durante el segundo paso.

## Probar en Local
1. Abre una terminal y navega a `backend/`.
2. Ejecuta `npm run dev` (el servidor iniciará en el puerto 4000).
3. En la app móvil, el `API_BASE_URL` apunta a `http://localhost:4000/api`. Si estás usando un emulador Android o la tablet conectada por USB, recuerda hacer el puente con: `adb reverse tcp:4000 tcp:4000`.
