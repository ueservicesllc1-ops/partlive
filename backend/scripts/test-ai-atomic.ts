import { db } from '../src/config/firebase';
import { seedAiConfig } from '../src/seeds/seedAiConfig';
import {
  generatePreLivePlan,
  detectAudienceDrop,
  generatePostLiveSummary,
  detectClipMoments,
  classifyModerationContent,
} from '../src/services/aiService';

export const runAiAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🤖 RUNNING AI CREATOR ASSISTANT ATOMIC TESTS');
  console.log('==================================================\n');

  // 1. Seed Config
  await seedAiConfig();

  // Test 1: Pre-Live Plan Generation
  console.log('\n▶ Test 1: Generar Plan Pre-Live con IA...');
  const plan = await generatePreLivePlan('PARTY', 'musica, trivia');
  console.log(`Títulos sugeridos (${plan.suggestedTitles.length}): ${plan.suggestedTitles[0]}`);
  if (plan.suggestedTitles.length >= 3 && plan.suggestedQuestions.length >= 3) {
    console.log('✅ Test 1 PASADO: Plan Pre-Live generado exitosamente.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Audience Drop Detection
  console.log('\n▶ Test 2: Detección de caída de audiencia...');
  const dropResult1 = detectAudienceDrop([100, 120, 115]); // Stable
  const dropResult2 = detectAudienceDrop([100, 120, 80]);  // Drop > 25%

  console.log(`Drop Estable: ${dropResult1.isDropDetected}, Drop Caída: ${dropResult2.isDropDetected}`);
  if (!dropResult1.isDropDetected && dropResult2.isDropDetected && dropResult2.recommendation) {
    console.log('✅ Test 2 PASADO: Caída de audiencia detectada y recomendación generada.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Post-Live Performance Summary
  console.log('\n▶ Test 3: Resumen de rendimiento Post-Live...');
  const summary = await generatePostLiveSummary(1200, 550, 45, 25000);
  console.log(`Resumen IA: Pico=${summary.peakViewers}, Insights=${summary.whatWorked.length}`);
  if (summary.peakViewers === 1200 && summary.whatWorked.length >= 1) {
    console.log('✅ Test 3 PASADO: Resumen Post-Live generado correctamente.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Auto Clip Moment Detection
  console.log('\n▶ Test 4: Detección automática de momentos para Clips...');
  const moments = await detectClipMoments('live_123', [
    { type: 'GALAXY_GIFT', timestamp: new Date().toISOString() },
    { type: 'PK_COMEBACK', timestamp: new Date().toISOString() },
  ]);

  console.log(`Momentos para Clips detectados: ${moments.length}`);
  if (moments.length === 2 && moments[0].suggestedTitles.length >= 1) {
    console.log('✅ Test 4 PASADO: Momentos destacados detectados con sugerencias de títulos.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Moderation Content Classification
  console.log('\n▶ Test 5: Clasificación asistida de moderación de contenido...');
  const modResult1 = classifyModerationContent('¡Hola a todos en el live!');
  const modResult2 = classifyModerationContent('Gana gratis coins ingresando tu password');

  console.log(`Moderación Normal: ${modResult1.classification}, Moderación Spam: ${modResult2.classification}`);
  if (modResult1.classification === 'LOW' && modResult2.classification === 'HIGH') {
    console.log('✅ Test 5 PASADO: Moderación asistida clasificó correctamente el spam.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE IA COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runAiAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de IA:', err);
      process.exit(1);
    });
}
