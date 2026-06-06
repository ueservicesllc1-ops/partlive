# Sistema de Billetera Interna (Wallet System) - PartyLiveApp

Este documento describe la arquitectura, el diseño de datos, los flujos y las consideraciones de seguridad para el sistema de billetera interna en PartyLiveApp.

---

## 1. Concepto de Monedas vs Diamantes

La economía interna de PartyLiveApp se divide en dos tokens virtuales con propósitos y reglas distintas:

1. **Coins (Monedas) 🪙**:
   - **Propósito**: Son adquiridas por los usuarios mediante compras en la app (Google Play Billing en el futuro) o como recompensas (bonos diarios/misiones).
   - **Uso**: El usuario las gasta exclusivamente para enviar regalos virtuales a hosts u otros usuarios en salas de voz y lives.
   - **Retirabilidad**: **No se pueden retirar** ni convertir en dinero real.

2. **Diamonds (Diamantes) 💎**:
   - **Propósito**: Son el valor recibido por un usuario/host al recibir regalos virtuales.
   - **Cálculo**: Cuando un emisor envía un regalo de $C$ monedas, el receptor recibe $D$ diamantes (generalmente una tasa del 50%, ej. un regalo de 10 monedas genera 5 diamantes).
   - **Uso**: Representan las ganancias acumuladas.
   - **Retirabilidad**: En el futuro, los hosts validados podrán convertir diamantes acumulados en dinero real (payouts).

---

## 2. Estructura de Datos en Firestore

El sistema está diseñado de forma auditable utilizando tres colecciones principales en Firestore:

### A. Colección `wallets/{userId}` (Billetera Principal)
Es el documento central de balances para cada usuario.
```typescript
interface Wallet {
  id: string; // userId
  userId: string;
  coins: number;
  diamonds: number;
  lifetimeCoinsPurchased: number;
  lifetimeCoinsSpent: number;
  lifetimeDiamondsEarned: number;
  lifetimeDiamondsWithdrawn: number;
  pendingDiamonds: number;
  lockedDiamonds: number;
  status: 'active' | 'locked' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### B. Colección `walletTransactions/{transactionId}` (Historial Auditable)
Toda alteración en el saldo de un usuario debe generar un registro de transacción inmutable para fines de auditoría.
```typescript
interface WalletTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'gift_sent' | 'gift_received' | 'reward' | 'daily_bonus' | 'mission_reward' | 'adjustment' | 'withdrawal' | 'refund';
  direction: 'credit' | 'debit';
  currencyType: 'coins' | 'diamonds';
  amount: number;
  balanceAfter: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'reversed';
  description?: string;
  relatedUserId?: string; // ej. el receptor o emisor del regalo
  relatedRoomId?: string;
  relatedLiveId?: string;
  relatedGiftId?: string;
  relatedGiftEventId?: string;
  relatedPurchaseId?: string;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### C. Colección `coinPackages/{packageId}` (Catálogo de Paquetes)
Define los paquetes de monedas disponibles para su compra en la app.
```typescript
interface CoinPackage {
  id: string;
  title: string;
  coins: number;
  bonusCoins: number;
  priceUsd: number;
  productId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 3. Caché y Fuente de Verdad

- **Fuente de Verdad**: El balance principal reside en la colección `wallets/{userId}`.
- **Caché en Perfil**: Para optimizar el rendimiento y evitar lecturas redundantes en la UI rápida (como el Home o el Header), el documento del usuario en `users/{uid}` mantiene copias de `coins` y `diamonds`.
- **Regla de Sincronización**: Al procesar transacciones en el backend, la billetera y el caché del perfil del usuario se actualizan **atómicamente en una única transacción de base de datos**.

---

## 4. Seguridad y Centralización en el Backend

### ¿Por qué la Wallet debe vivir en el Backend?
Permitir que el cliente móvil realice escrituras directas sobre balances en Firestore es un **riesgo crítico de seguridad**. Un cliente vulnerado podría inyectarse saldo de monedas o diamantes de forma ilícita.

Por ende:
1. **Firestore Rules bloquean toda escritura** directa desde SDKs móviles clientes en `wallets` y `walletTransactions`.
2. Las transacciones de recarga de saldo o consumo de monedas para regalos son **procesadas estrictamente por el Backend Node/Express (Firebase Admin SDK)** en el entorno del servidor tras validar firmas, recibos u operaciones.

---

## 5. Endpoints de Backend Desarrollados

El servidor Express expone las siguientes rutas bajo `/api/wallet` y `/api/gifts`:

1. **`GET /api/wallet/me`**:
   - Obtiene la billetera del usuario autenticado de forma segura.
2. **`GET /api/wallet/transactions`**:
   - Devuelve las transacciones auditadas del usuario autenticado.
3. **`POST /api/wallet/dev/credit-coins`** y **`POST /api/wallet/dev/credit-diamonds`**:
   - Acredita saldo de prueba en desarrollo. Bloqueado con `403 Forbidden` si `NODE_ENV === 'production'`.
4. **`POST /api/gifts/room/send`**:
   - Endpoint transaccional seguro para enviar regalos reales debitando monedas al emisor y acreditando diamantes al receptor.

---

## 6. Guía de Pruebas Manuales (Tablet Samsung por USB)

### Ejecución de Servicios
1. Ejecuta el servidor backend:
   ```bash
   cd backend
   npm run dev
   ```
2. Ejecuta la app en la tablet:
   ```bash
   npm run android
   ```

### Casos de Prueba

| ID | Escenario | Pasos | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **T1** | Creación Automática de Billetera | Inicia sesión con una cuenta nueva en la app. Abre Firestore. | Se crea automáticamente un documento en `wallets/{uid}` con balance en 0. |
| **T2** | Herramientas de Desarrollo | Dirígete a la pestaña **Billetera** en la app. Toca el botón **"+10k Monedas"** en la sección amarilla de desarrollo. | El saldo se actualiza a `10,000` monedas de forma reactiva e instantánea en el Header y en la pantalla. |
| **T3** | Historial de Transacciones | Realiza la acreditación dev y revisa el listado inferior en la Billetera. | Aparece el registro *"Credit dev coins"* con un valor de `+10,000` en verde y fecha actual. |
| **T4** | Compra Simulada | Presiona el botón de precio en cualquiera de los paquetes de monedas mostrados. | Se despliega una alerta aclarando que las compras reales se implementarán con Google Play Billing. |
| **T5** | Catálogo de Regalos (Mock) | Entra a una sala de voz y presiona **"Regalo"** en la barra inferior. Selecciona un destinatario y el regalo "Rose" (10 coins). Con `GIFT_WALLET_MODE = 'mock'`. | Se envía el regalo, aparece el banner en el chat y el saldo local no disminuye. |
| **T6** | Regalo con Wallet Real (Backend) | Cambia `GIFT_WALLET_MODE = 'backend'` en `src/constants/giftConfig.ts`. Recarga saldo y envía un regalo. | El saldo de monedas disminuye en el emisor, se incrementan los diamantes en el receptor y se generan logs de débito/crédito en Firestore. |
