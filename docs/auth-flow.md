# Flujo de Autenticación de PartyLiveApp

La aplicación maneja el estado de autenticación a través de `AuthContext`, que sirve como punto central de verdad y orquesta la navegación.

## 1. Arquitectura de Navegación

`AppNavigator` decide qué flujo mostrar basado en tres estados:
1. `initializing`: Muestra `SplashScreen` mientras Firebase Auth verifica la sesión.
2. `isAuthenticated === false`: Muestra `AuthNavigator` (Login, Register, Forgot Password).
3. `isProfileCompleted === false`: Muestra `SetupNavigator` (ProfileSetupScreen) para forzar al usuario a elegir un `username` único.
4. Caso por defecto: Muestra `MainNavigator` (Home, Salas, Lives, etc.).

## 2. Colecciones en Firestore

- `users/{uid}`: Almacena los perfiles. La bandera `profileCompleted` determina si el usuario completó la configuración inicial.
- `usernames/{usernameLowercase}`: Almacena las reservas de nombre de usuario para garantizar exclusividad global en la plataforma.

## 3. Registro

1. El usuario ingresa Nombre Público, Username, Correo y Contraseña en `RegisterScreen`.
2. Se valida localmente el formato del `username` (sin espacios, caracteres especiales, longitud mínima).
3. Se verifica en Firestore (`usernames` collection) que el `username` esté disponible.
4. Se crea el usuario en Firebase Auth (`authService.signUpWithEmail`).
5. Se crea el documento `users/{uid}` con `profileCompleted: true`.
6. Al detectar el login automático, la app navega a `MainTabs`.

## 4. Inicio de Sesión (Email & Google)

1. El usuario se autentica en `LoginScreen`.
2. `ensureUserProfile` en `usersService` garantiza que exista un documento en la colección `users`. Si es un nuevo usuario (ej: entró por Google), crea un perfil mínimo con `profileCompleted: false` y un `username` en blanco.
3. El estado de la app reevalúa `isProfileCompleted`. Si es `false`, navega a `ProfileSetupScreen`.

## 5. Configuración de Perfil (Profile Setup)

Es una pantalla barrera para los usuarios autenticados que no tienen un `username` válido (usualmente porque se registraron mediante Google Sign-In). 

1. El usuario ingresa un `username`, biografía y país opcionales.
2. Se valida la unicidad del `username`.
3. Se invoca `completeUserProfile()`, que actualiza la colección `users` y `usernames`.
4. El Contexto se actualiza y la app navega automáticamente a `MainTabs`.

## 6. Recuperación de Contraseña

`ForgotPasswordScreen` envía un correo genérico de restablecimiento a través de `authService.sendPasswordResetEmail`.

## 7. Errores Amigables

Los códigos de error de Firebase (ej: `auth/email-already-in-use`) se interceptan mediante `getFriendlyAuthError` en `src/utils/firebaseAuthErrors.ts` y se transforman a mensajes entendibles en español para el UI.

## 8. Seguridad
- Las contraseñas se almacenan mediante Firebase Auth (encriptadas, inaccesibles desde el cliente).
- El control de escritura de `usernames` debe protegerse adicionalmente mediante Security Rules de Firestore para evitar secuestros de usernames en llamadas directas a la API.
