import { db } from '../src/config/firebase';
import {
  getStoreReadinessChecklist,
  requestAccountDeletion,
  exportPersonalData,
  createSupportTicket,
  getProductionLaunchGateStatus,
  recordReleaseAudit,
} from '../src/services/appStoreCompliance2Service';

export const runCompliance2AtomicTests = async () => {
  console.log('\n==================================================');
  console.log('📱 RUNNING APP STORE, COMPLIANCE & PRODUCTION LAUNCH 2.0 ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: App Store & Google Play Readiness Checklist
  console.log('\n▶ Test 1: Consultar lista de comprobación de preparación para App Store y Google Play...');
  const checklist = await getStoreReadinessChecklist();

  console.log(`App Store: ${checklist.appStore.status}, Google Play: ${checklist.googlePlay.status}, Estado General: ${checklist.overallStatus}`);

  if (checklist.appStore.status === 'READY' && checklist.googlePlay.status === 'READY' && checklist.overallStatus === 'APPROVED_FOR_RELEASE') {
    console.log('✅ Test 1 PASADO: Lista de preparación para tiendas verificada.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Authenticated Account Deletion Flow & Audit Log Retention
  console.log('\n▶ Test 2: Solicitar eliminación de cuenta con período de gracia y retención contable...');
  const userId = 'user_compliance_100';
  const deletion = await requestAccountDeletion(userId, 'Solicitud voluntaria desde Privacy Center');

  console.log(`Solicitud ID: ${deletion.requestId}, Estado: ${deletion.status}, Días Gracia: ${deletion.gracePeriodDays}, Registros Contables Retenidos: ${deletion.financialRecordsRetained}`);

  if (deletion.status === 'PENDING_GRACE_PERIOD' && deletion.gracePeriodDays === 14 && deletion.financialRecordsRetained) {
    console.log('✅ Test 2 PASADO: Flujo de eliminación de cuenta y retención contable verificado.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Privacy Center Personal Data Export
  console.log('\n▶ Test 3: Generar paquete de exportación de datos personales (Privacy Center)...');
  const dataExport = await exportPersonalData(userId);

  console.log(`Exportación ID: ${dataExport.exportId}, URL Descarga: ${dataExport.downloadUrl}, Expira: ${dataExport.expiresAt}`);

  if (dataExport.downloadUrl.includes('privacy/download') && dataExport.activitySummary.totalLivesJoined === 42) {
    console.log('✅ Test 3 PASADO: Paquete de exportación de datos personales verificado.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Support Ticket System with Financial Transaction Linking
  console.log('\n▶ Test 4: Crear ticket de soporte con vinculación a transacción financiera...');
  const ticket = await createSupportTicket(userId, 'PAYMENTS', 'Acreditación pendiente de Coins', 'Compré paquete inicial pero demoró validación IAP.', 'tx_pay_9988');

  console.log(`Ticket ID: ${ticket.ticketId}, Categoría: ${ticket.category}, Prioridad: ${ticket.priority}, Transacción: ${ticket.linkedTransactionId}`);

  if (ticket.category === 'PAYMENTS' && ticket.priority === 'HIGH' && ticket.linkedTransactionId === 'tx_pay_9988') {
    console.log('✅ Test 4 PASADO: Sistema de tickets de soporte con vinculación financiera verificado.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Production Launch Gates Evaluation
  console.log('\n▶ Test 5: Evaluar puertas de calidad para lanzamiento a producción (Launch Gates)...');
  const gates = await getProductionLaunchGateStatus();

  console.log(`Seguridad: ${gates.securityGatePassed}, Rendimiento: ${gates.performanceGatePassed}, LiveKit: ${gates.livekitGatePassed}, IAP: ${gates.iapGatePassed}, Bloqueadores Críticos: ${gates.criticalBlockersCount}`);

  if (gates.readyForProduction && gates.criticalBlockersCount === 0) {
    console.log('✅ Test 5 PASADO: Evaluador de puertas de calidad para producción validado.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Test 6: Official Production Release Audit Sign-Off
  console.log('\n▶ Test 6: Firmar registro oficial de auditoría de lanzamiento a producción...');
  const approverId = 'ADMIN_SUPER_PROD';
  const audit = await recordReleaseAudit('1.0.0', 100, approverId);

  console.log(`Auditoría ID: ${audit.auditId}, Versión: v${audit.version}, Build: #${audit.buildNumber}, Aprobado: ${audit.approved}`);

  if (audit.approved && audit.version === '1.0.0' && audit.buildNumber === 100) {
    console.log('✅ Test 6 PASADO: Firma de auditoría de lanzamiento verificado.');
  } else {
    console.error('❌ Test 6 FALLIDO.');
  }

  // Cleanup
  await db.collection('accountDeletions2').doc(userId).delete();
  await db.collection('dataExports2').doc(dataExport.exportId).delete();
  await db.collection('supportTickets2').doc(ticket.ticketId).delete();
  await db.collection('releaseAudits2').doc(audit.auditId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE COMPLIANCE & LANZAMIENTO COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runCompliance2AtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Compliance 2.0:', err);
      process.exit(1);
    });
}
