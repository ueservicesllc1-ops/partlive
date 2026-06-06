# Guía de Configuración de Firebase - PartyLiveApp (Android)

Esta guía detalla los pasos para configurar Firebase en la consola y compilar de forma limpia el proyecto en Android.

---

## 1. Configuración en la Consola de Firebase

1. Abre la [Consola de Firebase](https://console.firebase.google.com/).
2. Haz clic en **Agregar proyecto** (o selecciona uno existente) y llámalo `PartyLiveApp`.
3. Ve a **Configuración del proyecto** (ícono de engranaje).
4. En la pestaña *General*, baja hasta la sección *Tus apps* y haz clic en el ícono de **Android**.
5. Registra tu aplicación con los siguientes detalles:
   - **Nombre del paquete de Android:** `com.partylive.app` (Mismo `applicationId` definido en Gradle).
   - **Apodo de la app:** `PartyLive App Android`
6. Descarga el archivo **`google-services.json`**.
7. Coloca el archivo descargado en la siguiente ubicación de tu proyecto:
   `android/app/google-services.json`
   
   > **Nota:** ¡El archivo ya ha sido copiado y configurado con éxito en esta ubicación!

---

## 2. Habilitar Firebase Authentication

1. En el menú lateral izquierdo de Firebase Console, ve a **Autenticación (Authentication)**.
2. Haz clic en la pestaña **Método de inicio de sesión (Sign-in method)**.
3. Haz clic en **Agregar proveedor** y selecciona **Correo electrónico/Contraseña (Email/Password)**.
4. Habilita la opción principal y haz clic en **Guardar**.

---

## 3. Comandos de Compilación y Ejecución Limpia

Ejecuta los siguientes comandos para limpiar la caché de Gradle, reinstalar dependencias y arrancar la aplicación en tu tablet Android:

### Paso 1: Instalación y limpieza de dependencias
```bash
# Instalar los paquetes npm
npm install

# Limpiar compilaciones anteriores de Gradle
npm run android:clean
```

### Paso 2: Iniciar el servidor Metro
```bash
# Iniciar Metro bundler
npm start
```

### Paso 3: Arrancar la App en Android (Tablet por USB)
Asegúrate de que la tablet Samsung esté conectada y tenga habilitado el puerto reverso de Metro:
```bash
# Redirigir el puerto 8081 para Metro bundler
C:\Users\Freedom Labs\AppData\Local\Android\Sdk\platform-tools\adb.exe reverse tcp:8081 tcp:8081

# Lanzar compilación y arranque
npx react-native run-android
```
