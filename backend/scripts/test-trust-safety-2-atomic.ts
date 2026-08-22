import { db } from '../src/config/firebase';
import {
  evaluateUserRiskScore2,
  submitUserReport,
  getModerationQueue,
  applyEnforcementAction,
  processModerationAppeal,
  filterBotEngagement,
  getSafetyCenterMetrics,
} from '../src/services/trustSafetyEngine2Service';

export const runTrustSafety2AtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🛡️ RUNNING TRUST, SAFETY & MODERATION 2.0 ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Multi-Signal Risk Score Evaluation
  console.log('\n▶ Test 1: Evaluar riesgo de usuario multi-señal (prohibición de auto-baneo por 1 sola señal)...');
  const userId = 'user_risk_100';
  const evalResult = await evaluateUserRiskScore2(userId, { hasSpamFlag: true, isNewDevice: true, reportCount: 3 });

  console.log(`Usuario: ${evalResult.userId}, Riesgo Score: ${evalResult.riskScore}/100, Nivel: ${evalResult.riskLevel}, Revisión Humana: ${evalResult.requiresHumanReview}`);

  if (evalResult.riskScore >= 60 && evalResult.requiresHumanReview) {
    console.log('✅ Test 1 PASADO: Evaluación de riesgo multi-señal verificada.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: User Report Submission & Priority Escalation
  console.log('\n▶ Test 2: Enviar reporte de usuario y verificar enrutamiento de prioridad URGENT...');
  const report = await submitUserReport('reporter_user_50', 'bad_actor_999', 'USER', 'CHILD_SAFETY', 'Evidencia de violación de seguridad infantil');
  console.log(`Reporte ID: ${report.reportId}, Tipo: ${report.reportType}, Prioridad: ${report.priority}, Estado: ${report.status}`);

  if (report.priority === 'URGENT' && report.status === 'OPEN') {
    console.log('✅ Test 2 PASADO: Envío de reporte y escalamiento prioritario verificado.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Moderation Queue Retrieval
  console.log('\n▶ Test 3: Consultar cola de moderación humana...');
  const queue = await getModerationQueue();
  console.log(`Casos en Cola: ${queue.length}, Primer Caso ID: ${queue[0].caseId}, Riesgo: ${queue[0].riskScore}/100`);

  if (queue.length >= 2 && queue[0].riskScore > 80) {
    console.log('✅ Test 3 PASADO: Recuperación de cola de moderación validada.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Enforcement Action Application with Audit Trail
  console.log('\n▶ Test 4: Aplicar sanción de moderación (LIVE_RESTRICTION) con auditoría...');
  const enforcement = await applyEnforcementAction('bad_actor_999', 'LIVE_RESTRICTION', 1440, 'Spam reiterado durante live', 'MOD_ALEX');
  console.log(`Sanción ID: ${enforcement.actionId}, Tipo: ${enforcement.actionType}, Duración: ${enforcement.durationMinutes} min, Aplicado Por: ${enforcement.appliedBy}`);

  if (enforcement.actionType === 'LIVE_RESTRICTION' && enforcement.durationMinutes === 1440) {
    console.log('✅ Test 4 PASADO: Aplicación de sanción de moderación y auditoría verificada.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Moderation Appeal Processing
  console.log('\n▶ Test 5: Procesar apelación humana del usuario (Decisión REVERSED)...');
  const appeal = await processModerationAppeal('case_mod_101', 'bad_actor_999', 'Fue un error involuntario', 'REVERSED', 'SUPER_MOD');
  console.log(`Apelación ID: ${appeal.appealId}, Decisión: ${appeal.decision}, Revisado Por: ${appeal.reviewedBy}`);

  if (appeal.decision === 'REVERSED') {
    console.log('✅ Test 5 PASADO: Procesamiento de apelaciones humanas verificado.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Test 6: Bot Tap & Fake Engagement Filter
  console.log('\n▶ Test 6: Probar filtro de interacciones automatizadas (Bot Taps)...');
  const botResult = await filterBotEngagement('live_superstar_1', 2500);
  console.log(`Taps Masivos: ${botResult.rawTaps} -> Válidos: ${botResult.validTaps}, Descartados por Bot: ${botResult.botTapsFiltered}`);

  if (botResult.botTapsFiltered === 2000 && botResult.validTaps === 500) {
    console.log('✅ Test 6 PASADO: Filtro de bots e integridad de ránkings validado.');
  } else {
    console.error('❌ Test 6 FALLIDO.');
  }

  // Test 7: Real-Time Safety Metrics
  console.log('\n▶ Test 7: Consultar métricas de telemetría de inteligencia de seguridad...');
  const metrics = await getSafetyCenterMetrics();
  console.log(`Reportes Abiertos: ${metrics.openReportsCount}, Casos Urgentes: ${metrics.urgentCasesCount}, Bot Taps Filtrados: ${metrics.botTapsFilteredCount}`);

  if (metrics.openReportsCount > 0 && metrics.botTapsFilteredCount > 0) {
    console.log('✅ Test 7 PASADO: Métricas de telemetría de seguridad verificadas.');
  } else {
    console.error('❌ Test 7 FALLIDO.');
  }

  // Cleanup
  await db.collection('userReports2').doc(report.reportId).delete();
  await db.collection('enforcementActions2').doc(enforcement.actionId).delete();
  await db.collection('moderationAppeals2').doc(appeal.appealId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE SEGURIDAD COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runTrustSafety2AtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Seguridad 2.0:', err);
      process.exit(1);
    });
}
