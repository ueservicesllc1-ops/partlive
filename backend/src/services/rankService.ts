import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { USER_RANKS } from '../constants/userRanks';
import { UserRankName } from '../types/rank';

/**
 * Calculates user rank configuration based on their XP.
 */
export const calculateUserRank = (xp: number): { name: UserRankName; level: number; label: string; nextXp: number } => {
  let activeRank = USER_RANKS[0];
  
  for (let i = 0; i < USER_RANKS.length; i++) {
    if (xp >= USER_RANKS[i].minXp) {
      activeRank = USER_RANKS[i];
    } else {
      break;
    }
  }

  const activeIndex = USER_RANKS.findIndex((r: any) => r.name === activeRank.name);
  const nextRank = USER_RANKS[activeIndex + 1] || activeRank;
  const nextXp = nextRank.minXp;

  return {
    name: activeRank.name,
    level: activeRank.level,
    label: activeRank.label,
    nextXp,
  };
};

/**
 * Adds XP to a user and upgrades their rank if thresholds are crossed.
 */
export const addUserXp = async (userId: string, amount: number, reason: string): Promise<number> => {
  const userRef = db.collection('users').doc(userId);
  const now = admin.firestore.FieldValue.serverTimestamp();
  
  let newXp = amount;

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) throw new Error('User not found');
    
    const user = userSnap.data()!;
    newXp = (user.xp || 0) + amount;

    const rankInfo = calculateUserRank(newXp);

    transaction.update(userRef, {
      xp: newXp,
      rank: rankInfo.label,
      rankLevel: rankInfo.level,
      nextRankXp: rankInfo.nextXp,
      updatedAt: now,
    });
  });

  return newXp;
};
