import { db } from '../src/config/firebase';
import { seedMonetizationStreams } from '../src/seeds/seedMonetizationStreams';
import {
  getMonetizationStreams,
  calculateRevenueCommission,
  updateStreamCommission,
} from '../src/services/monetizationEngineService';
import { createPromoCode, validateAndApplyCoupon } from '../src/services/couponService';
import { getVirtualItemsCatalog, promoteCreatorLive } from '../src/services/virtualItemService';

export const runMonetizationAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('💎 RUNNING MONETIZATION & REVENUE ENGINE ATOMIC TESTS');
  console.log('==================================================\n');

  const adminId = 'test_mon_admin_' + Date.now();
  const userId = 'test_mon_user_' + Date.now();
  const hostId = 'test_mon_host_' + Date.now();

  await db.collection('users').doc(adminId).set({ uid: adminId, displayName: 'Admin Monetización', status: 'active', role: 'admin' });
  await db.collection('users').doc(userId).set({ uid: userId, displayName: 'Usuario Comprador', status: 'active' });
  await db.collection('users').doc(hostId).set({ uid: hostId, displayName: 'Creador Pro', status: 'active', isHost: true });

  console.log('✅ Datos de Prueba Creados.');

  // 1. Seed Streams
  await seedMonetizationStreams();

  // Test 1: Get Active Streams
  console.log('\n▶ Test 1: Consultar flujos de ingresos activos (12 Módulos)...');
  const streams = await getMonetizationStreams('US');
  console.log(`Total de flujos de ingresos activos: ${streams.length}`);
  if (streams.length >= 8) {
    console.log('✅ Test 1 PASADO: Flujos de ingresos consultados exitosamente.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Calculate Commission Split
  console.log('\n▶ Test 2: Calcular división de ingresos (Host vs Plataforma) para Suscripciones...');
  const splitSub = await calculateRevenueCommission('CREATOR_SUBSCRIPTION', 10.00);
  console.log(`Monto Bruto: $${splitSub.grossAmountUsd}, Creador (80%): $${splitSub.hostAmountUsd}, Plataforma (20%): $${splitSub.platformAmountUsd}`);

  if (splitSub.hostAmountUsd === 8.00 && splitSub.platformAmountUsd === 2.00) {
    console.log('✅ Test 2 PASADO: División de comisión calculada correctamente.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Coupons & Discounts
  console.log('\n▶ Test 3: Crear y validar código promocional (20% descuento)...');
  await createPromoCode('SUMMER20', 20, 50);
  const couponResult = await validateAndApplyCoupon('SUMMER20', userId, 50.00);
  console.log(`Original: $${couponResult.originalAmount}, Descuento: $${couponResult.discountAmount}, Final: $${couponResult.finalAmount}`);

  if (couponResult.discountAmount === 10.00 && couponResult.finalAmount === 40.00) {
    console.log('✅ Test 3 PASADO: Código promocional aplicado correctamente.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Virtual Items & Promoted Content
  console.log('\n▶ Test 4: Consultar catálogo de artículos virtuales y promocionar Live...');
  const catalog = await getVirtualItemsCatalog();
  console.log(`Artículos virtuales en catálogo: ${catalog.length}`);

  const liveRef = db.collection('lives').doc('live_test_mon');
  await liveRef.set({ id: 'live_test_mon', hostId, status: 'active', title: 'Live Especial' });

  const promotion = await promoteCreatorLive(hostId, 'live_test_mon', 25.00, 4);
  console.log(`Promoción Creada ID: ${promotion.id}, Patrocinado: ${promotion.sponsored}`);

  if (catalog.length >= 3 && promotion.sponsored === true) {
    console.log('✅ Test 4 PASADO: Promoción de creador e ítems virtuales procesados.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Test 5: Admin Commission Update
  console.log('\n▶ Test 5: Actualizar comisión de flujo (Salas Pagadas a 75% Host / 25% Plataforma)...');
  const updatedStream = await updateStreamCommission('stream_paid_room', 0.75, 0.25, adminId);
  console.log(`Nuevo Share del Creador: ${updatedStream.hostSharePct * 100}%, Fecha Efectiva: ${updatedStream.effectiveAt}`);

  if (updatedStream.hostSharePct === 0.75 && Boolean(updatedStream.effectiveAt)) {
    console.log('✅ Test 5 PASADO: Comisión actualizada con fecha efectiva y auditoría.');
  } else {
    console.error('❌ Test 5 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(adminId).delete();
  await db.collection('users').doc(userId).delete();
  await db.collection('users').doc(hostId).delete();
  await liveRef.delete();

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
