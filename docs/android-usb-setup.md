# Guía de Configuración Android USB para PartyLiveApp

Esta guía detalla el proceso completo para configurar tu tablet Android física a través de USB en Windows, desplegar la aplicación **PartyLiveApp** en tiempo real y solucionar los errores más comunes que puedas encontrar durante el desarrollo.

---

## 📱 1. Activar Opciones de Desarrollo en la Tablet

Para que tu computador pueda interactuar con la tablet Android, debes activar el modo de depuración:

1. Abre la aplicación **Ajustes** (o Configuración) de tu tablet.
2. Desplázate hasta el final y selecciona **Acerca del dispositivo** (o Acerca de la tablet / Información del sistema).
3. Busca la opción **Número de compilación** (Build Number).
4. Toca repetidamente **7 veces** sobre "Número de compilación". Verás una notificación emergente indicando: *"¡Ahora eres desarrollador!"* o *"El modo de desarrollo ya está activo"*.
5. Vuelve al menú principal de **Ajustes**.
6. Entra a la nueva sección **Opciones de desarrollador** (o Sistema -> Opciones para desarrolladores).
7. Activa la casilla **Depuración por USB** (USB Debugging).
8. Conecta la tablet a tu computadora usando un cable USB de buena calidad (asegúrate de que transmita datos, no solo energía).
9. Al conectarla, aparecerá una ventana emergente en la pantalla de tu tablet preguntando: *¿Permitir depuración USB?* con la huella digital de la clave RSA de tu PC. Marca **"Permitir siempre desde esta computadora"** y presiona **Aceptar**.

---

## 🛠️ 2. Comandos para Ejecutar en Windows

Abre una terminal (`PowerShell` o `CMD`) en la raíz del proyecto (`E:\Chaton`) y ejecuta:

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Limpieza de Gradle (Recomendado en la primera ejecución o tras cambiar configuraciones)
```bash
npm run android:clean
```

### Paso 3: Verificar conexión USB del dispositivo
```bash
adb devices
```
*Deberías ver una salida parecida a:*
```text
List of devices attached
3a94821a8d02    device
```
*(Si dice `unauthorized` o está vacío, lee la sección de solución de errores).*

### Paso 4: Iniciar el empaquetador Metro
```bash
npx react-native start
```

### Paso 5: Compilar y desplegar la App en tu tablet
*(En una nueva ventana de terminal)*
```bash
npx react-native run-android
```

---

## 🚨 3. Solución de Errores Comunes

### ❌ `adb` no reconoce la tablet (Lista de dispositivos vacía)
* **Causa**: Falta de controladores USB en Windows o cable incorrecto.
* **Solución**:
  1. Asegúrate de que el cable USB soporte transferencia de datos. Prueba en otro puerto USB de tu PC.
  2. Confirma que la tablet está en modo **Transferencia de Archivos (MTP)** o **PTP**, y no solo en "Solo Carga".
  3. Instala el controlador USB de Google desde el Android SDK Manager o descarga los drivers oficiales del fabricante de tu tablet (Samsung, Lenovo, Xiaomi, etc.).

### ❌ El dispositivo aparece como `unauthorized`
* **Causa**: La tablet no ha aceptado la huella digital de la clave RSA del PC.
* **Solución**:
  1. Desconecta y vuelve a conectar el cable USB.
  2. Mira la pantalla de la tablet; debería aparecer el popup solicitando permiso. Acéptalo.
  3. Si no aparece, ve a *Opciones de desarrollador* en la tablet y presiona **"Revocar autorizaciones de depuración USB"**. Luego reconecta el USB.
  4. Reinicia el servidor adb en la PC:
     ```bash
     adb kill-server
     adb start-server
     ```

### ❌ No aparece el permiso RSA
* **Causa**: Conflicto de firmas o adb inestable.
* **Solución**:
  1. Revoca autorizaciones en Opciones de desarrollador.
  2. Apaga y vuelve a encender "Depuración USB".
  3. Ejecuta `adb devices` en la PC para forzar la solicitud.

### ❌ Error Gradle Fails al compilar
* **Causa**: Problemas con la caché local de Gradle o incompatibilidad de dependencias.
* **Solución**:
  1. Ejecuta la limpieza de gradle:
     ```bash
     npm run android:clean
     ```
  2. Si el error persiste, elimina la caché local de gradle en tu computadora (carpeta `.gradle/caches` en el directorio de usuario de Windows) y vuelve a intentar.

### ❌ SDK de Android no encontrado (Android SDK not found)
* **Causa**: React Native no sabe dónde está instalado el SDK de Android.
* **Solución**:
  Crea un archivo llamado `local.properties` dentro de la carpeta `android/` en tu proyecto:
  * **Ruta del archivo**: `E:\Chaton\android\local.properties`
  * **Contenido** (ajusta el nombre de usuario de Windows si es diferente):
    ```properties
    sdk.dir=C\:\\Users\\Freedom Labs\\AppData\\Local\\Android\\Sdk
    ```
    *(Usa barras invertidas dobles `\\` y escapa los dos puntos `:` en Windows)*.

### ❌ `JAVA_HOME` no está configurado
* **Causa**: Las variables de entorno de Windows no apuntan a tu instalación de Java JDK.
* **Solución**:
  1. Instala JDK 17 (versión recomendada para React Native moderno).
  2. Abre *Variables de entorno* en Windows y crea una nueva variable del sistema llamada `JAVA_HOME`.
  3. Dale el valor del directorio de instalación, por ejemplo: `C:\Program Files\Java\jdk-17`
  4. Edita la variable `Path` del sistema y añade `%JAVA_HOME%\bin`.

### ❌ Metro no conecta con la app (Pantalla roja de error de conexión)
* **Causa**: La tablet no puede comunicarse con el empaquetador Metro que corre en tu PC en el puerto 8081.
* **Solución**:
  Redirige el puerto TCP de la PC a la tablet usando adb:
  ```bash
  adb reverse tcp:8081 tcp:8081
  ```
  *(Luego, agita la tablet o abre el menú de desarrollador en la app y presiona **"Reload"**)*.

### ❌ App abre en blanco / Pantalla blanca infinita
* **Causa**: Metro bundler no se ha iniciado o la IP local de la PC no es accesible.
* **Solución**:
  1. Cierra todas las terminales y corre `npx react-native start --reset-cache`.
  2. Asegúrate de que la PC y la tablet estén conectadas a la misma red Wi-Fi (aunque el USB redirige el tráfico con `adb reverse`, estar en la misma red facilita la conexión).

### ❌ Puerto 8081 ocupado (Port 8081 already in use)
* **Causa**: Otra instancia de node, McAfee, u otro software está usando el puerto por defecto de Metro.
* **Solución**:
  1. Encuentra el proceso ocupando el puerto:
     ```powershell
     Get-NetTCPConnection -LocalPort 8081
     ```
  2. Mata el proceso usando su PID:
     ```powershell
     Stop-Process -Id <PID> -Force
     ```
  3. O inicia Metro en otro puerto alternativo:
     ```bash
     npx react-native start --port 8082
     ```
     *(Luego compila usando: `npx react-native run-android --port 8082`)*.
