# Estructura de Navegación (PartyLiveApp)

El sistema de navegación de PartyLiveApp ha sido diseñado utilizando React Navigation 6 para soportar una jerarquía compleja típica de redes sociales (Tabs y Stacks).

## Tipos de Navegadores

La aplicación se compone de **3 capas principales**:

1. **RootStack (`AppNavigator.tsx`)**:
   Es el controlador maestro de sesiones. 
   - Si no estás autenticado -> `AuthStack`
   - Si entraste por Google y no tienes Username -> `SetupStack`
   - Si estás listo -> `MainStack`

2. **MainStack (`MainNavigator.tsx`)**:
   Es la pila global de la aplicación.
   Aquí viven TODAS las pantallas que **ocultan la barra de pestañas inferior** al abrirse, para dar una sensación de inmersión total (ej. Pantallas de Salas de Voz, Ajustes, Billetera, Rankings, Edición de Perfil).
   La pantalla principal de este Stack es el componente `MainTabs`.

3. **MainTabs (`MainTabs.tsx`)**:
   Es el Bottom Tab Navigator (🏠 🎙️ 📺 🎮 👤).
   Alberga las pantallas principales (Home, Rooms, Lives, Games, Profile).

## Rutas y Tipados (`routes.ts` & `navigationTypes.ts`)

Todas las rutas están extraídas como constantes para evitar strings quemados.
```typescript
navigation.navigate(MAIN_ROUTES.ROOM_DETAILS, { roomId: '123' });
```

### Agregando una pantalla nueva

1. Define la ruta en `routes.ts` y sus parámetros (si lleva IDs) en `navigationTypes.ts`.
2. Si la pantalla debe mostrar la barra inferior de pestañas, agrégala en `MainTabs.tsx`.
3. Si la pantalla NO debe mostrar la barra inferior (modo inmersivo/detalles), agrégala en `MainNavigator.tsx`.

## Botón de Retroceso en Android (Back Behavior)
La navegación de React Native Stack maneja esto automáticamente en Android. Presionar "Atrás" en un detalle como `RoomDetails` destruye la vista del detalle y te regresa al Tab donde estabas, manteniendo el estado de tu navegación.

## Testing
Al hacer cambios profundos en las rutas, el compilador de Typescript (`npx tsc`) te advertirá de cualquier navegación rota o mal tipada en los archivos `.tsx`. ¡Mantenlo pasando en verde!
