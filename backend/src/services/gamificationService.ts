import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface GamificationProfile {
  userId: string;
  userLevel: string;
  currentStreakDays: number;
  longestStreakDays: number;
  partyPoints: number; // Non-financial virtual currency for cosmetics
  lastActiveDate: string;
  updatedAt: any;
}

export const recordDailyStreak = async (userId: string): Promise<GamificationProfile> => {
  const ref = db.collection('userGamification').doc(userId);
  const snap = await ref.get();
  const todayStr = new Date().toISOString().slice(0, 10);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  let currentStreakDays = 1;
  let longestStreakDays = 1;
  let partyPoints = 10;

  if (snap.exists) {
    const data = snap.data()!;
    const lastActive = data.lastActiveDate || '';

    if (lastActive === todayStr) {
      // Already active today
      return {
        userId,
        userLevel: data.userLevel || 'Regular',
        currentStreakDays: data.currentStreakDays || 1,
        longestStreakDays: data.longestStreakDays || 1,
        partyPoints: data.partyPoints || 0,
        lastActiveDate: todayStr,
        updatedAt: data.updatedAt,
      };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastActive === yesterdayStr) {
      currentStreakDays = (data.currentStreakDays || 0) + 1;
    } else {
      currentStreakDays = 1;
    }

    longestStreakDays = Math.max(currentStreakDays, data.longestStreakDays || 1);
    partyPoints = (data.partyPoints || 0) + 10;
  }

  // Level thresholds
  let userLevel = 'Newcomer';
  if (currentStreakDays >= 30) userLevel = 'Legend';
  else if (currentStreakDays >= 14) userLevel = 'Super Fan';
  else if (currentStreakDays >= 7) userLevel = 'Active';
  else if (currentStreakDays >= 3) userLevel = 'Regular';

  await ref.set({
    userId,
    userLevel,
    currentStreakDays,
    longestStreakDays,
    partyPoints,
    lastActiveDate: todayStr,
    updatedAt: timestamp,
  }, { merge: true });

  return {
    userId,
    userLevel,
    currentStreakDays,
    longestStreakDays,
    partyPoints,
    lastActiveDate: todayStr,
    updatedAt: timestamp,
  };
};

export const awardPartyPoints = async (
  userId: string,
  points: number,
  reason: string
): Promise<{ newTotalPoints: number }> => {
  const ref = db.collection('userGamification').doc(userId);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const current = snap.exists ? (snap.data()?.partyPoints || 0) : 0;
    const newTotal = current + points;

    transaction.set(ref, {
      userId,
      partyPoints: newTotal,
      updatedAt: timestamp,
    }, { merge: true });

    // Ledger entry for audit
    const ledgerRef = db.collection('partyPointsLedger').doc();
    transaction.set(ledgerRef, {
      id: ledgerRef.id,
      userId,
      points,
      reason,
      timestamp,
    });
  });

  const updated = await ref.get();
  return { newTotalPoints: updated.data()?.partyPoints || 0 };
};

export const getUserGamificationProfile = async (userId: string): Promise<GamificationProfile> => {
  const snap = await db.collection('userGamification').doc(userId).get();

  if (!snap.exists) {
    return recordDailyStreak(userId);
  }

  const data = snap.data()!;
  return {
    userId,
    userLevel: data.userLevel || 'Newcomer',
    currentStreakDays: data.currentStreakDays || 0,
    longestStreakDays: data.longestStreakDays || 0,
    partyPoints: data.partyPoints || 0,
    lastActiveDate: data.lastActiveDate || '',
    updatedAt: data.updatedAt,
  };
};
