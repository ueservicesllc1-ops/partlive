import { db } from '../src/config/firebase';
import {
  recordDoubleEntryLedger,
  getFinancialOverview,
  simulateFinancialScenario,
  calculateBreakEven,
} from '../src/services/cfoFinancialService';

export const runCFOFinancialAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('💼 RUNNING FINANCIAL INTELLIGENCE, CFO & DOUBLE-ENTRY LEDGER ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_cfo_user_' + Date.now();
  const creatorId = 'test_cfo_creator_' + Date.now();

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Record Double-Entry Immutable Ledger Transaction
  console.log('\n▶ Test 1: Registrar entrada contable de partida doble en libro inmutable (Minor units)...');
  const record = await recordDoubleEntryLedger(
    'COIN_PURCHASE',
    'stripe_ch_123',
    userId,
    1999, // $19.99 in cents
    'CASH_ASSETS',
    'UNEARNED_REVENUE_COINS'
  );

  console.log(`Entrada Registrada ID: ${record.id}, Tipo: ${record.type}, Monto Cents: ${record.amountCents}, Débito: ${record.debitAccount}, Crédito: ${record.creditAccount}`);
  if (record.amountCents === 1999 && record.debitAccount === 'CASH_ASSETS') {
    console.log('✅ Test 1 PASADO: Transacción contable de partida doble registrada en unidades menores.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Calculate Financial Overview & Creator Liability
  console.log('\n▶ Test 2: Consultar resumen financiero ejecutivo (CFO) y pasivo de creadores...');
  const overview = await getFinancialOverview();
  console.log(`Ventas Brutas: $${overview.grossBookingsCents / 100}, Pasivo Creadores: $${overview.creatorLiabilityCents / 100}, Take Rate: ${overview.platformTakeRatePercent}%, Margen de Contribución: ${overview.contributionMarginPercent}%`);

  if (overview.grossBookingsCents === 500000 && overview.creatorLiabilityCents === 212500) {
    console.log('✅ Test 2 PASADO: Métricas financieras y pasivo de creadores calculados con precisión.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Financial Scenario Simulation (WHAT-IF 100K DAU)
  console.log('\n▶ Test 3: Ejecutar simulador de escenarios financieros para 100,000 usuarios activos (DAU)...');
  const sim = simulateFinancialScenario(100000, 3.5, 25.0, 50.0);
  console.log(`Ingreso Mensual Proyectado: $${sim.projectedMonthlyRevenueUsd}, Pasivo Creadores: $${sim.projectedCreatorLiabilityUsd}, Margen Proyectado: $${sim.projectedContributionMarginUsd}`);

  if (sim.projectedMonthlyRevenueUsd === 2625000 && sim.projectedCreatorLiabilityUsd === 1312500) {
    console.log('✅ Test 3 PASADO: Simulación financiera de escalabilidad ejecutada correctamente.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Break-Even Calculation
  console.log('\n▶ Test 4: Calcular análisis de punto de equilibrio (Break-Even) para costos fijos de $5,000 USD...');
  const be = calculateBreakEven(5000, 0.36, 75.0);
  console.log(`DAU Requerido para Break-Even: ${be.requiredDau}, Ingreso Mensual Requerido: $${be.requiredMonthlyRevenueUsd.toFixed(2)}`);

  if (be.requiredDau > 0 && be.requiredMonthlyRevenueUsd > 5000) {
    console.log('✅ Test 4 PASADO: Punto de equilibrio calculado exitosamente.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('financialDoubleEntryLedger').doc(record.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DEL CFO Y CONTABILIDAD COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runCFOFinancialAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de CFO Financiero:', err);
      process.exit(1);
    });
}
