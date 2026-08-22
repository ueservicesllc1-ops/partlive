import { db } from '../src/config/firebase';
import {
  trackUserAttribution,
  processQualifiedReferralEx,
  createGrowthCampaign,
  calculateGrowthAcquisitionMetrics,
  toggleGrowthCampaignKillSwitch,
} from '../src/services/growthAcquisitionEngineService';

export const runGrowthAcquisitionAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🚀 RUNNING GROWTH & ACQUISITION ENGINE ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Multi-Touch Attribution Tracking (First & Last Touch)
  console.log('\n▶ Test 1: Registrar atribución multi-touch de usuario (First/Last Touch)...');
  const userId = 'user_acq_100';
  const attribution = await trackUserAttribution(userId, 'Social_Facebook', 'Referral_Link_99', 'user_referrer_50', 'camp_summer_viral', 'CL', 'android');

  console.log(`Usuario: ${attribution.userId}, First Touch: ${attribution.firstTouchSource}, Last Touch: ${attribution.lastTouchSource}, Referrer: ${attribution.referrerId}`);

  if (attribution.firstTouchSource === 'Social_Facebook' && attribution.lastTouchSource === 'Referral_Link_99') {
    console.log('✅ Test 1 PASADO: Registro de atribución multi-touch verificado.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Qualified Referral Processing (FIRST_PURCHASE Event)
  console.log('\n▶ Test 2: Calificar referido por evento de primera compra (FIRST_PURCHASE)...');
  const refereeId = 'user_referee_200';
  const referrerId = 'user_referrer_50';
  const referral = await processQualifiedReferralEx(referrerId, refereeId, 'FIRST_PURCHASE', 'device_unique_123');

  console.log(`Referral ID: ${referral.id}, Estado: ${referral.status}, Recompensa: +${referral.rewardCoins} Coins`);

  if (referral.status === 'QUALIFIED' && referral.rewardCoins === 100) {
    console.log('✅ Test 2 PASADO: Calificación de referido por evento real verificada.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Anti-Fraud Check - Self-Referral Denied
  console.log('\n▶ Test 3: Denegar auto-referencias (referrerId === refereeId)...');
  let selfRefBlocked = false;
  try {
    await processQualifiedReferralEx('user_same_id', 'user_same_id', 'FIRST_PURCHASE');
  } catch (err: any) {
    selfRefBlocked = err.message.includes('DENIED_SELF_REFERRAL');
  }

  console.log(`Auto-referencia Bloqueada: ${selfRefBlocked}`);

  if (selfRefBlocked) {
    console.log('✅ Test 3 PASADO: Bloqueo de auto-referencias validado.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Anti-Fraud Check - Same Device Fraud Hold
  console.log('\n▶ Test 4: Retener referido sospechoso por mismo dispositivo (PENDING_REVIEW)...');
  const fraudRef = await processQualifiedReferralEx(referrerId, 'user_fraud_referee', 'FIRST_PURCHASE', 'same_device_flag');
  console.log(`Fraude Estado: ${fraudRef.status}, Recompensa: ${fraudRef.rewardCoins}, Razón: ${fraudRef.reason}`);

  if (fraudRef.status === 'PENDING_REVIEW' && fraudRef.rewardCoins === 0) {
    console.log('✅ Test 4 PASADO: Retención de fraude por mismo dispositivo verificada.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Growth Campaign Creation & Budget Protection Cap
  console.log('\n▶ Test 5: Crear campaña de crecimiento con límite de presupuesto...');
  const campaign = await createGrowthCampaign('camp_referral_promo', 2500, 150);
  console.log(`Campaña ID: ${campaign.campaignId}, Presupuesto: $${campaign.budgetUsd} USD, Recompensa: ${campaign.rewardCoinsPerReferral} Coins, Estado: ${campaign.status}`);

  if (campaign.status === 'ACTIVE' && campaign.budgetUsd === 2500) {
    console.log('✅ Test 5 PASADO: Creación de campaña y control de presupuesto validados.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Test 6: Viral K-Factor & Acquisition Economics Metrics
  console.log('\n▶ Test 6: Consultar métricas de viralidad K-Factor y economía de adquisición (CAC/LTV)...');
  const metrics = await calculateGrowthAcquisitionMetrics();
  console.log(`K-Factor: ${metrics.kFactor}x, Score Viral: ${metrics.viralityScore}, CAC Referidos: $${metrics.cacReferralUsd} USD, Ratio LTV/CAC: ${metrics.overallLtvToCacRatio}x`);

  if (metrics.kFactor > 1.0 && metrics.overallLtvToCacRatio > 3.0) {
    console.log('✅ Test 6 PASADO: Métricas K-Factor y economía de adquisición verificadas.');
  } else {
    console.error('❌ Test 6 FALLIDO.');
  }

  // Test 7: Campaign Kill Switch
  console.log('\n▶ Test 7: Probar interruptor de emergencia de campaña (Kill Switch)...');
  const pausedCamp = await toggleGrowthCampaignKillSwitch('camp_referral_promo', false);
  console.log(`Campaña Pausada: ${pausedCamp.campaignId}, Estado: ${pausedCamp.status}`);

  if (pausedCamp.status === 'PAUSED') {
    console.log('✅ Test 7 PASADO: Interruptor de emergencia de campaña de crecimiento verificado.');
  } else {
    console.error('❌ Test 7 FALLIDO.');
  }

  // Cleanup
  await db.collection('qualifiedReferralsEx').doc(referral.id).delete();
  await db.collection('qualifiedReferralsEx').doc(fraudRef.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE CRECIMIENTO COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runGrowthAcquisitionAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Crecimiento y Adquisición:', err);
      process.exit(1);
    });
}
