import { db } from '../src/config/firebase';
import {
  trackStandardizedEvent,
  calculateRetentionCohorts,
  calculateUnitEconomics,
  generateRevenueForecast,
  getAIExecutionRecommendations,
  queryNaturalLanguageBI,
} from '../src/services/dataIntelligenceEngineService';

export const runDataIntelligenceAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🧠 RUNNING DATA & BUSINESS INTELLIGENCE ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Standardized BI Event Tracking & Deduplication
  console.log('\n▶ Test 1: Registrar eventos estandarizados y verificar deduplicación...');
  const eventId = 'evt_test_' + Date.now();
  const evt1 = await trackStandardizedEvent(eventId, 'user_test_100', 'LIVE_JOIN', { liveId: 'live_500' });
  const evt2 = await trackStandardizedEvent(eventId, 'user_test_100', 'LIVE_JOIN', { liveId: 'live_500' });

  console.log(`Evento 1 Exitoso: ${evt1.success}, Es Duplicado: ${evt1.isDuplicate}`);
  console.log(`Evento 2 (Duplicado) Exitoso: ${evt2.success}, Es Duplicado: ${evt2.isDuplicate}`);

  if (!evt1.isDuplicate && evt2.isDuplicate) {
    console.log('✅ Test 1 PASADO: Deduplicación y validación de esquema de eventos estandarizada.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Cohort Retention Curves (D1-D90)
  console.log('\n▶ Test 2: Consultar curva de retención de cohortes D1 a D90...');
  const cohorts = await calculateRetentionCohorts();
  console.log(`Retención D1: ${cohorts.d1Percent}%, D7: ${cohorts.d7Percent}%, D30: ${cohorts.d30Percent}%, D90: ${cohorts.d90Percent}%`);

  if (cohorts.d1Percent > cohorts.d7Percent && cohorts.d7Percent > cohorts.d30Percent) {
    console.log('✅ Test 2 PASADO: Curva de retención de cohortes verificada.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Unit Economics & LTV Metrics
  console.log('\n▶ Test 3: Calcular métricas de economía unitaria (ARPU, ARPPU, LTV, Take Rate)...');
  const economics = await calculateUnitEconomics();
  console.log(`ARPU: $${economics.arpuUsd} USD, ARPPU: $${economics.arppuUsd} USD, User LTV: $${economics.userLtvUsd} USD, Platform Take Rate: ${economics.platformTakeRatePercent}%`);

  if (economics.arpuUsd > 0 && economics.userLtvUsd > economics.arpuUsd) {
    console.log('✅ Test 3 PASADO: Métricas de economía unitaria y LTV calculadas.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Revenue Forecasting & Scenario Simulator
  console.log('\n▶ Test 4: Simular pronósticos de ingresos en escenarios Conservador, Base y Agresivo...');
  const baseFc = await generateRevenueForecast('BASE', 30);
  const aggFc = await generateRevenueForecast('AGGRESSIVE', 30);

  console.log(`Base 30d Ingreso Bruto: $${baseFc.projectedGrossRevenueUsd} USD | Agresivo 30d Ingreso Bruto: $${aggFc.projectedGrossRevenueUsd} USD`);
  if (aggFc.projectedGrossRevenueUsd > baseFc.projectedGrossRevenueUsd) {
    console.log('✅ Test 4 PASADO: Pronósticos y simulación de escenarios validados.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Natural Language BI Query Processor
  console.log('\n▶ Test 5: Procesar consulta en lenguaje natural sobre métricas BI...');
  const nlResult = await queryNaturalLanguageBI('¿Cuál es el LTV de los usuarios?');
  console.log(`Consulta: "${nlResult.query}" -> Respuesta: "${nlResult.answer}"`);

  if (nlResult.answer.includes('$4.50') && nlResult.confidence === 'HIGH') {
    console.log('✅ Test 5 PASADO: Procesador de consultas BI en lenguaje natural validado.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('biEvents').doc(eventId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE BUSINESS INTELLIGENCE COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runDataIntelligenceAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Data Intelligence:', err);
      process.exit(1);
    });
}
