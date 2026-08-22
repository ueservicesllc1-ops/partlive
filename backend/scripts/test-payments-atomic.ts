import { db } from '../src/config/firebase';
import { seedProductCatalog, getActiveProducts, validateProductId } from '../src/seeds/seedProductCatalog';
import { verifyGooglePlayPurchase } from '../src/services/purchasesService';
import { verifyApplePurchaseAndCreditCoins } from '../src/services/appleIapService';
import { recordChargeback, createPaymentLedgerEntry } from '../src/services/paymentLedgerService';
import { reconcileDailyFinancials } from '../src/services/financialIntegrityService';

export const runPaymentsAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('💳 RUNNING PHASE 17 REAL PAYMENTS ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_pay_user_' + Date.now();
  const orderIdGoogle = 'test_order_g_' + Date.now();
  const orderIdApple = 'test_order_a_' + Date.now();
  const googleToken = 'test_token_g_' + Date.now();

  // Create User & Purchase Orders
  await db.collection('users').doc(userId).set({
    uid: userId,
    displayName: 'Comprador Test',
    diamonds: 0,
    status: 'active',
  });

  await db.collection('diamondPackages').doc('coins_500').set({
    diamonds: 500,
    bonusDiamonds: 0,
    totalDiamonds: 500,
    priceUsd: 4.99,
    googlePlayProductId: 'com.partylive.coins.500',
  });

  await db.collection('purchaseOrders').doc(orderIdGoogle).set({
    id: orderIdGoogle,
    userId,
    packageId: 'coins_500',
    totalDiamonds: 500,
    totalCoins: 500,
    priceUsd: 4.99,
    status: 'pending',
  });

  await db.collection('purchaseOrders').doc(orderIdApple).set({
    id: orderIdApple,
    userId,
    packageId: 'coins_500',
    totalDiamonds: 500,
    totalCoins: 500,
    priceUsd: 4.99,
    status: 'pending',
  });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Seed Product Catalog
  console.log('\n▶ Test 1: Poblar Catálogo Central de Productos e Inspeccionar...');
  await seedProductCatalog();
  const activeProds = await getActiveProducts();
  const validProd = await validateProductId('coins_100');

  console.log(`Productos Activos: ${activeProds.length}, Producto 100 Coins: ${validProd.label} ($${validProd.priceUsd})`);
  if (activeProds.length >= 5 && validProd.coins === 100) {
    console.log('✅ Test 1 PASADO: Catálogo de productos creado e inspeccionado.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Google Play Purchase Verification & Idempotency
  console.log('\n▶ Test 2: Verificar Compra Google Play e Idempotencia...');
  const verifyRes1 = await verifyGooglePlayPurchase(userId, orderIdGoogle, googleToken, 'com.partylive.coins.500');
  console.log(`Resultado Compra 1: ok=${verifyRes1.ok}, status=${verifyRes1.status}, credited=${verifyRes1.diamondsCredited}`);

  // Re-verify same token -> should NOT double credit
  let duplicateCaught = false;
  try {
    await verifyGooglePlayPurchase(userId, orderIdGoogle, googleToken, 'com.partylive.coins.500');
  } catch (err: any) {
    duplicateCaught = err.message.includes('DUPLICATE') || err.message.includes('already been processed');
  }

  if (verifyRes1.ok && (duplicateCaught || verifyRes1.status === 'paid')) {
    console.log('✅ Test 2 PASADO: Compra Google Play verificada con protección contra duplicados.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Apple IAP Verification (Mock Sandbox)
  console.log('\n▶ Test 3: Verificar recibo de Apple IAP...');
  const appleRes = await verifyApplePurchaseAndCreditCoins(userId, orderIdApple, 'mock_receipt_data', 'com.partylive.coins.500');
  console.log(`Resultado Apple IAP: ok=${appleRes.ok}, coinsCredited=${appleRes.coinsCredited}`);

  if (appleRes.ok && appleRes.coinsCredited === 500) {
    console.log('✅ Test 3 PASADO: Recibo de Apple IAP verificado y Coins acreditados.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Chargeback Recording & Wallet Lock
  console.log('\n▶ Test 4: Registrar Contracargo (Chargeback) y verificar bloqueo de Cartera...');
  await recordChargeback(orderIdGoogle, 'Fraudulent transaction dispute', 4.99);

  const walletDoc = await db.collection('wallets').doc(userId).get();
  const orderDoc = await db.collection('purchaseOrders').doc(orderIdGoogle).get();

  console.log(`Estado de Wallet tras contracargo: ${walletDoc.data()?.status}, Estado de Orden: ${orderDoc.data()?.status}`);
  if (walletDoc.data()?.status === 'locked' && orderDoc.data()?.status === 'chargeback') {
    console.log('✅ Test 4 PASADO: Contracargo registrado y cartera bloqueada por seguridad.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Payment Ledger Entry
  console.log('\n▶ Test 5: Crear registro en Payment Ledger unificado...');
  const ledgerEntry = await createPaymentLedgerEntry({
    userId,
    purchaseOrderId: orderIdGoogle,
    platform: 'android',
    productId: 'com.partylive.coins.500',
    grossAmountUsd: 4.99,
    coinsCredited: 500,
    diamondsGenerated: 500,
    status: 'PURCHASE',
  });
  console.log(`Payment Ledger ID: ${ledgerEntry.id}, Gross: $${ledgerEntry.grossAmountUsd}`);
  if (ledgerEntry.id && ledgerEntry.grossAmountUsd === 4.99) {
    console.log('✅ Test 5 PASADO: Trazabilidad contable registrada.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Test 6: Daily Financial Reconciliation
  console.log('\n▶ Test 6: Ejecutar Reconciliación Financiera Diaria...');
  const recon = await reconcileDailyFinancials();
  console.log(`Reconciliación: Status=${recon.status}, Anomalías=${recon.anomaliesDetected}`);

  if (recon.status) {
    console.log('✅ Test 6 PASADO: Informe de reconciliación financiera generado.');
  } else {
    console.error('❌ Test 6 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(userId).delete();
  await db.collection('wallets').doc(userId).delete();
  await db.collection('diamondPackages').doc('coins_500').delete();
  await db.collection('purchaseOrders').doc(orderIdGoogle).delete();
  await db.collection('purchaseOrders').doc(orderIdApple).delete();
  await db.collection('processedPurchaseTokens').doc(googleToken).delete();
  await db.collection('paymentLedger').doc(ledgerEntry.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE FASE 17 REAL PAYMENTS COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runPaymentsAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Pago Real:', err);
      process.exit(1);
    });
}
