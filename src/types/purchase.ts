export interface Purchase {
  id: string;
  userId: string;
  platform: 'android';
  productId: string;
  googlePlayProductId: string;
  purchaseToken: string;
  orderId?: string;
  packageId: string;
  coins: number;
  bonusCoins: number;
  totalCoins: number;
  priceUsd?: number;
  currency?: string;
  status: 'pending' | 'validated' | 'credited' | 'failed' | 'refunded' | 'duplicate';
  validationResponse?: Record<string, any>;
  errorMessage?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  creditedAt?: any; // Firestore Timestamp
}
