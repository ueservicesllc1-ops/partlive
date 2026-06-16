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
  roomEffectType?: string; // e.g. "confetti", "fireworks", "laser", "music_notes", etc.
  animationType?: 'small' | 'big' | 'global';
  senderTitle?: string; // Title awarded to sender, e.g., "Rey del Karaoke"
  senderTitleDurationDays?: number;
  hostBadge?: string; // Badge awarded to receiver/host, e.g., "Super Estrella"
  hostBadgeDurationDays?: number;
  iconEmoji?: string; // Fallback emoji for chat/system messages
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

