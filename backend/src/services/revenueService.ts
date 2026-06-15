import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

const PLATFORM_REVENUE = 'platformRevenue';

/**
 * Logs revenue when a user purchases a diamond package.
 */
export const recordDiamondPurchaseRevenue = async (
  amountUsd: number,
  diamondsSold: number
): Promise<void> => {
  const dateStr = new Date().toISOString().split('T')[0]; // Daily period: YYYY-MM-DD
  const revenueRef = db.collection(PLATFORM_REVENUE).doc(dateStr);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(revenueRef);
    if (!snap.exists) {
      transaction.set(revenueRef, {
        period: dateStr,
        diamondsSold,
        revenueUsd: amountUsd,
        platformBeansEquivalent: 0,
        hostBeansPaid: 0,
        agencyCommissionBeans: 0,
        payoutUsd: 0,
        estimatedMarginPercent: 100,
        giftsSentCount: 0,
        activePayingUsers: 1,
        activeHosts: 0,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      transaction.update(revenueRef, {
        diamondsSold: admin.firestore.FieldValue.increment(diamondsSold),
        revenueUsd: admin.firestore.FieldValue.increment(amountUsd),
        updatedAt: now,
      });
    }
  });
};

/**
 * Tracks margin retained when a gift is sent (Platform beans share vs Host beans share).
 */
export const recordGiftPlatformMargin = async (
  diamondsSpent: number,
  beansToHost: number,
  beansToAgency: number
): Promise<void> => {
  const dateStr = new Date().toISOString().split('T')[0];
  const revenueRef = db.collection(PLATFORM_REVENUE).doc(dateStr);
  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1 Diamond = 1 base Bean equivalent.
  // Platform retained Beans = diamondsSpent - beansToHost - beansToAgency
  const platformRetainedBeans = Math.max(0, diamondsSpent - beansToHost - beansToAgency);

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(revenueRef);
    if (!snap.exists) {
      transaction.set(revenueRef, {
        period: dateStr,
        diamondsSold: 0,
        revenueUsd: 0,
        platformBeansEquivalent: platformRetainedBeans,
        hostBeansPaid: beansToHost,
        agencyCommissionBeans: beansToAgency,
        payoutUsd: 0,
        estimatedMarginPercent: diamondsSpent > 0 ? (platformRetainedBeans / diamondsSpent) * 100 : 0,
        giftsSentCount: 1,
        activePayingUsers: 1,
        activeHosts: 1,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      transaction.update(revenueRef, {
        platformBeansEquivalent: admin.firestore.FieldValue.increment(platformRetainedBeans),
        hostBeansPaid: admin.firestore.FieldValue.increment(beansToHost),
        agencyCommissionBeans: admin.firestore.FieldValue.increment(beansToAgency),
        giftsSentCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      });
    }
  });
};

/**
 * Fetches revenue statistics for a period (e.g. last 30 days).
 */
export const getRevenueSummary = async (limitDays = 30): Promise<any[]> => {
  const snap = await db.collection(PLATFORM_REVENUE)
    .orderBy('period', 'desc')
    .limit(limitDays)
    .get();

  return snap.docs.map(doc => doc.data());
};
