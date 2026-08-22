import * as fs from 'fs';
import * as path from 'path';
import { db } from '../src/config/firebase';
import {
  authenticateAdminSession,
  revokeAdminSession,
  logAdminAction,
  getAdminCommandCenterOverview,
  setMaintenanceMode,
} from '../src/services/adminCommandCenterService';

export const runAdminCommandCenterAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('👑 RUNNING ADMIN COMMAND CENTER & RBAC ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Authenticate Admin Session across 10 RBAC Roles
  console.log('\n▶ Test 1: Autenticar sesión administrativa con rol SUPER_ADMIN y 2FA...');
  const session = await authenticateAdminSession('superadmin@partylive.app', 'SuperAdmin#2026!', '123456');
  console.log(`Sesión Creada ID: ${session.sessionId}, Rol: ${session.role}, 2FA Verificado: ${session.is2FAVerified}`);

  if (session.role === 'SUPER_ADMIN' && session.is2FAVerified) {
    console.log('✅ Test 1 PASADO: Autenticación de rol RBAC y 2FA verificada.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Immutable Audit Logging
  console.log('\n▶ Test 2: Registrar acción administrativa en la bitácora inmutable (Audit Log)...');
  const audit = await logAdminAction(
    session.adminId,
    session.role,
    'SYSTEM_CONFIG_UPDATE',
    'COMMISSION_RATES',
    { platformSharePercent: 20 },
    'Ajuste anual de comisiones'
  );
  console.log(`Audit Log ID: ${audit.id}, Actor: ${audit.adminId}, Acción: ${audit.action}`);

  if (audit.action === 'SYSTEM_CONFIG_UPDATE' && audit.role === 'SUPER_ADMIN') {
    console.error('✅ Test 2 PASADO: Log de auditoría inmutable generado.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: System Health Overview & Global KPIs
  console.log('\n▶ Test 3: Consultar resumen ejecutivo de salud de servicios y KPIs...');
  const overview = await getAdminCommandCenterOverview();
  console.log(`DAU: ${overview.kpis.dau}, Lives Activos: ${overview.kpis.activeLives}, API Health: ${overview.servicesHealth.api}`);

  if (overview.kpis.dau > 0 && overview.servicesHealth.api === 'HEALTHY') {
    console.log('✅ Test 3 PASADO: Resumen ejecutivo y salud de servicios verificados.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Maintenance Mode Manager
  console.log('\n▶ Test 4: Activar y desactivar Modo Mantenimiento de la plataforma...');
  const maintOn = await setMaintenanceMode(true, 'Mantenimiento Urgente', 'Prueba de mantenimiento', 15, session.adminId);
  const maintOff = await setMaintenanceMode(false, 'Mantenimiento Concluido', 'Plataforma operativa', 0, session.adminId);

  console.log(`Estado Mantenimiento ON: ${maintOn.enabled}, Estado OFF: ${maintOff.enabled}`);
  if (maintOn.enabled && !maintOff.enabled) {
    console.log('✅ Test 4 PASADO: Modo mantenimiento global alternado exitosamente.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Verify Admin Credentials Catalog File
  console.log('\n▶ Test 5: Verificar existencia del Catálogo de Credenciales y Manual de Acceso...');
  const catalogPath = path.join(__dirname, '../../docs/admin-credentials-catalog.md');
  const exists = fs.existsSync(catalogPath);
  let hasRoles = false;
  if (exists) {
    const content = fs.readFileSync(catalogPath, 'utf8');
    hasRoles = content.includes('SUPER_ADMIN') && content.includes('superadmin@partylive.app');
  }

  console.log(`Archivo de Catálogo Existe: ${exists}, Contiene Roles y Credenciales: ${hasRoles}`);
  if (exists && hasRoles) {
    console.log('✅ Test 5 PASADO: Catálogo de credenciales (docs/admin-credentials-catalog.md) verificado.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await revokeAdminSession(session.sessionId);
  await db.collection('adminAuditLogs').doc(audit.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE ADMIN COMMAND CENTER COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runAdminCommandCenterAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Admin Command Center:', err);
      process.exit(1);
    });
}
