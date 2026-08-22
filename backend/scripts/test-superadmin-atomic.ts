import { db } from '../src/config/firebase';
import {
  getExecutiveOverview,
  toggleKillSwitch,
  updateGlobalConfig,
  submitMakerCheckerRequest,
  approveMakerCheckerRequest,
} from '../src/services/superAdminService';

export const runSuperAdminAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('⚡ RUNNING SUPER ADMIN & PLATFORM CONTROL ATOMIC TESTS');
  console.log('==================================================\n');

  const adminMakerId = 'test_super_maker_' + Date.now();
  const adminCheckerId = 'test_super_checker_' + Date.now();

  await db.collection('users').doc(adminMakerId).set({ uid: adminMakerId, displayName: 'Super Admin Maker', role: 'super_admin' });
  await db.collection('users').doc(adminCheckerId).set({ uid: adminCheckerId, displayName: 'Finance Admin Checker', role: 'finance_admin' });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Fetch Executive Overview
  console.log('\n▶ Test 1: Consultar resumen ejecutivo y estado de salud de la plataforma...');
  const overview = await getExecutiveOverview();
  console.log(`DAU: ${overview.dau}, MAU: ${overview.mau}, Ingresos Hoy: $${overview.revenueTodayUsd}, Salud Infraestructura: ${overview.systemHealth}`);

  if (overview.dau > 0 && overview.systemHealth === 'HEALTHY') {
    console.log('✅ Test 1 PASADO: Resumen ejecutivo y estado de plataforma consultados.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Emergency Kill Switch & Audit Trail
  console.log('\n▶ Test 2: Activar interruptor de emergencia (KILL_PAYOUTS) y verificar auditoría...');
  const switchRes = await toggleKillSwitch('KILL_PAYOUTS', true, 'Sospecha de ataque de fraude en payouts', adminMakerId);
  console.log(`Interruptor: ${switchRes.featureKey}, Estado: ${switchRes.enabled}, Razón: ${switchRes.reason}`);

  const auditSnap = await db.collection('adminAuditLogs').where('target', '==', 'KILL_PAYOUTS').get();
  console.log(`Registros de Auditoría Encontrados: ${auditSnap.size}`);

  if (switchRes.enabled && auditSnap.size >= 1) {
    console.log('✅ Test 2 PASADO: Interruptor de emergencia activado con registro de auditoría.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Versioned Global Configuration
  console.log('\n▶ Test 3: Modificar configuración global con versionado (Module: Economy)...');
  const configRes1 = await updateGlobalConfig('economy', { coinRateUsd: 0.01 }, undefined, 'Ajuste inicial', adminMakerId);
  const configRes2 = await updateGlobalConfig('economy', { coinRateUsd: 0.012 }, undefined, 'Ajuste de tasa', adminMakerId);

  console.log(`Versión de Configuración Alcanzada: ${configRes2.version}`);
  if (configRes2.version === 2) {
    console.log('✅ Test 3 PASADO: Configuración global versionada correctamente.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Dual Control (Maker / Checker) Workflow
  console.log('\n▶ Test 4: Probar flujo de aprobación de doble control (Maker / Checker)...');
  const reqItem = await submitMakerCheckerRequest(
    adminMakerId,
    'FINANCIAL_ADJUSTMENT',
    { userId: 'u1', amountUsd: 100 },
    'Corrección de acreditación por fallo de pasarela'
  );

  console.log(`Solicitud Creada ID: ${reqItem.id}, Estado: ${reqItem.status}`);

  // Test self-approval restriction
  let blockedSelfApprove = false;
  try {
    await approveMakerCheckerRequest(reqItem.id, adminMakerId);
  } catch (err: any) {
    blockedSelfApprove = err.message.includes('DUAL_CONTROL_VIOLATION');
  }
  console.log(`¿Bloqueo de auto-aprobación por Maker exitoso?: ${blockedSelfApprove}`);

  // Legitimate Checker approval
  const approvedReq = await approveMakerCheckerRequest(reqItem.id, adminCheckerId);
  console.log(`Estado de Solicitud tras aprobación por Checker: ${approvedReq.status}, Aprobador: ${approvedReq.approverId}`);

  if (blockedSelfApprove && approvedReq.status === 'APPROVED') {
    console.log('✅ Test 4 PASADO: Control dual (Maker / Checker) verificado exitosamente.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(adminMakerId).delete();
  await db.collection('users').doc(adminCheckerId).delete();
  await db.collection('killSwitches').doc('KILL_PAYOUTS').delete();
  await db.collection('systemConfigs').doc('economy').delete();
  await db.collection('makerCheckerRequests').doc(reqItem.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE SUPER ADMIN COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runSuperAdminAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Super Admin:', err);
      process.exit(1);
    });
}
