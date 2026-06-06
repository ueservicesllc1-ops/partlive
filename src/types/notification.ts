export interface AppNotification {
  id: string;
  userId: string;
  type: 'follow' | 'gift' | 'room_invite' | 'live_started' | 'mission_reward' | 'system' | 'moderation';
  title: string;
  body: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: any; // Firestore Timestamp
}
