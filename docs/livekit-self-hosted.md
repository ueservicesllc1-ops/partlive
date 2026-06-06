# Configuración de Servidor LiveKit Local y Docker

Esta guía explica detalladamente cómo levantar un servidor de LiveKit auto-hospedado (self-hosted) de forma local utilizando Docker en tu máquina de desarrollo.

---

## 1. Requisitos Previos

- Tener instalado **Docker Desktop** en tu computadora (Windows).
- Dispositivo Android (tablet/móvil) y PC conectados a la **misma red WiFi**.
- Conocer la **IP local de tu PC** en la red local (ej: `192.168.1.51`).
  - Puedes verificarla en Windows ejecutando `ipconfig` en PowerShell/cmd (busca la línea *IPv4 Address*).

---

## 2. Creación del Archivo de Configuración (`livekit.yaml`)

Crea un archivo llamado `livekit.yaml` en la carpeta raíz del backend o de tu proyecto para configurar los puertos de WebRTC y las claves de acceso de desarrollo.

```yaml
# livekit.yaml
port: 7880
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 50100
  use_external_ip: true
keys:
  devkey: devsecret
```

---

## 3. Levantar LiveKit con Docker en Windows (PowerShell)

Ejecuta el siguiente comando para correr el servidor de LiveKit en un contenedor Docker utilizando la configuración anterior.

> [!IMPORTANT]
> Asegúrate de reemplazar `%cd%` por `${PWD}` en PowerShell para montar correctamente el volumen del archivo de configuración.

```powershell
docker run --rm -d `
  --name livekit-server `
  -p 7880:7880 `
  -p 7881:7881 `
  -p 50000-50100:50000-50100/udp `
  -v "${PWD}/livekit.yaml:/livekit.yaml" `
  livekit/livekit-server `
  --config /livekit.yaml
```

---

## 4. Configurar el Firewall de Windows

Para permitir que el dispositivo Android se conecte al servidor que corre en tu PC, debes abrir los siguientes puertos en el Firewall de Windows:

- **Puerto 7880 (TCP)**: Conexión WebSocket HTTP inicial.
- **Puerto 7881 (TCP)**: Conectividad WebRTC fallback TCP.
- **Rango 50000-50100 (UDP)**: Transferencia de audio real de baja latencia mediante WebRTC.

Puedes abrirlos rápidamente ejecutando este comando en PowerShell como **Administrador**:

```powershell
New-NetFirewallRule -DisplayName "LiveKit Server TCP" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 7880,7881
New-NetFirewallRule -DisplayName "LiveKit Server UDP" -Direction Inbound -Action Allow -Protocol UDP -LocalPort 50000-50100
```

---

## 5. Configuración para Producción (VPS y Dominio)

Cuando pases a producción, debes seguir estas recomendaciones:

1. **Dominio Propio**: Asocia un subdominio (ej: `livekit.tudominio.com`) al servidor LiveKit.
2. **TLS / HTTPS**: Habilita certificados de seguridad con Let's Encrypt o Cloudflare. Las conexiones seguras son obligatorias para producción en navegadores y apps móviles (`wss://` y `https://`).
3. **Servidor TURN**: En redes móviles (donde los cortafuegos restringen el tráfico UDP directo), es necesario configurar un servidor TURN/STUN para enrutar el tráfico de audio. LiveKit tiene un servidor TURN integrado que requiere puertos dedicados (ej: `3478` y `443` para TURN sobre TLS).
4. **Claves de Seguridad**: Cambia `devkey` y `devsecret` por contraseñas robustas generadas aleatoriamente.
5. **Base de Datos**: Para múltiples servidores balanceados de LiveKit, configura un clúster utilizando **Redis** como intermediario de estado.
