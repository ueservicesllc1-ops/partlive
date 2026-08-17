import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { VIP_PLANS } from '../constants/vipPlans';

const SUBSCRIPTIONS = 'vipSubscriptions';
const USERS = 'users';

export const getVipPlans = () => {
  return VIP_PLANS;
};

/**
 * Secures the purchase of a VIP subscription and updates the user profile cache.
 */
export const subscribeUserToVip = async (
  userId: string,
  planId: string,
  purchaseToken?: string,
  platform: 'android' | 'ios' | 'manual' = 'android'
): Promise<string> => {
  const plan = VIP_PLANS.find((p: any) => p.id === planId);
  if (!plan) throw new Error('VIP Plan not found');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const subRef = db.collection(SUBSCRIPTIONS).doc();
  const nowTimestamp = admin.firestore.FieldValue.serverTimestamp();
  const expiresTimestamp = admin.firestore.Timestamp.fromDate(expiresAt);

  await db.runTransaction(async (transaction) => {
    // 1. Create subscription record
    transaction.set(subRef, {
      id: subRef.id,
      userId,
      planId,
      status: 'active',
      startedAt: nowTimestamp,
      expiresAt: expiresTimestamp,
      purchaseToken: purchaseToken || null,
      platform,
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
    });

    // Determine level: bronze=1, silver=2, gold=3
    let vipLevel = 1;
    if (planId === 'vip_silver') vipLevel = 2;
    if (planId === 'vip_gold') vipLevel = 3;

    // 2. Update user profile cache
    transaction.update(db.collection(USERS).doc(userId), {
      vipLevel,
      vipExpiresAt: expiresTimestamp,
      isVip: true,
      updatedAt: nowTimestamp,
    });

    // 3. Create wallet transaction audit log
    const txRef = db.collection('walletTransactions').doc();
    transaction.set(txRef, {
      id: txRef.id,
      userId,
      type: 'vip_purchase',
      direction: 'debit',
      currencyType: 'diamonds', // VIP could also be paid in diamonds or real money via Play Store
      amount: plan.priceUsd * 100, // log equivalent cents or dollars
      status: 'completed',
      description: `Compró ${plan.name} por 30 días`,
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
    });
  });

  // Track VIP purchase in analytics
  try {
    const { recordVipPurchase } = await import('./analyticsService');
    // Fetch user country for analytics
    const userSnap = await db.collection(USERS).doc(userId).get();
    const country = userSnap.exists ? (userSnap.data()?.country || 'CL') : 'CL';
    await recordVipPurchase(userId, planId, plan.priceUsd, country);
  } catch (anErr) {
    console.error('Failed to track VIP purchase in analytics:', anErr);
  }

  return subRef.id;
};

export const checkVipStatus = async (userId: string): Promise<boolean> => {
  const userSnap = await db.collection(USERS).doc(userId).get();
  if (!userSnap.exists) return false;
  
  const user = userSnap.data()!;
  if (!user.isVip || !user.vipExpiresAt) return false;

  const expiresMillis = user.vipExpiresAt.toMillis();
  if (expiresMillis < Date.now()) {
    // Expired, update profile
    await db.collection(USERS).doc(userId).update({
      isVip: false,
      vipLevel: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
    return false;
  }

  return true;
};

/**
 * Calculates user's cumulative verified spend from giftTransactions and updates VIP Level.
 */
export const recalculateUserVip = async (userId: string): Promise<{ vipLevel: number; eligibleCoinsSpent: number }> => {
  const userRef = db.collection(USERS).doc(userId);

  // 1. Fetch systemConfig/vip
  const vipConfigSnap = await db.collection('systemConfig').doc('vip').get();
  const vipLevelsList = vipConfigSnap.exists ? (vipConfigSnap.data()?.vipLevels || []) : [];

  // 2. Sum coins spent in verified completed gift transactions
  const giftSnap = await db
    .collection('giftTransactions')
    .where('senderId', '==', userId)
    .where('status', '==', 'completed')
    .get();

  let totalCoinsSpent = 0;
  giftSnap.docs.forEach((doc) => {
    const data = doc.data();
    totalCoinsSpent += data.totalCoinsSpent || data.coinCost * (data.quantity || 1) || 0;
  });

  // 3. Determine target VIP Level based on requiredSpendCoins
  let targetVipLevel = 0;
  let targetBadge = '👤';
  let targetFrame = 'default';

  for (const vLvl of vipLevelsList) {
    if (totalCoinsSpent >= vLvl.requiredSpendCoins) {
      targetVipLevel = vLvl.level;
      targetBadge = vLvl.badge;
      targetFrame = `frame_vip_${vLvl.level}`;
    } else {
      break;
    }
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await userRef.update({
    vipLevel: targetVipLevel,
    isVip: targetVipLevel > 0,
    eligibleCoinsSpent: totalCoinsSpent,
    profileFrame: targetFrame,
    badges: admin.firestore.FieldValue.arrayUnion(`vip_${targetVipLevel}`),
    updatedAt: timestamp,
  });

  return { vipLevel: targetVipLevel, eligibleCoinsSpent: totalCoinsSpent };
};
