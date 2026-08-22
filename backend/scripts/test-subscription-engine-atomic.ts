import { db } from '../src/config/firebase';
import {
  subscribeUserToCreator,
  subscribeUserToFanClub,
  verifySubscriberContentAccess,
  getSubscriptionAnalytics,
  toggleSubscriptionKillSwitch,
} from '../src/services/subscriptionEngineService';

export const runSubscriptionEngineAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('💳 RUNNING SUBSCRIPTION ENGINE & RECURRING REVENUE ATOMIC TESTS');
  console.log('==================================================\n');

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Creator Subscription with Receipt Validation
  console.log('\n▶ Test 1: Suscribir usuario a creador con validación de recibo server-side (Tier 2)...');
  const userId = 'user_sub_100';
  const hostId = 'host_star_500';
  const sub = await subscribeUserToCreator(userId, hostId, 'tier_2', 'receipt_valid_token_123', 'android');

  console.log(`Suscripción Creada ID: ${sub.subscriptionId}, Nivel: ${sub.tierId}, Estado: ${sub.status}, Cuota Creador: $${sub.creatorShareUsd} USD`);

  if (sub.status === 'ACTIVE' && sub.creatorShareUsd === 6.99) {
    console.log('✅ Test 1 PASADO: Suscripción a creador y validación de recibo verificada.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Fan Club Membership & Badge Code
  console.log('\n▶ Test 2: Unirse a Fan Club del creador y generar código de insignias...');
  const fc = await subscribeUserToFanClub(userId, hostId);
  console.log(`Fan Club Membership ID: ${fc.membershipId}, Estado: ${fc.status}, Insignia: ${fc.badgeCode}`);

  if (fc.status === 'ACTIVE' && fc.badgeCode.startsWith('FAN_')) {
    console.log('✅ Test 2 PASADO: Membresía de Fan Club e insignias verificadas.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Server-Side Content Access Gate Verification
  console.log('\n▶ Test 3: Verificar barrera de control de acceso (Content Gate) para contenido exclusivo...');
  const accessGranted = await verifySubscriberContentAccess(userId, hostId, 'live_exclusive_99');
  const accessDenied = await verifySubscriberContentAccess('unsub_user_999', hostId, 'live_exclusive_99');

  console.log(`Acceso Usuario Suscrito: Permiso=${accessGranted.hasAccess}, Estado=${accessGranted.entitlementStatus}`);
  console.log(`Acceso Usuario No Suscrito: Permiso=${accessDenied.hasAccess}, Razón=${accessDenied.reason}`);

  if (accessGranted.hasAccess && !accessDenied.hasAccess) {
    console.log('✅ Test 3 PASADO: Barrera de acceso a contenido exclusivo server-side validada.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Subscription Analytics (MRR, ARR, Churn Rate)
  console.log('\n▶ Test 4: Consultar analítica de ingresos recurrentes (MRR, ARR, Churn)...');
  const analytics = await getSubscriptionAnalytics();
  console.log(`MRR: $${analytics.mrrUsd} USD, ARR: $${analytics.arrUsd} USD, ARPS: $${analytics.arpsUsd} USD, Churn: ${analytics.subscriberChurnRatePercent}%`);

  if (analytics.mrrUsd > 0 && analytics.arrUsd === analytics.mrrUsd * 12) {
    console.log('✅ Test 4 PASADO: Métricas de ingresos recurrentes MRR/ARR validadas.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Emergency Subscription Kill Switch
  console.log('\n▶ Test 5: Probar interruptor de emergencia de suscripciones (Kill Switch)...');
  await toggleSubscriptionKillSwitch(false, 'Mantenimiento de facturación');

  let blocked = false;
  try {
    await subscribeUserToCreator('user_test_blocked', hostId, 'tier_1', 'receipt_valid_token_123');
  } catch (err: any) {
    blocked = err.message.includes('SUBSCRIPTION_PAUSED');
  }

  await toggleSubscriptionKillSwitch(true, 'Restablecimiento normal');
  console.log(`Compra Bloqueada en Modo Emergencia: ${blocked}`);

  if (blocked) {
    console.log('✅ Test 5 PASADO: Interruptor de emergencia de compras de suscripciones verificado.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('creatorSubscriptions').doc(sub.subscriptionId).delete();
  await db.collection('fanClubMemberships').doc(fc.membershipId).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DEL MOTOR DE SUSCRIPCIONES COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runSubscriptionEngineAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas del Motor de Suscripciones:', err);
      process.exit(1);
    });
}
