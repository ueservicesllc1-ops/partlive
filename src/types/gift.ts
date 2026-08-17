export type GiftCategoryType = 'POPULAR' | 'LOVE' | 'FUN' | 'PREMIUM' | 'SPECIAL' | string;

export interface Gift {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  staticIcon?: string;
  animationUrl?: string;
  animationAsset?: string;
  soundAsset?: string;
  coinCost: number; // Cost in Coins for the sender
  diamondReward: number; // Diamonds awarded to receiver/host
  priceDiamonds?: number; // Legacy compatibility
  beansValue?: number; // Legacy compatibility
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  category?: GiftCategoryType; // "POPULAR" | "LOVE" | "FUN" | "PREMIUM" | "SPECIAL"
  isActive: boolean;
  sortOrder: number;
  roomEffectType?: string; // e.g. "confetti", "fireworks", "laser", "music_notes", etc.
  animationType?: 'small' | 'medium' | 'big' | 'global';
  senderTitle?: string;
  senderTitleDurationDays?: number;
  hostBadge?: string;
  hostBadgeDurationDays?: number;
  iconEmoji?: string; // Fallback emoji
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

