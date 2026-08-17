import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { recordRevenueEvent } from './revenueService';

export interface HostSubscription {
  id: string;
  userId: string;
  hostId: string;
  tier: 'BASIC' | 'PREMIUM' | 'ELITE';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startedAt: any;
  expiresAt: any;
  platform: 'android' | 'ios' | 'web';
}

const TIER_PRICES_USD = {
  BASIC: 4.99,
  PREMIUM: 9.99,
  ELITE: 24.99,
};

export const subscribeToHost = async (
  userId: string,
  hostId: string,
  tier: 'BASIC' | 'PREMIUM' | 'ELITE' = 'BASIC',
  platform: 'android' | 'ios' | 'web' = 'android'
): Promise<HostSubscription> => {
  const price = TIER_PRICES_USD[tier] || 4.99;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const subRef = db.collection('hostSubscriptions').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const newSub: HostSubscription = {
    id: subRef.id,
    userId,
    hostId,
    tier,
    status: 'ACTIVE',
    startedAt: timestamp,
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    platform,
  };

  await subRef.set(newSub);

  // Record audited Revenue Ledger Entry (60% Host, 10% Agency, 30% Platform)
  await recordRevenueEvent(
    'HOST_SUBSCRIPTION',
    subRef.id,
    userId,
    price,
    3.0, // Fees
    60.0, // Host share
    10.0, // Agency share
    hostId
  );

  return newSub;
};

export const getUserActiveSubscriptions = async (userId: string): Promise<any> => {
  const subsSnap = await db.collection('hostSubscriptions')
    .where('userId', '==', userId)
    .where('status', '==', 'ACTIVE')
    .get();

  const hostSubs = subsSnap.docs.map((doc) => doc.data());

  const vipSnap = await db.collection('vipSubscriptions')
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .get();

  const vipSubs = vipSnap.docs.map((doc) => doc.data());

  return {
    vipSubscriptions: vipSubs,
    hostSubscriptions: hostSubs,
  };
};
