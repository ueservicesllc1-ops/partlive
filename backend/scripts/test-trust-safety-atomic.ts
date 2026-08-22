import { db } from '../src/config/firebase';
import {
  evaluateRiskScore,
  enforceIdempotencyKey,
  detectAccountTakeover,
  verifyPayoutSecurity,
  toggleSecurityKillSwitch,
  getSecurityKillSwitchesState,
} from '../src/services/trustSafetyEngineService';

export const runTrustSafetyAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🛡️ RUNNING TRUST, SAFETY, ANTI-FRAUD & KILL-SWITCH ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_trust_user_' + Date.now();
  const idempotencyKey = 'test_idem_key_' + Date.now();

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Multi-Factor Risk Score Engine
  console.log('\n▶ Test 1: Evaluar puntaje de riesgo multifactorial (Risk Score)...');
  const lowRisk = await evaluateRiskScore(userId, 'TRANSACTION', { isNewDevice: false, amountCents: 500 });
  const highRisk = await evaluateRiskScore(userId, 'PAYOUT', { isNewDevice: true, amountCents: 150000, giftLoopDetected: true });

  console.log(`Riesgo Normal: Score ${lowRisk.riskScore}, Nivel ${lowRisk.riskLevel}, Acción ${lowRisk.recommendedAction}`);
  console.log(`Riesgo Elevado: Score ${highRisk.riskScore}, Nivel ${highRisk.riskLevel}, Acción ${highRisk.recommendedAction}, Señales: ${highRisk.signals.join(', ')}`);

  if (lowRisk.riskLevel === 'LOW' && highRisk.riskLevel === 'CRITICAL') {
    console.log('✅ Test 1 PASADO: Evaluador de riesgo multifactorial verificado.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Idempotency Key Deduplication Guard
  console.log('\n▶ Test 2: Verificar la clave de idempotencia financiera (Evitar cobro doble por reintento)...');
  const firstCall = await enforceIdempotencyKey(userId, idempotencyKey, async () => ({ status: 'PAID', amountCents: 2000 }));
  const secondCall = await enforceIdempotencyKey(userId, idempotencyKey, async () => ({ status: 'PAID', amountCents: 2000 }));

  console.log(`Llamada 1 (Nueva): Cached=${firstCall.cached}, Monto: ${firstCall.data.amountCents}`);
  console.log(`Llamada 2 (Reintento): Cached=${secondCall.cached}, Monto: ${secondCall.data.amountCents}`);

  if (!firstCall.cached && secondCall.cached && secondCall.data.amountCents === 2000) {
    console.log('✅ Test 2 PASADO: Clave de idempotencia previno duplicación de transacción.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Account Takeover Detection
  console.log('\n▶ Test 3: Detectar anomalía de seguridad e imponer bloqueo preventivo de 48h...');
  const takeover = await detectAccountTakeover(userId, 'dev_unknown_99', '192.168.1.1', 'PAYOUT_METHOD_UPDATE');
  console.log(`Resultado Takeover: Estado ${takeover.status}, Razón: ${takeover.holdReason}`);

  if (takeover.status === 'SECURITY_HOLD') {
    console.log('✅ Test 3 PASADO: Bloqueo preventivo de seguridad activado exitosamente.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Payout Security Threshold Check
  console.log('\n▶ Test 4: Verificar seguridad de payout y retención por monto elevado...');
  const payoutCheck = await verifyPayoutSecurity(userId, 75000); // $750 USD > $500 threshold
  console.log(`Verificación Payout ($750 USD): Estado ${payoutCheck.status}, Razón: ${payoutCheck.reviewReason}`);

  if (payoutCheck.status === 'PENDING_REVIEW') {
    console.log('✅ Test 4 PASADO: Payout elevado retenido para revisión manual.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Emergency Security Kill Switch
  console.log('\n▶ Test 5: Activar interruptor de emergencia de Payouts (Kill Switch)...');
  await toggleSecurityKillSwitch('PAYOUTS', 'PAUSED', 'ADMIN_TEST');
  const killState = getSecurityKillSwitchesState();
  const wasPaused = killState.PAYOUTS.status === 'PAUSED';
  console.log(`Estado Kill Switch PAYOUTS: ${killState.PAYOUTS.status}`);

  let killSwitchEnforced = false;
  try {
    await verifyPayoutSecurity(userId, 1000);
  } catch (err: any) {
    if (err.message.includes('KILL_SWITCH_ACTIVE')) {
      killSwitchEnforced = true;
    }
  }

  // Restore Payouts
  await toggleSecurityKillSwitch('PAYOUTS', 'ACTIVE', 'ADMIN_TEST');

  if (wasPaused && killSwitchEnforced) {
    console.log('✅ Test 5 PASADO: Interruptor de emergencia de Payouts verificado.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('idempotencyKeys').doc(`${userId}_${idempotencyKey}`).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE SEGURIDAD Y INTEGRIDAD COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runTrustSafetyAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Confianza y Seguridad:', err);
      process.exit(1);
    });
}
