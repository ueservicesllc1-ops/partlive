import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export const addXpToUser = async (
  userId: string,
  xpAmount: number,
  source: 'gift_sent' | 'gift_received' | 'live_entry' | 'room_entry' | 'pk_participate' | 'mission'
): Promise<{ newLevel: number; newXp: number; leveledUp: boolean }> => {
  if (xpAmount <= 0) return { newLevel: 1, newXp: 0, leveledUp: false };

  const userRef = db.collection('users').doc(userId);
  const levelsDoc = await db.collection('systemConfig').doc('levels').get();
  
  const levelsData = levelsDoc.exists ? levelsDoc.data() : null;
  const levelsList = levelsData?.levels || [];
  const maxLevel = levelsData?.maxLevel || 100;

  let leveledUp = false;
  let finalLevel = 1;
  let finalXp = 0;

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) return;

    const userData = userSnap.data()!;
    const currentXp = userData.xp || 0;
    const currentLevel = userData.level || 1;

    finalXp = currentXp + xpAmount;

    // Calculate appropriate level for finalXp
    let targetLevel = currentLevel;
    for (const lvl of levelsList) {
      if (finalXp >= lvl.requiredXP) {
        targetLevel = lvl.level;
      } else {
        break;
      }
    }

    targetLevel = Math.min(targetLevel, maxLevel);
    if (targetLevel > currentLevel) {
      leveledUp = true;
    }

    finalLevel = targetLevel;

    const updates: any = {
      xp: finalXp,
      level: finalLevel,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (leveledUp) {
      const levelInfo = levelsList.find((l: any) => l.level === finalLevel);
      if (levelInfo) {
        updates.rank = levelInfo.name;
        updates.badges = admin.firestore.FieldValue.arrayUnion(`level_${finalLevel}`);
      }
    }

    transaction.update(userRef, updates);
  });

  return { newLevel: finalLevel, newXp: finalXp, leveledUp };
};
