export interface Gift {
  id: string;
  name: string;
  iconUrl?: string;
  animationUrl?: string;
  priceDiamonds: number;
  beansValue: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category?: string; // e.g. "popular", "premium", "interactive"
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
