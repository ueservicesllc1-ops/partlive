This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods- Base de código estructurada con TypeScript
- Integración de Firebase Authentication y AuthContext

## 🗄️ Firestore Data Model (Fase de Desarrollo)
PartyLiveApp cuenta con una arquitectura de base de datos altamente escalable en Firestore, separando la información en las siguientes colecciones principales:
- `users`: Perfiles de usuario y subcolecciones privadas (billetera, notificaciones).
- `rooms` & `lives`: Salas de chat de voz y streaming de video.
- `games` & `gifts`: Catálogos de activos y juegos gestionados por administradores.
- `wallets` & `walletTransactions`: Gestión económica segura de monedas y diamantes.
- Entidades sociales: `follows`, `blocks`, `reports`, `rankings`.

### 🎙️ Salas de Voz en Tiempo Real con LiveKit
El sistema de salas de voz integra **Firestore** para los metadatos, chat en vivo y roles, y **LiveKit Server (WebRTC)** auto-hospedado para la distribución de audio real.

#### 1. Iniciar Servidor LiveKit (Docker)
Encuentra la IP local de tu PC y configura el archivo `livekit.yaml`. Luego, ejecuta el contenedor:
```powershell
# En Windows PowerShell
docker run --rm -d --name livekit-server -p 7880:7880 -p 7881:7881 -p 50000-50100:50000-50100/udp -v "${PWD}/livekit.yaml:/livekit.yaml" livekit/livekit-server --config /livekit.yaml
```
*Ver guía detallada en [docs/livekit-self-hosted.md](file:///e:/Chaton/docs/livekit-self-hosted.md).*

#### 2. Iniciar Backend (Servidor de Tokens Express)
1. Navega a `backend/` y configura el archivo `.env` con tus claves de Firebase y las credenciales de Livekit (`LIVEKIT_API_KEY=devkey` y `LIVEKIT_API_SECRET=devsecret`).
2. Levanta el servidor:
```bash
npm run dev
```

#### 3. Iniciar la App Móvil (Android)
1. Actualiza `src/config/livekit.ts` con la IP local de tu PC.
2. Ejecuta:
```bash
npm run android
```

### 🛠️ Cómo sembrar datos de prueba (Seed)
1. Ejecuta la aplicación en modo desarrollo (`npm start`).
2. Ve a la pantalla principal (Home).
3. Desliza hacia el final y presiona el botón rojo **"Seed Test Data"**.
4. Se generarán automáticamente regalos, juegos, misiones y salas base en Firebase.

> ⚠️ **Advertencia de Seguridad:** Actualmente el proyecto utiliza reglas de Firestore en "Modo de Prueba". Antes de salir a producción, se DEBE aplicar el borrador ubicado en `firebase/firestore.rules.draft` y restringir operaciones críticas de billetera para que solo puedan modificarse mediante Cloud Functions (backend).

## 🚀 Próximos Pasos
- Implementar Video Lives.

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
