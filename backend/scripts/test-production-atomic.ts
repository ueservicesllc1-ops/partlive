import { db } from '../src/config/firebase';
import { seedFeatureConfig } from '../src/seeds/seedFeatureConfig';
import { isFeatureEnabled, getSystemFeatureFlags } from '../src/services/featureFlagService';
import { reconcileDailyFinancials } from '../src/services/financialIntegrityService';
import { calculateUserFraudRiskScore } from '../src/services/fraudDetectionService';

export const runProductionAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🛡️ RUNNING PRODUCTION INFRASTRUCTURE & SECURITY ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_prod_user_' + Date.now();

  // Create User
  await db.collection('users').doc(userId).set({
    uid: userId,
    displayName: 'Usuario Producción Test',
    status: 'active',
  });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Seed & Query Feature Flags
  console.log('\n▶ Test 1: Sembrar e inspeccionar Feature Flags del sistema...');
  await seedFeatureConfig();
  const flags = await getSystemFeatureFlags();
  console.log(`Flags cargadas: PK=${flags.pkEnabled}, VIP=${flags.vipEnabled}, AI=${flags.aiEnabled}`);
  if (flags.pkEnabled && flags.vipEnabled && flags.aiEnabled) {
    console.log('✅ Test 1 PASADO: Feature flags sembradas y activas.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Feature Flag Killswitch
  console.log('\n▶ Test 2: Simular apagado de emergencia (Killswitch) de una función...');
  await db.collection('systemConfig').doc('features').update({ pkEnabled: false });
  const isPkActive = await isFeatureEnabled('pkEnabled');
  console.log(`Estado de PK tras Killswitch: ${isPkActive}`);
  if (!isPkActive) {
    console.log('✅ Test 2 PASADO: Killswitch desactivó PK exitosamente.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Restore PK Flag
  await db.collection('systemConfig').doc('features').update({ pkEnabled: true });

  // Test 3: Financial Reconciliation Audit
  console.log('\n▶ Test 3: Ejecutar auditoría de reconciliación financiera diaria...');
  const report = await reconcileDailyFinancials();
  console.log(`Informe de Reconciliación: Status=${report.status}, Anomalías=${report.anomaliesDetected}`);
  if (report.status === 'HEALTHY' || report.status === 'ANOMALY_DETECTED') {
    console.log('✅ Test 3 PASADO: Auditoría de reconciliación ejecutada.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Fraud Risk Score Calculation
  console.log('\n▶ Test 4: Calcular Score de Riesgo de Fraude para usuario...');
  const evaluation = await calculateUserFraudRiskScore(userId);
  console.log(`Evaluación de Riesgo: Score=${evaluation.riskScore}, Nivel=${evaluation.riskLevel}`);
  if (evaluation.riskLevel === 'LOW' || evaluation.riskLevel === 'MEDIUM' || evaluation.riskLevel === 'HIGH') {
    console.log('✅ Test 4 PASADO: Score de fraude calculado.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(userId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE PRODUCCIÓN Y SEGURIDAD COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runProductionAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Producción:', err);
      process.exit(1);
    });
}
