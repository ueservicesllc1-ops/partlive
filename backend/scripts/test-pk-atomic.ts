import { db } from '../src/config/firebase';
import {
  inviteHostToPk,
  acceptPkInvite,
  finishPkBattle,
} from '../src/services/pkBattleService';
import { sendGiftWithWallet } from '../src/services/giftWalletService';
import { initializeEconomyConfig } from '../src/config/economyConfig';

export const runPkBattleTests = async () => {
  console.log('\n==================================================');
  console.log('⚔️ RUNNING PK BATTLE ATOMIC VERIFICATION TESTS');
  console.log('==================================================\n');

  await initializeEconomyConfig();

  const hostAId = 'test_pk_hostA_' + Date.now();
  const hostBId = 'test_pk_hostB_' + Date.now();
  const liveAId = 'test_pk_liveA_' + Date.now();
  const liveBId = 'test_pk_liveB_' + Date.now();
  const senderId = 'test_pk_sender_' + Date.now();

  // 1. Create Test Users & Lives
  await db.collection('users').doc(hostAId).set({
    uid: hostAId,
    displayName: 'Anfitrión Alfa',
    isHost: true,
    role: 'host',
    status: 'active',
  });

  await db.collection('users').doc(hostBId).set({
    uid: hostBId,
    displayName: 'Anfitrión Beta',
    isHost: true,
    role: 'host',
    status: 'active',
  });

  await db.collection('users').doc(senderId).set({
    uid: senderId,
    displayName: 'Espectador Generoso',
    coins: 1000,
    coinsBalance: 1000,
  });

  await db.collection('wallets').doc(senderId).set({
    userId: senderId,
    coins: 1000,
    coinsBalance: 1000,
    status: 'active',
  });

  await db.collection('wallets').doc(hostAId).set({
    userId: hostAId,
    diamonds: 0,
    availableDiamonds: 0,
    status: 'active',
  });

  await db.collection('wallets').doc(hostBId).set({
    userId: hostBId,
    diamonds: 0,
    availableDiamonds: 0,
    status: 'active',
  });

  await db.collection('lives').doc(liveAId).set({
    id: liveAId,
    hostId: hostAId,
    status: 'live',
    title: 'Transmisión Alfa',
    isInPkBattle: false,
  });

  await db.collection('lives').doc(liveBId).set({
    id: liveBId,
    hostId: hostBId,
    status: 'live',
    title: 'Transmisión Beta',
    isInPkBattle: false,
  });

  await db.collection('gifts').doc('gift_fire_pk_test').set({
    id: 'gift_fire_pk_test',
    name: 'Fuego PK',
    coinCost: 20,
    diamondReward: 20,
    priceDiamonds: 20,
    beansValue: 20,
    isActive: true,
    sortOrder: 1,
    imageUrl: 'https://example.com/fire.png',
  });

  console.log('✅ Datos de Prueba Creados.');

  // Test 1: Invite Host
  console.log('\n▶ Test 1: Anfitrión Alfa invita a Anfitrión Beta...');
  const invite = await inviteHostToPk(hostAId, hostBId, liveAId, '¿Listos para el duelo?');
  console.log(`Invite creado ID: ${invite.id}, status: ${invite.status}`);
  if (invite.status === 'pending') {
    console.log('✅ Test 1 PASADO: Invitación creada en estado pending.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Accept Invite
  console.log('\n▶ Test 2: Anfitrión Beta acepta la invitación...');
  const activeBattle = await acceptPkInvite(hostBId, invite.id, liveBId);
  console.log(`Batalla PK ID: ${activeBattle.id}, status: ${activeBattle.status}`);
  if (activeBattle.status === 'active') {
    console.log('✅ Test 2 PASADO: Batalla activa iniciada.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Send Gift during PK to Host A
  console.log('\n▶ Test 3: Espectador envía regalo a Anfitrión Alfa durante la PK...');
  await sendGiftWithWallet({
    targetType: 'live',
    targetId: liveAId,
    senderId,
    receiverId: hostAId,
    giftId: 'gift_fire_pk_test',
    quantity: 5, // 5 x 20 = 100 Diamonds
  });

  const battleDocA = await db.collection('pkBattles').doc(activeBattle.id).get();
  const battleDataA = battleDocA.data();
  console.log(`Score Host A: ${battleDataA?.hostAScore} (Esperado 100), Score Host B: ${battleDataA?.hostBScore} (Esperado 0)`);
  if (battleDataA?.hostAScore === 100 && battleDataA?.hostBScore === 0) {
    console.log('✅ Test 3 PASADO: Puntuación de Host A actualizada en tiempo real.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Finish Battle & Winner Calculation
  console.log('\n▶ Test 4: Finalizar Batalla PK y calcular ganador...');
  const finishedBattle = await finishPkBattle(activeBattle.id, 'TIME_EXPIRED');
  console.log(`Resultado final: ${finishedBattle.result}, Ganador ID: ${finishedBattle.winnerId}`);
  if (finishedBattle.result === 'hostA_win' && finishedBattle.winnerId === hostAId) {
    console.log('✅ Test 4 PASADO: Ganador determinado correctamente por puntos de Diamantes.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup test documents
  await db.collection('users').doc(hostAId).delete();
  await db.collection('users').doc(hostBId).delete();
  await db.collection('users').doc(senderId).delete();
  await db.collection('wallets').doc(hostAId).delete();
  await db.collection('wallets').doc(hostBId).delete();
  await db.collection('wallets').doc(senderId).delete();
  await db.collection('lives').doc(liveAId).delete();
  await db.collection('lives').doc(liveBId).delete();
  await db.collection('gifts').doc('gift_fire_pk_test').delete();
  await db.collection('pkBattles').doc(activeBattle.id).delete();
  await db.collection('pkInvites').doc(invite.id).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE PK BATALAS COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runPkBattleTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas de PK:', err);
      process.exit(1);
    });
}
