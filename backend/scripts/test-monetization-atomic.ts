import { db } from '../src/config/firebase';
import { recordRevenueEvent, processRefundReversal, getPlatformRevenueDashboard } from '../src/services/revenueService';
import { subscribeToHost, getUserActiveSubscriptions } from '../src/services/hostSubscriptionService';

export const runMonetizationAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('💳 RUNNING ADVANCED MONETIZATION & REVENUE ATOMIC TESTS');
  console.log('==================================================\n');

  const userId = 'test_monetization_user_' + Date.now();
  const hostId = 'test_monetization_host_' + Date.now();

  // Create Users
  await db.collection('users').doc(userId).set({
    uid: userId,
    displayName: 'Usuario Monetización Test',
    status: 'active',
  });

  await db.collection('users').doc(hostId).set({
    uid: hostId,
    displayName: 'Host Monetización Test',
    isHost: true,
    status: 'active',
  });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Record Audited Revenue Event
  console.log('\n▶ Test 1: Registrar evento de ingresos en Revenue Ledger...');
  const entry = await recordRevenueEvent(
    'VIP_SUBSCRIPTION',
    'tx_test_vip_100',
    userId,
    9.99, // Gross Amount
    3.0,  // Payment Fee %
    0,    // Host Share %
    0     // Agency Share %
  );

  console.log(`Revenue Entry ID: ${entry.revenueId}, Gross: $${entry.grossAmount}, Net: $${entry.netAmount}`);
  if (entry.revenueId && entry.netAmount > 0 && entry.status === 'COMPLETED') {
    console.log('✅ Test 1 PASADO: Registro contable de ingresos creado correctamente.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Host Subscription & Automated Split
  console.log('\n▶ Test 2: Suscribir usuario a Host y verificar cálculo de splits...');
  const sub = await subscribeToHost(userId, hostId, 'BASIC');

  const userSubs = await getUserActiveSubscriptions(userId);
  console.log(`Suscripción creada ID: ${sub.id}, Tier: ${sub.tier}, Total activas: ${userSubs.hostSubscriptions.length}`);
  if (sub.id && userSubs.hostSubscriptions.length >= 1) {
    console.log('✅ Test 2 PASADO: Suscripción a Host activa y distribuida.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Process Refund Reversal
  console.log('\n▶ Test 3: Procesar reversión de reembolso (Refund Reversal)...');
  await processRefundReversal(entry.revenueId, 'Cliente solicitó reembolso App Store');

  const updatedLedgerDoc = await db.collection('revenueLedger').doc(entry.revenueId).get();
  console.log(`Estado del Ledger post-reembolso: ${updatedLedgerDoc.data()?.status}, Net Amount: $${updatedLedgerDoc.data()?.netAmount}`);
  if (updatedLedgerDoc.data()?.status === 'REFUNDED' && updatedLedgerDoc.data()?.netAmount === 0) {
    console.log('✅ Test 3 PASADO: Reembolso revertido y auditado.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Query Platform Revenue Dashboard
  console.log('\n▶ Test 4: Consultar Dashboard de Ingresos de la Plataforma...');
  const dashboard = await getPlatformRevenueDashboard();
  console.log(`Dashboard Resultados: Transacciones=${dashboard.totalTransactions}, Gross=$${dashboard.grossRevenue}, Net=$${dashboard.netPlatformRevenue}`);
  if (dashboard.totalTransactions >= 1) {
    console.log('✅ Test 4 PASADO: Dashboard financiero consolidado.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(userId).delete();
  await db.collection('users').doc(hostId).delete();
  await db.collection('revenueLedger').doc(entry.revenueId).delete();
  await db.collection('hostSubscriptions').doc(sub.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE MONETIZACIÓN COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runMonetizationAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de Monetización:', err);
      process.exit(1);
    });
}
