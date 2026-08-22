import { db } from '../src/config/firebase';
import {
  generateShareLink,
  processQualifiedReferral,
  generateCreatorRecruitmentLink,
  calculateViralityMetrics,
  getGrowthExperimentConfig,
} from '../src/services/viralGrowthEngineService';

export const runViralGrowthAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🚀 RUNNING VIRAL GROWTH ENGINE, REFERRALS & K-FACTOR ATOMIC TESTS');
  console.log('==================================================\n');

  const referrerId = 'test_referrer_' + Date.now();
  const refereeId = 'test_referee_' + Date.now();

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Generate Deep Link
  console.log('\n▶ Test 1: Generar deep link universal para contenido de la plataforma...');
  const link = await generateShareLink('LIVE', 'demo_live_123', referrerId, 'social_share');
  console.log(`Deep Link Creado ID: ${link.linkId}, Tipo: ${link.type}, URL: ${link.url}`);

  if (link.type === 'LIVE' && link.url.includes('/link/')) {
    console.log('✅ Test 1 PASADO: Deep link universal generado exitosamente.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Process Qualified Referral & Anti-Self-Referral Guard
  console.log('\n▶ Test 2: Procesar referido calificado y comprobar guardia de auto-referencia...');
  const referral = await processQualifiedReferral(referrerId, refereeId, 'FIRST_PURCHASE', 'device_abc_123');
  console.log(`Referido ID: ${referral.id}, Estado: ${referral.status}, Recompensa: ${referral.rewardCoins} Coins`);

  let selfReferralBlocked = false;
  try {
    await processQualifiedReferral(referrerId, referrerId, 'SIGNUP');
  } catch (err: any) {
    if (err.message.includes('DENIED_SELF_REFERRAL')) {
      selfReferralBlocked = true;
    }
  }

  if (referral.status === 'QUALIFIED' && selfReferralBlocked) {
    console.log('✅ Test 2 PASADO: Referido calificado procesado y auto-referencia bloqueada.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Generate Creator & Agency Recruitment Link
  console.log('\n▶ Test 3: Generar enlace de reclutamiento para agencias y nuevos creadores...');
  const recruit = await generateCreatorRecruitmentLink(undefined, 'agency_latam_top');
  console.log(`Reclutamiento ID: ${recruit.linkId}, URL: ${recruit.url}, Código: ${recruit.trackingCode}`);

  if (recruit.trackingCode.includes('agency_latam_top')) {
    console.log('✅ Test 3 PASADO: Enlace de reclutamiento de agencias generado.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Virality & K-Factor Analytics Engine
  console.log('\n▶ Test 4: Calcular métricas avanzadas de viralidad y factor K (K-Factor)...');
  const metrics = await calculateViralityMetrics();
  console.log(`Factor K: ${metrics.kFactor}x, Invitaciones/Usuario: ${metrics.invitesPerUser}, Conversión: ${metrics.qualifiedConversionPercent}%`);

  if (metrics.kFactor === 1.35 && metrics.qualifiedConversionPercent === 48.0) {
    console.log('✅ Test 4 PASADO: Métricas de viralidad y factor K calculadas.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Growth Experiment Feature Flag Variants
  console.log('\n▶ Test 5: Consultar variante de experimento A/B de crecimiento...');
  const exp = getGrowthExperimentConfig('onboarding_v2');
  console.log(`Experimento: onboarding_v2, Habilitado: ${exp.enabled}, Variante: ${exp.variant}`);

  if (exp.enabled && exp.variant === 'VARIANT_B') {
    console.log('✅ Test 5 PASADO: Variante de experimento A/B obtenida.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('shareLinks').doc(link.linkId).delete();
  await db.collection('qualifiedReferrals').doc(referral.id).delete();
  await db.collection('creatorRecruitmentLinks').doc(recruit.linkId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE CRECIMIENTO VIRAL COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runViralGrowthAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Crecimiento Viral:', err);
      process.exit(1);
    });
}
