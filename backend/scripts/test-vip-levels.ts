import { db } from '../src/config/firebase';
import { seedLevelsAndVipConfig } from '../src/seeds/seedLevelsAndVip';
import { addXpToUser } from '../src/services/levelService';
import { recalculateUserVip } from '../src/services/vipService';
import { createClub, joinClub } from '../src/services/clubService';
import { calculateHostSupporterStatus } from '../src/services/supporterService';

export const runVipAndLevelsTests = async () => {
  console.log('\n==================================================');
  console.log('👑 RUNNING VIP, LEVELS & CLUBS ATOMIC TESTS');
  console.log('==================================================\n');

  // 1. Seed Config
  await seedLevelsAndVipConfig();

  const userId = 'test_vip_user_' + Date.now();
  const hostId = 'test_vip_host_' + Date.now();

  // Create Test User & Host
  await db.collection('users').doc(userId).set({
    uid: userId,
    displayName: 'Usuario VIP Test',
    level: 1,
    xp: 0,
    vipLevel: 0,
    status: 'active',
  });

  await db.collection('users').doc(hostId).set({
    uid: hostId,
    displayName: 'Host VIP Test',
    isHost: true,
    status: 'active',
  });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Add XP and Level Up
  console.log('\n▶ Test 1: Otorgar XP y verificar subida de Nivel...');
  const xpResult = await addXpToUser(userId, 500, 'gift_sent');
  console.log(`Nuevo Nivel: ${xpResult.newLevel}, XP: ${xpResult.newXp}, Subió de nivel: ${xpResult.leveledUp}`);
  if (xpResult.newLevel > 1 && xpResult.leveledUp) {
    console.log('✅ Test 1 PASADO: XP y Nivel actualizados correctamente.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: VIP Calculation based on verified gift spend
  console.log('\n▶ Test 2: Registrar transacciones y recargar VIP...');
  const txRef = db.collection('giftTransactions').doc();
  await txRef.set({
    id: txRef.id,
    senderId: userId,
    receiverId: hostId,
    totalCoinsSpent: 600, // Threshold for VIP 2 (>= 500 coins)
    status: 'completed',
    createdAt: new Date(),
  });

  const vipResult = await recalculateUserVip(userId);
  console.log(`Gasto Calificado: ${vipResult.eligibleCoinsSpent} Coins, Nivel VIP: ${vipResult.vipLevel}`);
  if (vipResult.vipLevel >= 2) {
    console.log('✅ Test 2 PASADO: VIP Level 2 asignado por gasto verificado.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Create and Join VIP Club
  console.log('\n▶ Test 3: Crear Club VIP y unir miembro...');
  const club = await createClub(hostId, 'Club de Fans Oficial', 'Fan Club VIP');
  console.log(`Club Creado ID: ${club.id}, Miembros: ${club.memberCount}`);
  await joinClub(userId, club.id);

  const updatedClubDoc = await db.collection('clubs').doc(club.id).get();
  console.log(`Miembros actualizados en Club: ${updatedClubDoc.data()?.memberCount}`);
  if (updatedClubDoc.data()?.memberCount === 2) {
    console.log('✅ Test 3 PASADO: Miembro unido exitosamente al Club VIP.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Host Supporter Level
  console.log('\n▶ Test 4: Calcular Nivel de Supporter del Host...');
  const supporterTier = await calculateHostSupporterStatus(userId, hostId);
  console.log(`Tier de Apoyo: ${supporterTier.tierName} (${supporterTier.badge})`);
  if (supporterTier.tierName === 'Supporter') {
    console.log('✅ Test 4 PASADO: Tier de Supporter asignado correctamente.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(userId).delete();
  await db.collection('users').doc(hostId).delete();
  await db.collection('giftTransactions').doc(txRef.id).delete();
  await db.collection('clubs').doc(club.id).collection('members').doc(userId).delete();
  await db.collection('clubs').doc(club.id).collection('members').doc(hostId).delete();
  await db.collection('clubs').doc(club.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE VIP & NIVELES COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runVipAndLevelsTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de VIP/Niveles:', err);
      process.exit(1);
    });
}
