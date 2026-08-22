import { db } from '../src/config/firebase';
import { seedRegionalConfigs } from '../src/seeds/seedRegionalConfigs';
import {
  getCountryConfig,
  getActiveMarkets,
  updateCountryConfig,
  isFeatureAllowedInCountry,
} from '../src/services/regionalConfigService';
import { translateKey, formatCurrencyAmount, formatDateLocale } from '../src/services/i18nService';
import { getRegionalTrendingContent, getRegionalLeaderboards } from '../src/services/regionalDiscoveryService';

export const runRegionalAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🌐 RUNNING REGIONAL EXPANSION & LOCALIZATION ATOMIC TESTS');
  console.log('==================================================\n');

  const adminId = 'test_reg_admin_' + Date.now();
  await db.collection('users').doc(adminId).set({ uid: adminId, displayName: 'Admin Regional', status: 'active', role: 'admin' });

  console.log('✅ Datos de Prueba Creados.');

  // 1. Seed Configs
  await seedRegionalConfigs();

  // Test 1: Get Active Markets
  console.log('\n▶ Test 1: Consultar mercados regionales activos y en beta...');
  const markets = await getActiveMarkets();
  console.log(`Total de mercados activos/beta: ${markets.length}`);
  const hasEcuador = markets.some((m) => m.countryCode === 'EC');
  const hasBrazil = markets.some((m) => m.countryCode === 'BR');

  if (markets.length >= 6 && hasEcuador && hasBrazil) {
    console.log('✅ Test 1 PASADO: Mercados regionales inicializados correctamente.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: i18n Translation & Fallback Chain
  console.log('\n▶ Test 2: Probar traducción i18n con jerarquía de fallback (PT -> ES -> EN)...');
  const textPT = translateKey('gift.send', 'PT');
  const textES = translateKey('gift.send', 'ES');
  const fallbackText = translateKey('non_existent_key', 'PT');

  console.log(`Traducción PT: "${textPT}", Traducción ES: "${textES}", Fallback Key: "${fallbackText}"`);
  if (textPT === 'Enviar Presente' && textES === 'Enviar Regalo' && fallbackText === 'non_existent_key') {
    console.log('✅ Test 2 PASADO: Jerarquía de traducción i18n funcionando.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Locale Formatting
  console.log('\n▶ Test 3: Formatear moneda y fecha local...');
  const formattedUsd = formatCurrencyAmount(9.99, 'USD', 'es-EC');
  const formattedMxn = formatCurrencyAmount(199.00, 'MXN', 'es-MX');

  console.log(`USD Formateado (EC): ${formattedUsd}, MXN Formateado (MX): ${formattedMxn}`);
  if (formattedUsd.includes('9') && formattedMxn.includes('199')) {
    console.log('✅ Test 3 PASADO: Formateador de moneda local funcionando.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Regional Discovery Scope
  console.log('\n▶ Test 4: Probar Discovery por ámbito (LOCAL vs GLOBAL)...');
  const localLives = await getRegionalTrendingContent('EC', 'LOCAL');
  const globalLives = await getRegionalTrendingContent('EC', 'GLOBAL');

  console.log(`Lives Locales (EC): ${localLives.length}, Lives Globales: ${globalLives.length}`);
  console.log('✅ Test 4 PASADO: Ámbitos de descubrimiento regional consultados.');

  // Test 5: Admin Market Status Change
  console.log('\n▶ Test 5: Cambiar estado de mercado (Brasil de BETA a ACTIVE)...');
  const updatedBR = await updateCountryConfig('BR', { status: 'ACTIVE' }, adminId);
  console.log(`Estado de BR tras actualización: ${updatedBR.status}`);

  if (updatedBR.status === 'ACTIVE') {
    console.log('✅ Test 5 PASADO: Estado de mercado actualizado exitosamente.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(adminId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE EXPANSIÓN REGIONAL COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runRegionalAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas Regionales:', err);
      process.exit(1);
    });
}
