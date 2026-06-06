export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  actionType: 'none' | 'room' | 'live' | 'event' | 'url';
  actionValue?: string;
  placement: 'home_top' | 'rooms_top' | 'lives_top' | 'games_top';
  startsAt?: any; // Firestore Timestamp
  endsAt?: any; // Firestore Timestamp
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
