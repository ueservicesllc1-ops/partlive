import firestore from '@react-native-firebase/firestore';
import { CoinPackage } from '../../../types/wallet';
import { FirestoreCollections } from '../../../constants/firestoreCollections';

export const getActiveCoinPackages = async (): Promise<CoinPackage[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.COIN_PACKAGES)
    .where('isActive', '==', true)
    .orderBy('sortOrder', 'asc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoinPackage));
};

export const listenToActiveCoinPackages = (callback: (packages: CoinPackage[]) => void) => {
  return firestore()
    .collection(FirestoreCollections.COIN_PACKAGES)
    .where('isActive', '==', true)
    .orderBy('sortOrder', 'asc')
    .onSnapshot(snapshot => {
      if (snapshot) {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoinPackage)));
      }
    }, err => {
      console.error('Error listening to active coin packages:', err);
    });
};
