export type ReportTargetType = 'user' | 'message' | 'room' | 'live' | 'gift' | 'host' | 'payout' | 'other';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'sexual_content'
  | 'violence'
  | 'scam'
  | 'impersonation'
  | 'underage'
  | 'illegal_activity'
  | 'self_harm'
  | 'privacy'
  | 'other';

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected' | 'duplicate';

export type ModerationActionType =
  | 'warn_user'
  | 'hide_message'
  | 'delete_message'
  | 'kick_from_room'
  | 'ban_from_room'
  | 'kick_from_live'
  | 'ban_from_live'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'ban_user'
  | 'unban_user'
  | 'close_room'
  | 'suspend_room'
  | 'end_live'
  | 'suspend_live'
  | 'resolve_report'
  | 'reject_report'
  | 'lock_wallet'
  | 'unlock_wallet';

export type UserStatus = 'active' | 'warning' | 'suspended' | 'banned' | 'deleted';

export interface Report {
  id: string;
  reporterId: string;
  reporterName?: string;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerId?: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  roomId?: string;
  liveId?: string;
  messageId?: string;
  metadata?: Record<string, any>;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  reviewedBy?: string;
  reviewedAt?: any; // Firestore Timestamp
  resolutionNote?: string;
  actionTaken?: ModerationActionType;
}

export interface ModerationLog {
  id: string;
  actorId: string;
  actorRole?: 'owner' | 'host' | 'moderator' | 'admin';
  action: ModerationActionType;
  targetType: ReportTargetType | 'wallet' | 'room_member' | 'live_viewer';
  targetId: string;
  targetOwnerId?: string;
  reason?: string;
  reportId?: string;
  roomId?: string;
  liveId?: string;
  metadata?: Record<string, any>;
  createdAt: any; // Firestore Timestamp
}

export interface UserModerationState {
  userId: string;
  status: UserStatus;
  warningsCount: number;
  suspensionsCount: number;
  bansCount: number;
  suspendedUntil?: any; // Firestore Timestamp
  bannedAt?: any; // Firestore Timestamp
  bannedReason?: string;
  lastWarningAt?: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
