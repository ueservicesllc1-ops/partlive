export interface Wallet {
  id: string; // userId
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
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface WalletTransaction {
  id: string;
  userId: string;
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
  amount: number;
  balanceAfter?: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'reversed';
  description?: string;
  relatedUserId?: string;
  relatedRoomId?: string;
  relatedLiveId?: string;
  relatedGiftId?: string;
  relatedGiftEventId?: string;
  relatedPurchaseId?: string;
  metadata?: Record<string, any>;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface CoinPackage {
  id: string;
  title: string;
  description?: string;
  coins: number;
  bonusCoins: number;
  totalCoins: number;
  priceUsd: number;
  productId: string;
  googlePlayProductId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
