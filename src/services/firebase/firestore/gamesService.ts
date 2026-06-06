import firestore from '@react-native-firebase/firestore';
import { Game } from '../../../types/game';
import { FirestoreCollections } from '../../../constants/firestoreCollections';

export const getActiveGames = async (): Promise<Game[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.GAMES)
    .where('isActive', '==', true)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
};

export const getGameById = async (id: string): Promise<Game | null> => {
  const doc = await firestore().collection(FirestoreCollections.GAMES).doc(id).get();
  if (doc.exists()) {
    return { id: doc.id, ...doc.data() } as Game;
  }
  return null;
};
