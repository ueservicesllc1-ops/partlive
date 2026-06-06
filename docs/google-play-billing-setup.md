# Configuración de Compras In-App en Android (Google Play Billing)

Este documento detalla los pasos necesarios para configurar y probar las compras in-app en PartyLiveApp usando la facturación de Google Play en el entorno de producción y desarrollo.

---

## 1. Configuración de Productos Consumibles en Google Play Console

Para que los usuarios compren paquetes de monedas, estos deben estar registrados como **Productos Integrados** en Google Play Console:

1. Ve a [Google Play Console](https://play.google.com/apps/publish).
2. Selecciona tu aplicación (`com.partylive.app`).
3. En el menú de la izquierda, navega a **Monetizar** -> **Productos** -> **Productos integrados (In-app products)**.
4. Haz clic en **Crear producto**.
5. Rellena los campos para cada uno de los siguientes paquetes correspondientes a las semillas de la base de datos:

| ID de Producto (SKU) | Nombre del Producto | Monedas (Base + Bonus) | Precio Base Sugerido |
| :--- | :--- | :--- | :--- |
| `coins_100` | 100 Coins | 100 | $0.99 USD |
| `coins_550` | 550 Coins | 500 + 50 | $4.99 USD |
| `coins_1200` | 1,200 Coins | 1000 + 200 | $9.99 USD |
| `coins_2800` | 2,800 Coins | 2500 + 300 | $19.99 USD |
| `coins_7000` | 7,000 Coins | 6000 + 1000 | $49.99 USD |
| `coins_15000` | 15,000 Coins | 12000 + 3000 | $99.99 USD |

6. Configura cada producto como **Consumible** (esto se maneja llamando a `finishTransaction` con `isConsumable: true` en la app tras ser acreditada por el backend).
7. Establece el precio y haz clic en **Guardar** y luego en **Activar**.

---

## 2. Cuenta de Servicio (Service Account) de Google Developer API

El backend Node.js requiere credenciales seguras de Google Cloud para validar tokens de compra (`purchaseToken`) mediante la Google Play Developer API (Android Publisher API v3).

### Paso 2.1: Crear la Cuenta de Servicio en Google Cloud Console
1. Ingresa a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea o selecciona el proyecto vinculado a tu aplicación de Google Play.
3. Ve a **IAM y administración** -> **Cuentas de servicio**.
4. Haz clic en **Crear cuenta de servicio**:
   - **Nombre**: `play-billing-validator`
   - **Rol**: `Propietario` (o rol limitado a API de Google Play si deseas granularidad).
5. Crea la cuenta y accede a la sección **Claves** (Keys).
6. Haz clic en **Agregar clave** -> **Crear clave nueva** -> Elige formato **JSON**.
7. Descarga el archivo JSON. Contiene tu `client_email` y `private_key`.

### Paso 2.2: Vincular la Cuenta en Google Play Console
1. En Google Play Console, ve a **Configuración de la cuenta** -> **API de Developer**.
2. Vincula tu proyecto de Google Cloud Console si no lo has hecho.
3. Verás la cuenta de servicio recién creada en la sección de cuentas asociadas.
4. Haz clic en **Gestionar permisos** y asegúrate de otorgarle permisos de visualización de datos de compras y monetización:
   - **Ver datos financieros, de pedidos e informes de cancelaciones**.
   - **Gestionar pedidos y suscripciones**.

---

## 3. Variables de Entorno del Backend (.env)

Configura las siguientes variables de entorno en el archivo `.env` del backend para habilitar la comunicación con la API de Google Play Developer:

```env
# Identificador de paquete de la aplicación en producción (Google Play)
GOOGLE_PLAY_PACKAGE_NAME=com.partylive.app

# Email de la cuenta de servicio
GOOGLE_PLAY_CLIENT_EMAIL=play-billing-validator@<tu-proyecto>.iam.gserviceaccount.com

# Clave privada de la cuenta de servicio (reemplazar saltos de línea \n literalmente en una sola línea)
GOOGLE_PLAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6...\n-----END PRIVATE KEY-----\n"
```

> [!NOTE]
> En entornos locales de desarrollo donde las variables `GOOGLE_PLAY_CLIENT_EMAIL` y `GOOGLE_PLAY_PRIVATE_KEY` no estén configuradas, el backend responderá automáticamente con **verificación de prueba (MOCK)** para facilitar las pruebas del flujo de base de datos y transacciones sin requerir credenciales de Google reales.

---

## 4. Configuración de Testers de Licencia

Para probar compras in-app reales sin coste real en tu tablet Samsung u otros dispositivos físicos:

1. En Google Play Console, navega a **Configuración** -> **Pruebas de licencia** (License testing).
2. Añade los correos de Gmail de los testers de licencia (las cuentas de Google vinculadas al Google Play Store en el dispositivo físico de prueba).
3. Establece la **Respuesta de licencia** a `RESPOND_WITH_APPROVED` para pruebas automáticas aprobadas, o usa tarjetas de prueba que simulan aprobaciones y declinaciones.
4. Asegúrate de añadir los mismos correos electrónicos a la lista de **Testers** de tu canal de pruebas cerrado/interno.
5. Descarga la compilación de la app desde el canal interno en la tablet Samsung de prueba para asociarla a la firma de Google Play Console.
