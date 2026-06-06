import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { Banner } from '../../../types';

export const getActiveBannersByPlacement = async (placement: string): Promise<Banner[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.BANNERS)
    .where('placement', '==', placement)
    .where('isActive', '==', true)
    .get();
    
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
};
