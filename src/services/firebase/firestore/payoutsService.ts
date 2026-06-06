import firebaseFirestore from '@react-native-firebase/firestore';
import { HostPayout, HostPayoutMethod } from '../../../types/payout';
import { FirestoreCollections } from '../../../constants/firestoreCollections';

export const listenToMyPayouts = (
  hostId: string,
  callback: (payouts: HostPayout[]) => void
) => {
  return firebaseFirestore()
    .collection(FirestoreCollections.HOST_PAYOUTS)
    .where('hostId', '==', hostId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot => {
        if (snapshot) {
          const payouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HostPayout));
          callback(payouts);
        }
      },
      err => {
        console.error('Error listening to host payouts:', err);
      }
    );
};

export const listenToMyPayoutMethods = (
  hostId: string,
  callback: (methods: HostPayoutMethod[]) => void
) => {
  return firebaseFirestore()
    .collection(FirestoreCollections.HOST_PAYOUT_METHODS)
    .where('hostId', '==', hostId)
    .where('isActive', '==', true)
    .onSnapshot(
      snapshot => {
        if (snapshot) {
          const methods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HostPayoutMethod));
          callback(methods);
        }
      },
      err => {
        console.error('Error listening to host payout methods:', err);
      }
    );
};

export const listenToAdminPendingPayouts = (
  callback: (payouts: HostPayout[]) => void
) => {
  return firebaseFirestore()
    .collection(FirestoreCollections.HOST_PAYOUTS)
    .where('status', 'in', ['pending', 'approved'])
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot => {
        if (snapshot) {
          const payouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HostPayout));
          callback(payouts);
        }
      },
      err => {
        console.error('Error listening to pending payouts (admin):', err);
      }
    );
};
