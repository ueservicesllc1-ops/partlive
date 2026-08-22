import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';

const db = firestore;

export interface TriviaUserProgress {
  userId: string;
  progress: Record<string, number>; // e.g. { 'ciencia': 3, 'historia': 1 } - stores MAX UNLOCKED level (1-10)
  updatedAt: any;
}

/**
 * Gets the user's unlocked levels for all categories.
 * If the user hasn't played, they get level 1 for everything by default.
 */
export const getUserTriviaProgress = async (userId: string): Promise<Record<string, number>> => {
  try {
    const doc = await db().collection(FirestoreCollections.USERS).doc(userId).collection('gameProgress').doc('trivia').get();
    
    if (doc.exists) {
      const data = doc.data() as TriviaUserProgress;
      return data.progress || {};
    }
    return {};
  } catch (error) {
    console.warn('[getUserTriviaProgress] Error:', error);
    return {};
  }
};

/**
 * Unlocks the next level if the user passed the current one.
 * E.g., if user passed level 1, this sets the unlocked level to 2 (if it wasn't already higher).
 */
export const unlockTriviaLevel = async (userId: string, categoryId: string, levelPassed: number): Promise<void> => {
  try {
    const ref = db().collection(FirestoreCollections.USERS).doc(userId).collection('gameProgress').doc('trivia');
    
    await db().runTransaction(async (transaction) => {
      const doc = await transaction.get(ref);
      let currentProgress: Record<string, number> = {};
      
      if (doc.exists) {
        currentProgress = (doc.data() as TriviaUserProgress).progress || {};
      }
      
      const currentUnlocked = currentProgress[categoryId] || 1;
      const nextLevelToUnlock = levelPassed + 1;
      
      // Only update if they are unlocking a new level (don't downgrade if they replay a low level)
      if (nextLevelToUnlock > currentUnlocked && nextLevelToUnlock <= 10) {
        currentProgress[categoryId] = nextLevelToUnlock;
        
        transaction.set(ref, {
          userId,
          progress: currentProgress,
          updatedAt: firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    });
  } catch (error) {
    console.warn('[unlockTriviaLevel] Error:', error);
  }
};
