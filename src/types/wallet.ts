export interface Wallet {
  id: string; // userId
  userId: string;
  diamonds: number; // Purchased currency
  beans: number; // Host earned currency
  lifetimeDiamondsPurchased: number;
  lifetimeDiamondsSpent: number;
  lifetimeBeansEarned: number;
  lifetimeBeansWithdrawn: number;
  pendingBeans: number;
  lockedBeans: number;
  status: 'active' | 'locked' | 'suspended';
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export type WalletTransactionType =
  | 'diamond_purchase'
  | 'gift_sent'
  | 'gift_received'
  | 'beans_earned'
  | 'payout_requested'
  | 'payout_paid'
  | 'payout_rejected'
  | 'vip_purchase'
  | 'admin_adjustment'
  | 'reward';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  direction: 'credit' | 'debit';
  currencyType: 'diamonds' | 'beans';
  amount: number;
  balanceAfter?: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'reversed';
  description?: string;
  relatedUserId?: string;
  relatedRoomId?: string;
  relatedLiveId?: string;
  relatedGiftId?: string;
  relatedGiftEventId?: string;
  relatedPayoutId?: string;
  metadata?: Record<string, any>;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface DiamondPackage {
  id: string;
  title: string;
  description?: string;
  diamonds: number;
  bonusDiamonds: number;
  totalDiamonds: number;
  priceUsd: number;
  googlePlayProductId: string;
  isActive: boolean;
  isPopular?: boolean;     // Optional flag for highlighted packages
  sortOrder: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
