import firestore from '@react-native-firebase/firestore';
import { DiamondPackage } from '../../../types/wallet';
import { FirestoreCollections } from '../../../constants/firestoreCollections';

export const getActiveDiamondPackages = async (): Promise<DiamondPackage[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.DIAMOND_PACKAGES)
    .where('isActive', '==', true)
    .orderBy('sortOrder', 'asc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiamondPackage));
};

export const listenToActiveDiamondPackages = (callback: (packages: DiamondPackage[]) => void) => {
  return firestore()
    .collection(FirestoreCollections.DIAMOND_PACKAGES)
    .where('isActive', '==', true)
    .orderBy('sortOrder', 'asc')
    .onSnapshot(snapshot => {
      if (snapshot) {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiamondPackage)));
      }
    }, err => {
      console.error('Error listening to active diamond packages:', err);
    });
};
