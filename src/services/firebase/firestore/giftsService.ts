import firestore from '@react-native-firebase/firestore';
import { Gift } from '../../../types/gift';
import { FirestoreCollections } from '../../../constants/firestoreCollections';

export const listenToActiveGifts = (onUpdate: (gifts: Gift[]) => void): (() => void) => {
  return firestore()
    .collection(FirestoreCollections.GIFTS)
    .where('isActive', '==', true)
    .onSnapshot(
      snapshot => {
        if (!snapshot) {
          onUpdate([]);
          return;
        }
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gift));
        data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || (a.coinCost || 0) - (b.coinCost || 0));
        onUpdate(data);
      },
      error => {
        console.error('Error listening to active gifts:', error);
        onUpdate([]);
      }
    );
};

export const getActiveGifts = async (): Promise<Gift[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.GIFTS)
    .where('isActive', '==', true)
    .get();

  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gift));
  return data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || (a.coinCost || 0) - (b.coinCost || 0));
};

export const getGiftById = async (id: string): Promise<Gift | null> => {
  const doc = await firestore().collection(FirestoreCollections.GIFTS).doc(id).get();
  if (doc.exists()) {
    return { id: doc.id, ...doc.data() } as Gift;
  }
  return null;
};
