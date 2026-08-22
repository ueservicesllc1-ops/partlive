import { db } from '../src/config/firebase';
import {
  createSafetyReport,
  getModerationQueue,
  submitCaseAppeal,
  reviewCaseAppeal,
} from '../src/services/platformSafetyService';
import { evaluateUserRiskScore, flagHighRiskPayout } from '../src/services/fraudEngineService';

export const runSafetyAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🛡️ RUNNING TRUST & SAFETY, MODERATION & ANTI-FRAUD ATOMIC TESTS');
  console.log('==================================================\n');

  const reporterId = 'test_safe_reporter_' + Date.now();
  const targetUserId = 'test_safe_target_' + Date.now();
  const adminId = 'test_safe_admin_' + Date.now();

  await db.collection('users').doc(reporterId).set({ uid: reporterId, displayName: 'Denunciante', status: 'active' });
  await db.collection('users').doc(targetUserId).set({ uid: targetUserId, displayName: 'Usuario Reportado', status: 'active' });
  await db.collection('users').doc(adminId).set({ uid: adminId, displayName: 'Moderador Lead', status: 'active', role: 'admin' });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Create Safety Report & Auto-Severity Assignment
  console.log('\n▶ Test 1: Crear reporte de seguridad con severidad CRITICAL (Child Safety)...');
  const case1 = await createSafetyReport(reporterId, {
    targetUserId,
    category: 'CHILD_SAFETY',
    description: 'Intento de contacto inapropiado reportado por la comunidad.',
  });

  console.log(`Caso Creado ID: ${case1.id}, Severidad Asignada: ${case1.severity}, Equipo: ${case1.assignedTeam}`);
  if (case1.severity === 'CRITICAL' && case1.assignedTeam === 'SAFETY') {
    console.log('✅ Test 1 PASADO: Severidad CRITICAL asignada a Child Safety.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Report Deduplication
  console.log('\n▶ Test 2: Probar deduplicación de reportes (acumulación de contadores)...');
  const caseDuplicate = await createSafetyReport(reporterId, {
    targetUserId,
    category: 'CHILD_SAFETY',
    description: 'Segundo reporte sobre el mismo usuario.',
  });

  console.log(`Caso ID: ${caseDuplicate.id}, Contador de Reportes: ${caseDuplicate.reportCount}`);
  if (caseDuplicate.id === case1.id && caseDuplicate.reportCount === 2) {
    console.log('✅ Test 2 PASADO: Reportes duplicados agrupados correctamente.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Moderation Queue & Appeal Workflow
  console.log('\n▶ Test 3: Consultar cola de moderación y procesar apelación (REVERSED)...');
  const queue = await getModerationQueue('OPEN');
  console.log(`Casos en Cola de Moderación: ${queue.length}`);

  const appeal = await submitCaseAppeal(targetUserId, case1.id, 'No cometí ninguna infracción de normas.');
  const reviewedAppeal = await reviewCaseAppeal(appeal.id, 'REVERSED', 'Evaluación completada. Caso revertido por falta de evidencias.', adminId);

  console.log(`Estado de Apelación tras revisión: ${reviewedAppeal.status}`);
  if (reviewedAppeal.status === 'REVERSED' && queue.length >= 1) {
    console.log('✅ Test 3 PASADO: Apelación procesada y caso revertido con auditoría.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Fraud Signals & Payout Hold
  console.log('\n▶ Test 4: Evaluar score de riesgo de fraude y retención de Payout...');
  // Add 3 fraud signals
  for (let i = 0; i < 3; i++) {
    await db.collection('fraudSignals').add({
      userId: targetUserId,
      type: 'payment_velocity_spike',
      timestamp: new Date().toISOString(),
    });
  }

  const riskProfile = await evaluateUserRiskScore(targetUserId);
  console.log(`Score de Riesgo: ${riskProfile.riskScore}, Nivel: ${riskProfile.riskLevel}, Retención Payout: ${riskProfile.payoutHold}`);

  const payoutRef = db.collection('payoutRequests').doc('payout_test_safe');
  await payoutRef.set({ id: 'payout_test_safe', userId: targetUserId, status: 'PENDING' });

  await flagHighRiskPayout('payout_test_safe', targetUserId, 'Múltiples señales de riesgo de pago.');
  const updatedPayout = await payoutRef.get();
  console.log(`Estado del Payout tras evaluación: ${updatedPayout.data()?.status}`);

  if (riskProfile.payoutHold && updatedPayout.data()?.status === 'HOLD') {
    console.log('✅ Test 4 PASADO: Payout colocado en retención por score de riesgo.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(reporterId).delete();
  await db.collection('users').doc(targetUserId).delete();
  await db.collection('users').doc(adminId).delete();
  await db.collection('safetyCases').doc(case1.id).delete();
  await db.collection('caseAppeals').doc(appeal.id).delete();
  await payoutRef.delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE TRUST & SAFETY COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runSafetyAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Seguridad:', err);
      process.exit(1);
    });
}
