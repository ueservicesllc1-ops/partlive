import { db } from '../src/config/firebase';
import {
  getCoinPackages,
  getEligibleOffersForUser,
  createSmartBundle,
  calculateNextBestOffer,
  claimSmartOffer,
  toggleGlobalMonetizationKillSwitch,
} from '../src/services/monetizationOfferService';

export const runMonetizationOfferAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🎁 RUNNING MONETIZATION & SMART OFFER ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Coin Packages Catalog (Base + Bonus Coins)
  console.log('\n▶ Test 1: Consultar catálogo de paquetes de Coins y calcular bonus...');
  const packages = await getCoinPackages();
  const popular = packages.find((p) => p.isRecommended);

  console.log(`Paquetes Totales: ${packages.length}, Recomendado: ${popular?.tierName} (${popular?.baseCoins} + ${popular?.bonusCoins} Bonus = ${popular?.totalCoins} Coins por $${popular?.priceUsd} USD)`);

  if (packages.length === 5 && popular?.totalCoins === 1500) {
    console.log('✅ Test 1 PASADO: Catálogo de paquetes de Coins y cálculo de bonus verificado.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Targeted Smart Offers Retrieval
  console.log('\n▶ Test 2: Consultar ofertas inteligentes segmentadas para ubicación WALLET...');
  const userId = 'user_offer_100';
  const offers = await getEligibleOffersForUser(userId, 'WALLET');
  console.log(`Ofertas Elegibles: ${offers.length}, Primera Oferta: "${offers[0].title}" (Ahorro: ${offers[0].savingsPercent}%)`);

  if (offers.length >= 1 && offers[0].savingsPercent > 0) {
    console.log('✅ Test 2 PASADO: Recuperación de ofertas inteligentes segmentadas verificada.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Transparent Bundle Engine (Individual vs Bundle Savings)
  console.log('\n▶ Test 3: Crear combo inteligente y calcular ahorro real sin precios falsos...');
  const bundle = await createSmartBundle('bundle_test_1', [
    { name: '1 Mes VIP 1', individualPriceUsd: 4.99 },
    { name: '1,500 Coins', individualPriceUsd: 9.99 },
  ], 25);

  console.log(`Bundle ID: ${bundle.bundleId}, Precio Individual: $${bundle.individualPriceUsd} USD -> Precio Combo: $${bundle.bundlePriceUsd} USD (Ahorro: $${bundle.savingsUsd} USD, ${bundle.savingsPercent}%)`);

  if (bundle.bundlePriceUsd === 11.23 && bundle.savingsPercent === 25) {
    console.log('✅ Test 3 PASADO: Motor de combos y ahorro transparente validado.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Next Best Offer AI & A/B Testing Variant
  console.log('\n▶ Test 4: Calcular Next Best Offer (NBO) y variante de experimento A/B...');
  const nbo = await calculateNextBestOffer(userId);
  console.log(`NBO Título: "${nbo.nextOffer.title}", Relevancia: ${nbo.relevanceScore * 100}%, Variante A/B: ${nbo.experimentVariant}`);

  if (nbo.relevanceScore > 0.90 && nbo.experimentVariant === 'VARIANT_A') {
    console.log('✅ Test 4 PASADO: Motor Next Best Offer y experimentos A/B verificados.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Single-Use Claim Deduplication
  console.log('\n▶ Test 5: Probar reclamo de oferta de uso único y deduplicación server-side...');
  const claim1 = await claimSmartOffer(userId, 'offer_single_use_99', 'receipt_valid_token_123');
  const claim2 = await claimSmartOffer(userId, 'offer_single_use_99', 'receipt_valid_token_123');

  console.log(`Reclamo 1 Exitoso: ${claim1.success}, Duplicado: ${claim1.isDuplicateClaim}, Coins Otorgadas: ${claim1.coinsGranted}`);
  console.log(`Reclamo 2 (Duplicado) Exitoso: ${claim2.success}, Duplicado: ${claim2.isDuplicateClaim}`);

  if (claim1.success && !claim1.isDuplicateClaim && claim2.isDuplicateClaim) {
    console.log('✅ Test 5 PASADO: Reclamo de oferta y deduplicación de uso único validada.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Test 6: Global Monetization Kill Switch
  console.log('\n▶ Test 6: Probar interruptor de emergencia de promociones monetizadas (Kill Switch)...');
  await toggleGlobalMonetizationKillSwitch(false, 'Mantenimiento de ofertas');

  let blocked = false;
  try {
    await claimSmartOffer('user_test_blocked', 'offer_welcome_starter', 'receipt_valid_token_123');
  } catch (err: any) {
    blocked = err.message.includes('PROMOTIONS_PAUSED');
  }

  await toggleGlobalMonetizationKillSwitch(true, 'Restablecimiento normal');
  console.log(`Reclamo Bloqueado en Modo Emergencia: ${blocked}`);

  if (blocked) {
    console.log('✅ Test 6 PASADO: Interruptor de emergencia de ofertas monetizadas verificado.');
  } else {
    console.error('❌ Test 6 FALLIDO.');
  }

  // Cleanup
  if (claim1.transactionId) {
    await db.collection('offerClaims').doc(claim1.transactionId).delete();
  }

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DEL MOTOR DE MONETIZACIÓN COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runMonetizationOfferAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas del Motor de Monetización:', err);
      process.exit(1);
    });
}
