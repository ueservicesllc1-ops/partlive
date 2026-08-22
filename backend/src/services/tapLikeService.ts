import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface LiveTapLikeStats {
  liveId: string;
  totalLikes: number;
  likesPerMinute: number;
  lastUpdatedAt: any;
}

export const recordTapLikeBatch = async (
  liveId: string,
  userId: string,
  tapCount: number
): Promise<{ totalLikes: number; likesPerMinute: number }> => {
  // Max 50 taps per batch flush for anti-bot validation
  const safeCount = Math.min(Math.max(1, tapCount), 50);

  const likesRef = db.collection('liveLikes').doc(liveId);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  let newTotal = safeCount;
  let likesPerMinute = safeCount * 10; // Rate calculation

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(likesRef);

    if (!snap.exists) {
      transaction.set(likesRef, {
        liveId,
        totalLikes: safeCount,
        likesPerMinute: safeCount * 10,
        createdAt: timestamp,
        lastUpdatedAt: timestamp,
      });
    } else {
      const data = snap.data()!;
      newTotal = (data.totalLikes || 0) + safeCount;
      likesPerMinute = Math.min(10000, Math.floor((data.likesPerMinute || 0) * 0.8 + safeCount * 6));

      transaction.update(likesRef, {
        totalLikes: newTotal,
        likesPerMinute,
        lastUpdatedAt: timestamp,
      });
    }
  });

  return { totalLikes: newTotal, likesPerMinute };
};

export const getLiveTapLikeStats = async (liveId: string): Promise<LiveTapLikeStats> => {
  const snap = await db.collection('liveLikes').doc(liveId).get();
  if (!snap.exists) {
    return {
      liveId,
      totalLikes: 0,
      likesPerMinute: 0,
      lastUpdatedAt: new Date().toISOString(),
    };
  }
  return snap.data() as LiveTapLikeStats;
};
