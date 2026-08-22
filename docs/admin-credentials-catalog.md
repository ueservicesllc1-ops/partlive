# CATÁLOGO DE CREDENCIALES Y MANUAL DE ACCESO AL ADMIN COMMAND CENTER

Este catálogo documenta las credenciales de acceso, roles RBAC y procedimientos de seguridad para el **Admin Command Center de PartyLive**.

---

## 🔑 Credenciales de Acceso por Rol (Entorno de Pruebas y Administración)

| Rol RBAC | Correo Electrónico (Admin Login) | Contraseña Temporal | Código 2FA de Prueba | Permisos Principales |
| :--- | :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | `superadmin@partylive.app` | `SuperAdmin#2026!` | `123456` | Acceso Global, Interruptores de Emergencia, Configuración de Sistema |
| **OPERATIONS_ADMIN** | `opsadmin@partylive.app` | `OpsAdmin#2026!` | `123456` | Monitoreo en Vivo, Gestión de Salas, Batallas PK y Eventos |
| **FINANCE_ADMIN** | `financeadmin@partylive.app` | `FinanceAdmin#2026!` | `123456` | Control de Payouts, Conciliación de Pagos, Comisiones y Ledger |
| **MODERATION_ADMIN** | `modadmin@partylive.app` | `ModAdmin#2026!` | `123456` | Cola de Reportes, Casos de Seguridad, Apelaciones y Banchos |
| **SUPPORT_ADMIN** | `supportadmin@partylive.app` | `SupportAdmin#2026!` | `123456` | Asistencia de Tickets, Ayuda de Cuentas (Sin datos bancarios) |
| **AGENCY_ADMIN** | `agencyadmin@partylive.app` | `AgencyAdmin#2026!` | `123456` | Reclutamiento de Agencias, Asignación de Hosts y Comisiones |
| **GROWTH_ADMIN** | `growthadmin@partylive.app` | `GrowthAdmin#2026!` | `123456` | Campañas de Referidos, Deep Links, Atribución y Experimentos A/B |
| **ANALYTICS_ADMIN** | `analyticsadmin@partylive.app` | `AnalyticsAdmin#2026!` | `123456` | KPIs Globales, DAU/MAU, Retención y Exportación de Métricas |
| **CONTENT_ADMIN** | `contentadmin@partylive.app` | `ContentAdmin#2026!` | `123456` | Catálogo de Música, Archivos de Karaoke, Clips y Regalos |
| **TECH_ADMIN** | `techadmin@partylive.app` | `TechAdmin#2026!` | `123456` | Estado de Servicios (LiveKit, Firebase, Payments) y Modo Mantenimiento |

---

## 🛡️ Instrucciones de Acceso

1. **Iniciar Sesión Administrativa**:
   - Navegue a la pantalla `AdminControlCenter` o ejecute una petición POST a `/api/admin-center/login`.
   - Ingrese el correo correspondiente al rol requerido y la contraseña temporal.
   - Proporcione el código 2FA de prueba (`123456`).

2. **Principio de Menor Privilegio (Least Privilege)**:
   - El personal de Soporte no posee permisos para aprobar Payouts ni ver credenciales de pago.
   - El personal de Moderación no posee permisos para modificar paquetes de Coins ni comisiones financieras.
   - Las correcciones financieras requieren solicitudes con justificación auditada (Maker-Checker).

3. **Seguridad e Inmutabilidad**:
   - Todas las acciones administrativas quedan registradas en la colección `adminAuditLogs`.
   - El modo de mantenimiento global solo puede ser activado por un `SUPER_ADMIN` o `TECH_ADMIN`.
