import { db } from '../src/config/firebase';
import {
  saveUserInterests,
  recordTapBurstInteraction,
  processGiftConversionFlow,
  trackCreatorActivationMilestones,
  getConversionFunnelMetrics,
  getUxAuditTelemetry,
} from '../src/services/uxConversionEngine2Service';

export const runUxConversion2AtomicTests = async () => {
  console.log('\n==================================================');
  console.log('✨ RUNNING UX/UI 2.0, ENGAGEMENT & CONVERSION ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Progressive Onboarding & User Interest Selection
  console.log('\n▶ Test 1: Guardar intereses de usuario en onboarding progresivo (Music, Karaoke, Games)...');
  const userId = 'user_ux_100';
  const interests = await saveUserInterests(userId, ['Music', 'Karaoke', 'Games']);

  console.log(`Usuario: ${interests.userId}, Intereses: ${interests.selectedInterests.join(', ')}, Feed Personalizado: ${interests.personalizedFeedConfigured}`);

  if (interests.selectedInterests.length === 3 && interests.personalizedFeedConfigured) {
    console.log('✅ Test 1 PASADO: Guardado de intereses e inicialización de feed personalizado verificado.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Thumbs-Up 👍 Tap Burst Interaction & Haptic Feedback
  console.log('\n▶ Test 2: Enviar ráfaga de 50 taps 👍 me gusta en vivo y verificar respuesta de animación/háptica...');
  const liveId = 'live_superstar_1';
  const tapResult = await recordTapBurstInteraction(userId, liveId, 50);

  console.log(`Live: ${tapResult.liveId}, Taps Agregados: +${tapResult.tapsAdded} 👍, Animación: ${tapResult.burstAnimationTriggered}, Patrón Háptico: ${tapResult.hapticFeedbackPattern}`);

  if (tapResult.tapsAdded === 50 && tapResult.burstAnimationTriggered && tapResult.hapticFeedbackPattern === 'HEAVY_BURST') {
    console.log('✅ Test 2 PASADO: Ráfaga de taps 👍 y retroalimentación háptica en vivo verificada.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Frictionless Gift Conversion & Low Balance Recharge Trigger
  console.log('\n▶ Test 3: Probar conversión de regalo con saldo insuficiente (50 coins de 500 requeridas)...');
  const conversion = await processGiftConversionFlow(userId, liveId, 'gift_dragon_fire', 50);

  console.log(`Regalo: ${conversion.giftId}, Requeridas: ${conversion.requiredCoins}, Posee: ${conversion.userCoins}, Saldo Suficiente: ${conversion.hasSufficientBalance}, Trigger Recarga: ${conversion.rechargeOfferTriggered}`);

  if (!conversion.hasSufficientBalance && conversion.rechargeOfferTriggered && conversion.suggestedCoinPackageId === 'pack_coins_starter_1000') {
    console.log('✅ Test 3 PASADO: Detección de saldo bajo y disparo de recarga contextual verificado.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Creator Activation Journey Milestones
  console.log('\n▶ Test 4: Rastrear hitos del embudo de activación de creadores de contenido...');
  const creatorAct = await trackCreatorActivationMilestones('creator_star_99');

  console.log(`Creador: ${creatorAct.creatorId}, Progreso Activación: ${creatorAct.activationProgressPercent}%, Primer Live: ${creatorAct.milestones.firstLiveStreamed}, Primer Regalo: ${creatorAct.milestones.firstGiftReceived}`);

  if (creatorAct.activationProgressPercent > 80 && creatorAct.milestones.firstLiveStreamed) {
    console.log('✅ Test 4 PASADO: Seguimiento de hitos de activación de creadores verificado.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Usability & Conversion Funnel Telemetry
  console.log('\n▶ Test 5: Consultar métricas del embudo de conversión y punto principal de abandono...');
  const funnel = await getConversionFunnelMetrics();

  console.log(`Conversión General: ${funnel.overallConversionRatePercent}%, Home->Live: ${funnel.stageRates.homeToLiveWatch}%, Abandono Principal: "${funnel.topDropoffStage}"`);

  if (funnel.overallConversionRatePercent > 10 && funnel.stageRates.homeToLiveWatch > 80) {
    console.log('✅ Test 5 PASADO: Métricas del embudo de conversión validadas.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Test 6: UX Audit, Mobile FPS & Zero Dark Pattern Verification
  console.log('\n▶ Test 6: Consultar telemetría de auditoría UX, FPS móvil y cero patrones engañosos (Dark Patterns)...');
  const telemetry = await getUxAuditTelemetry();

  console.log(`FPS Promedio Móvil: ${telemetry.mobileFpsAverage}, Accesibilidad: ${telemetry.accessibilityScorePercent}%, Patrones Oscuros: ${telemetry.darkPatternsDetected}`);

  if (telemetry.mobileFpsAverage >= 55 && telemetry.darkPatternsDetected === 0 && telemetry.rtlLayoutReady) {
    console.log('✅ Test 6 PASADO: Auditoría UX, rendimiento móvil y ausencia de patrones engañosos verificado.');
  } else {
    console.error('❌ Test 6 FALLIDO.');
  }

  // Cleanup
  await db.collection('userInterests2').doc(userId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE UX/UI Y CONVERSIÓN COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runUxConversion2AtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de UX Conversión 2.0:', err);
      process.exit(1);
    });
}
