export interface VipPlan {
  id: string;
  name: string;
  priceUsd: number;
  durationDays: number;
  benefits: {
    badge: boolean;
    exclusiveEmojis: boolean;
    animatedEntry: boolean;
    profileHighlight: boolean;
    exclusiveGifts: boolean;
    priorityRoomEntry: boolean;
  };
  googlePlayProductId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface VipSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  startedAt: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp
  purchaseToken?: string;
  platform: 'android' | 'ios' | 'manual';
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
