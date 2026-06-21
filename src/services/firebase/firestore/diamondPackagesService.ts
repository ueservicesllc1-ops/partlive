import firestore from '@react-native-firebase/firestore';
import { DiamondPackage } from '../../../types/wallet';
import { FirestoreCollections } from '../../../constants/firestoreCollections';

export const getActiveDiamondPackages = async (): Promise<DiamondPackage[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.DIAMOND_PACKAGES)
    .where('isActive', '==', true)
    .get();

  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiamondPackage));
  return data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

export const listenToActiveDiamondPackages = (callback: (packages: DiamondPackage[]) => void) => {
  return firestore()
    .collection(FirestoreCollections.DIAMOND_PACKAGES)
    .where('isActive', '==', true)
    .onSnapshot(snapshot => {
      if (snapshot) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiamondPackage));
        callback(data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      }
    }, err => {
      console.error('Error listening to active diamond packages:', err);
    });
};
