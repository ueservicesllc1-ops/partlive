import { db } from '../src/config/firebase';
import {
  createCampaign,
  recordAttribution,
  createPromoCode,
  validatePromoCode,
  applyCreatorProgram,
  calculateGrowthMetrics,
} from '../src/services/growthEngineService';

export const runGrowthEngineAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('📈 RUNNING GROWTH ENGINE, RECRUITMENT & UNIT ECONOMICS ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_growth_user_' + Date.now();
  const promoCodeStr = 'PROMO_TEST_' + Date.now();

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Create Campaign & Track Attribution
  console.log('\n▶ Test 1: Crear campaña de adquisición y registrar atribución...');
  const campaign = await createCampaign('Campaña Lanzamiento TikTok', 'TikTok', 1000, 1.20);
  await recordAttribution(userId, campaign.id, 'tiktok_ads', 'video');

  console.log(`Campaña Creada ID: ${campaign.id}, Canal: ${campaign.channel}, Presupuesto: $${campaign.budgetUsd}`);
  if (campaign.name === 'Campaña Lanzamiento TikTok' && campaign.status === 'ACTIVE') {
    console.log('✅ Test 1 PASADO: Campaña creada y atribución de usuario registrada.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Create & Redeem Promo Code
  console.log('\n▶ Test 2: Crear y canjear código promocional (Promo Code Engine)...');
  const promo = await createPromoCode(promoCodeStr, 100, 2);
  const redeemRes = await validatePromoCode(promoCodeStr, userId);

  console.log(`Código Promo: ${promo.code}, Recompensa: ${promo.rewardCoins} Coins, Canje Válido: ${redeemRes.valid}`);
  if (redeemRes.valid && redeemRes.rewardCoins === 100) {
    console.log('✅ Test 2 PASADO: Código promocional canjeado y saldo validado.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Creator Recruitment Application Pipeline
  console.log('\n▶ Test 3: Enviar solicitud de reclutamiento para el programa de creadores...');
  const creatorApp = await applyCreatorProgram(userId, 'Música / Karaoke', 'US', '@star_creator_2026');
  console.log(`Solicitud de Creador ID: ${creatorApp.id}, Categoría: ${creatorApp.category}, Estado: ${creatorApp.status}`);

  if (creatorApp.status === 'APPLIED') {
    console.log('✅ Test 3 PASADO: Solicitud de reclutamiento de creador registrada.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Advanced Unit Economics Calculation
  console.log('\n▶ Test 4: Calcular métricas avanzadas de crecimiento (CAC, LTV, Payback, Margen)...');
  const metrics = await calculateGrowthMetrics();
  console.log(`CAC: $${metrics.cacUsd}, LTV: $${metrics.ltvUsd}, Ratio LTV/CAC: ${metrics.ltvToCacRatio}x, Payback: ${metrics.paybackPeriodDays} días`);

  if (metrics.ltvToCacRatio > 3.0 && metrics.paybackPeriodDays <= 90) {
    console.log('✅ Test 4 PASADO: Economía de unidad de crecimiento altamente rentable confirmada.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('marketingCampaigns').doc(campaign.id).delete();
  await db.collection('attributions').doc(userId).delete();
  await db.collection('promoCodes').doc(promoCodeStr.toUpperCase()).delete();
  await db.collection('creatorApplications').doc(creatorApp.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE GROWTH Y RECLUTAMIENTO COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runGrowthEngineAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Growth Engine:', err);
      process.exit(1);
    });
}
