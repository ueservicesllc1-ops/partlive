export interface AppEvent {
  id: string;
  title: string;
  description?: string;
  type: 'ranking' | 'gift_bonus' | 'game_tournament' | 'host_campaign' | 'system';
  startsAt: any; // Firestore Timestamp
  endsAt: any; // Firestore Timestamp
  isActive: boolean;
  bannerUrl?: string;
  rules?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
