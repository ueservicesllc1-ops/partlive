# Sistema de Perfiles de Usuario

PartyLiveApp cuenta con un sistema de perfiles complejo que interconecta Firestore, autenticación y almacenamiento de medios en B2.

## Estructura de `users/{uid}`

La colección almacena la fuente de la verdad para los usuarios.

### Campos Editables por el Usuario (Seguros)
- `displayName`: El nombre público.
- `username` / `usernameLowercase`: Nombre de usuario único para menciones y búsquedas.
- `bio`, `country`, `language`, `interests`: Datos sociales.
- `photoURL`: Avatar (cargado vía B2).

### Campos Protegidos (NO editables desde el cliente)
Estos campos JAMÁS deben modificarse desde `EditProfileScreen`. Deben estar protegidos en futuras *Firestore Security Rules*.
- `role`: (`user`, `host`, `admin`, `moderator`)
- `isHost`, `isVerified`
- `coins`, `diamonds` (Wallet)
- `level`, `xp` (Sistema de Gamificación)
- `followersCount`, `followingCount`, etc. (Contadores, deben modificarse atómicamente por funciones del lado del servidor).
- `status`

## Flujo de Edición de Perfil

1. El usuario ingresa a `EditProfileScreen`.
2. Las modificaciones locales se pasan a `updateEditableProfile` (`usersService.ts`).
3. El servicio filtra exclusivamente los campos permitidos y actualiza la fecha de `updatedAt`.
4. Si cambia el `username`, se dispara una transacción/batch interno que reserva el nuevo nombre en la colección `usernames`, libera el antiguo y lo asocia al usuario en `users`.

## Flujo de Subida de Foto (B2)

1. El usuario presiona "Cambiar Foto".
2. `pickProfileImage` (`imagePicker.ts`) abre la galería nativa mediante la librería de `react-native-image-picker`.
3. Valida el peso (Máximo 5MB) y el formato (JPG/PNG).
4. Pasa el URI local a `uploadProfilePhoto` (`uploadService.ts`).
5. El servicio pide una URL firmada a nuestro backend (`/api/uploads`), sube la foto binaria a Backblaze B2 de forma directa, y confirma con el backend.
6. El backend o el cliente (como respaldo) actualiza `photoURL` en la colección `users/{uid}`.
7. La UI refresca la información a través del `AuthContext`.

## Navegación

Las vistas `EditProfile` y `PublicProfile` se insertan directamente en el `RootStack`, lo que significa que "flotan" por encima de la barra de pestañas principal (bottom tabs) para dar una inmersión completa.

## Probando en Local
Para compilar y testear esto en Android, asegúrate de correr:
```bash
npx react-native run-android
```
Si el bundle no toma los cambios, borra el caché:
```bash
npx react-native start --reset-cache
```
