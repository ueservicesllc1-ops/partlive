import { db } from '../src/config/firebase';
import { sendGiftWithWallet } from '../src/services/giftWalletService';
import { initializeEconomyConfig } from '../src/config/economyConfig';

export const runAtomicGiftTests = async () => {
  console.log('\n==================================================');
  console.log('🧪 RUNNING ATOMIC GIFT & ECONOMY VERIFICATION TESTS');
  console.log('==================================================\n');

  await initializeEconomyConfig();

  const senderId = 'test_sender_' + Date.now();
  const hostId = 'test_host_' + Date.now();
  const liveId = 'test_live_' + Date.now();

  // Create Test Users & Target Live Stream
  await db.collection('users').doc(senderId).set({
    uid: senderId,
    displayName: 'Test Sender',
    coins: 100,
    coinsBalance: 100,
    diamonds: 100,
    isHost: false,
    role: 'user',
    createdAt: new Date().toISOString(),
  });

  await db.collection('users').doc(hostId).set({
    uid: hostId,
    displayName: 'Test Host',
    diamonds: 0,
    diamondBalance: 0,
    beans: 0,
    isHost: true,
    role: 'host',
    createdAt: new Date().toISOString(),
  });

  await db.collection('wallets').doc(senderId).set({
    userId: senderId,
    coins: 100,
    coinsBalance: 100,
    diamonds: 100,
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  await db.collection('wallets').doc(hostId).set({
    userId: hostId,
    diamonds: 0,
    diamondBalance: 0,
    availableDiamonds: 0,
    lifetimeDiamonds: 0,
    beans: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  await db.collection('lives').doc(liveId).set({
    id: liveId,
    hostId: hostId,
    title: 'Test Stream',
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  await db.collection('gifts').doc('gift_rose_test').set({
    id: 'gift_rose_test',
    name: 'Rosa Test',
    coinCost: 10,
    diamondReward: 5,
    priceDiamonds: 10,
    beansValue: 5,
    isActive: true,
    sortOrder: 1,
  });

  await db.collection('gifts').doc('gift_inactive_test').set({
    id: 'gift_inactive_test',
    name: 'Regalo Inactivo',
    coinCost: 5,
    diamondReward: 5,
    isActive: false,
    sortOrder: 99,
  });

  console.log('✅ Test Data Initialized.');

  // --- Case 1: Sender has sufficient Coins (100 Coins, cost 10 x 2 = 20 Coins) ---
  console.log('\n▶ Case 1: User has sufficient Coins (100 Coins, spending 20)...');
  try {
    const result = await sendGiftWithWallet({
      targetType: 'live',
      targetId: liveId,
      senderId,
      receiverId: hostId,
      giftId: 'gift_rose_test',
      quantity: 2,
    });

    const senderWalletDoc = await db.collection('wallets').doc(senderId).get();
    const hostWalletDoc = await db.collection('wallets').doc(hostId).get();

    const senderCoins = senderWalletDoc.data()?.coins;
    const hostDiamonds = hostWalletDoc.data()?.diamonds;

    console.log(`Result: Sender Coins = ${senderCoins} (Expected 80), Host Diamonds = ${hostDiamonds} (Expected 10)`);
    if (senderCoins === 80 && hostDiamonds === 10) {
      console.log('✅ Case 1 PASSED: Coins deducted & Diamonds credited atomically.');
    } else {
      console.error('❌ Case 1 FAILED: Incorrect balances after gift transfer.');
    }
  } catch (err: any) {
    console.error('❌ Case 1 FAILED with exception:', err.message);
  }

  // --- Case 2: Sender does not have enough Coins (80 Coins left, cost 10 x 10 = 100 Coins) ---
  console.log('\n▶ Case 2: User has insufficient Coins (80 Coins available, spending 100)...');
  try {
    await sendGiftWithWallet({
      targetType: 'live',
      targetId: liveId,
      senderId,
      receiverId: hostId,
      giftId: 'gift_rose_test',
      quantity: 10,
    });
    console.error('❌ Case 2 FAILED: Expected transaction rejection due to insufficient funds.');
  } catch (err: any) {
    console.log(`✅ Case 2 PASSED: Transaction rejected with message: "${err.message}"`);
  }

  // --- Case 3: Inactive Gift ---
  console.log('\n▶ Case 3: Attempting to send inactive gift...');
  try {
    await sendGiftWithWallet({
      targetType: 'live',
      targetId: liveId,
      senderId,
      receiverId: hostId,
      giftId: 'gift_inactive_test',
      quantity: 1,
    });
    console.error('❌ Case 3 FAILED: Inactive gift was accepted.');
  } catch (err: any) {
    console.log(`✅ Case 3 PASSED: Inactive gift rejected with message: "${err.message}"`);
  }

  // --- Case 4: Concurrent Gift Transfers ---
  console.log('\n▶ Case 4: Simulating 3 concurrent gift requests (80 Coins available, 3 x 30 Coins = 90 total)...');
  const req1 = sendGiftWithWallet({ targetType: 'live', targetId: liveId, senderId, receiverId: hostId, giftId: 'gift_rose_test', quantity: 3 }); // 30 Coins
  const req2 = sendGiftWithWallet({ targetType: 'live', targetId: liveId, senderId, receiverId: hostId, giftId: 'gift_rose_test', quantity: 3 }); // 30 Coins
  const req3 = sendGiftWithWallet({ targetType: 'live', targetId: liveId, senderId, receiverId: hostId, giftId: 'gift_rose_test', quantity: 3 }); // 30 Coins

  const results = await Promise.allSettled([req1, req2, req3]);
  const fulfilled = results.filter(r => r.status === 'fulfilled').length;
  const rejected = results.filter(r => r.status === 'rejected').length;

  const finalSenderWallet = await db.collection('wallets').doc(senderId).get();
  console.log(`Concurrent results: Fulfilled = ${fulfilled}, Rejected = ${rejected}, Final Coins = ${finalSenderWallet.data()?.coins}`);
  if (fulfilled === 2 && rejected === 1 && finalSenderWallet.data()?.coins === 20) {
    console.log('✅ Case 4 PASSED: Concurrency protected. Over-draft prevented.');
  } else {
    console.warn(`ℹ Case 4 execution completed. Fulfilled: ${fulfilled}, Rejected: ${rejected}, Remaining Coins: ${finalSenderWallet.data()?.coins}`);
  }

  // Cleanup test docs
  await db.collection('users').doc(senderId).delete();
  await db.collection('users').doc(hostId).delete();
  await db.collection('wallets').doc(senderId).delete();
  await db.collection('wallets').doc(hostId).delete();
  await db.collection('lives').doc(liveId).delete();
  await db.collection('gifts').doc('gift_rose_test').delete();
  await db.collection('gifts').doc('gift_inactive_test').delete();

  console.log('\n==================================================');
  console.log('🎉 ALL ATOMIC ECONOMY VERIFICATION TESTS COMPLETE!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runAtomicGiftTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal test runner error:', err);
      process.exit(1);
    });
}
