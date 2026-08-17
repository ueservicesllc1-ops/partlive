import { db } from '../src/config/firebase';
import { seedAdminConfig } from '../src/seeds/seedAdminConfig';
import {
  getAdminOverviewMetrics,
  requestTwoPersonApproval,
  approveTwoPersonAction,
  logAdminAuditAction,
} from '../src/services/adminControlService';

export const runAdminAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('⚙️ RUNNING ADMIN CONTROL CENTER & AUDIT ATOMIC TESTS');
  console.log('==================================================\n');

  const makerAdminId = 'test_maker_admin_' + Date.now();
  const checkerAdminId = 'test_checker_admin_' + Date.now();

  // Create Admin Users
  await db.collection('users').doc(makerAdminId).set({
    uid: makerAdminId,
    displayName: 'Admin Maker Test',
    role: 'admin',
    adminRole: 'FINANCE_ADMIN',
    status: 'active',
  });

  await db.collection('users').doc(checkerAdminId).set({
    uid: checkerAdminId,
    displayName: 'Admin Checker Test',
    role: 'admin',
    adminRole: 'SUPER_ADMIN',
    status: 'active',
  });

  console.log('✅ Datos de Prueba Creados.');

  // 1. Seed Config
  await seedAdminConfig();

  // Test 1: Get Overview Metrics
  console.log('\n▶ Test 1: Consultar métricas generales de BI y Operaciones...');
  const metrics = await getAdminOverviewMetrics();
  console.log(`Métricas: Usuarios=${metrics.totalUsers}, Hosts=${metrics.totalHosts}, Ingreso Bruto=$${metrics.grossRevenue}`);
  if (metrics.systemStatus === 'HEALTHY') {
    console.log('✅ Test 1 PASADO: Métricas obtenidas.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Request Two-Person Approval
  console.log('\n▶ Test 2: Solicitar aprobación de dos personas (Maker/Checker) para retiro grande...');
  const req = await requestTwoPersonApproval(makerAdminId, 'PAYOUT_APPROVAL', 250.0, 'payout_8821');
  console.log(`Solicitud Creada ID: ${req.id}, Estado: ${req.status}, Monto: $${req.payloadUsd}`);
  if (req.id && req.status === 'PENDING_CHECKER_APPROVAL') {
    console.log('✅ Test 2 PASADO: Solicitud pendiente de aprobación registrada.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Self-Approval Prevention
  console.log('\n▶ Test 3: Probar protección contra auto-aprobación del mismo administrador...');
  try {
    await approveTwoPersonAction(makerAdminId, req.id); // Maker tries to approve self
    console.error('❌ Test 3 FALLIDO: Se permitió auto-aprobación.');
  } catch (err: any) {
    console.log(`✅ Test 3 PASADO: Auto-aprobación rechazada correctamente (${err.message}).`);
  }

  // Test 4: Secondary Admin Approval & Audit Logging
  console.log('\n▶ Test 4: Aprobación exitosa por segundo administrador (Checker)...');
  await approveTwoPersonAction(checkerAdminId, req.id);

  const reqDoc = await db.collection('twoPersonApprovals').doc(req.id).get();
  const logsSnap = await db.collection('adminAuditLogs')
    .where('targetId', '==', req.id)
    .get();

  console.log(`Estado de Aprobación Final: ${reqDoc.data()?.status}, Registros de Auditoría creados: ${logsSnap.size}`);
  if (reqDoc.data()?.status === 'APPROVED' && logsSnap.size >= 2) {
    console.log('✅ Test 4 PASADO: Operación aprobada e inmutablemente auditada.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(makerAdminId).delete();
  await db.collection('users').doc(checkerAdminId).delete();
  await db.collection('twoPersonApprovals').doc(req.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE ADMIN CONTROL CENTER COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runAdminAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Admin:', err);
      process.exit(1);
    });
}
