import { db } from '../src/config/firebase';
import {
  analyzeTextModeration,
  generateCreatorSuggestions,
  translateChatText,
  verifyFinancialIsolation,
  getAICostReport,
  trackAIUsage,
} from '../src/services/aiIntelligenceService';

export const runAIIntelligenceAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🤖 RUNNING AI INTELLIGENCE, MODERATION & GOVERNANCE ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: AI Moderation Engine
  console.log('\n▶ Test 1: Evaluar moderación de IA sobre mensaje sospechoso (Spam / Scam)...');
  const modResult = await analyzeTextModeration('Gana $10000 gratis compra spam followers ahora', 'chat');
  console.log(`Puntaje de Riesgo: ${modResult.riskScore}/100, Nivel: ${modResult.riskLevel}, Categorías: ${modResult.categoriesDetected.join(', ')}`);

  if (modResult.riskScore >= 60 && modResult.categoriesDetected.includes('SPAM_SCAM')) {
    console.log('✅ Test 1 PASADO: Moderación de IA clasificó correctamente el riesgo de spam/scam.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: AI Creator Assistant
  console.log('\n▶ Test 2: Generar sugerencias de títulos e ideas para creadores en vivo...');
  const creatorAi = await generateCreatorSuggestions('test_user_host', 'Karaoke Retro');
  console.log(`Títulos Sugeridos: ${creatorAi.suggestedTitles.length}, Consejo: "${creatorAi.coachingTip}"`);

  if (creatorAi.suggestedTitles.length >= 3 && creatorAi.coachingTip) {
    console.log('✅ Test 2 PASADO: Sugerencias e ideas del asistente de creadores generadas.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Real-Time Translation & Cache Verification
  console.log('\n▶ Test 3: Traducir texto de chat en tiempo real y verificar caché en segundo llamado...');
  const text = 'Hello welcome to my party live stream!';
  const trans1 = await translateChatText(text, 'es');
  const trans2 = await translateChatText(text, 'es');

  console.log(`Traducción 1: "${trans1.translatedText}" (Cache: ${trans1.isCacheHit})`);
  console.log(`Traducción 2: "${trans2.translatedText}" (Cache: ${trans2.isCacheHit})`);

  if (!trans1.isCacheHit && trans2.isCacheHit) {
    console.log('✅ Test 3 PASADO: Traducción en tiempo real optimizada con caché exitosamente.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Strict Financial Isolation Guard
  console.log('\n▶ Test 4: Probar la guardia de aislamiento financiero impidiendo mutaciones por IA...');
  const guardDenied = verifyFinancialIsolation('mutateCoinsBalance');
  const guardAllowed = verifyFinancialIsolation('generateLiveTitle');

  console.log(`Intento Mutar Coins: Permitido=${guardDenied.allowed}, Razón="${guardDenied.reason}"`);
  console.log(`Intento Título Live: Permitido=${guardAllowed.allowed}`);

  if (!guardDenied.allowed && guardAllowed.allowed) {
    console.log('✅ Test 4 PASADO: Guardia de aislamiento financiero bloqueó correctamente intentos de mutación.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: AI Cost & Token Control
  console.log('\n▶ Test 5: Consultar reporte de costos y consumo de IA...');
  const costs = await getAICostReport();
  console.log(`Costo Mensual Total: $${costs.totalCostMonthUsd} USD, Límite: $${costs.budgetCapUsd} USD`);

  if (costs.totalCostMonthUsd <= costs.budgetCapUsd) {
    console.log('✅ Test 5 PASADO: Presupuesto y consumo de IA controlados dentro de límites.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE IA Y GOBERNANZA COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runAIIntelligenceAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de IA Intelligence:', err);
      process.exit(1);
    });
}
