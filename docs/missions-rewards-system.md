# Sistema de Misiones y Recompensas - PartyLiveApp

Este documento describe el flujo completo, reglas de negocio y mecanismos de seguridad del sistema de misiones y recompensas.

---

## 1. Reglas de Negocio
- **Economía de la App**: Las misiones no regalan diamantes ni beans ordinariamente. El principal incentivo es XP para subir de rango, medallas (badges), puntos de evento y tickets de regalos.
- **Tipos de Misión**:
  - `daily`: Misiones del día (resetean a las 00:00 UTC, YYYY-MM-DD).
  - `weekly`: Misiones de la semana (resetean los domingos a las 23:59 UTC, YYYY-WW).
  - `host`: Exclusivas para creadores y transmisiones.
  - `vip`: Reservadas a usuarios que posean VIP activo.
  - `event`: Vinculadas a un período o evento específico.
  - `new_user`: Única por cuenta.

- **Reclamación Segura**:
  - El cliente **no tiene permiso de escritura** directa sobre la colección `userMissionProgress` ni `missionRewards`.
  - El cliente llama al endpoint seguro `/api/missions/:progressId/claim`.
  - El backend valida el cumplimiento de la meta, los requisitos de VIP o Host y el límite de reclamaciones.

---

## 2. Prevención de Abuso (Anti-Abuse)
El servicio `missionAntiAbuseService.ts` implementa controles estrictos:
- **Baneo**: Usuarios suspendidos tienen prohibido acumular progreso y reclamar.
- **Límite por Minuto**: Máximo de 10 progresos incrementados por minuto para prevenir spam.
- **Join Room Rapid Fire**: Se restringe acumular progreso si el usuario se une a la misma sala varias veces en menos de 30 segundos.
- **Longitud Mínima de Mensaje**: Solo los mensajes de texto con más de 2 caracteres cuentan para el progreso de mensajes.
- **Verificación de Riesgo**: Puntuaciones de riesgo superiores a 80 en `/fraudSignals` bloquean inmediatamente las reclamaciones.

---

## 3. Guía de Pruebas

### Probar en Entorno de Desarrollo

#### 1. Iniciar los Servicios
```bash
# Correr el Backend (puerto 4000)
cd backend
npm run dev

# Correr el Panel de Administración (puerto 3000)
cd admin
npm run dev
```

#### 2. Poblar Misiones Iniciales
1. Abre el panel de administración en `http://localhost:3000/missions`.
2. Haz clic en **Sembrar Predeterminadas** para poblar la base de datos Firestore de forma automática.

#### 3. Simular Acciones de Usuario (Desarrollo)
En desarrollo, se puede simular el tracking usando el endpoint de test (requiere token de Firebase):
```bash
curl -X POST http://localhost:4000/api/missions/track \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"actionType": "daily_login", "amount": 1}'
```
*(También se pueden simular acciones como `join_room`, `send_message` o `play_game` del mismo modo).*

#### 4. Reclamar Recompensa
1. Consulta las misiones completadas en la app.
2. Presiona el botón **Reclamar Recompensa** para activar la acreditación de XP/tickets en el backend.
