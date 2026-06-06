# HomeScreen Arquitectura

La pantalla principal (`HomeScreen`) de PartyLiveApp es el centro neurálgico de la aplicación. Para evitar archivos monolíticos de miles de líneas, se ha implementado un patrón de abstracción agresiva.

## 1. Patrón Controlador (El Hook)

Todo el estado de la pantalla Home no se maneja en el componente, sino en **`useHomeData.ts`**.
Este Hook tiene una única responsabilidad:
1. Obtener la data paralela usando llamadas asíncronas (`Promise.all` cuando se conecte a Firebase).
2. Devolver la data en un formato fácil de consumir.
3. Proveer el método `refresh()` para el `RefreshControl`.

### 1.1 Estrategia de Fallback

Dado que el backend de Firestore puede estar vacío durante el desarrollo, `useHomeData` usa la función de utilidad `withFallbackData(remoteData, mockData)`.
Si la colección en Firebase está vacía o falla, el Home automáticamente inyectará datos hermosos definidos en `src/constants/mockData.ts`. Esto garantiza que la app siempre luzca vibrante y completa para presentaciones.

## 2. Componentes Modulares

La UI del Home está rota en **10 componentes independientes** ubicados en `src/components/home/`:

- `HomeGreeting`: Muestra nombre, avatar y wallet de AuthContext.
- `HomeBannerCarousel`: Carrusel horizontal de eventos promocionados.
- `QuickActions`: Botonera de acceso a Salas, Lives, Juegos, etc.
- `PopularRoomsSection`: Lista scrolleable de las mejores salas.
- `LiveStreamsSection`: Lista scrolleable de transmisiones con tags EN VIVO.
- `QuickGamesSection`: Grilla adaptable de juegos instantáneos.
- `DailyRankingSection`: Resumen del top 3 de anfitriones del día.
- `FeaturedHostsSection`: Avatares grandes recomendados para seguir.
- `DailyMissionsSection`: Misiones interactivas para gamificar la experiencia.
- `FloatingCreateButton`: FAB global para instanciar contenido.

## 3. Guía para agregar una nueva sección

1. Crear un componente en `src/components/home/NewSection.tsx`.
2. Actualizar `mockData.ts` si necesitas datos falsos para esta sección.
3. Actualizar `useHomeData.ts` para que exponga el array de tu nueva data.
4. Importar y colocar el componente en el `ScrollView` de `HomeScreen.tsx`.
