import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface LiveGoal {
  liveId: string;
  targetTaps: number;
  currentTaps: number;
  reached: boolean;
  updatedAt: any;
}

export const processTapBatch = async (
  userId: string,
  liveId: string,
  tapCount: number
): Promise<{ success: boolean; totalTaps: number; liveEnergy: number; goalReached: boolean }> => {
  // Anti-abuse rate limiting: Max 30 taps per batch call
  const validTaps = Math.min(Math.max(1, tapCount), 30);

  const liveRef = db.collection('lives').doc(liveId);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  let totalTaps = 0;
  let liveEnergy = 0;
  let goalReached = false;

  await db.runTransaction(async (transaction) => {
    const liveSnap = await transaction.get(liveRef);
    if (!liveSnap.exists) throw new Error(`LIVE_NOT_FOUND: ${liveId}`);

    const liveData = liveSnap.data()!;
    totalTaps = (liveData.tapCount || 0) + validTaps;
    const comments = liveData.commentCount || 0;
    const gifts = liveData.giftCount || 0;

    // Live Energy Formula (strictly non-financial)
    liveEnergy = totalTaps * 1 + comments * 5 + gifts * 50;

    const goalTarget = liveData.tapGoal || 1000;
    goalReached = totalTaps >= goalTarget;

    transaction.update(liveRef, {
      tapCount: totalTaps,
      liveEnergy,
      tapGoalReached: goalReached,
      updatedAt: timestamp,
    });
  });

  return {
    success: true,
    totalTaps,
    liveEnergy,
    goalReached,
  };
};

export const setLiveGoal = async (
  liveId: string,
  targetTaps: number,
  hostId: string
): Promise<LiveGoal> => {
  const liveRef = db.collection('lives').doc(liveId);
  const snap = await liveRef.get();
  if (!snap.exists) throw new Error(`LIVE_NOT_FOUND: ${liveId}`);

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const currentTaps = snap.data()?.tapCount || 0;

  await liveRef.update({
    tapGoal: targetTaps,
    tapGoalReached: currentTaps >= targetTaps,
    updatedAt: timestamp,
  });

  return {
    liveId,
    targetTaps,
    currentTaps,
    reached: currentTaps >= targetTaps,
    updatedAt: timestamp,
  };
};
