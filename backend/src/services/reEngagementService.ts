import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { createNotificationAndPush } from './notificationService';

export type UserLifecycleState =
  | 'NEW'
  | 'ACTIVATED'
  | 'ENGAGED'
  | 'POWER_USER'
  | 'PAYING'
  | 'DORMANT'
  | 'AT_RISK'
  | 'CHURNED';

export interface UserLifecycleProfile {
  userId: string;
  state: UserLifecycleState;
  lastActiveAt: any;
  totalLivesWatched: number;
  totalGiftsSent: number;
  totalPurchasesUsd: number;
  updatedAt: any;
}

export const evaluateUserLifecycleState = async (userId: string): Promise<UserLifecycleProfile> => {
  const userSnap = await db.collection('users').doc(userId).get();
  if (!userSnap.exists) throw new Error('User not found.');

  const userData = userSnap.data()!;
  const walletSnap = await db.collection('wallets').doc(userId).get();
  const wallet = walletSnap.exists ? walletSnap.data()! : {};

  const nowMs = Date.now();
  const lastActiveMs = userData.lastLoginAt ? (userData.lastLoginAt.toMillis ? userData.lastLoginAt.toMillis() : new Date(userData.lastLoginAt).getTime()) : nowMs;
  const daysInactive = (nowMs - lastActiveMs) / (1000 * 60 * 60 * 24);

  const totalPurchasesUsd = wallet.lifetimeDiamondsPurchased ? wallet.lifetimeDiamondsPurchased / 100 : 0;
  const totalGiftsSent = wallet.lifetimeDiamondsSpent || 0;

  let state: UserLifecycleState = 'NEW';

  if (totalPurchasesUsd > 0) {
    state = 'PAYING';
  } else if (daysInactive > 30) {
    state = 'CHURNED';
  } else if (daysInactive > 14) {
    state = 'DORMANT';
  } else if (daysInactive > 7) {
    state = 'AT_RISK';
  } else if (totalGiftsSent > 1000) {
    state = 'POWER_USER';
  } else if (userData.livesWatchedCount > 5 || totalGiftsSent > 0) {
    state = 'ENGAGED';
  } else if (userData.livesWatchedCount > 0) {
    state = 'ACTIVATED';
  } else {
    state = 'NEW';
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const profile: UserLifecycleProfile = {
    userId,
    state,
    lastActiveAt: userData.lastLoginAt || timestamp,
    totalLivesWatched: userData.livesWatchedCount || 0,
    totalGiftsSent,
    totalPurchasesUsd,
    updatedAt: timestamp,
  };

  await db.collection('userLifecycle').doc(userId).set(profile, { merge: true });
  return profile;
};

export const runReEngagementScan = async (): Promise<{ scanned: number; reEngaged: number }> => {
  const inactiveSnap = await db.collection('userLifecycle')
    .where('state', 'in', ['DORMANT', 'AT_RISK'])
    .limit(50)
    .get();

  let reEngaged = 0;

  for (const doc of inactiveSnap.docs) {
    const profile = doc.data() as UserLifecycleProfile;
    try {
      await createNotificationAndPush({
        userId: profile.userId,
        type: 'live_started',
        channel: 'both',
        title: '🔥 ¡Tus Creadores Favoritos Están Transmitiendo!',
        body: 'Descubre los mejores Lives de PartyLive y no te pierdas la diversión.',
        actionType: 'open_url',
        actionValue: 'partylive://discovery',
      });
      reEngaged++;
    } catch (err) {
      console.warn(`[ReEngagement] Failed to notify ${profile.userId}:`, err);
    }
  }

  return { scanned: inactiveSnap.size, reEngaged };
};
