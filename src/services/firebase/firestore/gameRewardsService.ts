import firestore from '@react-native-firebase/firestore';
import { GameReward } from '../../../types/game';
import { FirestoreCollections } from '../../../constants/firestoreCollections';

/**
 * Client-side reward service.
 *
 * En __DEV__ otorga las recompensas localmente.
 * En producción, el cliente notifica al backend y el backend usa admin SDK
 * para actualizar wallet y XP de forma segura (evitar trampas).
 */
export const grantGameReward = async (reward: Omit<GameReward, 'grantedAt'>): Promise<void> => {
  const rewardRef = firestore().collection(FirestoreCollections.GAME_REWARDS).doc();
  await rewardRef.set({
    ...reward,
    grantedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const getUserGameHistory = async (
  userId: string,
  limitCount = 20,
): Promise<GameReward[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.GAME_REWARDS)
    .where('userId', '==', userId)
    .orderBy('grantedAt', 'desc')
    .limit(limitCount)
    .get();

  return snapshot.docs.map(doc => doc.data() as GameReward);
};
