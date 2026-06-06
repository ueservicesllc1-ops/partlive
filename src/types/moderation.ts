export interface ModerationLog {
  id: string;
  moderatorId: string;
  action: 'warn' | 'mute' | 'kick' | 'ban' | 'unban' | 'resolve_report' | 'delete_message';
  targetType: 'user' | 'room' | 'live' | 'message';
  targetId: string;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: any; // Firestore Timestamp
}
