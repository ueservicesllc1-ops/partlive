export interface Gift {
  id: string;
  name: string;
  iconUrl?: string;
  animationUrl?: string;
  priceCoins: number;
  valueDiamonds: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
