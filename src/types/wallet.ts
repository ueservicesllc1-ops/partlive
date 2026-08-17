export interface Wallet {
  id: string; // userId
  userId: string;
  coins: number; // User purchased currency (Coins)
  coinsBalance?: number; // Alias for coins
  diamonds: number; // Host earned currency (Diamonds)
  diamondBalance?: number; // Alias for diamonds
  availableDiamonds: number; // Diamonds ready for payout
  pendingDiamonds: number; // Diamonds under review/pending
  lifetimeDiamonds: number; // Total diamonds earned all-time
  withdrawnDiamonds: number; // Total diamonds successfully paid out
  beans?: number; // Legacy compatibility
  pendingBeans?: number; // Legacy compatibility
  lockedBeans?: number; // Legacy compatibility
  lifetimeDiamondsPurchased?: number; // Legacy alias
  lifetimeDiamondsSpent?: number; // Legacy alias
  lifetimeBeansEarned?: number; // Legacy alias
  lifetimeBeansWithdrawn?: number; // Legacy alias
  status: 'active' | 'locked' | 'suspended';
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export type WalletTransactionType =
  | 'COIN_PURCHASE'
  | 'GIFT_SENT'
  | 'DIAMOND_EARNED'
  | 'DIAMOND_ADJUSTMENT'
  | 'PAYOUT_REQUEST'
  | 'PAYOUT_COMPLETED'
  | 'PAYOUT_REJECTED'
  | 'REFUND'
  | 'diamond_purchase' // Legacy support
  | 'gift_received' // Legacy support
  | 'beans_earned' // Legacy support
  | 'payout_requested' // Legacy support
  | 'payout_paid' // Legacy support
  | 'vip_purchase'
  | 'admin_adjustment'
  | 'reward';

export interface WalletTransaction {
  id: string;
  transactionId?: string;
  userId: string;
  type: WalletTransactionType;
  direction?: 'credit' | 'debit';
  currency?: 'coins' | 'diamonds';
  currencyType?: 'coins' | 'diamonds' | 'beans';
  amount: number;
  balanceAfter?: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'reversed' | 'PENDING' | 'COMPLETED' | 'REJECTED';
  source?: string;
  recipientId?: string;
  relatedUserId?: string;
  relatedRoomId?: string;
  relatedLiveId?: string;
  relatedGiftId?: string;
  liveId?: string;
  roomId?: string;
  giftId?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export type PayoutStatusType =
  | 'PENDING'
  | 'APPROVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface PayoutRequest {
  id: string;
  hostId: string;
  diamondAmount: number;
  cashAmount: number;
  status: PayoutStatusType;
  paymentMethod?: string;
  payoutMethodType?: string;
  payoutMethodLabel?: string;
  payoutDetailsMasked?: string;
  createdAt: any;
  processedAt?: any;
}

export interface CreatorEarnings {
  todayDiamonds: number;
  weekDiamonds: number;
  monthDiamonds: number;
  lifetimeDiamonds: number;
  availableDiamonds: number;
  pendingDiamonds: number;
  withdrawnDiamonds: number;
  availableCashUsd: number;
}

export interface DiamondPackage {
  id: string;
  title: string;
  description?: string;
  diamonds: number; // Number of coins/diamonds in package
  bonusDiamonds: number;
  totalDiamonds: number;
  priceUsd: number;
  googlePlayProductId: string;
  isActive: boolean;
  isPopular?: boolean;
  sortOrder: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
