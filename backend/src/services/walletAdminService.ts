import * as admin from 'firebase-admin';
import { db } from '../config/firebase';

export interface WalletData {
  id: string;
  userId: string;
  coins: number;
  diamonds: number;
  lifetimeCoinsPurchased: number;
  lifetimeCoinsSpent: number;
  lifetimeDiamondsEarned: number;
  lifetimeDiamondsWithdrawn: number;
  pendingDiamonds: number;
  lockedDiamonds: number;
  status: 'active' | 'locked' | 'suspended';
  createdAt: any;
  updatedAt: any;
}

export const ensureUserWallet = async (userId: string): Promise<WalletData> => {
  const walletRef = db.collection('wallets').doc(userId);
  const doc = await walletRef.get();

  if (doc.exists) {
    return { id: doc.id, ...doc.data() } as WalletData;
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const newWallet: WalletData = {
    id: userId,
    userId,
    coins: 0,
    diamonds: 0,
    lifetimeCoinsPurchased: 0,
    lifetimeCoinsSpent: 0,
    lifetimeDiamondsEarned: 0,
    lifetimeDiamondsWithdrawn: 0,
    pendingDiamonds: 0,
    lockedDiamonds: 0,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await walletRef.set(newWallet);
  return newWallet;
};

export const getUserWallet = async (userId: string): Promise<WalletData | null> => {
  const doc = await db.collection('wallets').doc(userId).get();
  if (doc.exists) {
    return { id: doc.id, ...doc.data() } as WalletData;
  }
  return null;
};

export interface CreditParams {
  userId: string;
  amount: number;
  type:
    | 'purchase'
    | 'gift_sent'
    | 'gift_received'
    | 'reward'
    | 'daily_bonus'
    | 'mission_reward'
    | 'adjustment'
    | 'withdrawal'
    | 'refund';
  direction: 'credit' | 'debit';
  currencyType: 'coins' | 'diamonds';
  description?: string;
  relatedUserId?: string;
  relatedRoomId?: string;
  relatedLiveId?: string;
  relatedGiftId?: string;
  relatedGiftEventId?: string;
  relatedPurchaseId?: string;
  metadata?: Record<string, any>;
}

export const executeWalletTransaction = async (params: CreditParams): Promise<WalletData> => {
  const {
    userId,
    amount,
    type,
    direction,
    currencyType,
    description,
    relatedUserId,
    relatedRoomId,
    relatedLiveId,
    relatedGiftId,
    relatedGiftEventId,
    relatedPurchaseId,
    metadata,
  } = params;

  if (amount <= 0) {
    throw new Error('Transaction amount must be greater than zero');
  }

  const walletRef = db.collection('wallets').doc(userId);
  const userRef = db.collection('users').doc(userId);
  const txRef = db.collection('walletTransactions').doc();

  let updatedWallet: WalletData | null = null;

  await db.runTransaction(async (transaction) => {
    // 1. Get Wallet
    const walletSnap = await transaction.get(walletRef);
    let wallet: WalletData;

    if (!walletSnap.exists) {
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      wallet = {
        id: userId,
        userId,
        coins: 0,
        diamonds: 0,
        lifetimeCoinsPurchased: 0,
        lifetimeCoinsSpent: 0,
        lifetimeDiamondsEarned: 0,
        lifetimeDiamondsWithdrawn: 0,
        pendingDiamonds: 0,
        lockedDiamonds: 0,
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    } else {
      wallet = { id: walletSnap.id, ...walletSnap.data() } as WalletData;
    }

    if (wallet.status !== 'active') {
      throw new Error(`Wallet transaction blocked: Wallet status is ${wallet.status}`);
    }

    // 2. Adjust Balance
    let newCoins = wallet.coins;
    let newDiamonds = wallet.diamonds;
    let newLifetimeCoinsPurchased = wallet.lifetimeCoinsPurchased;
    let newLifetimeCoinsSpent = wallet.lifetimeCoinsSpent;
    let newLifetimeDiamondsEarned = wallet.lifetimeDiamondsEarned;
    let newLifetimeDiamondsWithdrawn = wallet.lifetimeDiamondsWithdrawn;

    const change = direction === 'credit' ? amount : -amount;

    if (currencyType === 'coins') {
      newCoins += change;
      if (newCoins < 0) {
        throw new Error('Insufficient coins balance');
      }
      if (direction === 'credit') {
        if (type === 'purchase') {
          newLifetimeCoinsPurchased += amount;
        }
      } else {
        newLifetimeCoinsSpent += amount;
      }
    } else {
      newDiamonds += change;
      if (newDiamonds < 0) {
        throw new Error('Insufficient diamonds balance');
      }
      if (direction === 'credit') {
        newLifetimeDiamondsEarned += amount;
      } else if (type === 'withdrawal') {
        newLifetimeDiamondsWithdrawn += amount;
      }
    }

    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const updatedWalletData: Partial<WalletData> = {
      coins: newCoins,
      diamonds: newDiamonds,
      lifetimeCoinsPurchased: newLifetimeCoinsPurchased,
      lifetimeCoinsSpent: newLifetimeCoinsSpent,
      lifetimeDiamondsEarned: newLifetimeDiamondsEarned,
      lifetimeDiamondsWithdrawn: newLifetimeDiamondsWithdrawn,
      updatedAt: timestamp,
    };

    if (!walletSnap.exists) {
      transaction.set(walletRef, { ...wallet, ...updatedWalletData });
    } else {
      transaction.update(walletRef, updatedWalletData);
    }

    // 3. Create Transaction Audit Document
    const txData = {
      id: txRef.id,
      userId,
      type,
      direction,
      currencyType,
      amount,
      balanceAfter: currencyType === 'coins' ? newCoins : newDiamonds,
      status: 'completed',
      description: description || '',
      relatedUserId: relatedUserId || null,
      relatedRoomId: relatedRoomId || null,
      relatedLiveId: relatedLiveId || null,
      relatedGiftId: relatedGiftId || null,
      relatedGiftEventId: relatedGiftEventId || null,
      relatedPurchaseId: relatedPurchaseId || null,
      metadata: metadata || {},
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    transaction.set(txRef, txData);

    // 4. Update Cache in User Profile
    transaction.update(userRef, {
      coins: newCoins,
      diamonds: newDiamonds,
      updatedAt: timestamp,
    });

    updatedWallet = {
      ...wallet,
      ...updatedWalletData,
    } as WalletData;
  });

  if (!updatedWallet) {
    throw new Error('Transaction execution failed');
  }

  return updatedWallet;
};
