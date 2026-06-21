import firestore from '@react-native-firebase/firestore';
import { Gift } from '../../../types/gift';
import { FirestoreCollections } from '../../../constants/firestoreCollections';

export const getActiveGifts = async (): Promise<Gift[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.GIFTS)
    .where('isActive', '==', true)
    .get();

  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gift));
  return data.sort((a, b) => (a.priceDiamonds || 0) - (b.priceDiamonds || 0));
};

export const getGiftById = async (id: string): Promise<Gift | null> => {
  const doc = await firestore().collection(FirestoreCollections.GIFTS).doc(id).get();
  if (doc.exists()) {
    return { id: doc.id, ...doc.data() } as Gift;
  }
  return null;
};
