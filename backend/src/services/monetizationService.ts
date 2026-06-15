import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { Wallet } from '../types/wallet';

const WALLETS = 'wallets';
const USERS = 'users';

export const getOrCreateWallet = async (userId: string): Promise<Wallet> => {
  const walletRef = db.collection(WALLETS).doc(userId);
  const walletSnap = await walletRef.get();

  if (walletSnap.exists) {
    return { id: walletSnap.id, ...walletSnap.data() } as Wallet;
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const newWallet: Omit<Wallet, 'id'> = {
    userId,
    diamonds: 0,
    beans: 0,
    lifetimeDiamondsPurchased: 0,
    lifetimeDiamondsSpent: 0,
    lifetimeBeansEarned: 0,
    lifetimeBeansWithdrawn: 0,
    pendingBeans: 0,
    lockedBeans: 0,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  await walletRef.set(newWallet);
  return { id: userId, ...newWallet } as Wallet;
};

/**
 * Credits diamonds to user wallet after a successful Google Play billing purchase.
 */
export const creditDiamondsPurchase = async (
  userId: string,
  diamonds: number,
  priceUsd: number,
  purchaseToken: string
): Promise<void> => {
  const walletRef = db.collection(WALLETS).doc(userId);
  const userRef = db.collection(USERS).doc(userId);
  const txRef = db.collection('walletTransactions').doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) throw new Error('Wallet not found');
    const wallet = walletSnap.data()!;

    // Check if token has already been processed to prevent duplicates
    const duplicatesSnap = await db.collection('walletTransactions')
      .where('metadata.purchaseToken', '==', purchaseToken)
      .limit(1)
      .get();
      
    if (!duplicatesSnap.empty) {
      throw new Error('This purchase token has already been processed.');
    }

    const newDiamonds = (wallet.diamonds || 0) + diamonds;
    const newLifetimePurchased = (wallet.lifetimeDiamondsPurchased || 0) + diamonds;

    transaction.update(walletRef, {
      diamonds: newDiamonds,
      lifetimeDiamondsPurchased: newLifetimePurchased,
      updatedAt: now,
    });

    transaction.update(userRef, {
      diamonds: newDiamonds,
      updatedAt: now,
    });

    transaction.set(txRef, {
      id: txRef.id,
      userId,
      type: 'diamond_purchase',
      direction: 'credit',
      currencyType: 'diamonds',
      amount: diamonds,
      balanceAfter: newDiamonds,
      status: 'completed',
      description: `Compró paquete de ${diamonds} diamantes`,
      metadata: { purchaseToken, priceUsd },
      createdAt: now,
      updatedAt: now,
    });
  });
};
