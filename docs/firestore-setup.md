# Guía de Configuración: Cloud Firestore en PartyLiveApp

Esta guía detalla los pasos para habilitar y probar Firestore en el entorno de desarrollo.

## 1. Habilitar Firestore en Firebase Console

1. Ve a la consola de Firebase: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Entra al proyecto de **PartyLiveApp**.
3. En el menú izquierdo, navega a **Compilación > Firestore Database**.
4. Haz clic en **Crear base de datos**.
5. **IMPORTANTE:** Selecciona una **Ubicación (Región)** lo más cercana posible a tu público principal (ej. `us-east1` o `us-central1`). *Nota: Esta decisión no se puede cambiar después.*
6. Configura las Reglas de Seguridad iniciales en **Modo de Prueba (Test Mode)**. Esto permitirá leer y escribir sin bloqueos por 30 días, ideal para la fase de desarrollo actual. En fases futuras, programaremos reglas estrictas.
7. Dale a **Habilitar**.

## 2. Estructura de Colecciones

El proyecto está preparado con constantes tipadas para las siguientes colecciones, ubicadas en la raíz de Firestore:
- `users`: Perfiles de usuarios (creados automáticamente al registrarse).
- `rooms`: Salas de voz (audio y chat).
- `lives`: Transmisiones en vivo de video.
- `games`: Juegos activos.
- `wallets`: Billeteras de usuarios.
- `walletTransactions`: Historial de recargas y gastos.
- `gifts`: Catálogo de regalos.
- `rankings`: Tablas de clasificación (diario, semanal, mensual).

## 3. Probar la creación automática de usuarios

1. Lanza la aplicación en modo desarrollo.
2. Cierra sesión si estabas como invitado.
3. Ve a la pantalla de "Register" y crea una nueva cuenta usando correo y contraseña.
4. Una vez redirigido a la pantalla principal, abre la consola de Firebase.
5. Ve a **Firestore Database** y comprueba que se creó la colección `users` y dentro existe un documento cuyo ID coincide con el `uid` del usuario. Sus datos (monedas, diamantes, nivel, rol) deberían estar en sus valores por defecto.

## 4. Usar la herramienta de Seed (Datos Iniciales)

Para poblar rápidamente Firestore con datos temporales (juegos y regalos base):
1. Inicia la app en tu entorno local (`__DEV__` es `true` por defecto cuando ejecutas el bundler).
2. En la parte inferior de la pestaña **Inicio (Home)**, encontrarás un recuadro rojo que dice **🛠 DEBUG ONLY 🛠**.
3. Presiona el botón **Seed Test Data**.
4. En la consola de Firebase deberías ver aparecer las colecciones `games` y `gifts` con datos de ejemplo.
*Nota: Este botón no será visible cuando compiles la app en modo Release para producción.*

## Comandos Útiles

- Para iniciar el bundler:
  ```bash
  npm start
  ```
- Para compilar e instalar en tu tablet:
  ```bash
  npx react-native run-android
  ```

---
> **Nota de Seguridad Futura:** Antes de lanzar la aplicación a producción real o permitir que usuarios reales usen saldo, deberemos actualizar la pestaña de **Reglas (Rules)** en la consola de Firestore para validar que un usuario solo pueda editar su propio perfil y que los pagos solo se puedan crear desde el backend seguro.
