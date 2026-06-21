import firestore from '@react-native-firebase/auth';
import firebaseFirestore from '@react-native-firebase/firestore';
import { Wallet, WalletTransaction } from '../../../types/wallet';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { apiFetch } from '../../api/apiClient';

export const ensureUserWallet = async (userId: string): Promise<Wallet | null> => {
  const db = firebaseFirestore();
  const walletRef = db.collection(FirestoreCollections.WALLETS).doc(userId);
  const doc = await walletRef.get();

  if (doc.exists()) {
    return { id: doc.id, ...doc.data() } as Wallet;
  }

  // Wallet not found — the backend creates it automatically on user registration.
  // Do NOT create it from the client to avoid Firestore permission errors.
  return null;
};

export const getUserWallet = async (userId: string): Promise<Wallet | null> => {
  const doc = await firebaseFirestore()
    .collection(FirestoreCollections.WALLETS)
    .doc(userId)
    .get();

  if (doc.exists()) {
    return { id: doc.id, ...doc.data() } as Wallet;
  }
  return null;
};

export const listenToUserWallet = (userId: string, callback: (wallet: Wallet | null) => void) => {
  return firebaseFirestore()
    .collection(FirestoreCollections.WALLETS)
    .doc(userId)
    .onSnapshot(doc => {
      if (doc && doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Wallet);
      } else {
        callback(null);
      }
    }, err => {
      console.error('Error listening to user wallet:', err);
    });
};

export const getUserWalletTransactions = async (
  userId: string,
  limitCount = 50
): Promise<WalletTransaction[]> => {
  const snapshot = await firebaseFirestore()
    .collection(FirestoreCollections.WALLET_TRANSACTIONS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction));
};

export const listenToUserWalletTransactions = (
  userId: string,
  callback: (transactions: WalletTransaction[]) => void,
  limitCount = 50
) => {
  return firebaseFirestore()
    .collection(FirestoreCollections.WALLET_TRANSACTIONS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .onSnapshot(snapshot => {
      if (snapshot) {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction)));
      }
    }, err => {
      console.error('Error listening to wallet transactions:', err);
    });
};

// DEV Methods - call secure backend endpoints
export const devCreditDiamonds = async (amount: number, description: string): Promise<{ success: boolean; wallet: Wallet }> => {
  if (__DEV__) {
    const result = await apiFetch('/wallet/dev/credit-diamonds', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
    return result as { success: boolean; wallet: Wallet };
  }
  throw new Error('Not allowed in production environment');
};

export const devCreditBeans = async (amount: number, description: string): Promise<{ success: boolean; wallet: Wallet }> => {
  if (__DEV__) {
    const result = await apiFetch('/wallet/dev/credit-beans', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
    return result as { success: boolean; wallet: Wallet };
  }
  throw new Error('Not allowed in production environment');
};
