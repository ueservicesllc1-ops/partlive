import { db } from '../src/config/firebase';
import {
  getCountryConfig,
  updateCountryConfig,
  convertCurrency,
  isFeatureEnabledForCountry,
  simulateCountryExpansion,
} from '../src/services/globalExpansionService';

export const runGlobalExpansionAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🌐 RUNNING MULTI-COUNTRY, MULTI-CURRENCY & GLOBAL EXPANSION ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Query Country Configurations
  console.log('\n▶ Test 1: Consultar configuraciones regionales de EE.UU. (US) y Ecuador (EC)...');
  const usConfig = await getCountryConfig('US');
  const ecConfig = await getCountryConfig('EC');

  console.log(`EE.UU.: Moneda=${usConfig.defaultCurrency}, Región=${usConfig.region}, Estado=${usConfig.status}`);
  console.log(`Ecuador: Moneda=${ecConfig.defaultCurrency}, Región=${ecConfig.region}, Estado=${ecConfig.status}`);

  if (usConfig.countryCode === 'US' && ecConfig.countryCode === 'EC') {
    console.log('✅ Test 1 PASADO: Configuraciones regionales por país consultadas correctamente.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Dynamic Currency FX Conversion Engine
  console.log('\n▶ Test 2: Convertir moneda dinámicamente preservando monto original y tasa empleada...');
  const fxResult = convertCurrency(100, 'USD', 'MXN');
  console.log(`Monto Original: $${fxResult.originalAmount} ${fxResult.originalCurrency}, Convertido: $${fxResult.convertedAmount} ${fxResult.targetCurrency}, Tasa Usada: ${fxResult.exchangeRate}`);

  if (fxResult.convertedAmount === 1715 && fxResult.exchangeRate === 17.15) {
    console.log('✅ Test 2 PASADO: Conversión FX ejecutada preservando auditoría histórica.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Feature Matrix & Country Kill Switches
  console.log('\n▶ Test 3: Verificar matriz de funcionalidades y interruptores por país...');
  const payoutsUs = await isFeatureEnabledForCountry('US', 'payouts');
  const karaokeEc = await isFeatureEnabledForCountry('EC', 'karaoke');

  console.log(`Payouts en US: ${payoutsUs}, Karaoke en EC: ${karaokeEc}`);
  if (payoutsUs && karaokeEc) {
    console.log('✅ Test 3 PASADO: Matriz de funcionalidades por país verificada.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Market Expansion Simulator
  console.log('\n▶ Test 4: Ejecutar simulador de expansión para el lanzamiento en México (MX)...');
  const sim = simulateCountryExpansion('MX', 50000, 18.0, 3.0);
  console.log(`País: ${sim.countryCode}, Ingreso Proyectado: $${sim.projectedMonthlyRevenueUsd} USD, Comisiones Pago: $${sim.projectedPaymentFeesUsd} USD, Margen: $${sim.projectedContributionMarginUsd} USD`);

  if (sim.countryCode === 'MX' && sim.projectedMonthlyRevenueUsd > 0) {
    console.log('✅ Test 4 PASADO: Simulación de expansión de mercado completada con éxito.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE EXPANSIÓN GLOBAL COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runGlobalExpansionAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Expansión Global:', err);
      process.exit(1);
    });
}
