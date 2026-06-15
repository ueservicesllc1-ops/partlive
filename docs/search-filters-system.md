# Sistema de Búsqueda y Filtros de PartyLiveApp

Este documento describe la arquitectura, el diseño de datos, los índices y las guías de pruebas para el sistema de búsqueda y filtros implementado en PartyLiveApp.

## 1. Diseño de Arquitectura (MVP)

Debido a que Firebase Firestore no admite de forma nativa búsquedas de texto completo ("full-text search"), búsquedas semánticas o consultas complejas con múltiples desigualdades sobre distintos campos, se implementa una solución de **búsqueda por rangos normalizados y keywords**.

### Flujo de Consulta

1. **Normalización**: El cliente normaliza el texto ingresado (removiendo acentos, convirtiendo a minúsculas y limpiando caracteres especiales) mediante `normalizeSearchText`.
2. **Consulta por Rangos (Prefijo)**: Se realiza una consulta Firestore con filtros de rango:
   * `usernameLowercase >= queryNormalized`
   * `usernameLowercase <= queryNormalized + '\uf8ff'` (el carácter `\uf8ff` es el último en la tabla Unicode UTF-8, lo que limita los resultados a aquellos que inicien exactamente con el prefijo provisto).
3. **Filtros Adicionales**: Se aplican filtros exactos en base a país, idioma, categoría, estado y rol.
4. **Agregación y Ordenamiento**: La app obtiene un límite de 20 registros por colección consultada, luego fusiona y ordena los resultados en el cliente (o backend si se usa el API REST) según la propiedad seleccionada (`popular`, `recent`, `viewers`, `followers`, `gifts`).

---

## 2. Modelado de Datos (Campos Normalizados)

Para optimizar las búsquedas, se agregaron/actualizaron los siguientes campos en Firestore:

### `users`
* `usernameLowercase` (string): Username en minúsculas.
* `displayNameLowercase` (string): Display Name en minúsculas.
* `searchKeywords` (array of strings): Prefijos combinados generados al guardar el perfil para permitir búsquedas eficientes por token.
* `country` (string, ISO: US, CO, MX, etc.).
* `language` (string: es, en, pt, fr).
* `isHost` (boolean).
* `isVip` (boolean).
* `status` (string: "active", "suspended", "banned").

### `rooms`
* `titleLowercase` (string).
* `country`, `language`, `category`, `status`, `isLive`, `listenersCount`, `giftsCount`.

### `lives`
* `titleLowercase` (string).
* `country`, `language`, `category`, `status`, `viewersCount`, `giftsCount`.

### `games`
* `titleLowercase` (string).
* `category`, `isActive`.

### `events`
* `titleLowercase` (string).
* `country`, `language`, `status`, `startsAt`.

---

## 3. Índices Recomendados en Firestore

Para evitar errores de consulta compuestos, debes crear los siguientes índices compuestos en Firebase Console:

### Colección `users`
* `status` (Asc) + `isHost` (Asc) + `usernameLowercase` (Asc)
* `status` (Asc) + `country` (Asc) + `language` (Asc) + `usernameLowercase` (Asc)

### Colección `rooms`
* `status` (Asc) + `isLive` (Asc) + `listenersCount` (Desc)
* `status` (Asc) + `category` (Asc) + `titleLowercase` (Asc)

### Colección `lives`
* `status` (Asc) + `category` (Asc) + `viewersCount` (Desc)
* `status` (Asc) + `country` (Asc) + `language` (Asc) + `titleLowercase` (Asc)

### Colección `recentSearches`
* `userId` (Asc) + `createdAt` (Desc)

### Colección `trendingSearches`
* `country` (Asc) + `language` (Asc) + `count` (Desc)

---

## 4. Plan de Migración a Motor de Búsqueda Externo

Cuando PartyLiveApp requiera búsquedas más potentes (búsqueda por voz, tolerancia a errores ortográficos, recomendaciones personalizadas), se recomienda migrar a:

1. **Algolia** (SaaS, rápido de integrar, hosting de pago).
2. **Meilisearch** / **Typesense** (Código abierto, self-hosted, alta performance).

### Flujo de Sincronización (Event-Driven)

Para la migración, se sugiere usar Firebase Cloud Functions en modo `onWrite`:

```javascript
exports.syncUserToSearchEngine = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    if (!change.after.exists) {
      // Eliminar de Algolia/Meilisearch
      return searchIndex.deleteObject(userId);
    }
    const userData = change.after.data();
    // Guardar/Actualizar
    return searchIndex.saveObject({
      objectID: userId,
      displayName: userData.displayName,
      username: userData.username,
      photoURL: userData.photoURL,
      country: userData.country,
      language: userData.language,
      followersCount: userData.followersCount,
      isHost: userData.isHost
    });
  });
```
