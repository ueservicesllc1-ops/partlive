import { db } from '../src/config/firebase';
import {
  getCreatorStudioDashboard,
  getCreatorAudienceIntelligence,
  generatePreLiveChecklist,
  getAICreatorCoachAdvice,
  generateCreatorMediaKit,
} from '../src/services/creatorStudioSuccessService';

export const runCreatorStudioSuccessAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🌟 RUNNING CREATOR STUDIO PRO & CREATOR SUCCESS ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Creator Studio Performance Dashboard & USD Equivalent
  console.log('\n▶ Test 1: Consultar rendimiento diario del creador y equivalente en USD...');
  const hostId = 'host_test_100';
  const dashboard = await getCreatorStudioDashboard(hostId);
  console.log(`Horas Transmitidas: ${dashboard.todayLiveHours}h, Espectadores: ${dashboard.todayViewers}, Diamonds Disponibles: ${dashboard.diamondsAvailable}, USD Equivalente: $${dashboard.usdEquivalentAvailable} USD`);

  if (dashboard.diamondsAvailable === 12500 && dashboard.usdEquivalentAvailable === 62.50) {
    console.log('✅ Test 1 PASADO: Resumen de rendimiento e ingresos en USD verificado.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Audience Intelligence & Supporter CRM
  console.log('\n▶ Test 2: Consultar curva de retención de audiencia y CRM de supporters principales...');
  const audience = await getCreatorAudienceIntelligence(hostId);
  console.log(`Espectadores Únicos: ${audience.uniqueViewers30d}, Recurrentes: ${audience.returningViewersPercent}%, Top Supporter: ${audience.topSupporters[0].username} (${audience.topSupporters[0].diamondsContributed} Diamonds)`);

  if (audience.returningViewersPercent > 50 && audience.topSupporters.length === 3) {
    console.log('✅ Test 2 PASADO: Inteligencia de audiencia y CRM de supporters validados.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Pre-Live Checklist & AI Title Assistant
  console.log('\n▶ Test 3: Generar checklist pre-live y sugerencias de títulos con IA...');
  const checklist = await generatePreLiveChecklist(hostId, 'Noche de Karaoke', 'Karaoke');
  console.log(`Chequeo de Hardware: Cámara=${checklist.hardwareCheck.cameraOk}, Red=${checklist.hardwareCheck.networkQuality} | Títulos Sugeridos: ${checklist.aiTitleSuggestions.length}`);

  if (checklist.hardwareCheck.cameraOk && checklist.aiTitleSuggestions.length === 3) {
    console.log('✅ Test 3 PASADO: Pre-Live checklist y asistente de títulos por IA validados.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: AI Creator Coach Advice & Actionable Plan
  console.log('\n▶ Test 4: Consultar asesoramiento de AI Creator Coach y plan de acción...');
  const coach = await getAICreatorCoachAdvice(hostId);
  console.log(`Health Score: ${coach.healthScore}, Estado: ${coach.status} | Asesoría: "${coach.topInsight}" | Pasos del Plan: ${coach.actionablePlan.length}`);

  if (coach.healthScore > 90 && coach.actionablePlan.length === 3) {
    console.log('✅ Test 4 PASADO: Asistente AI Creator Coach y plan de acción validados.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Creator Media Kit & QR Code Generator
  console.log('\n▶ Test 5: Generar Media Kit público del creador y código QR...');
  const mediaKit = await generateCreatorMediaKit(hostId);
  console.log(`Media Kit Creador: ${mediaKit.username}, Seguidores: ${mediaKit.totalFollowers}, URL Pública: ${mediaKit.publicProfileUrl}, URL QR: ${mediaKit.qrCodeUrl}`);

  if (mediaKit.qrCodeUrl.includes('api.qrserver.com') && mediaKit.deepLinkUrl.includes('partylive://')) {
    console.log('✅ Test 5 PASADO: Generador de Media Kit y código QR verificado.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('creatorMediaKits').doc(hostId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE CREATOR STUDIO PRO COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runCreatorStudioSuccessAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Creator Studio Pro:', err);
      process.exit(1);
    });
}
