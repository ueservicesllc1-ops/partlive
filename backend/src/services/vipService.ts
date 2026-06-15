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
