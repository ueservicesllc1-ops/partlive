import { db } from '../src/config/firebase';
import {
  createBetaInviteCode,
  validateBetaInviteCode,
  submitBetaFeedback,
  checkAppVersionGate,
  setCanaryRolloutPercentage,
  getLaunchReadinessScore,
} from '../src/services/betaRolloutService';

export const runBetaAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🚀 RUNNING BETA, CANARY ROLLOUT & LAUNCH SYSTEM ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_beta_user_' + Date.now();
  const codeStr = 'TEST_BETA_' + Date.now();

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Create & Validate Beta Invite Code
  console.log('\n▶ Test 1: Crear y validar código de invitación para Closed Beta...');
  const invite = await createBetaInviteCode(codeStr, 2, 'alpha_cohort');
  const val1 = await validateBetaInviteCode(codeStr, userId);

  console.log(`Código Creado: ${invite.code}, Canje 1 Válido: ${val1.valid}`);
  if (invite.code === codeStr.toUpperCase() && val1.valid) {
    console.log('✅ Test 1 PASADO: Código de invitación Beta creado y canjeado exitosamente.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Submit Beta Feedback / Bug Report
  console.log('\n▶ Test 2: Registrar reporte de error/feedback de probador Beta...');
  const feedback = await submitBetaFeedback(userId, 'BUG', 'Error visual al unirse a Live en Android 13', '1.0.0', 'Pixel 7');
  console.log(`Feedback Registrado ID: ${feedback.id}, Categoría: ${feedback.category}, Estado: ${feedback.status}`);

  if (feedback.category === 'BUG' && feedback.status === 'NEW') {
    console.log('✅ Test 2 PASADO: Feedback de probador Beta registrado.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Check App Version Gate Rules
  console.log('\n▶ Test 3: Verificar reglas de versión mínima requerida (Version Gate)...');
  const gateOutdated = checkAppVersionGate('0.8.0', 'android');
  const gateCurrent = checkAppVersionGate('1.0.0', 'android');

  console.log(`Versión 0.8.0 Actualización Requerida: ${gateOutdated.updateRequired}, Versión 1.0.0 Actualización Requerida: ${gateCurrent.updateRequired}`);
  if (gateOutdated.updateRequired && !gateCurrent.updateRequired) {
    console.log('✅ Test 3 PASADO: Version Gate forzando actualizaciones requeridas correctamente.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Canary Rollout Percentage Adjustment
  console.log('\n▶ Test 4: Configurar porcentaje de despliegue progresivo (Canary Rollout 25%)...');
  const canary = await setCanaryRolloutPercentage(25);
  console.log(`Porcentaje Canary: ${canary.percentage}%, Estado: ${canary.status}`);

  if (canary.percentage === 25 && canary.status === 'ACTIVE') {
    console.log('✅ Test 4 PASADO: Despliegue progresivo Canary actualizado.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Launch Readiness Score Calculation
  console.log('\n▶ Test 5: Evaluar puntuación global de preparación para lanzamiento...');
  const readiness = await getLaunchReadinessScore();
  console.log(`Puntuación Global: ${readiness.overallScore}/100, Seguridad: ${readiness.securityScore}%, Finanzas: ${readiness.financialScore}%`);

  if (readiness.overallScore === 100) {
    console.log('✅ Test 5 PASADO: Puntuación global de lanzamiento 100/100 confirmada.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('betaInvites').doc(codeStr.toUpperCase()).delete();
  await db.collection('betaFeedback').doc(feedback.id).delete();
  await db.collection('canaryRollouts').doc('global').delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE BETA Y LANZAMIENTO COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runBetaAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Beta y Lanzamiento:', err);
      process.exit(1);
    });
}
