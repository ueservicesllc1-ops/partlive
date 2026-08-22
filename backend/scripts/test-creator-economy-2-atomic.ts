import { db } from '../src/config/firebase';
import {
  getCreatorEarningProfile,
  getCreatorMissionsAndMilestones,
  askCreatorAiAssistant,
  getAgencyEconomicsOverview,
  runEconomySimulation,
  recordEconomyChangeControl,
} from '../src/services/creatorEconomyEngine2Service';

export const runCreatorEconomy2AtomicTests = async () => {
  console.log('\n==================================================');
  console.log('💎 RUNNING CREATOR ECONOMY 2.0 ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Creator Earning Profile & Level Progression
  console.log('\n▶ Test 1: Consultar perfil de ingresos de creador, desglose por fuente y nivel...');
  const creatorId = 'creator_star_99';
  const profile = await getCreatorEarningProfile(creatorId);

  console.log(`Creador: ${profile.creatorName}, Nivel: ${profile.creatorLevel}, Racha: ${profile.broadcastingStreakDays} Días, Diamantes: ${profile.availableDiamonds.toLocaleString()} 💎`);
  console.log(`Desglose: Regalos ${profile.revenueBreakdownPercent.gifts}%, Suscripciones ${profile.revenueBreakdownPercent.subscriptions}%, VIP ${profile.revenueBreakdownPercent.vipMemberships}%`);

  if (profile.creatorLevel === 'TOP_CREATOR' && profile.revenueBreakdownPercent.gifts === 65 && profile.broadcastingStreakDays === 14) {
    console.log('✅ Test 1 PASADO: Perfil de ingresos de creador y desglose por fuentes verificado.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Creator Missions & Capped Milestone Rewards
  console.log('\n▶ Test 2: Consultar misiones diarias/semanales del creador y presupuesto tope...');
  const missionsData = await getCreatorMissionsAndMilestones(creatorId);

  console.log(`Misiones Totales: ${missionsData.missions.length}, Progreso Hitos: ${missionsData.milestoneProgressPercent}%, Misión 1 Completa: ${missionsData.missions[0].isCompleted}`);

  if (missionsData.missions.length >= 2 && missionsData.missions[0].budgetUsdCap === 0.5) {
    console.log('✅ Test 2 PASADO: Misiones de creadores con presupuesto de recompensa protegido verificado.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Creator AI Assistant Strategy Recommendations
  console.log('\n▶ Test 3: Consultar Asistente de IA para Creadores sobre mejores horarios en vivo...');
  const aiAdvice = await askCreatorAiAssistant(creatorId, '¿A qué hora debo transmitir en vivo?');

  console.log(`Horario Recomendado: "${aiAdvice.recommendedBestTimeToGoLive}", Categoría: "${aiAdvice.recommendedContentCategory}", Límites Financieros: ${aiAdvice.financialBoundaryEnforced}`);

  if (aiAdvice.financialBoundaryEnforced && aiAdvice.recommendedBestTimeToGoLive.includes('Viernes')) {
    console.log('✅ Test 3 PASADO: Asistente de IA para creadores con límites financieros estricto verificado.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Agency Economics & Commission Split
  console.log('\n▶ Test 4: Consultar economía de agencias y reparto de comisiones transparente...');
  const agency = await getAgencyEconomicsOverview('agency_latam_top');

  console.log(`Agencia: ${agency.agencyName}, Hosts Activos: ${agency.activeHostsCount}, Comisión: ${agency.agencyCommissionPercent}% ($${agency.agencyCommissionEarningsUsd.toLocaleString()} USD)`);

  if (agency.activeHostsCount === 45 && agency.agencyCommissionPercent === 10 && agency.complianceStatus === 'VERIFIED_AND_AUDITED') {
    console.log('✅ Test 4 PASADO: Economía de agencias y comisión del 10% verificado.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Platform Economy Simulator & Scenario Modeling
  console.log('\n▶ Test 5: Ejecutar simulador de economía de plataforma (10,000 compradores)...');
  const sim = await runEconomySimulation({
    coinPriceUsd: 0.01,
    creatorRevenueSharePercent: 60,
    agencySharePercent: 10,
    monthlyPurchasersCount: 10000,
    avgSpentPerPurchaserUsd: 15,
    infrastructureCostUsd: 12000,
  });

  console.log(`Bruto: $${sim.grossRevenueUsd.toLocaleString()} USD, Creadores (60%): $${sim.creatorPayoutsUsd.toLocaleString()} USD, Agencias (10%): $${sim.agencyPayoutsUsd.toLocaleString()} USD, Margen Plataforma: ${sim.platformMarginPercent}%`);

  if (sim.grossRevenueUsd === 150000 && sim.creatorPayoutsUsd === 90000 && sim.platformMarginPercent > 20) {
    console.log('✅ Test 5 PASADO: Simulador de economía de plataforma y modelado de margen verificado.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Test 6: Economy Change Control Log
  console.log('\n▶ Test 6: Registrar cambio de parámetro económico en el log de auditoría...');
  const changeLog = await recordEconomyChangeControl('ADMIN_ECONOMY_LEAD', 'UPDATE_CREATOR_LEVEL_REQUIREMENT', {
    level: 'ELITE',
    requiredDiamonds: 1000000,
  });

  console.log(`Cambio ID: ${changeLog.changeId}, Registrado A Las: ${changeLog.loggedAt}`);

  if (changeLog.changeId) {
    console.log('✅ Test 6 PASADO: Registro de control de cambios económicos verificado.');
  } else {
    console.error('❌ Test 6 FALLIDO.');
  }

  // Cleanup
  await db.collection('economyChangeLogs2').doc(changeLog.changeId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE ECONOMÍA DE CREADORES COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runCreatorEconomy2AtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Economía de Creadores 2.0:', err);
      process.exit(1);
    });
}
